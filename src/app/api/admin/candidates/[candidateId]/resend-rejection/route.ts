/**
 * POST /api/admin/candidates/[candidateId]/resend-rejection
 *
 * Vuelve a generar el correo de rechazo de alguien que YA está rechazado.
 *
 * POR QUÉ EXISTE
 * `reject-with-reason` arma el correo como efecto secundario de mover al
 * candidato a rechazado. Si en ese momento Gmail no respondía, el permiso de
 * Google había expirado, o el borrador quedó sin enviar, no había manera de
 * volver a intentarlo: el candidato ya estaba en rechazado y no se podía
 * rechazar de nuevo. Esta ruta separa las dos cosas — la decisión ya está
 * tomada, acá solo se vuelve a mandar el correo.
 *
 * Body:
 *   - mode: "send" (default) envía de verdad · "draft" deja borrador en Gmail
 *
 * No toca la etapa, ni la categoría, ni `rejected_at`. Solo el correo.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { createDraftViaGmail, sendViaGmail, isGmailConnected } from "@/lib/gmail";
import {
  buildRejectionHtml,
  rejectionSubject,
  REJECTION_FROM_NAME,
  REJECTION_REPLY_TO,
} from "@/lib/rejection-email";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { candidateId: string } },
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const mode: "send" | "draft" = body?.mode === "draft" ? "draft" : "send";

    const { data: cand, error: fetchErr } = await supabaseAdmin
      .from("ht_candidates")
      .select(
        "id, name, email, stage, status, rejection_category, rejection_note_public, rejection_sent_at, ht_vacancies(title)",
      )
      .eq("id", params.candidateId)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ error: "No se pudo leer el candidato", detail: fetchErr.message }, { status: 500 });
    }
    if (!cand) {
      return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
    }

    // Solo para quienes ya están rechazados: esta ruta no toma decisiones.
    if (cand.stage !== "rechazado" && cand.status !== "rejected") {
      return NextResponse.json(
        { error: "Este candidato no está rechazado. El correo de rechazo se genera al rechazarlo." },
        { status: 409 },
      );
    }

    if (!cand.email) {
      return NextResponse.json(
        { error: `${cand.name || "El candidato"} no tiene correo registrado.` },
        { status: 422 },
      );
    }

    // El texto que se le escribió al rechazarlo manda; si no hay, se cae al
    // template de la categoría. Si tampoco hay, no inventamos un mensaje.
    let messageBody = (cand.rejection_note_public as string | null)?.trim() || "";
    if (!messageBody && cand.rejection_category) {
      const { data: cat } = await supabaseAdmin
        .from("ts_rejection_categories")
        .select("public_message_template")
        .eq("category_key", cand.rejection_category)
        .maybeSingle();
      messageBody = (cat?.public_message_template as string | null)?.trim() || "";
    }
    if (!messageBody) {
      return NextResponse.json(
        {
          error:
            "Este rechazo no tiene mensaje para el candidato ni plantilla de categoría, " +
            "así que no hay qué enviar. Abrí el candidato y escribí el mensaje primero.",
        },
        { status: 422 },
      );
    }

    const gmail = await isGmailConnected();
    if (!gmail.connected) {
      return NextResponse.json(
        {
          error:
            "Gmail no está conectado o el permiso de Google expiró. Se reconecta entrando a " +
            "/api/google/auth con la sesión de jointheteam@tradingsolutions.com.",
        },
        { status: 503 },
      );
    }

    // @ts-expect-error relación de supabase
    const vacancyTitle: string = cand.ht_vacancies?.title || "la posición";
    const firstName = (cand.name || "").split(" ")[0] || "candidato";
    const html = buildRejectionHtml(firstName, vacancyTitle, messageBody);
    const subject = rejectionSubject(vacancyTitle);

    if (mode === "draft") {
      const res = await createDraftViaGmail({
        to: cand.email as string,
        subject,
        html,
        fromName: REJECTION_FROM_NAME,
        replyTo: REJECTION_REPLY_TO,
      });
      if (!res.ok) {
        return NextResponse.json({ error: "No se pudo crear el borrador", detail: res.error }, { status: 502 });
      }
      await supabaseAdmin
        .from("ht_candidates")
        .update({ rejection_draft_id: res.draft_id, updated_at: new Date().toISOString() })
        .eq("id", params.candidateId);

      return NextResponse.json({
        success: true,
        mode: "draft",
        draft_id: res.draft_id,
        to: cand.email,
        message: `Borrador creado en ${res.gmail_email}. Revisalo y enviálo desde Gmail.`,
      });
    }

    const res = await sendViaGmail({
      to: cand.email as string,
      subject,
      html,
      fromName: REJECTION_FROM_NAME,
      replyTo: REJECTION_REPLY_TO,
    });
    if (!res.ok) {
      return NextResponse.json({ error: "No se pudo enviar el correo", detail: res.error }, { status: 502 });
    }

    const sentAt = new Date().toISOString();
    const { error: updErr } = await supabaseAdmin
      .from("ht_candidates")
      .update({ rejection_sent_at: sentAt, updated_at: sentAt })
      .eq("id", params.candidateId);

    // Si el correo salió pero no se pudo marcar, es peor callarlo: el próximo
    // clic volvería a enviar sin avisar que ya había salido.
    if (updErr) {
      return NextResponse.json({
        success: true,
        mode: "send",
        to: cand.email,
        sent_at: sentAt,
        warning: "El correo salió, pero no se pudo registrar la fecha de envío: " + updErr.message,
      });
    }

    return NextResponse.json({
      success: true,
      mode: "send",
      to: cand.email,
      sent_at: sentAt,
      resent: Boolean(cand.rejection_sent_at),
      message: `Correo enviado a ${cand.email}.`,
    });
  } catch (err: any) {
    console.error("[resend-rejection]", err);
    return NextResponse.json(
      { error: "Error interno", detail: err?.message || String(err) },
      { status: 500 },
    );
  }
}
