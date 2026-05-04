/**
 * GET  /api/decision/[token]  → estado de la decisión (para que la página sepa si ya respondieron)
 * POST /api/decision/[token]  → registra decisión + auto-actualiza stage del candidato
 *
 * Endpoint público (sin auth) — el token es la credencial.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const TS_CLIENT_ID = "98b62872-5767-4815-9b49-1394b9527c1f";

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  const { data, error } = await supabaseAdmin
    .from("ts_interview_decisions")
    .select("id, candidate_id, vacancy_id, interview_type, recipient_role, recipient_name, sent_at, expires_at, responded_at, decision, decision_to_stage, reasoning, recommended_vacancy_id, recommended_vacancy_text")
    .eq("token", token)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Token inválido" }, { status: 404 });
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: "Esta decisión ya expiró" }, { status: 410 });
  }

  // Get candidate + vacancy info
  const { data: cand } = await supabaseAdmin
    .from("ht_candidates")
    .select("id, name, current_job_role, current_company, headline, stage")
    .eq("id", data.candidate_id)
    .maybeSingle();

  const { data: vac } = data.vacancy_id
    ? await supabaseAdmin.from("ht_vacancies").select("id, title, area").eq("id", data.vacancy_id).maybeSingle()
    : { data: null };

  // AI summary si existe
  const { data: ai } = await supabaseAdmin
    .from("ht_ai_interviews")
    .select("ai_summary, ai_score, ai_recommendation, overall_score")
    .eq("candidate_id", data.candidate_id)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // List of all open vacancies for the "recomendar otra" dropdown
  const { data: openVacs } = await supabaseAdmin
    .from("ht_vacancies")
    .select("id, title, area")
    .eq("client_id", TS_CLIENT_ID);

  return NextResponse.json({
    decision_id: data.id,
    already_responded: !!data.responded_at,
    decision: data.decision,
    interview_type: data.interview_type,
    recipient_role: data.recipient_role,
    recipient_name: data.recipient_name,
    sent_at: data.sent_at,
    candidate: cand ? {
      name: cand.name,
      current_role: cand.current_job_role,
      current_company: cand.current_company,
      headline: cand.headline,
      stage: cand.stage,
    } : null,
    vacancy: vac ? { id: vac.id, title: vac.title, area: vac.area } : null,
    ai_insights: ai ? {
      summary: ai.ai_summary,
      score: ai.ai_score ?? ai.overall_score,
      recommendation: ai.ai_recommendation,
    } : null,
    open_vacancies: (openVacs || []).map(v => ({ id: v.id, title: v.title, area: v.area })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const body = await req.json();

    const { data: existing } = await supabaseAdmin
      .from("ts_interview_decisions")
      .select("id, candidate_id, vacancy_id, responded_at, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (!existing) return NextResponse.json({ error: "Token inválido" }, { status: 404 });
    if (existing.responded_at) {
      return NextResponse.json({ error: "Esta decisión ya fue registrada" }, { status: 409 });
    }
    if (existing.expires_at && new Date(existing.expires_at) < new Date()) {
      return NextResponse.json({ error: "Esta decisión expiró" }, { status: 410 });
    }

    // Validate decision
    const validDecisions = ['avanza','no_avanza','needs_more_info','recommend_other_vacancy'];
    if (!validDecisions.includes(body.decision)) {
      return NextResponse.json({ error: "Decisión inválida" }, { status: 400 });
    }

    const updates: any = {
      responded_at: new Date().toISOString(),
      decision: body.decision,
      reasoning: body.reasoning ? String(body.reasoning).slice(0, 2000) : null,
    };

    if (body.decision === 'avanza') {
      updates.decision_to_stage = body.target_stage || null;
    }
    if (body.decision === 'recommend_other_vacancy') {
      updates.recommended_vacancy_id = body.recommended_vacancy_id || null;
      updates.recommended_vacancy_text = body.recommended_vacancy_text ? String(body.recommended_vacancy_text).slice(0, 500) : null;
    }

    // Auto-apply stage transition si avanza con stage definido
    let stageUpdated = false;
    if (body.decision === 'avanza' && body.target_stage) {
      const validStages = ['recruiter_interview','cwo_interview','touring','terna','oferta','contratado'];
      if (validStages.includes(body.target_stage)) {
        await supabaseAdmin
          .from("ht_candidates")
          .update({ stage: body.target_stage, updated_at: new Date().toISOString() })
          .eq("id", existing.candidate_id);
        stageUpdated = true;
      }
    } else if (body.decision === 'no_avanza') {
      // Marcar rechazado automáticamente
      await supabaseAdmin
        .from("ht_candidates")
        .update({ stage: 'rechazado', status: 'rejected', updated_at: new Date().toISOString() })
        .eq("id", existing.candidate_id);
      stageUpdated = true;
    } else if (body.decision === 'recommend_other_vacancy' && body.recommended_vacancy_id && body.move_now) {
      // Mover candidato a la otra vacante en stage aplico (o el que indique target_stage)
      await supabaseAdmin
        .from("ht_candidates")
        .update({
          vacancy_id: body.recommended_vacancy_id,
          stage: body.target_stage || 'aplico',
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.candidate_id);
      stageUpdated = true;
    }
    updates.stage_auto_updated = stageUpdated;

    const { error: upErr } = await supabaseAdmin
      .from("ts_interview_decisions")
      .update(updates)
      .eq("id", existing.id);

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    return NextResponse.json({
      success: true,
      stage_auto_updated: stageUpdated,
    });
  } catch (err: any) {
    console.error('decision POST error:', err);
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 });
  }
}
