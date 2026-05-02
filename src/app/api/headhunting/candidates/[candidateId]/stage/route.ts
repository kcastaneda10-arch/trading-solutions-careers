/**
 * POST /api/headhunting/candidates/[candidateId]/stage
 *
 * Mueve un candidato a una nueva etapa del funnel.
 * Body: { stage: 'aplico' | 'prefiltro_pasado' | 'rechazado' | ... , create_rejection_draft?: boolean }
 *
 * Si stage === 'rechazado' Y create_rejection_draft (default true):
 *   - Cambia status a 'rejected'
 *   - Crea draft de descarte automático en Gmail
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { createDraftViaGmail, isGmailConnected } from "@/lib/gmail";
import { defaultOnboardingTasks } from "@/lib/onboarding-tasks";
import crypto from "crypto";

const VALID_STAGES = [
  "aplico",
  "prefiltro_enviado",
  "prefiltro_pasado",
  "prefiltro_revision",
  "assessment_invitado",
  "assessment_en_progreso",
  "assessment_completado",
  "entrevista_ia",
  "bateria_psicometrica",
  "recruiter_interview",
  "cwo_interview",
  "touring",
  "terna",
  "oferta",
  "contratado",
  "rechazado",
];

const TS_LINKEDIN_URL = "https://www.linkedin.com/company/trading-sol/";

function buildRejectionHtml(name: string, vacancyTitle: string): string {
  const firstName = (name || "").split(" ")[0] || "candidato";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: Inter, -apple-system, sans-serif; line-height: 1.6; color: #1a1a1a; padding: 24px; background: #f9f9f9; }
  .container { max-width: 600px; margin: 0 auto; background: white; padding: 32px; border-radius: 12px; }
  a { color: #2C64ED; }
</style></head><body>
  <div class="container">
    <p>Hola <strong>${firstName}</strong>,</p>
    <p>Gracias por tomarte el tiempo de aplicar a la posición de <strong>${vacancyTitle}</strong> en Trading Solutions. Después de revisar tu aplicación, hemos decidido avanzar con otros candidatos cuyo perfil se ajusta más a la posición en este momento. Sin embargo, Trading Solutions sigue creciendo y nos encantaría mantenernos en contacto.</p>
    <p>Tu información queda en nuestra base de datos para futuras oportunidades. También te invitamos a seguirnos en LinkedIn para enterarte de nuevas vacantes: <a href="${TS_LINKEDIN_URL}">${TS_LINKEDIN_URL}</a></p>
    <p>Apreciamos tu interés en Trading Solutions y te deseamos mucho éxito en tus próximos pasos.</p>
    <p>Un abrazo,<br><strong>Kelly Castañeda</strong><br>Talent Acquisition and Development Lead<br>Trading Solutions</p>
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
    const body = await req.json();
    const targetStage = String(body.stage || "");
    const createRejectionDraft = body.create_rejection_draft !== false;

    if (!VALID_STAGES.includes(targetStage)) {
      return NextResponse.json(
        { error: `Stage inválida. Válidas: ${VALID_STAGES.join(", ")}` },
        { status: 400 }
      );
    }

    // Cargar candidato
    const { data: candidate, error: fetchErr } = await supabaseAdmin
      .from("ht_candidates")
      .select("id, name, email, vacancy_id, stage, status, ht_vacancies(title)")
      .eq("id", candidateId)
      .single();

    if (fetchErr || !candidate) {
      return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      stage: targetStage,
      updated_at: new Date().toISOString(),
    };

    // Si se mueve a rechazado, también actualizar status
    if (targetStage === "rechazado") {
      updates.status = "rejected";
    }

    // Si se mueve a contratado, status también
    if (targetStage === "contratado") {
      updates.status = "completed";
    }

    let draftId: string | null = null;
    let elevareUrl: string | null = null;

    // Si se mueve a assessment_invitado: generar token + draft de Elevare
    if (targetStage === "assessment_invitado") {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 72);
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://trading-solutions-careers.vercel.app";
      elevareUrl = `${baseUrl}/assessment/ht/${token}`;

      updates.assessment_token = token;
      updates.token_expires_at = expiresAt.toISOString();
      updates.invited_at = new Date().toISOString();
      updates.status = "invited";

      try {
        const gmail = await isGmailConnected();
        if (gmail.connected) {
          // @ts-expect-error supabase relation
          const vacancyTitle = candidate.ht_vacancies?.title || "la vacante";
          const firstName = (candidate.name as string).split(" ")[0] || "candidato";
          const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: Inter, sans-serif; line-height: 1.6; color: #1a1a1a; padding: 24px; background: #f9f9f9; }
  .container { max-width: 600px; margin: 0 auto; background: white; padding: 32px; border-radius: 12px; }
  .cta { display: inline-block; background: #2C64ED; color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
</style></head><body>
  <div class="container">
    <p>Hola <strong>${firstName}</strong>,</p>
    <p>Espero que estés muy bien. Te escribo para invitarte a la siguiente etapa de nuestro proceso de selección para la posición de <strong>${vacancyTitle}</strong> en Trading Solutions.</p>
    <p>El siguiente paso es una evaluación que nos ayuda a entender mejor cómo piensas y decides en situaciones reales del trabajo. No hay respuestas correctas o incorrectas — solo queremos conocer tu forma de ser.</p>
    <p style="text-align:center"><a href="${elevareUrl}" class="cta">Iniciar Evaluación</a></p>
    <p>Detalles importantes:</p>
    <ul>
      <li>Duración aproximada: 55 minutos</li>
      <li>Necesitas: computador con internet estable y cámara web (la usamos para verificar identidad)</li>
      <li>Recomendación: busca un espacio tranquilo, sin interrupciones</li>
      <li>El enlace es válido por 72 horas</li>
      <li>Tus respuestas se guardan automáticamente</li>
    </ul>
    <p>Si tienes alguna pregunta, simplemente responde este correo.</p>
    <p>Un abrazo,<br><strong>Kelly Castañeda</strong><br>Trading Solutions</p>
  </div>
</body></html>`;
          const draftRes = await createDraftViaGmail({
            to: candidate.email as string,
            subject: `Trading Solutions · Evaluación para ${vacancyTitle}`,
            html,
            fromName: "Kelly Castañeda",
          });
          if (draftRes.ok) {
            draftId = draftRes.draft_id;
          }
        }
      } catch (e) {
        console.error("Failed to create Elevare draft:", e);
      }
    }

    // Crear draft de rechazo si aplica
    if (targetStage === "rechazado" && createRejectionDraft) {
      try {
        const gmail = await isGmailConnected();
        if (gmail.connected) {
          // @ts-expect-error supabase relation
          const vacancyTitle = candidate.ht_vacancies?.title || "la posición";
          const draftRes = await createDraftViaGmail({
            to: candidate.email as string,
            subject: `Trading Solutions · Sobre tu aplicación`,
            html: buildRejectionHtml(candidate.name as string, vacancyTitle),
            fromName: "Kelly Castañeda",
          });
          if (draftRes.ok) {
            draftId = draftRes.draft_id;
            updates.rejection_draft_id = draftRes.draft_id;
          }
        }
      } catch (e) {
        console.error("Failed to create rejection draft:", e);
      }
    }

    const { error: updateErr } = await supabaseAdmin
      .from("ht_candidates")
      .update(updates)
      .eq("id", candidateId);

    if (updateErr) {
      return NextResponse.json({ error: "save_failed", detail: updateErr.message }, { status: 500 });
    }

    // ─── Auto-create People + Onboarding when hired ───
    let onboardingId: string | null = null;
    let personId: string | null = null;
    if (targetStage === "contratado") {
      try {
        // Get vacancy info
        const { data: vac } = await supabaseAdmin
          .from("ht_vacancies")
          .select("id, title, area, role_level")
          .eq("id", candidate.vacancy_id)
          .maybeSingle();

        // Find or create person
        const { data: existingPerson } = await supabaseAdmin
          .from("ts_people")
          .select("id")
          .eq("linked_candidate_id", candidateId)
          .maybeSingle();

        if (existingPerson) {
          personId = existingPerson.id;
        } else {
          const { data: newPerson } = await supabaseAdmin
            .from("ts_people")
            .insert({
              name: candidate.name,
              email: candidate.email,
              role: vac?.title || 'Pendiente',
              area: vac?.area || null,
              role_level: vac?.role_level || 'entry',
              start_date: new Date().toISOString().slice(0, 10),
              status: 'onboarding',
              linked_candidate_id: candidateId,
              linked_vacancy_id: vac?.id || null,
              location: 'Barranquilla',
              is_top_performer: false,
            })
            .select("id")
            .single();
          if (newPerson) personId = newPerson.id;
        }

        // Find or create onboarding
        if (personId) {
          const { data: existingOnb } = await supabaseAdmin
            .from("ts_onboarding")
            .select("id")
            .eq("person_id", personId)
            .maybeSingle();
          if (existingOnb) {
            onboardingId = existingOnb.id;
          } else {
            const tasks = defaultOnboardingTasks(vac?.role_level || 'entry');
            const { data: newOnb } = await supabaseAdmin
              .from("ts_onboarding")
              .insert({
                person_id: personId,
                start_date: new Date().toISOString().slice(0, 10),
                status: 'in_progress',
                tasks,
              })
              .select("id")
              .single();
            if (newOnb) onboardingId = newOnb.id;
          }
        }
      } catch (e) {
        console.error("Auto-onboarding creation failed:", e);
      }
    }

    return NextResponse.json({
      success: true,
      candidate_id: candidateId,
      from_stage: candidate.stage,
      to_stage: targetStage,
      draft_id: draftId,
      elevare_url: elevareUrl,
      person_id: personId,
      onboarding_id: onboardingId,
    });
  } catch (err) {
    console.error("stage update error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
