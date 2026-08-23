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
import { supabaseAdmin } from "@/lib/supabase";
import { jobs } from "@/data/jobs";

const TS_CLIENT_ID = "98b62872-5767-4815-9b49-1394b9527c1f";

/**
 * Plantilla de prefiltro según el área del cargo.
 *
 * POR QUÉ IMPORTA: getTemplate() cae a "comex" cuando form_template_key está
 * vacío. Una vacante nueva sin esto le preguntaba a un psicólogo por años en
 * logística internacional, Incoterms y experiencia en pricing.
 */
function plantillaDePrefiltro(job: { dept: string; slug: string; location: string }): string {
  const d = (job.dept || "").toLowerCase();
  if (job.slug.startsWith("china-") || /china|shanghai|shenzhen|guangzhou/i.test(job.location)) return "china";
  if (d.includes("tecnolog") || d.includes("technology")) return "tech";
  if (d.includes("finanz") || d.includes("contab") || d.includes("finance")) return "finance";
  if (d.includes("talento") || d.includes("wellness") || d.includes("people") || d.includes("human")) return "hr_lead";
  return "comex";
}

// ht_vacancies.role_level tiene un CHECK: solo 'entry', 'lead' y 'c_suite'.
// Son niveles de jerarquía, no de seniority — un cargo junior o mid es 'entry'.
function nivelDeJerarquia(level: string): string {
  const l = (level || "").toLowerCase();
  if (l.includes("senior") || l.includes("lead")) return "lead";
  return "entry";
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://trading-solutions-careers.vercel.app";

  try {
    const creadas: { title: string; url: string }[] = [];
    const actualizadas: { title: string; url: string }[] = [];
    const funnel_creado: string[] = [];
    const plantilla_corregida: string[] = [];
    const fallidas: { slug: string; error: string }[] = [];

    for (const job of jobs) {
      try {
        // Buscar por slug y, si no aparece, por título. Hay filas viejas con
        // slug NULL: buscando solo por slug no se encuentran, se insertaría una
        // segunda fila y la vacante saldría duplicada en la web.
        let existing = await sql`
          SELECT id, status, slug FROM vacancies WHERE slug = ${job.slug} LIMIT 1
        `;
        if (existing.length === 0) {
          existing = await sql`
            SELECT id, status, slug FROM vacancies
            WHERE slug IS NULL AND (title ILIKE ${job.title.es} OR title ILIKE ${job.title.en})
            LIMIT 1
          `;
        }
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
              slug                = ${job.slug},
              updated_at          = NOW()
            WHERE id = ${existing[0].id}
          `;
          actualizadas.push({ title: job.title.es, url: `${baseUrl}/vacantes/${existing[0].id}` });
        } else {
          const creada = await sql`
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
            RETURNING id
          `;
          const nuevoId = (creada as any[])[0]?.id;
          creadas.push({ title: job.title.es, url: `${baseUrl}/vacantes/${nuevoId}` });
        }
        // La otra mitad del problema: sin fila en ht_vacancies la vacante se ve
        // en la web pero las aplicaciones no tienen funnel donde entrar. Publicar
        // en dos bases distintas a mano es justo donde se rompía antes.
        const { data: enAts } = await supabaseAdmin
          .from("ht_vacancies")
          .select("id, form_template_key")
          .eq("client_id", TS_CLIENT_ID)
          .ilike("title", job.title.es)
          .maybeSingle();

        const plantilla = plantillaDePrefiltro(job);

        if (!enAts) {
          const { error: atsErr } = await supabaseAdmin.from("ht_vacancies").insert({
            client_id: TS_CLIENT_ID,
            title: job.title.es,
            area: job.dept,
            status: "open",
            role_level: nivelDeJerarquia(job.level),
            vacancy_type: "incremental",
            form_template_key: plantilla,
          });
          if (atsErr) {
            fallidas.push({ slug: job.slug, error: `web OK, pero no se creó en el ATS: ${atsErr.message}` });
          } else {
            funnel_creado.push(`${job.title.es} (prefiltro: ${plantilla})`);
          }
        } else if (!enAts.form_template_key) {
          // Vacante que ya existía sin plantilla asignada: se le pone la que
          // corresponde en vez de dejarla cayendo al default de comex.
          const { error: tplErr } = await supabaseAdmin
            .from("ht_vacancies")
            .update({ form_template_key: plantilla })
            .eq("id", enAts.id);
          if (!tplErr) plantilla_corregida.push(`${job.title.es} → ${plantilla}`);
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
      funnel_creado,
      plantilla_corregida,
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
