/**
 * POST /api/admin/sync-jobs-to-web
 *
 * Publica en la web las vacantes definidas en `src/data/jobs.ts`.
 *
 * POR QUÉ EXISTE
 * La página pública /vacantes lee la tabla `vacancies` de Neon, mientras que el
 * ATS vive en Supabase (`ht_vacancies`) y el perfil de cada cargo está escrito
 * en jobs.ts. Tres fuentes distintas, sin nada que las conecte: publicar o
 * corregir una vacante obligaba a abrir una consola SQL y escribir el INSERT a
 * mano, con el riesgo de equivocarse de base — ya pasó.
 *
 * Con esto jobs.ts pasa a ser la fuente editable: se cambia el archivo, se
 * aprieta un botón y la web queda al día. Queda versionado en git, revisable en
 * un diff, y sin SQL de por medio.
 *
 * QUÉ NO HACE
 * - No cierra vacantes. Si una desapareció de jobs.ts pero sigue publicada, se
 *   reporta para que una persona decida: cerrarla es una decisión, no un efecto
 *   secundario de un sync.
 * - No pisa el `status` de una vacante que ya existe. Si la cerraste desde el
 *   ATS, el sync no la vuelve a abrir.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { jobs } from "@/data/jobs";

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const creadas: string[] = [];
    const actualizadas: string[] = [];
    const fallidas: { slug: string; error: string }[] = [];

    for (const job of jobs) {
      try {
        const existing = await sql`
          SELECT id, status FROM vacancies WHERE slug = ${job.slug} LIMIT 1
        `;
        const yaExiste = existing.length > 0;

        const tags = (job.tags || []).join(", ");

        if (yaExiste) {
          // El status NO se toca: si la vacante se cerró desde el ATS, un sync
          // de contenido no debe reabrirla.
          await sql`
            UPDATE vacancies SET
              title               = ${job.title.es},
              title_es            = ${job.title.es},
              title_en            = ${job.title.en},
              department          = ${job.dept},
              location            = ${job.location},
              work_mode           = ${job.mode},
              level               = ${job.level},
              salary_range        = ${job.salary},
              tags                = ${tags},
              apply_email         = ${job.applyEmail},
              posted_at           = ${job.postedAt || null},
              linkedin_url        = ${job.linkedinUrl || null},
              description         = ${job.description.es},
              description_es      = ${job.description.es},
              description_en      = ${job.description.en},
              responsibilities_es = ${JSON.stringify(job.responsibilities.es)}::jsonb,
              responsibilities_en = ${JSON.stringify(job.responsibilities.en)}::jsonb,
              requirements_es     = ${JSON.stringify(job.requirements.es)}::jsonb,
              requirements_en     = ${JSON.stringify(job.requirements.en)}::jsonb,
              updated_at          = NOW()
            WHERE slug = ${job.slug}
          `;
          actualizadas.push(job.title.es);
        } else {
          await sql`
            INSERT INTO vacancies (
              slug, title, title_es, title_en, department, location, work_mode,
              employment_type, level, salary_range, tags, status, apply_email,
              posted_at, linkedin_url, description, description_es, description_en,
              responsibilities_es, responsibilities_en, requirements_es, requirements_en,
              created_at, updated_at
            ) VALUES (
              ${job.slug}, ${job.title.es}, ${job.title.es}, ${job.title.en},
              ${job.dept}, ${job.location}, ${job.mode},
              'full-time', ${job.level}, ${job.salary}, ${tags}, 'open',
              ${job.applyEmail}, ${job.postedAt || null}, ${job.linkedinUrl || null},
              ${job.description.es}, ${job.description.es}, ${job.description.en},
              ${JSON.stringify(job.responsibilities.es)}::jsonb,
              ${JSON.stringify(job.responsibilities.en)}::jsonb,
              ${JSON.stringify(job.requirements.es)}::jsonb,
              ${JSON.stringify(job.requirements.en)}::jsonb,
              NOW(), NOW()
            )
          `;
          creadas.push(job.title.es);
        }
      } catch (e: any) {
        fallidas.push({ slug: job.slug, error: e?.message || String(e) });
      }
    }

    // Publicadas en la web que ya no están en jobs.ts. No se tocan: solo se
    // reportan para que alguien decida si corresponde cerrarlas.
    const slugsEnCodigo = jobs.map((j) => j.slug);
    const huerfanas = await sql`
      SELECT slug, title, status FROM vacancies
      WHERE status = 'open'
        AND (slug IS NULL OR NOT (slug = ANY(${slugsEnCodigo}::text[])))
    `;

    return NextResponse.json({
      success: fallidas.length === 0,
      creadas,
      actualizadas,
      fallidas,
      publicadas_sin_perfil: huerfanas.map((v: any) => ({
        slug: v.slug,
        title: v.title,
      })),
    });
  } catch (err: any) {
    console.error("[sync-jobs-to-web]", err);
    return NextResponse.json(
      { error: "No se pudo sincronizar", detail: err?.message || String(err) },
      { status: 500 },
    );
  }
}
