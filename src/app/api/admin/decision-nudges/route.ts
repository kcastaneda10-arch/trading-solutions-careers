/**
 * GET  /api/admin/decision-nudges  → lista candidatos con decisión pendiente + nudges activos
 * POST /api/admin/decision-nudges  → crea nudge (Gmail draft) para un candidato específico
 *
 * Body POST: { candidate_id, recipient_email, recipient_name, recipient_role, interview_type }
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { createDraftViaGmail, isGmailConnected } from "@/lib/gmail";
import crypto from "crypto";

const TS_CLIENT_ID = "98b62872-5767-4815-9b49-1394b9527c1f";

// Stages que requieren decisión humana antes de avanzar
const STAGES_NEEDING_DECISION = ['recruiter_interview','cwo_interview','touring','terna'];

function buildEmail(opts: {
  candidate_name: string;
  candidate_role_at_company?: string;
  vacancy_title: string;
  interview_type: string;
  recipient_name: string;
  base_url: string;
  token: string;
  ai_summary?: string;
  ai_score?: number;
}): string {
  const linkAvanza = `${opts.base_url}/decision/${opts.token}?d=avanza`;
  const linkNoAvanza = `${opts.base_url}/decision/${opts.token}?d=no_avanza`;
  const linkOther = `${opts.base_url}/decision/${opts.token}?d=recommend_other_vacancy`;
  const linkMore = `${opts.base_url}/decision/${opts.token}?d=needs_more_info`;
  const firstName = opts.recipient_name.split(' ')[0] || opts.recipient_name;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.55; color: #111; padding: 0; margin: 0; background: #f5f5f5; }
  .wrap { max-width: 580px; margin: 0 auto; padding: 24px 16px; }
  .header { background: #000; color: #fff; padding: 16px 20px; border-radius: 12px 12px 0 0; font-weight: 800; letter-spacing: 2.5px; font-size: 12px; }
  .container { background: white; border: 1px solid #e5e5e5; border-top: none; padding: 28px; border-radius: 0 0 12px 12px; }
  h2 { margin: 0 0 12px; font-size: 22px; letter-spacing: -0.02em; line-height: 1.2; }
  .candidate-card { background: #f8f8f8; border-left: 4px solid #000; padding: 14px 18px; margin: 18px 0; border-radius: 4px; }
  .label { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; color: #888; margin-bottom: 4px; }
  .btn { display: inline-block; padding: 14px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px; margin: 4px 0; text-align: center; min-width: 220px; }
  .btn-yes { background: #10B981; color: white; }
  .btn-no { background: #EF4444; color: white; }
  .btn-other { background: #2C64ED; color: white; }
  .btn-more { background: #f5f5f5; color: #111; border: 2px solid #d4d4d4; }
  .actions { margin: 26px 0 14px; text-align: center; }
  .actions .btn { display: block; margin: 8px auto; }
  .footer { font-size: 12px; color: #777; margin-top: 22px; padding-top: 18px; border-top: 1px solid #eee; }
  .ai-summary { background: #fef3c7; border: 1px solid #fde68a; padding: 12px 14px; border-radius: 6px; font-size: 13px; margin: 14px 0; }
  .ai-summary .label { color: #92400e; }
</style></head><body>
  <div class="wrap">
    <div class="header">TRADING SOLUTIONS · TALENT ACQUISITION</div>
    <div class="container">
      <p style="margin:0 0 6px;color:#666;font-size:13px;">Hola ${firstName},</p>
      <h2>Necesitamos tu decisión sobre un candidato.</h2>
      <p style="color:#444;font-size:14px;">Para poder avanzar el proceso, ¿puedes responder en 2 clicks? Cualquier dilatación nos cuesta el candidato.</p>

      <div class="candidate-card">
        <div class="label">CANDIDATO</div>
        <div style="font-size:18px;font-weight:700;letter-spacing:-0.01em;">${opts.candidate_name}</div>
        ${opts.candidate_role_at_company ? `<div style="font-size:12px;color:#666;margin-top:4px;">${opts.candidate_role_at_company}</div>` : ''}
        <div class="label" style="margin-top:14px;">VACANTE</div>
        <div style="font-weight:600;">${opts.vacancy_title}</div>
        <div class="label" style="margin-top:14px;">TIPO DE ENTREVISTA</div>
        <div style="font-weight:600;text-transform:capitalize;">${opts.interview_type.replace('_',' ')}</div>
      </div>

      ${opts.ai_summary ? `
      <div class="ai-summary">
        <div class="label">RESUMEN IA · score ${opts.ai_score ?? '—'}/100</div>
        <div style="margin-top:4px;">${opts.ai_summary}</div>
      </div>
      ` : ''}

      <div class="actions">
        <a href="${linkAvanza}" class="btn btn-yes">✓ Sí, avanza para esta vacante</a>
        <a href="${linkOther}" class="btn btn-other">→ No para esta, pero sí para otra vacante</a>
        <a href="${linkNoAvanza}" class="btn btn-no">✗ No, no avanza</a>
        <a href="${linkMore}" class="btn btn-more">? Necesito otra entrevista / más info</a>
      </div>

      <p style="font-size:12px;color:#888;margin-top:8px;text-align:center;">
        <strong>Una respuesta concreta es 30 segundos.</strong> Cualquier "lo veo más para X" sin click no es decisión y el candidato queda en el aire.
      </p>

      <div class="footer">
        El sistema actualiza el stage del candidato automáticamente con tu respuesta. Si tienes dudas, escribime.<br/>
        — Kelly Castañeda · Talent Acquisition Lead
      </div>
    </div>
  </div>
</body></html>`;
}

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  // Candidatos en stages que requieren decisión + sin decisión activa
  const { data: cands } = await supabaseAdmin
    .from("ht_candidates")
    .select("id, name, email, vacancy_id, stage, status, updated_at, ht_vacancies(title, area)")
    .eq("client_id", TS_CLIENT_ID)
    .in("stage", STAGES_NEEDING_DECISION)
    .order("updated_at", { ascending: true })
    .limit(50);

  // Decisiones existentes
  const candIds = (cands || []).map((c: any) => c.id);
  const { data: decisions } = candIds.length > 0
    ? await supabaseAdmin
        .from("ts_interview_decisions")
        .select("*")
        .in("candidate_id", candIds)
        .order("sent_at", { ascending: false })
    : { data: [] };

  // Mapear: por cada candidato, cuántos nudges enviados, último, decisión final
  const decisionByCand: Record<string, any> = {};
  (decisions || []).forEach((d: any) => {
    const existing = decisionByCand[d.candidate_id];
    if (!existing) {
      decisionByCand[d.candidate_id] = {
        last_decision: d,
        nudges_sent: 1,
        any_response: !!d.responded_at,
      };
    } else {
      existing.nudges_sent++;
      if (d.responded_at) existing.any_response = true;
    }
  });

  const items = (cands || []).map((c: any) => {
    const d = decisionByCand[c.id];
    const daysSinceUpdate = c.updated_at
      ? Math.floor((Date.now() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    return {
      candidate_id: c.id,
      candidate_name: c.name,
      candidate_email: c.email,
      vacancy_id: c.vacancy_id,
      vacancy_title: c.ht_vacancies?.title || null,
      vacancy_area: c.ht_vacancies?.area || null,
      stage: c.stage,
      status: c.status,
      days_since_stage_update: daysSinceUpdate,
      nudges_sent: d?.nudges_sent || 0,
      last_nudge_recipient: d?.last_decision?.recipient_email || null,
      last_nudge_at: d?.last_decision?.sent_at || null,
      decision: d?.last_decision?.responded_at ? d.last_decision.decision : null,
      decided_at: d?.last_decision?.responded_at || null,
    };
  });

  return NextResponse.json({
    candidates: items,
    total: items.length,
    pending_decision: items.filter(i => !i.decision).length,
    overdue: items.filter(i => !i.decision && (i.days_since_stage_update || 0) > 5).length,
  });
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { candidate_id, recipient_email, recipient_name, recipient_role, interview_type } = body;

    if (!candidate_id || !recipient_email || !recipient_role) {
      return NextResponse.json({ error: "Faltan candidate_id, recipient_email, recipient_role" }, { status: 400 });
    }

    // Get candidate + vacancy
    const { data: cand } = await supabaseAdmin
      .from("ht_candidates")
      .select("id, name, current_job_role, current_company, vacancy_id, stage, ht_vacancies(title)")
      .eq("id", candidate_id)
      .single();

    if (!cand) return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });

    // Pull AI summary si existe (de ai interview o elevare)
    const { data: aiInt } = await supabaseAdmin
      .from("ht_ai_interviews")
      .select("ai_summary, ai_score, overall_score")
      .eq("candidate_id", candidate_id)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const token = crypto.randomBytes(20).toString('hex');
    const baseUrl = (req.headers.get('host') && !req.headers.get('host')!.includes('localhost'))
      ? `https://${req.headers.get('host')}`
      : 'https://trading-solutions-careers.vercel.app';

    const html = buildEmail({
      candidate_name: cand.name,
      candidate_role_at_company: cand.current_job_role && cand.current_company
        ? `${cand.current_job_role} en ${cand.current_company}`
        : cand.current_job_role || undefined,
      // @ts-expect-error supabase relation
      vacancy_title: cand.ht_vacancies?.title || 'Vacante',
      interview_type: interview_type || cand.stage || 'entrevista',
      recipient_name: recipient_name || recipient_email.split('@')[0],
      base_url: baseUrl,
      token,
      ai_summary: aiInt?.ai_summary || undefined,
      ai_score: aiInt?.ai_score ?? aiInt?.overall_score ?? undefined,
    });

    const subject = `[Decisión requerida] ${cand.name} — ¿avanza o no?`;

    // Crear draft en Gmail
    const draftRes = await createDraftViaGmail({
      to: recipient_email,
      subject,
      html,
      fromName: 'Kelly Castañeda',
      replyTo: 'kcastaneda@tradingsolutions.com',
    });

    if (!draftRes.ok) {
      return NextResponse.json({ error: draftRes.error }, { status: 500 });
    }

    // Insertar registro
    const { data: decisionRow, error: insErr } = await supabaseAdmin
      .from("ts_interview_decisions")
      .insert({
        candidate_id,
        vacancy_id: cand.vacancy_id,
        interview_type: interview_type || cand.stage,
        recipient_role,
        recipient_email,
        recipient_name: recipient_name || null,
        token,
        channel: 'email',
        sent_via_draft_id: draftRes.draft_id,
      })
      .select()
      .single();

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      decision_id: decisionRow.id,
      token,
      draft_id: draftRes.draft_id,
      decision_url: `${baseUrl}/decision/${token}`,
    });
  } catch (err: any) {
    console.error('decision-nudges POST error:', err);
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 });
  }
}
