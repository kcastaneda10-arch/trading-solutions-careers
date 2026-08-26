/**
 * GET   /api/requisitions/[id]  — el detalle, con su historial
 * PATCH /api/requisitions/[id]  — armar perfil · devolver · aprobar · rechazar
 *
 * Las decisiones viven acá y solo se toman desde el HR Panel: WXM crea la
 * requisición y después lee, nada más. Un solo lugar donde se decide es lo que
 * mantiene una sola verdad.
 *
 * Al aprobar nace la vacante en el ATS con el líder como responsable. Ese es
 * el momento en que el proceso arranca de verdad, y el que ancla los 22 días.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";
import {
  RequisitionStatus,
  validarTransicion,
  faltaParaElPerfil,
  accionesDisponibles,
  diasEnEstado,
} from "@/lib/requisitions";
import { modeloDeCompetencias, nivelDeJerarquia, TS_CLIENT_ID } from "@/lib/competency-model";

export const runtime = "nodejs";

const CAMPOS =
  "id, lead_email, lead_name, area, title, requisition_type, reason, needed_by, " +
  "job_description, requirements, salary_cap_cop, form_template_key, english_required, " +
  "status, approved_at, approved_by, decision_note, vacancy_id, created_at, updated_at";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { data: raw, error } = await supabaseAdmin
    .from("ht_requisitions")
    .select(CAMPOS)
    .eq("id", params.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!raw) return NextResponse.json({ error: "No existe esa requisición" }, { status: 404 });
  const data = raw as any;

  const { data: eventos } = await supabaseAdmin
    .from("ht_requisition_events")
    .select("from_status, to_status, actor_email, note, changed_at")
    .eq("requisition_id", params.id)
    .order("changed_at", { ascending: true });

  return NextResponse.json({
    requisicion: { ...data, dias_en_estado: diasEnEstado(data.updated_at) },
    historial: eventos || [],
    acciones: accionesDisponibles(data.status as RequisitionStatus),
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const accion = String(body.accion || "");
    const nota = body.nota ? String(body.nota).trim() : null;
    const actor = body.actor_email ? String(body.actor_email).toLowerCase().trim() : null;

    const { data: actualRaw, error: readErr } = await supabaseAdmin
      .from("ht_requisitions")
      .select(CAMPOS)
      .eq("id", params.id)
      .maybeSingle();

    if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });
    if (!actualRaw) return NextResponse.json({ error: "No existe esa requisición" }, { status: 404 });
    const actual = actualRaw as any;

    const estadoActual = actual.status as RequisitionStatus;

    // Los campos del perfil se guardan aunque la acción no sea "armar_perfil":
    // Wellness puede ir completando y guardar sin mandar todavía al CWO.
    const cambios: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const campo of [
      "job_description",
      "requirements",
      "salary_cap_cop",
      "form_template_key",
      "english_required",
    ]) {
      if (body[campo] !== undefined) cambios[campo] = body[campo];
    }

    // Guardar sin mover de estado.
    if (!accion) {
      const { error } = await supabaseAdmin
        .from("ht_requisitions")
        .update(cambios)
        .eq("id", params.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, guardado: true, status: estadoActual });
    }

    const validacion = validarTransicion(accion, estadoActual, nota);
    if (!validacion.ok) {
      return NextResponse.json({ error: validacion.error }, { status: 400 });
    }
    const destino = validacion.destino;

    // Mandarla al CWO con el perfil a medias es lo que hace que la devuelvan.
    // Se corta acá y se dice exactamente qué falta.
    if (accion === "armar_perfil") {
      const faltan = faltaParaElPerfil({ ...actual, ...cambios });
      if (faltan.length > 0) {
        return NextResponse.json(
          {
            error: `Antes de mandarla al CWO falta: ${faltan.join(", ")}.`,
            faltantes: faltan,
          },
          { status: 400 },
        );
      }
    }

    cambios.status = destino;
    if (nota) cambios.decision_note = nota;

    // ─── Al aprobar nace la vacante ──────────────────────────────────────
    let vacanteCreada: { id: string; title: string } | null = null;
    if (destino === "aprobada") {
      const modelId = await modeloDeCompetencias();
      if (!modelId) {
        return NextResponse.json(
          {
            error:
              "No hay modelo de competencias para el cliente, así que no se puede " +
              "crear la vacante. Hay que cargarlo (los 16 mandatos) antes de aprobar.",
          },
          { status: 409 },
        );
      }

      const { data: nueva, error: vacErr } = await supabaseAdmin
        .from("ht_vacancies")
        .insert({
          client_id: TS_CLIENT_ID,
          model_id: modelId,
          title: actual.title,
          area: actual.area || null,
          status: "open",
          // La requisición no pide nivel por separado: se deduce del título,
          // que es donde el líder escribe "Senior" o "Lead" cuando aplica.
          role_level: nivelDeJerarquia(actual.title),
          vacancy_type: actual.requisition_type,
          form_template_key: actual.form_template_key || null,
          hiring_lead_email: actual.lead_email,
          requisition_id: actual.id,
        })
        .select("id, title")
        .single();

      if (vacErr) {
        // La requisición NO se marca como aprobada si la vacante no se pudo
        // crear: dejarla aprobada sin vacante es el estado imposible que hace
        // que el líder vea "aprobada" y nunca aparezca un candidato.
        console.error("[requisitions] aprobar → crear vacante falló:", vacErr.message);
        return NextResponse.json(
          {
            error: "Se aprobó pero no se pudo crear la vacante en el ATS",
            detail: vacErr.message,
          },
          { status: 500 },
        );
      }

      vacanteCreada = nueva;
      cambios.vacancy_id = nueva.id;
      cambios.approved_at = new Date().toISOString();
      cambios.approved_by = actor;
    }

    const { error: updErr } = await supabaseAdmin
      .from("ht_requisitions")
      .update(cambios)
      .eq("id", params.id);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    const { error: evErr } = await supabaseAdmin.from("ht_requisition_events").insert({
      requisition_id: params.id,
      from_status: estadoActual,
      to_status: destino,
      actor_email: actor,
      note: nota,
    });
    if (evErr) console.error("[requisitions] evento no registrado:", evErr.message);

    return NextResponse.json({
      success: true,
      status: destino,
      vacante: vacanteCreada,
      acciones: accionesDisponibles(destino),
    });
  } catch (err: any) {
    console.error("[requisitions] PATCH", err);
    return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 });
  }
}
