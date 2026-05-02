/**
 * GET /api/headhunting/vacancies-overview
 *
 * Devuelve overview de todas las vacantes con:
 *   - milestones (fechas: solicitud, orgánica, linkedin, vacancy_started, hire)
 *   - estado (abierta/cerrada)
 *   - métricas (days_active, time_to_fill, days_since_linkedin, candidates_total, by_stage)
 *   - hired candidate info si cerrada
 *
 * Usado por el Dashboard para la sección "Vacantes".
 */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const TS_CLIENT_ID = "98b62872-5767-4815-9b49-1394b9527c1f";

export async function GET() {
  try {
    // 1. Vacancies + their milestones
    const { data: vacs, error: vErr } = await supabaseAdmin
      .from("ht_vacancies")
      .select("id, title, area, status")
      .eq("client_id", TS_CLIENT_ID);
    if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 });

    const { data: milestones } = await supabaseAdmin
      .from("ht_vacancy_milestones")
      .select("*");

    const milestoneByVacancy: Record<string, any> = {};
    (milestones || []).forEach((m: any) => { milestoneByVacancy[m.vacancy_id] = m; });

    // 2. Candidates per vacancy by stage
    const { data: cands } = await supabaseAdmin
      .from("ht_candidates")
      .select("id, name, vacancy_id, stage, status, email")
      .not("email", "ilike", "%@tradingsolutions.com");

    const candsByVacancy: Record<string, any[]> = {};
    (cands || []).forEach((c: any) => {
      if (!candsByVacancy[c.vacancy_id]) candsByVacancy[c.vacancy_id] = [];
      candsByVacancy[c.vacancy_id].push(c);
    });

    // 3. Hired candidate names
    const hiredIds = (milestones || []).map((m: any) => m.hired_candidate_id).filter(Boolean);
    const { data: hiredCands } = hiredIds.length > 0
      ? await supabaseAdmin.from("ht_candidates").select("id, name, email").in("id", hiredIds)
      : { data: [] };
    const hiredById: Record<string, any> = {};
    (hiredCands || []).forEach((c: any) => { hiredById[c.id] = c; });

    // 4. Build overview
    const today = new Date();
    const result = (vacs || []).map((v: any) => {
      const m = milestoneByVacancy[v.id] || {};
      const candidates = candsByVacancy[v.id] || [];

      const byStage: Record<string, number> = {};
      let activos = 0, rechazados = 0, contratados = 0;
      candidates.forEach((c: any) => {
        const s = c.stage || "aplico";
        byStage[s] = (byStage[s] || 0) + 1;
        if (s === "rechazado") rechazados++;
        else if (s === "contratado") contratados++;
        else activos++;
      });

      const hired = m.hired_candidate_id ? hiredById[m.hired_candidate_id] : null;

      // Compute days
      function daysBetween(from?: string | null, to?: string | null | Date): number | null {
        if (!from) return null;
        const f = new Date(from);
        const t = to ? new Date(to as any) : today;
        return Math.floor((t.getTime() - f.getTime()) / (1000 * 60 * 60 * 24));
      }

      const isClosed = !!m.hire_date;
      const daysActive = m.hr_request_date ? daysBetween(m.hr_request_date, isClosed ? m.hire_date : null) : null;
      const timeToFill = isClosed && m.hr_request_date ? daysBetween(m.hr_request_date, m.hire_date) : null;
      const daysSinceLinkedin = m.linkedin_active_date ? daysBetween(m.linkedin_active_date, isClosed ? m.hire_date : null) : null;
      const daysVacant = m.vacancy_started_date && isClosed ? daysBetween(m.vacancy_started_date, m.hire_date) : null;

      return {
        vacancy_id: v.id,
        title: v.title,
        area: v.area,
        status: isClosed ? "cerrada" : "abierta",
        milestones: {
          hr_request_date: m.hr_request_date,
          organic_traction_date: m.organic_traction_date,
          linkedin_active_date: m.linkedin_active_date,
          vacancy_started_date: m.vacancy_started_date,
          hire_date: m.hire_date,
          notes: m.notes,
        },
        metrics: {
          days_active: daysActive,
          time_to_fill: timeToFill,
          days_since_linkedin: daysSinceLinkedin,
          days_vacant: daysVacant,
          candidates_total: candidates.length,
          activos, rechazados, contratados,
          by_stage: byStage,
        },
        hired: hired ? { id: hired.id, name: hired.name, email: hired.email } : null,
      };
    });

    // Sort: abiertas primero (por días activos desc), después cerradas (por hire_date desc)
    result.sort((a, b) => {
      if (a.status !== b.status) return a.status === "abierta" ? -1 : 1;
      if (a.status === "abierta") {
        return (b.metrics.days_active || 0) - (a.metrics.days_active || 0);
      }
      const ad = a.milestones.hire_date || "";
      const bd = b.milestones.hire_date || "";
      return bd.localeCompare(ad);
    });

    return NextResponse.json({ vacancies: result, total: result.length });
  } catch (err: any) {
    console.error("vacancies-overview error:", err);
    return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 });
  }
}
