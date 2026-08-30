/**
 * POST /api/headhunting/candidates/[candidateId]/send-ai-interview
 *
 * Genera un token único de entrevista IA, lo guarda en ht_ai_interviews,
 * y crea un draft en Gmail con el link a la página de entrevista.
 *
 * El candidato accede a /entrevista-ia/[token] que embebe el widget de
 * ElevenLabs Conversational AI configurado para hacer la entrevista por voz.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { createDraftViaGmail, isGmailConnected } from "@/lib/gmail";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: { candidateId: string } }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { candidateId } = params;

    const { data: candidate, error } = await supabaseAdmin
      .from("ht_candidates")
      .select("*, ht_vacancies(title), ht_clients(name)")
      .eq("id", candidateId)
      .single();

    if (error || !candidate) {
      return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
    }

    // Generate token (72h expiry)
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72);

    // Insert AI interview record
    const { data: interview, error: insertErr } = await supabaseAdmin
      .from("ht_ai_interviews")
      .insert({
        candidate_id: candidateId,
        token,
        token_expires_at: expiresAt.toISOString(),
        agent_id: process.env.ELEVENLABS_AGENT_ID || null,
        status: "invited",
      })
      .select()
      .single();

    if (insertErr) {
      console.error("ai-interview insert error:", insertErr);
      return NextResponse.json({ error: "save_failed", detail: insertErr.message }, { status: 500 });
    }

    // Update candidate stage
    await supabaseAdmin
      .from("ht_candidates")
      .update({ stage: "entrevista_ia", updated_at: new Date().toISOString() })
      .eq("id", candidateId);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://trading-solutions-careers.vercel.app";
    const interviewUrl = `${baseUrl}/entrevista-ia/${token}`;
    const firstName = (candidate.name as string).split(" ")[0] || "candidato";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vacancyTitle = (candidate as any).ht_vacancies?.title || "la vacante";

    // Try to create Gmail draft
    let draftId: string | null = null;
    try {
      const gmail = await isGmailConnected();
      if (gmail.connected) {
        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: 'Open Sauce Sans', -apple-system, sans-serif; line-height: 1.6; color: #0a0a0a; padding: 24px; background: #fafafa; }
  .container { max-width: 600px; margin: 0 auto; background: white; padding: 32px; border: 1px solid #e8e8e8; }
  .cta { display: inline-block; background: #0a0a0a; color: white !important; text-decoration: none; padding: 13px 28px; font-weight: 700; margin: 16px 0; letter-spacing: 0.3px; }
  ul { margin: 8px 0 16px; padding-left: 20px; }
  li { margin-bottom: 5px; font-size: 14px; }
  p { font-size: 14px; margin: 0 0 14px; }
</style></head><body>
  <div class="container">
    <p>Hola <strong>${firstName}</strong>,</p>
    <p>Llegaste a la siguiente etapa del proceso para <strong>${vacancyTitle}</strong>. El próximo paso es una conversación con nuestra recruiter virtual · es por voz, en tiempo real, y termina con una sección corta en inglés.</p>
    <p>No es un examen · te va a preguntar sobre tu experiencia y querés contarle naturalmente, como una llamada cualquiera.</p>
    <p style="text-align:center"><a href="${interviewUrl}" class="cta">Iniciar entrevista</a></p>
    <p>Algunos detalles para que estés cómoda/o:</p>
    <ul>
      <li>Dura entre 15 y 20 minutos</li>
      <li>Necesitás computador con micrófono, internet estable y un espacio tranquilo</li>
      <li>Hablá con naturalidad · ella te escucha y responde</li>
      <li>El enlace queda activo 72 horas</li>
      <li>Mejor hacela de corrido, sin pausas largas</li>
    </ul>
    <p>Después de la entrevista nos contactamos contigo para los siguientes pasos. Si te queda alguna duda, contestame este correo.</p>
    <p>Un abrazo,<br><strong>Kelly Castañeda</strong><br>Talent Acquisition and Development Lead<br>Trading Solutions</p>
  </div>
</body></html>`;

        const draftRes = await createDraftViaGmail({
          to: candidate.email as string,
          subject: `Trading Solutions · Entrevista para ${vacancyTitle}`,
          html,
          fromName: "Kelly Castañeda",
        });
        if (draftRes.ok) {
          draftId = draftRes.draft_id;
          await supabaseAdmin
            .from("ht_ai_interviews")
            .update({ recruiter_draft_id: draftRes.draft_id })
            .eq("id", interview.id);
        }
      }
    } catch (e) {
      console.error("AI interview draft creation failed:", e);
    }

    return NextResponse.json({
      success: true,
      candidate_id: candidateId,
      interview_id: interview.id,
      interview_url: interviewUrl,
      expires_at: expiresAt.toISOString(),
      draft_id: draftId,
      channel: draftId ? "gmail-draft" : "token-only",
    });
  } catch (err) {
    console.error("send-ai-interview error:", err);
    return NextResponse.json(
      { error: "Error interno", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
