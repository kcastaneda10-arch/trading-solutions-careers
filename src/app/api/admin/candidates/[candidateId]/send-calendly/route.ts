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

// URL por defecto · Calendly individual de Kelly (Entrevista Recruiter solo).
const CALENDLY_URL_DEFAULT = process.env.CALENDLY_BASE_URL || "https://calendly.com/kcastaneda-tradingsolutions/30min";

// URLs especiales por vacancy_id · usadas cuando la entrevista requiere
// m\u00faltiples hosts (Collective Calendly).
const CALENDLY_URL_BY_VACANCY: Record<string, string> = {
  // Talent Acquisition and Development Lead · Kelly + Yohanna (CWO)
  "70c39cab-adaf-49a0-b137-29d0ff9b56b0": "https://calendly.com/d/cvxv-9wj-wz3/entrevista-colectiva-trading-solutions",
};

function getCalendlyUrl(vacancyId: string | null | undefined): string {
  if (vacancyId && CALENDLY_URL_BY_VACANCY[vacancyId]) {
    return CALENDLY_URL_BY_VACANCY[vacancyId];
  }
  return CALENDLY_URL_DEFAULT;
}

function buildPrefillUrl(baseUrl: string, name: string, email: string, vacancyTitle: string): string {
  const params = new URLSearchParams();
  if (name) params.set("name", name);
  if (email) params.set("email", email);
  if (vacancyTitle) params.set("a1", vacancyTitle);
  return `${baseUrl}?${params.toString()}`;
}

function buildEmailHtml(firstName: string, vacancyTitle: string, calendlyUrl: string, isCollective: boolean, customMessage?: string): string {
  const hostsText = isCollective
    ? "Yohanna Franco (CWO) y Kelly Casta\u00f1eda"
    : "Kelly Casta\u00f1eda";
  const messageBody = customMessage || (isCollective
    ? `Pasaste a la siguiente etapa del proceso para <strong>${vacancyTitle}</strong>. La pr\u00f3xima conversaci\u00f3n es con <strong>${hostsText}</strong> \u00b7 va a durar alrededor de 45 minutos por video.`
    : `Pasaste a la siguiente etapa del proceso para <strong>${vacancyTitle}</strong> y me encantar\u00eda conocerte en una conversaci\u00f3n de ~45 minutos por video.`);
  const slotText = isCollective
    ? "Elige el horario que mejor te funcione \u00b7 solo vas a ver opciones donde las dos estamos disponibles al mismo tiempo:"
    : "Elige el mejor horario de acuerdo a tu disponibilidad \u00b7 vas a ver mi calendario y puedes reservar el espacio que prefieras:";
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
    <p>${slotText}</p>
    <p style="text-align:center"><a href="${calendlyUrl}" class="cta">Elegir horario</a></p>
    <p>Si ninguno de los horarios disponibles te funciona, reg\u00e1lame una respuesta a este correo y buscamos juntos.</p>
    <p>Un abrazo,<br><strong>Kelly Casta\u00f1eda</strong><br>Talent Acquisition and Development Lead<br>Trading Solutions</p>
    <div class="footer">El enlace genera la videollamada de Google Meet autom\u00e1ticamente al confirmar.</div>
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
      .select("id, name, email, phone, vacancy_id, ht_vacancies(title)")
      .eq("id", candidateId)
      .single();

    if (error || !candidate) {
      return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
    }

    const firstName = (candidate.name || "").split(" ")[0] || "candidato";
    // @ts-expect-error supabase relation
    const vacancyTitle: string = candidate.ht_vacancies?.title || "la posición";

    // Elige Collective URL si la vacante lo requiere · sino solo Kelly
    const baseCalendlyUrl = getCalendlyUrl(candidate.vacancy_id as string | null);
    const calendlyUrl = buildPrefillUrl(
      baseCalendlyUrl,
      candidate.name as string,
      candidate.email as string,
      vacancyTitle
    );

    const isCollective = baseCalendlyUrl !== CALENDLY_URL_DEFAULT;
    let draftId: string | null = null;
    if (candidate.email) {
      try {
        const gmail = await isGmailConnected();
        if (gmail.connected) {
          const html = buildEmailHtml(firstName, vacancyTitle, calendlyUrl, isCollective, customMessage);
          const draftRes = await createDraftViaGmail({
            to: candidate.email as string,
            subject: `Trading Solutions · Elige tu horario para la entrevista de ${vacancyTitle}`,
            html,
            fromName: "Kelly Castañeda",
            replyTo: "jointheteam@tradingsolutions.com",
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
    const waMessage = isCollective
      ? `Hola ${firstName}, soy Kelly Casta\u00f1eda de Trading Solutions.\n\nPasaste a la siguiente etapa para ${vacancyTitle}. La pr\u00f3xima conversaci\u00f3n es con Yohanna Franco (CWO) y yo \u00b7 45 minutos por video.\n\nElige el horario que mejor te funcione \u00b7 solo ver\u00e1s opciones donde las dos estamos disponibles: ${calendlyUrl}\n\nSi ninguno te funciona, reg\u00e1lame una respuesta y buscamos juntos.\n\nUn abrazo,\nKelly`
      : `Hola ${firstName}, soy Kelly Casta\u00f1eda de Trading Solutions.\n\nPasaste a la siguiente etapa para ${vacancyTitle} y me encantar\u00eda conocerte en una conversaci\u00f3n de ~45 minutos por video.\n\nElige el mejor horario de acuerdo a tu disponibilidad desde ac\u00e1: ${calendlyUrl}\n\nSi ninguno te funciona, reg\u00e1lame una respuesta y buscamos juntos.\n\nUn abrazo,\nKelly`;
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
