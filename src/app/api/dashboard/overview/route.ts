/**
 * GET /api/dashboard/overview
 *
 * Devuelve los KPIs principales para el Dashboard Overview, comparando contra
 * targets configurados en ts_targets. Diseñado para ser consumido en vivo —
 * todos los cálculos hechos server-side para no exponer logic.
 */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const TS_CLIENT_ID = "98b62872-5767-4815-9b49-1394b9527c1f";

function daysBetween(from: string | Date, to: string | Date): number {
  return Math.floor((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET() {
  try {
    const today = new Date();
    const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Targets
    const { data: targets } = await supabaseAdmin.from("ts_targets").select("*");
    const targetByLevel: Record<string, number> = {};
    (targets || []).forEach((t: any) => { targetByLevel[t.role_level] = t.target_days_to_fill; });

    // Vacancies + role_level
    const { data: vacs } = await supabaseAdmin
      .from("ht_vacancies")
      .select("id, title, role_level, status")
      .eq("client_id", TS_CLIENT_ID);

    // Milestones
    const { data: milestones } = await supabaseAdmin.from("ht_vacancy_milestones").select("*");
    const milestoneByVac: Record<string, any> = {};
    (milestones || []).forEach((m: any) => { milestoneByVac[m.vacancy_id] = m; });

    // Candidates
    const { data: cands } = await supabaseAdmin
      .from("ht_candidates")
      .select("id, vacancy_id, stage, status, updated_at, created_at")
      .not("email", "ilike", "%@tradingsolutions.com");

    // ─── KPI 1: Hires this quarter & this month ───
    let hiresQuarter = 0, hiresMonth = 0, hiresAllTime = 0;
    const hiresByLevel: Record<string, number> = { entry: 0, lead: 0, c_suite: 0 };
    (milestones || []).forEach((m: any) => {
      if (!m.hire_date) return;
      const hd = new Date(m.hire_date);
      hiresAllTime++;
      if (hd >= quarterStart) hiresQuarter++;
      if (hd >= monthStart) hiresMonth++;
      const v = (vacs || []).find((vv: any) => vv.id === m.vacancy_id);
      if (v?.role_level) hiresByLevel[v.role_level]++;
    });

    // ─── KPI 2: Time-to-fill performance ───
    const ttfByLevel: Record<string, { values: number[]; target: number; avg: number; on_track: boolean }> = {
      entry: { values: [], target: targetByLevel.entry || 20, avg: 0, on_track: false },
      lead: { values: [], target: targetByLevel.lead || 30, avg: 0, on_track: false },
      c_suite: { values: [], target: targetByLevel.c_suite || 40, avg: 0, on_track: false },
    };
    (milestones || []).forEach((m: any) => {
      if (!m.hire_date || !m.hr_request_date) return;
      const v = (vacs || []).find((vv: any) => vv.id === m.vacancy_id);
      if (!v?.role_level) return;
      const ttf = daysBetween(m.hr_request_date, m.hire_date);
      ttfByLevel[v.role_level].values.push(ttf);
    });
    Object.keys(ttfByLevel).forEach(level => {
      const vals = ttfByLevel[level].values;
      if (vals.length > 0) {
        ttfByLevel[level].avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        ttfByLevel[level].on_track = ttfByLevel[level].avg <= ttfByLevel[level].target;
      }
    });

    // ─── KPI 3: Vacancies open ───
    const openVacs = (vacs || []).filter((v: any) => {
      const m = milestoneByVac[v.id];
      return !m?.hire_date;
    });
    const openWithMilestone = openVacs.filter((v: any) => milestoneByVac[v.id]?.hr_request_date);
    const avgDaysOpen = openWithMilestone.length > 0
      ? Math.round(openWithMilestone.reduce((sum: number, v: any) => {
          const m = milestoneByVac[v.id];
          return sum + daysBetween(m.hr_request_date, today);
        }, 0) / openWithMilestone.length)
      : 0;

    // ─── KPI 4: Pipeline activos ───
    const activeStages = ['aplico','prefiltro_enviado','prefiltro_pasado','prefiltro_revision','assessment_invitado','assessment_en_progreso','assessment_completado','entrevista_ia','bateria_psicometrica','recruiter_interview','cwo_interview','touring','terna','oferta'];
    const pipelineActivos = (cands || []).filter((c: any) => activeStages.includes(c.stage || 'aplico')).length;

    // ─── KPI 5: NPS (cuando tengamos surveys) ───
    const { data: surveys } = await supabaseAdmin.from("ts_candidate_experience").select("nps_score").not("nps_score", "is", null);
    let nps: number | null = null;
    if (surveys && surveys.length >= 5) {
      const promoters = surveys.filter((s: any) => s.nps_score >= 9).length;
      const detractors = surveys.filter((s: any) => s.nps_score <= 6).length;
      nps = Math.round(((promoters - detractors) / surveys.length) * 100);
    }

    // ─── KPI 6: Aging candidates (>5 días en mismo stage, en stages activos) ───
    const aging = (cands || []).filter((c: any) => {
      if (!activeStages.includes(c.stage || 'aplico')) return false;
      if (!c.updated_at) return false;
      return daysBetween(c.updated_at, today) > 5;
    }).length;

    // ─── Forecast: hires próximos 30d basado en pipeline en etapas finales ───
    const lateStages = ['cwo_interview','touring','terna','oferta'];
    const inLateStages = (cands || []).filter((c: any) => lateStages.includes(c.stage || '')).length;
    // Conservative estimate: 50% de los que están en late stages cierran en 30 días
    const forecastHires30d = Math.round(inLateStages * 0.5);

    return NextResponse.json({
      generated_at: today.toISOString(),
      hires: {
        quarter: hiresQuarter,
        month: hiresMonth,
        all_time: hiresAllTime,
        by_level: hiresByLevel,
      },
      time_to_fill: ttfByLevel,
      vacancies: {
        open: openVacs.length,
        avg_days_open: avgDaysOpen,
        closed_count: hiresAllTime,
      },
      pipeline: {
        active: pipelineActivos,
        aging: aging,
        in_late_stages: inLateStages,
        forecast_hires_30d: forecastHires30d,
      },
      nps: nps,
    });
  } catch (err: any) {
    console.error("dashboard overview error:", err);
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 });
  }
}
