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
  body { font-family: Inter, -apple-system, sans-serif; line-height: 1.6; color: #1a1a1a; padding: 24px; background: #f9f9f9; }
  .container { max-width: 600px; margin: 0 auto; background: white; padding: 32px; border-radius: 12px; }
  .cta { display: inline-block; background: #2C64ED; color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
  ul { margin: 12px 0; padding-left: 22px; }
  li { margin-bottom: 6px; }
</style></head><body>
  <div class="container">
    <p>Hola <strong>${firstName}</strong>,</p>
    <p>Has avanzado a la siguiente etapa del proceso para la posición de <strong>${vacancyTitle}</strong> en Trading Solutions. ¡Felicitaciones!</p>
    <p>El siguiente paso es una <strong>entrevista por voz con nuestra recruiter virtual</strong>. Es una conversación natural, en tiempo real — nuestra reclutadora te hará preguntas sobre tu experiencia y al final habrá una sección corta en inglés.</p>
    <p style="text-align:center"><a href="${interviewUrl}" class="cta">Iniciar entrevista</a></p>
    <p><strong>Detalles importantes:</strong></p>
    <ul>
      <li><strong>Duración:</strong> 15-20 minutos</li>
      <li><strong>Necesitas:</strong> computador con micrófono, internet estable, espacio tranquilo</li>
      <li><strong>Recomendación:</strong> habla con naturalidad, como en una llamada normal — ella escucha y responde</li>
      <li><strong>Validez:</strong> el enlace expira en 72 horas</li>
      <li><strong>Una sola oportunidad:</strong> termina la entrevista, sin pausas largas</li>
    </ul>
    <p>Después de la entrevista, te contactaremos para los siguientes pasos.</p>
    <p>Si tienes alguna duda por favor escribeme a este correo.</p>
    <p>Un abrazo,<br><strong>Kelly Castañeda</strong></p>
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
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
