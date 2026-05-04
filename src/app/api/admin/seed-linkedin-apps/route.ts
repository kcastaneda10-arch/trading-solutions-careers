/**
 * POST /api/admin/seed-linkedin-apps
 *
 * Importa los 113 candidatos del bulk LinkedIn Recruiter (2026-05-03).
 * Idempotente — chequea por email antes de insertar.
 *
 * Para correr una sola vez después del deploy:
 *   curl -X POST https://trading-solutions-careers.vercel.app/api/admin/seed-linkedin-apps \
 *        -H "Authorization: Bearer $ADMIN_SECRET"
 *
 * O simplemente desde el browser estando logueada (sin headers — usa cookie de sesión):
 *   abrí la URL en una nueva tab y hacé fetch desde la consola:
 *   fetch('/api/admin/seed-linkedin-apps', { method: 'POST' }).then(r => r.json()).then(console.log)
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import seedData from "@/data/linkedin_apps_2026_05_03.json";

type SeedRow = {
  name: string;
  email: string;
  phone: string | null;
  vacancy_id: string;
  notes: string;
  applied: string; // YYYY-MM-DD
};

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const cands = seedData as SeedRow[];

    if (!Array.isArray(cands) || cands.length === 0) {
      return NextResponse.json({ error: "Seed data vacío" }, { status: 500 });
    }

    // 1. Get existing emails para dedup
    const emails = cands.map(c => c.email.toLowerCase());
    const { data: existing } = await supabaseAdmin
      .from("ht_candidates")
      .select("email")
      .in("email", emails);

    const existingSet = new Set((existing || []).map((c: any) => (c.email || '').toLowerCase()));

    // 2. Build payloads para los nuevos
    const toInsert = cands
      .filter(c => !existingSet.has(c.email.toLowerCase()))
      .map(c => ({
        name: c.name,
        email: c.email,
        phone: c.phone,
        vacancy_id: c.vacancy_id,
        stage: 'aplico',
        status: 'new',
        notes: c.notes,
        created_at: c.applied ? `${c.applied}T12:00:00Z` : new Date().toISOString(),
      }));

    if (toInsert.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Todos los 113 candidatos ya estaban en el ATS — nada que insertar.",
        already_existing: cands.length,
        inserted: 0,
      });
    }

    // 3. Insert en chunks de 25
    let insertedCount = 0;
    const errors: string[] = [];
    for (let i = 0; i < toInsert.length; i += 25) {
      const chunk = toInsert.slice(i, i + 25);
      const { data: ins, error } = await supabaseAdmin
        .from("ht_candidates")
        .insert(chunk)
        .select('id');
      if (error) {
        errors.push(`Chunk ${i / 25}: ${error.message}`);
      } else {
        insertedCount += ins?.length || 0;
      }
    }

    // 4. Conteo por vacante para verificación
    const vacIds = Array.from(new Set(cands.map(c => c.vacancy_id)));
    const { data: vacInfo } = await supabaseAdmin
      .from("ht_vacancies")
      .select("id, title")
      .in("id", vacIds);

    const breakdown: Array<{ vacancy: string; new: number; existed: number }> = [];
    for (const v of vacInfo || []) {
      const forVac = cands.filter(c => c.vacancy_id === v.id);
      const newForVac = toInsert.filter(c => c.vacancy_id === v.id);
      breakdown.push({
        vacancy: v.title,
        new: newForVac.length,
        existed: forVac.length - newForVac.length,
      });
    }

    return NextResponse.json({
      success: errors.length === 0,
      total_processed: cands.length,
      inserted: insertedCount,
      already_existing: cands.length - toInsert.length,
      errors,
      breakdown,
    });
  } catch (err: any) {
    console.error("seed-linkedin-apps error:", err);
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 });
  }
}

// GET para preview sin insertar (dry run)
export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const cands = seedData as SeedRow[];
  const emails = cands.map(c => c.email.toLowerCase());
  const { data: existing } = await supabaseAdmin
    .from("ht_candidates")
    .select("email, vacancy_id, stage")
    .in("email", emails);

  const existingByEmail: Record<string, any> = {};
  (existing || []).forEach((c: any) => { existingByEmail[(c.email || '').toLowerCase()] = c; });

  const vacIds = Array.from(new Set(cands.map(c => c.vacancy_id)));
  const { data: vacInfo } = await supabaseAdmin.from("ht_vacancies").select("id, title").in("id", vacIds);

  const breakdown = (vacInfo || []).map((v: any) => {
    const forVac = cands.filter(c => c.vacancy_id === v.id);
    const newForVac = forVac.filter(c => !existingByEmail[c.email.toLowerCase()]);
    return { vacancy: v.title, total: forVac.length, new: newForVac.length, existed: forVac.length - newForVac.length };
  });

  return NextResponse.json({
    dry_run: true,
    total: cands.length,
    will_insert: cands.filter(c => !existingByEmail[c.email.toLowerCase()]).length,
    already_existing: cands.filter(c => existingByEmail[c.email.toLowerCase()]).length,
    breakdown,
  });
}
