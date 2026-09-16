/**
 * GET /api/ranking?vacancy_id=…
 *
 * Los candidatos de una vacante con su evaluación vigente, para dibujar el
 * 9-box. La ubicación en la matriz NO se calcula acá: la calcula
 * `ubicar()` en el cliente con las mismas reglas que se ven en pantalla, para
 * que no existan dos versiones del criterio.
 *
 * POR QUÉ DEVUELVE TAMBIÉN A LOS QUE NO TIENEN EVALUACIÓN
 * Una matriz que solo muestra a los evaluados hace invisible lo que falta
 * hacer, y el hueco se lee como si no hubiera nadie más. Vienen todos; la
 * pantalla decide dónde va cada uno.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/bateria/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Etapas que ya no participan de una decisión de terna. */
const ETAPAS_CERRADAS = new Set(["rechazado", "descartado", "contratado", "no_interesado"]);

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const vacancyId = req.nextUrl.searchParams.get("vacancy_id");
  if (!vacancyId) return NextResponse.json({ error: "Falta vacancy_id" }, { status: 400 });
  const incluirCerrados = req.nextUrl.searchParams.get("cerrados") === "1";

  try {
    const { data: vac, error: vErr } = await supabaseAdmin
      .from("ht_vacancies")
      .select("id, title, status")
      .eq("id", vacancyId)
      .maybeSingle<{ id: string; title: string; status: string }>();

    if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 });
    if (!vac) return NextResponse.json({ error: "Vacante no encontrada" }, { status: 404 });

    const { data: cands, error: cErr } = await supabaseAdmin
      .from("ht_candidates")
      .select("id, name, stage")
      .eq("vacancy_id", vacancyId)
      .order("name");

    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

    const candidatos = (cands ?? []).filter(
      (c) => incluirCerrados || !ETAPAS_CERRADAS.has(String(c.stage ?? "")),
    );

    if (candidatos.length === 0) {
      return NextResponse.json(
        { vacante: vac, candidatos: [] },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    // Todas las evaluaciones de esos candidatos, más nueva primero. Nos
    // quedamos con la primera de cada uno: es la vigente.
    const ids = candidatos.map((c) => c.id);
    const { data: evs, error: eErr } = await supabaseAdmin
      .from("ht_candidate_evaluations")
      .select(
        "candidate_id, rubrica_key, rubrica_version, run_at, capacidad_puntaje, capacidad_cobertura, ajuste_puntaje, ajuste_cobertura, bloqueado_por, semaforo, veredictos",
      )
      .in("candidate_id", ids)
      .order("run_at", { ascending: false });

    if (eErr) return NextResponse.json({ error: eErr.message }, { status: 500 });

    const vigente = new Map<string, Record<string, unknown>>();
    for (const e of evs ?? []) {
      if (!vigente.has(e.candidate_id)) vigente.set(e.candidate_id, e);
    }

    const filas = candidatos.map((c) => {
      const ev = vigente.get(c.id) as any;
      // Las preguntas pendientes son lo accionable; los veredictos completos
      // pesan mucho y acá no se leen renglón por renglón.
      const pendientes: string[] = Array.isArray(ev?.veredictos)
        ? ev.veredictos.filter((v: any) => v?.estado === "sin_evidencia" && v?.pregunta).map((v: any) => v.pregunta)
        : [];
      return {
        id: c.id,
        nombre: c.name,
        etapa: c.stage,
        evaluacion: ev
          ? {
              rubrica_key: ev.rubrica_key,
              rubrica_version: ev.rubrica_version,
              run_at: ev.run_at,
              capacidad_puntaje: ev.capacidad_puntaje == null ? null : Number(ev.capacidad_puntaje),
              capacidad_cobertura: ev.capacidad_cobertura,
              ajuste_puntaje: ev.ajuste_puntaje == null ? null : Number(ev.ajuste_puntaje),
              ajuste_cobertura: ev.ajuste_cobertura,
              bloqueado_por: ev.bloqueado_por ?? [],
              semaforo: ev.semaforo,
              preguntas_pendientes: pendientes,
            }
          : null,
      };
    });

    return NextResponse.json(
      { vacante: vac, candidatos: filas },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e: any) {
    console.error("[ranking]", e);
    return NextResponse.json({ error: "Error interno", detail: e?.message || String(e) }, { status: 500 });
  }
}
