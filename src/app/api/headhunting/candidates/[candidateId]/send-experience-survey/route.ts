/**
 * POST /api/headhunting/candidates/[candidateId]/send-experience-survey
 *
 * Genera un token único, crea registro en ts_candidate_experience y devuelve el link
 * Opcionalmente envía email al candidato si ?send=true
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { getResend, EMAIL_FROM, EMAIL_BCC } from "@/lib/resend";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: { candidateId: string } }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { candidateId } = params;
    const url = new URL(req.url);
    const send = url.searchParams.get("send") === "true";

    // Get candidate + vacancy
    const { data: cand, error: cErr } = await supabaseAdmin
      .from("ht_candidates")
      .select("id, name, email, stage, status, vacancy_id")
      .eq("id", candidateId)
      .single();

    if (cErr || !cand) {
      return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
    }

    // Determine outcome
    let outcome: 'rejected' | 'hired' | 'withdrew' | 'other' = 'other';
    if (cand.stage === 'rechazado') outcome = 'rejected';
    else if (cand.stage === 'contratado') outcome = 'hired';
    else if (cand.status === 'withdrew') outcome = 'withdrew';

    // Check si ya hay encuesta activa no-completa
    const { data: existing } = await supabaseAdmin
      .from("ts_candidate_experience")
      .select("id, token, submitted_at")
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let token: string;
    let surveyId: string;

    if (existing && !existing.submitted_at) {
      // Reusar token existente
      token = existing.token;
      surveyId = existing.id;
    } else {
      // Crear nuevo token
      token = crypto.randomBytes(20).toString('hex');
      const { data: created, error: insErr } = await supabaseAdmin
        .from("ts_candidate_experience")
        .insert({
          candidate_id: candidateId,
          vacancy_id: cand.vacancy_id,
          token,
          outcome,
        })
        .select()
        .single();
      if (insErr) {
        return NextResponse.json({ error: insErr.message }, { status: 500 });
      }
      surveyId = created.id;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://trading-solutions-careers.vercel.app";
    const surveyLink = `${baseUrl}/encuesta/${token}`;

    // Optionally send email
    let emailResult = null;
    if (send && cand.email) {
      try {
        const subject = outcome === 'hired'
          ? `${cand.name?.split(' ')[0] || 'Hola'}, ¿cómo fue tu experiencia con Trading Solutions?`
          : `${cand.name?.split(' ')[0] || 'Hola'}, nos gustaría conocer tu opinión sobre el proceso`;

        const greeting = outcome === 'hired'
          ? `¡Felicitaciones por unirte a Trading Solutions! Antes de empezar, queremos saber cómo viviste el proceso.`
          : `Gracias por participar en nuestro proceso de selección. Aunque esta vez no avanzamos juntos, tu experiencia importa y nos ayuda a mejorar.`;

        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
            <div style="background: #000; color: #fff; padding: 16px 20px; border-radius: 8px 8px 0 0; font-weight: 800; letter-spacing: 2px; font-size: 14px;">TRADING SOLUTIONS</div>
            <div style="border: 1px solid #e5e5e5; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 14px;">Hola ${cand.name?.split(' ')[0] || ''},</p>
              <p style="margin: 0 0 14px; line-height: 1.55;">${greeting}</p>
              <p style="margin: 0 0 18px; line-height: 1.55;">Te tomará menos de <strong>2 minutos</strong>. Tus respuestas son confidenciales y nos ayudan a mejorar la experiencia para futuros candidatos.</p>
              <div style="text-align: center; margin: 26px 0;">
                <a href="${surveyLink}" style="display: inline-block; background: #000; color: #fff; padding: 12px 28px; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 14px;">Responder encuesta →</a>
              </div>
              <p style="margin: 18px 0 0; font-size: 12px; color: #666;">Si el botón no funciona, copia este link en tu navegador:<br/><span style="color: #000; word-break: break-all;">${surveyLink}</span></p>
              <p style="margin: 24px 0 0; font-size: 12px; color: #888;">Equipo Talent Acquisition · Trading Solutions</p>
            </div>
          </div>
        `;

        const r = await getResend().emails.send({
          from: EMAIL_FROM,
          to: cand.email,
          bcc: EMAIL_BCC,
          subject,
          html,
        });
        emailResult = { sent: true, id: (r as any)?.data?.id || null };

        await supabaseAdmin
          .from("ts_candidate_experience")
          .update({ sent_at: new Date().toISOString() })
          .eq("id", surveyId);
      } catch (e: any) {
        emailResult = { sent: false, error: e?.message || String(e) };
      }
    }

    return NextResponse.json({
      success: true,
      survey_id: surveyId,
      token,
      link: surveyLink,
      outcome,
      email: emailResult,
    });
  } catch (err: any) {
    console.error("send-experience-survey error:", err);
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 });
  }
}
