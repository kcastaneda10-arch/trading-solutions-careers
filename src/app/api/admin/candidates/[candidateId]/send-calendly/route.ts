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

// Yohanna Franco · Chief Wellness Officer
const YOHANNA_CALENDLY = "https://calendly.com/cwo-tradingsolutions/new-meeting";
const YOHANNA_HOST = {
  firstName: "Yohanna",
  fullName: "Yohanna Franco",
  role: "Chief Wellness Officer · Trading Solutions",
};

// URLs especiales por vacancy_id · personalizadas según quién hace la entrevista recruiter
const CALENDLY_URL_BY_VACANCY: Record<string, string> = {
  // Talent Acquisition and Development Lead · Yohanna Franco (CWO) es la recruiter
  "70c39cab-adaf-49a0-b137-29d0ff9b56b0": YOHANNA_CALENDLY,
};

// Hosts/firmas por vacancy_id · para personalizar el copy y firma del email
const CALENDLY_HOST_BY_VACANCY: Record<string, { firstName: string; fullName: string; role: string }> = {
  "70c39cab-adaf-49a0-b137-29d0ff9b56b0": YOHANNA_HOST,
};

// Stages en los que Yohanna es siempre la host (independiente de la vacante)
const YOHANNA_STAGES = new Set(["cwo_interview"]);

function getCalendlyUrl(vacancyId: string | null | undefined, stage: string | null | undefined): string {
  // 1. Si el stage es de Yohanna (ej. cwo_interview) · siempre Yohanna
  if (stage && YOHANNA_STAGES.has(stage)) {
    return YOHANNA_CALENDLY;
  }
  // 2. Si la vacante tiene un host personalizado (ej. Talent → Yohanna)
  if (vacancyId && CALENDLY_URL_BY_VACANCY[vacancyId]) {
    return CALENDLY_URL_BY_VACANCY[vacancyId];
  }
  // 3. Default · Kelly
  return CALENDLY_URL_DEFAULT;
}

function getHost(vacancyId: string | null | undefined, stage: string | null | undefined): { firstName: string; fullName: string; role: string } {
  if (stage && YOHANNA_STAGES.has(stage)) {
    return YOHANNA_HOST;
  }
  if (vacancyId && CALENDLY_HOST_BY_VACANCY[vacancyId]) {
    return CALENDLY_HOST_BY_VACANCY[vacancyId];
  }
  return { firstName: "Kelly", fullName: "Kelly Castañeda", role: "Talent Acquisition and Development Lead · Trading Solutions" };
}

function buildPrefillUrl(baseUrl: string, name: string, email: string, vacancyTitle: string): string {
  const params = new URLSearchParams();
  if (name) params.set("name", name);
  if (email) params.set("email", email);
  if (vacancyTitle) params.set("a1", vacancyTitle);
  return `${baseUrl}?${params.toString()}`;
}

function buildEmailHtml(firstName: string, vacancyTitle: string, calendlyUrl: string, host: { firstName: string; fullName: string; role: string }, customMessage?: string): string {
  const messageBody = customMessage ||
    `Pasaste a la siguiente etapa del proceso para <strong>${vacancyTitle}</strong>. La próxima conversación es con <strong>${host.fullName}</strong> · va a durar alrededor de 45 minutos por video.`;
  const slotText = `Elige el mejor horario de acuerdo a tu disponibilidad · vas a ver el calendario de ${host.firstName} y puedes reservar el espacio que prefieras:`;
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
    <p style="font-size:13px;color:#737373"><em>Nota: los festivos colombianos no son hábiles · si ves alguno disponible (ej. lunes 18 de mayo · Día de la Ascensión), por favor escoge otro día.</em></p>
    <p>Si ninguno de los horarios disponibles te funciona, regálame una respuesta a este correo y buscamos juntos.</p>
    <p>Un abrazo,<br><strong>${host.fullName}</strong><br>${host.role}</p>
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
      .select("id, name, email, phone, vacancy_id, stage, ht_vacancies(title)")
      .eq("id", candidateId)
      .single();

    if (error || !candidate) {
      return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
    }

    const firstName = (candidate.name || "").split(" ")[0] || "candidato";
    // @ts-expect-error supabase relation
    const vacancyTitle: string = candidate.ht_vacancies?.title || "la posición";

    // Selección de host según stage y vacante:
    //   1. Stage cwo_interview → siempre Yohanna (en cualquier vacante)
    //   2. Vacante Talent Acquisition → Yohanna como recruiter
    //   3. Default → Kelly
    const candidateStage = candidate.stage as string | null;
    const baseCalendlyUrl = getCalendlyUrl(candidate.vacancy_id as string | null, candidateStage);
    const calendlyUrl = buildPrefillUrl(
      baseCalendlyUrl,
      candidate.name as string,
      candidate.email as string,
      vacancyTitle
    );

    const host = getHost(candidate.vacancy_id as string | null, candidateStage);
    const isCustomHost = baseCalendlyUrl !== CALENDLY_URL_DEFAULT;
    let draftId: string | null = null;
    if (candidate.email) {
      try {
        const gmail = await isGmailConnected();
        if (gmail.connected) {
          const html = buildEmailHtml(firstName, vacancyTitle, calendlyUrl, host, customMessage);
          const draftRes = await createDraftViaGmail({
            to: candidate.email as string,
            subject: `Trading Solutions · Elige tu horario para la entrevista de ${vacancyTitle}`,
            html,
            fromName: host.fullName,
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

    // WhatsApp link · pre-llenado para click-to-send (firmado por el host correspondiente)
    const waMessage = `Hola ${firstName}, te escribo desde Trading Solutions.\n\nPasaste a la siguiente etapa para ${vacancyTitle}. La próxima conversación es con ${host.fullName} · 45 minutos por video.\n\nElige el horario que mejor te funcione desde acá: ${calendlyUrl}\n\nSi ninguno te funciona, regálame una respuesta y buscamos juntos.\n\nUn abrazo,\n${host.firstName}`;
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
