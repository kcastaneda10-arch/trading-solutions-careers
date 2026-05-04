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

    // Lista mínima de columnas que sabemos existen. Si alguna columna opcional
    // (e.g. `source`) no existe en este schema, hacemos un retry sin ella.
    const baseCols = "id, name, email, vacancy_id, stage, status, prefilter_decision, prefilter_invited_at, prefilter_completed_at, created_at, updated_at, ht_vacancies(title)";
    const withSource = `id, name, email, vacancy_id, stage, status, prefilter_decision, prefilter_invited_at, prefilter_completed_at, source, created_at, updated_at, ht_vacancies(title)`;

    async function runQuery(cols: string) {
      let q = supabaseAdmin.from("ht_candidates").select(cols);
      if (vacancyFilter) q = q.eq("vacancy_id", vacancyFilter);
      return q;
    }

    let resp: any = await runQuery(withSource);
    if (resp.error && /column .*source.* does not exist/i.test(resp.error.message)) {
      // Retry sin source
      resp = await runQuery(baseCols);
    }
    if (resp.error) {
      return NextResponse.json({ error: resp.error.message }, { status: 500 });
    }

    const all: any[] = resp.data || [];

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

    // ─── Top candidates · activos en pipeline con Elevare score ───
    // Excluir contratado/rechazado y casos terminales
    const ACTIVE_FOR_TOP = [
      "aplico", "prefiltro_pasado", "assessment_completado", "entrevista_ia",
      "recruiter_interview", "cwo_interview", "touring", "terna", "oferta",
    ];
    const activeCands = all.filter((c) => ACTIVE_FOR_TOP.includes((c.stage as string) || ""));

    // Cargar Elevare scores en una query separada
    const candIds = activeCands.map((c) => c.id);
    let aiScoresByCandId: Record<string, { score: number | null; recommendation: string | null }> = {};
    if (candIds.length > 0) {
      const { data: aiInts } = await supabaseAdmin
        .from("ht_ai_interviews")
        .select("candidate_id, ai_score, overall_score, ai_recommendation, completed_at")
        .in("candidate_id", candIds)
        .order("completed_at", { ascending: false });
      // Guardar el más reciente por candidato
      (aiInts || []).forEach((ai: any) => {
        if (!aiScoresByCandId[ai.candidate_id]) {
          aiScoresByCandId[ai.candidate_id] = {
            score: ai.ai_score ?? ai.overall_score ?? null,
            recommendation: ai.ai_recommendation ?? null,
          };
        }
      });
    }

    const now = Date.now();
    const enrichedTop = activeCands
      .map((c) => {
        const ai = aiScoresByCandId[c.id] || {};
        const score = ai.score ?? null;
        const updated = c.updated_at ? new Date(c.updated_at).getTime() : null;
        const daysInStage = updated ? Math.floor((now - updated) / (1000 * 60 * 60 * 24)) : null;
        return {
          candidate_id: c.id,
          name: c.name,
          email: c.email,
          stage: c.stage,
          vacancy_id: c.vacancy_id,
          vacancy_title: c.ht_vacancies?.title || "—",
          elevare_score: score,
          elevare_recommendation: ai.recommendation || null,
          days_in_stage: daysInStage,
        };
      })
      .filter((c) => c.elevare_score !== null && c.elevare_score >= 50) // solo con score reasonable
      .sort((a, b) => (b.elevare_score || 0) - (a.elevare_score || 0))
      .slice(0, 6);

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
      top_candidates_enriched: enrichedTop,
    });
  } catch (err: any) {
    console.error("dashboard-stats error:", err);
    return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 });
  }
}
