/**
 * POST /api/admin/candidates/[candidateId]/send-calendly
 *
 * Genera la URL Calendly pre-llenada con datos del candidato y crea un draft
 * de Gmail con el mensaje de invitación · el candidato elige slot self-serve.
 *
 * URL prefill format:
 *   https://calendly.com/{user}/{event}?name=John&email=x@y.com&a1=Vacancy
 *
 * Body opcional: { custom_message?: string }
 *
 * Side effect:
 *   - Marca calendly_invitation_sent_at en ht_candidates (si la columna existe)
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { createDraftViaGmail, isGmailConnected } from "@/lib/gmail";

export const runtime = "nodejs";

const CALENDLY_URL = process.env.CALENDLY_BASE_URL || "https://calendly.com/kcastaneda-tradingsolutions/30min";
const TS_LINKEDIN_URL = "https://www.linkedin.com/company/trading-sol/";

function buildPrefillUrl(name: string, email: string, vacancyTitle: string): string {
  const params = new URLSearchParams();
  if (name) params.set("name", name);
  if (email) params.set("email", email);
  if (vacancyTitle) params.set("a1", vacancyTitle);
  return `${CALENDLY_URL}?${params.toString()}`;
}

function buildEmailHtml(firstName: string, vacancyTitle: string, calendlyUrl: string, customMessage?: string): string {
  const messageBody = customMessage || `Pasaste a la siguiente etapa del proceso para <strong>${vacancyTitle}</strong> · me encantaría conocerte en una conversación de ~45 minutos por video.`;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: 'Open Sauce Sans', -apple-system, sans-serif; line-height: 1.6; color: #0a0a0a; padding: 24px; background: #fafafa; }
  .container { max-width: 600px; margin: 0 auto; background: white; padding: 32px; border: 1px solid #e8e8e8; }
  .cta { display: inline-block; background: #0a0a0a; color: white !important; text-decoration: none; padding: 13px 28px; font-weight: 700; margin: 16px 0; letter-spacing: 0.3px; }
  p { font-size: 14px; margin: 0 0 14px; }
  .footer { color: #737373; font-size: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e8e8e8; }
</style></head><body>
  <div class="container">
    <p>Hola <strong>${firstName}</strong>,</p>
    <p>${messageBody}</p>
    <p>Elegí el horario que mejor te calce desde acá · vas a ver mi disponibilidad y podés reservar el slot que prefieras:</p>
    <p style="text-align:center"><a href="${calendlyUrl}" class="cta">Elegir horario</a></p>
    <p>Si ninguno de los horarios disponibles te funciona, contestame este correo y buscamos juntos.</p>
    <p>Un abrazo,<br><strong>Kelly Castañeda</strong><br>Talent Acquisition and Development Lead<br>Trading Solutions</p>
    <div class="footer">El enlace genera la videollamada de Google Meet automáticamente al confirmar.</div>
  </div>
</body></html>`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { candidateId: string } }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { candidateId } = params;
    const body = await req.json().catch(() => ({}));
    const customMessage: string | undefined = body.custom_message;

    const { data: candidate, error } = await supabaseAdmin
      .from("ht_candidates")
      .select("id, name, email, phone, ht_vacancies(title)")
      .eq("id", candidateId)
      .single();

    if (error || !candidate) {
      return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
    }

    const firstName = (candidate.name || "").split(" ")[0] || "candidato";
    // @ts-expect-error supabase relation
    const vacancyTitle: string = candidate.ht_vacancies?.title || "la posición";

    const calendlyUrl = buildPrefillUrl(
      candidate.name as string,
      candidate.email as string,
      vacancyTitle
    );

    let draftId: string | null = null;
    if (candidate.email) {
      try {
        const gmail = await isGmailConnected();
        if (gmail.connected) {
          const html = buildEmailHtml(firstName, vacancyTitle, calendlyUrl, customMessage);
          const draftRes = await createDraftViaGmail({
            to: candidate.email as string,
            subject: `Trading Solutions · Elegí tu horario para la entrevista de ${vacancyTitle}`,
            html,
            fromName: "Kelly Castañeda",
            replyTo: "kcastaneda@tradingsolutions.com",
          });
          if (draftRes.ok) draftId = draftRes.draft_id;
        }
      } catch (e) {
        console.error("Calendly draft creation failed:", e);
      }
    }

    // Tracking · si la columna existe, registra el envío. Si no, silenciar.
    try {
      await supabaseAdmin
        .from("ht_candidates")
        .update({
          calendly_invitation_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", candidateId);
    } catch {
      // columna probablemente no existe — no bloquear flujo
    }

    // WhatsApp link · pre-llenado para click-to-send
    const waMessage = `Hola ${firstName}, soy Kelly Castañeda de Trading Solutions.\n\nPasaste a la siguiente etapa para ${vacancyTitle} · me encantaría conocerte en una conversación de ~45 minutos por video.\n\nElegí el horario que mejor te calce desde acá: ${calendlyUrl}\n\nSi ninguno te funciona, contestame y buscamos juntos.\n\nUn abrazo,\nKelly`;
    const cleanPhone = (candidate.phone || "").replace(/[^0-9]/g, "");
    const finalPhone = cleanPhone.length === 10 ? `57${cleanPhone}` : cleanPhone;
    const waLink = finalPhone
      ? `https://wa.me/${finalPhone}?text=${encodeURIComponent(waMessage)}`
      : null;

    return NextResponse.json({
      success: true,
      candidate_id: candidateId,
      candidate_name: candidate.name,
      calendly_url: calendlyUrl,
      draft_id: draftId,
      wa_link: waLink,
    });
  } catch (err: any) {
    console.error("send-calendly error:", err);
    return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 });
  }
}
