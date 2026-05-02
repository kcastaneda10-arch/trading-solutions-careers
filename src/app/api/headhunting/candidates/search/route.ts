/**
 * GET /api/headhunting/candidates/search
 *
 * Buscador full-text de candidatos por:
 *   - q: nombre, email, current_role
 *   - vacancy_id: filtra por vacante
 *   - stage: filtra por stage
 *   - status: invited / completed / rejected / in_progress / etc.
 *   - min_score / max_score: rango de overall_score
 *   - days: candidatos creados en los últimos N días
 *
 * Excluye candidatos internos (@tradingsolutions.com).
 * Devuelve hasta 50 resultados ordenados por relevancia.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const vacancyId = url.searchParams.get("vacancy_id") || null;
    const stage = url.searchParams.get("stage") || null;
    const status = url.searchParams.get("status") || null;
    const minScore = url.searchParams.get("min_score");
    const maxScore = url.searchParams.get("max_score");
    const days = url.searchParams.get("days");
    const limit = Math.min(50, Number(url.searchParams.get("limit") || 25));

    let query = supabaseAdmin
      .from("ht_candidates")
      .select("id, name, email, phone, current_role, vacancy_id, stage, status, overall_score, created_at, updated_at, ht_vacancies(title, area)")
      .not("email", "ilike", "%@tradingsolutions.com")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (q) {
      // OR across name/email/current_role
      const safe = q.replace(/[%_]/g, '');
      query = query.or(
        `name.ilike.%${safe}%,email.ilike.%${safe}%,current_role.ilike.%${safe}%`
      );
    }
    if (vacancyId) query = query.eq("vacancy_id", vacancyId);
    if (stage) query = query.eq("stage", stage);
    if (status) query = query.eq("status", status);
    if (minScore) query = query.gte("overall_score", Number(minScore));
    if (maxScore) query = query.lte("overall_score", Number(maxScore));
    if (days) {
      const since = new Date();
      since.setDate(since.getDate() - Number(days));
      query = query.gte("created_at", since.toISOString());
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const results = (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      current_role: c.current_role,
      vacancy_id: c.vacancy_id,
      vacancy_title: c.ht_vacancies?.title || null,
      vacancy_area: c.ht_vacancies?.area || null,
      stage: c.stage,
      status: c.status,
      overall_score: c.overall_score,
      created_at: c.created_at,
      updated_at: c.updated_at,
    }));

    return NextResponse.json({ results, count: results.length, query: q });
  } catch (err: any) {
    console.error("candidate search error:", err);
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 });
  }
}
