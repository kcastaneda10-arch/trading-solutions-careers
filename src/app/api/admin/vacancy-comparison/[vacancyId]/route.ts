/**
 * GET /api/admin/vacancy-comparison/[vacancyId]
 *
 * Devuelve candidatos de la vacante con TODOS sus assessments por stage,
 * + score agregado para ranking. Usado por la vista "Comparar candidatos".
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { CEO_MANDATES, MandateScore } from "@/lib/ceo-mandates";

export const runtime = "nodejs";

// pass=2 · partial=1 · fail=0 · data/not_probed=null (excluido)
function scoreToNumeric(s: MandateScore | undefined): number | null {
  if (s === "pass") return 2;
  if (s === "partial") return 1;
  if (s === "fail") return 0;
  return null;
}

function computeAssessmentScore(scores: Record<string, MandateScore> | null | undefined): {
  score: number; max: number; pct: number; pass: number; partial: number; fail: number; not_probed: number; data: number;
} {
  if (!scores) return { score: 0, max: 0, pct: 0, pass: 0, partial: 0, fail: 0, not_probed: 0, data: 0 };
  let sum = 0, max = 0;
  let pass = 0, partial = 0, fail = 0, not_probed = 0, data = 0;
  for (const m of CEO_MANDATES) {
    const s = scores[String(m.num)];
    if (s === "pass") { sum += 2; max += 2; pass++; }
    else if (s === "partial") { sum += 1; max += 2; partial++; }
    else if (s === "fail") { max += 2; fail++; }
    else if (s === "data") { data++; } // no cuenta · es solo contexto
    else { not_probed++; }
  }
  return { score: sum, max, pct: max === 0 ? 0 : Math.round((sum / max) * 100), pass, partial, fail, not_probed, data };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { vacancyId: string } }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { vacancyId } = params;

    // Vacante info
    const { data: vacancy } = await supabaseAdmin
      .from("ht_vacancies")
      .select("id, title, area, role_level, vacancy_type, status")
      .eq("id", vacancyId)
      .maybeSingle();

    if (!vacancy) {
      return NextResponse.json({ error: "Vacante no encontrada" }, { status: 404 });
    }

    // Candidatos · solo los que están en stages post-prefiltro y NO rechazados/contratados
    const ACTIVE_STAGES = [
      "assessment_invitado", "assessment_en_progreso", "assessment_completado",
      "entrevista_ia", "bateria_psicometrica", "recruiter_interview",
      "cwo_interview", "touring", "terna", "oferta",
    ];

    const { data: cands } = await supabaseAdmin
      .from("ht_candidates")
      .select("id, name, email, stage, status, prefilter_data, prefilter_decision")
      .eq("vacancy_id", vacancyId)
      .in("stage", ACTIVE_STAGES)
      .order("updated_at", { ascending: false });

    const candIds = (cands || []).map(c => c.id);

    // Todas las assessments de estos candidatos
    const { data: assessments } = candIds.length > 0
      ? await supabaseAdmin
          .from("ts_recruiter_assessments")
          .select("*")
          .in("candidate_id", candIds)
          .order("interview_date", { ascending: false })
      : { data: [] };

    // Agrupar assessments por candidato y stage
    const assessmentsByCand: Record<string, Record<string, any>> = {};
    (assessments || []).forEach((a: any) => {
      if (!assessmentsByCand[a.candidate_id]) assessmentsByCand[a.candidate_id] = {};
      const s = a.assessment_stage || "recruiter_interview";
      // Tomar la más reciente por stage
      if (!assessmentsByCand[a.candidate_id][s]) {
        assessmentsByCand[a.candidate_id][s] = a;
      }
    });

    // Build comparison rows
    const rows = (cands || []).map((c: any) => {
      const evals = assessmentsByCand[c.id] || {};
      const recruiter = evals.recruiter_interview;
      const cwo = evals.cwo_interview;
      const hm = evals.hiring_manager_interview;

      const recruiterScore = computeAssessmentScore(recruiter?.mandate_scores);
      const cwoScore = computeAssessmentScore(cwo?.mandate_scores);
      const hmScore = computeAssessmentScore(hm?.mandate_scores);

      // Aggregate · solo evaluaciones existentes
      const validPcts = [
        recruiter ? recruiterScore.pct : null,
        cwo ? cwoScore.pct : null,
        hm ? hmScore.pct : null,
      ].filter((p): p is number => p !== null);

      const aggregatePct = validPcts.length > 0
        ? Math.round(validPcts.reduce((a, b) => a + b, 0) / validPcts.length)
        : null;

      // Verdict combinado · prioriza el más cauto (NO > MAYBE > STRONG_YES)
      const verdicts = [recruiter?.verdict, cwo?.verdict, hm?.verdict].filter(Boolean);
      const combinedVerdict = verdicts.includes("no") ? "no" :
                              verdicts.includes("maybe") ? "maybe" :
                              verdicts.includes("strong_yes") ? "strong_yes" : null;

      return {
        candidate_id: c.id,
        name: c.name,
        email: c.email,
        stage: c.stage,
        status: c.status,
        prefilter_decision: c.prefilter_decision,
        salary: (c.prefilter_data as any)?.salary || null,
        english_level: (c.prefilter_data as any)?.english_level || null,
        evaluations: {
          recruiter: recruiter ? {
            verdict: recruiter.verdict,
            verdict_summary: recruiter.verdict_summary,
            ...recruiterScore,
            mandate_scores: recruiter.mandate_scores,
            interviewer_email: recruiter.interviewer_email,
            interview_date: recruiter.interview_date,
          } : null,
          cwo: cwo ? {
            verdict: cwo.verdict,
            verdict_summary: cwo.verdict_summary,
            ...cwoScore,
            mandate_scores: cwo.mandate_scores,
            interviewer_email: cwo.interviewer_email,
            interview_date: cwo.interview_date,
          } : null,
          hm: hm ? {
            verdict: hm.verdict,
            verdict_summary: hm.verdict_summary,
            ...hmScore,
            mandate_scores: hm.mandate_scores,
            interviewer_email: hm.interviewer_email,
            interview_date: hm.interview_date,
          } : null,
        },
        aggregate_pct: aggregatePct,
        combined_verdict: combinedVerdict,
        evaluations_count: validPcts.length,
      };
    });

    // Sort: highest aggregate first, then by recruiter verdict
    rows.sort((a, b) => {
      if (a.aggregate_pct === null && b.aggregate_pct === null) return 0;
      if (a.aggregate_pct === null) return 1;
      if (b.aggregate_pct === null) return -1;
      return b.aggregate_pct - a.aggregate_pct;
    });

    return NextResponse.json({
      vacancy,
      candidates: rows,
      counts: {
        total: rows.length,
        with_evaluations: rows.filter(r => r.evaluations_count > 0).length,
        without_evaluations: rows.filter(r => r.evaluations_count === 0).length,
      },
    });
  } catch (err: any) {
    console.error("vacancy-comparison error:", err);
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 });
  }
}
