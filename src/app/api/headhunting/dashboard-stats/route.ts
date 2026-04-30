/**
 * GET /api/headhunting/dashboard-stats
 *
 * Devuelve métricas agregadas del pipeline real (ht_candidates en Supabase).
 * Esto es lo que el Dashboard debería estar mostrando en lugar (o además)
 * de la data de Neon legacy.
 *
 * Query params opcionales:
 *   - vacancy_id: filtrar por una vacante específica
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const vacancyFilter = url.searchParams.get("vacancy_id");

    let query = supabaseAdmin
      .from("ht_candidates")
      .select("id, name, email, vacancy_id, stage, status, prefilter_decision, prefilter_invited_at, prefilter_completed_at, source, created_at, ht_vacancies(title)");

    if (vacancyFilter) {
      query = query.eq("vacancy_id", vacancyFilter);
    }

    const { data: candidates, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const all = candidates || [];

    // Conteo por stage del Funnel (12 stages oficiales)
    const STAGES = [
      "aplico",
      "prefiltro_enviado",
      "prefiltro_pasado",
      "prefiltro_revision",
      "assessment_invitado",
      "assessment_en_progreso",
      "assessment_completado",
      "entrevista_ia",
      "recruiter_interview",
      "cwo_interview",
      "touring",
      "contratado",
      "rechazado",
    ];
    const byStage: Record<string, number> = {};
    for (const s of STAGES) byStage[s] = 0;
    for (const c of all) {
      const stg = (c.stage as string) || "aplico";
      byStage[stg] = (byStage[stg] ?? 0) + 1;
    }

    // Decision breakdown del prefiltro
    const prefilterDecision: Record<string, number> = { pass: 0, review: 0, reject: 0, pending: 0 };
    for (const c of all) {
      if (c.prefilter_completed_at) {
        const d = (c.prefilter_decision as string) || "pending";
        prefilterDecision[d] = (prefilterDecision[d] ?? 0) + 1;
      }
    }

    // Conteo por vacante
    const byVacancy: Record<string, { count: number; title: string }> = {};
    for (const c of all) {
      const vid = (c.vacancy_id as string) || "unknown";
      // @ts-expect-error supabase relation
      const title = c.ht_vacancies?.title || "—";
      if (!byVacancy[vid]) byVacancy[vid] = { count: 0, title };
      byVacancy[vid].count++;
    }

    // Source distribution
    const bySource: Record<string, number> = {};
    for (const c of all) {
      const s = ((c.source as string) || "otros").toLowerCase();
      const label = s.includes("linkedin")
        ? "LinkedIn TS"
        : s.includes("email") || s.includes("direct")
        ? "Email / directo"
        : s.includes("refer")
        ? "Referidos"
        : s.includes("organic") || s.includes("careers")
        ? "Careers (orgánico)"
        : "Otros";
      bySource[label] = (bySource[label] ?? 0) + 1;
    }

    // Funnel conversion rates (stage → next stage)
    const funnelOrder = [
      { key: "aplico", label: "Aplicó" },
      { key: "prefiltro_enviado", label: "Prefiltro enviado" },
      { key: "prefiltro_pasado", label: "Prefiltro pasado" },
      { key: "assessment_invitado", label: "Assessment invitado" },
      { key: "assessment_completado", label: "Assessment completado" },
      { key: "recruiter_interview", label: "Entrevista recruiter" },
      { key: "cwo_interview", label: "Entrevista CWO" },
      { key: "contratado", label: "Contratado" },
    ];
    // Acumulado: cuántos están en stage X o más adelante
    const STAGE_RANK: Record<string, number> = {};
    STAGES.forEach((s, i) => { STAGE_RANK[s] = i; });
    const cumulative = funnelOrder.map((f) => {
      const rankF = STAGE_RANK[f.key];
      const reached = all.filter((c) => {
        const stg = (c.stage as string) || "aplico";
        // 'rechazado' no cuenta como progreso a stages futuras
        if (stg === "rechazado") {
          // pero si fue rechazado AFTER passing this stage, debería contarse
          // approximation: si tiene prefilter_completed_at, ya pasó por aplico/prefiltro
          if (f.key === "aplico" || f.key === "prefiltro_enviado") return true;
          if (f.key === "prefiltro_pasado" && c.prefilter_decision === "pass") return true;
          return false;
        }
        return STAGE_RANK[stg] >= rankF;
      }).length;
      return { ...f, count: reached };
    });

    return NextResponse.json({
      total: all.length,
      byStage,
      prefilterDecision,
      byVacancy,
      bySource,
      cumulative,
      hires: byStage["contratado"] ?? 0,
      rejected: byStage["rechazado"] ?? 0,
      inElevareProcess: (byStage["assessment_invitado"] ?? 0) + (byStage["assessment_en_progreso"] ?? 0),
      completedElevare: byStage["assessment_completado"] ?? 0,
      prefilterCompleted: all.filter((c) => c.prefilter_completed_at).length,
      prefilterInvited: all.filter((c) => c.prefilter_invited_at).length,
    });
  } catch (err: any) {
    console.error("dashboard-stats error:", err);
    return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 });
  }
}
