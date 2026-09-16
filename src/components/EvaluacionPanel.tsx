"use client";

/**
 * EVALUACIÓN DEL EXPEDIENTE · dentro de la ficha del candidato
 *
 * Esta pantalla existe para que el número tenga dónde sostenerse. Cada criterio
 * se muestra con la cita de la que salió y el archivo donde estaba. Lo que no se
 * pudo verificar no se rellena: queda declarado, baja la cobertura, y se
 * convierte en la pregunta que hay que hacerle a la persona.
 *
 * LOS DOS EJES NO SE SUMAN
 * Se muestran lado a lado. Alguien fuerte en capacidad con ajuste bajo es una
 * decisión distinta —y una conversación distinta— que alguien al revés.
 *
 * LO QUE EL AGENTE NO PUEDE CALIFICAR
 * Assessment, juego de roles y entrevista los carga Wellness a mano, abajo.
 * Nadie puede leer de un PDF cómo alguien ejecutó en una sala.
 */

import { useCallback, useEffect, useState } from "react";
import { getRubrica, FUENTE_LABEL, type Criterio, type Bloque } from "@/lib/rubricas";
import {
  criteriosDelAgente,
  criteriosDeWellness,
  SEMAFORO_LABEL,
  type Semaforo,
  type Veredicto,
} from "@/lib/evaluacion";

type Evaluacion = {
  id?: string;
  rubrica_key: string;
  rubrica_version: string;
  run_at: string;
  modelo: string | null;
  veredictos: Veredicto[];
  niveles_manuales: Record<string, number> | null;
  capacidad_puntaje: number | null;
  capacidad_cobertura: number | null;
  ajuste_puntaje: number | null;
  ajuste_cobertura: number | null;
  bloqueado_por: string[];
  semaforo: Semaforo;
  documentos_leidos: string[];
  documentos_omitidos: string[];
};

const SEM_ESTILO: Record<Semaforo, string> = {
  listo: "bg-emerald-50 text-emerald-800 border-emerald-200",
  falta_evidencia: "bg-amber-50 text-amber-800 border-amber-200",
  bloqueado: "bg-red-50 text-red-800 border-red-200",
};

const SEM_PUNTO: Record<Semaforo, string> = {
  listo: "bg-emerald-500",
  falta_evidencia: "bg-amber-500",
  bloqueado: "bg-red-500",
};

function Puntaje({
  titulo,
  bajada,
  puntaje,
  cobertura,
}: {
  titulo: string;
  bajada: string;
  puntaje: number | null;
  cobertura: number | null;
}) {
  const cob = cobertura ?? 0;
  return (
    <div className="flex-1 min-w-[150px] bg-white border border-gray-200 rounded-lg px-3 py-2.5">
      <p className="text-[10.5px] uppercase tracking-wider font-bold text-gray-500">{titulo}</p>
      <div className="flex items-baseline gap-1.5 mt-0.5">
        <span className="font-mono text-2xl font-semibold text-gray-900">
          {puntaje != null ? Number(puntaje).toFixed(2) : "—"}
        </span>
        <span className="text-xs text-gray-400">/ 5</span>
      </div>
      {/* La cobertura va SIEMPRE pegada al número: un 4,3 con media rúbrica
          vacía no es comparable con un 4,1 completo. */}
      <div className="mt-1.5">
        <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={"h-full rounded-full " + (cob >= 100 ? "bg-emerald-500" : "bg-amber-400")}
            style={{ width: `${Math.min(100, cob)}%` }}
          />
        </div>
        <p className="text-[10.5px] text-gray-500 mt-1">
          {cob}% de la evidencia cargada
        </p>
      </div>
      <p className="text-[10.5px] text-gray-400 mt-1 leading-snug">{bajada}</p>
    </div>
  );
}

function FilaVeredicto({ c, v }: { c: Criterio; v: Veredicto | undefined }) {
  const estado = v?.estado ?? "sin_evidencia";
  const color =
    estado === "cumple"
      ? "text-emerald-700"
      : estado === "no_cumple"
      ? "text-red-700"
      : "text-gray-400";
  const marca = estado === "cumple" ? "●" : estado === "no_cumple" ? "▲" : "○";

  return (
    <div className="border-b border-gray-100 last:border-b-0 py-2.5">
      <div className="flex items-start gap-2">
        <span className={`font-mono text-xs mt-0.5 ${color}`}>{marca}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-gray-900">{c.nombre}</span>
            {c.excluyente && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-50 text-red-700">
                excluyente
              </span>
            )}
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
              {FUENTE_LABEL[c.fuente]}
            </span>
          </div>

          {v?.evidencia ? (
            <blockquote className="mt-1 text-[12.5px] text-gray-700 leading-snug border-l-2 border-gray-200 pl-2.5 italic">
              «{v.evidencia}»
              {v.fuente && <span className="not-italic text-gray-400"> — {v.fuente}</span>}
            </blockquote>
          ) : (
            <p className="mt-1 text-[12.5px] text-gray-500 italic">
              Sin evidencia en el expediente. No se estima.
            </p>
          )}

          {v?.pregunta && (
            <p className="mt-1.5 text-[12px] text-amber-800 bg-amber-50 border border-amber-100 rounded px-2 py-1.5 leading-snug">
              Preguntar: {v.pregunta}
            </p>
          )}
        </div>
        <span className="font-mono text-sm text-gray-900 shrink-0">
          {v?.nivel != null ? v.nivel : "—"}
        </span>
      </div>
    </div>
  );
}

export default function EvaluacionPanel({
  candidateId,
  rubricaKey = "sig-sst",
}: {
  candidateId: string;
  rubricaKey?: string;
}) {
  const rubrica = getRubrica(rubricaKey);

  const [ev, setEv] = useState<Evaluacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [corriendo, setCorriendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [detalle, setDetalle] = useState("");
  const [manual, setManual] = useState<Record<string, string>>({});
  const [abierto, setAbierto] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const r = await fetch(
        `/api/agents/evaluate-candidate?candidate_id=${candidateId}&rubrica=${rubricaKey}`,
        { cache: "no-store" },
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo cargar la evaluación");
      if (j.evaluacion) {
        setEv(j.evaluacion);
        const m = j.evaluacion.niveles_manuales ?? {};
        setManual(Object.fromEntries(Object.entries(m).map(([k, x]) => [k, String(x)])));
        setAbierto(true);
      }
    } catch (e: any) {
      setError(e.message || "No se pudo cargar");
    } finally {
      setCargando(false);
    }
  }, [candidateId, rubricaKey]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function correr() {
    setCorriendo(true);
    setError("");
    setDetalle("");
    try {
      const r = await fetch("/api/agents/evaluate-candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidateId, rubrica: rubricaKey }),
      });
      const j = await r.json();
      if (!r.ok) {
        setDetalle(j.detail || "");
        throw new Error(j.error || "El agente no pudo correr");
      }
      setEv(j.evaluacion);
      setAbierto(true);
      // Si corrió pero no se guardó, hay que decirlo: el número que se ve en
      // pantalla no está en la base y mañana no va a estar.
      if (j.guardado === false) {
        setError("La evaluación corrió pero no quedó guardada");
        setDetalle(j.error_guardado || "");
      }
    } catch (e: any) {
      setError(e.message || "El agente no pudo correr");
    } finally {
      setCorriendo(false);
    }
  }

  async function guardarManuales() {
    setGuardando(true);
    setError("");
    setDetalle("");
    try {
      const niveles: Record<string, number> = {};
      for (const [k, v] of Object.entries(manual)) {
        if (v !== "") niveles[k] = Number(v);
      }
      const r = await fetch("/api/agents/evaluate-candidate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidateId, rubrica: rubricaKey, niveles_manuales: niveles }),
      });
      const j = await r.json();
      if (!r.ok) {
        setDetalle(j.detail || "");
        throw new Error(j.error || "No se pudieron guardar las calificaciones");
      }
      setEv(j.evaluacion);
    } catch (e: any) {
      setError(e.message || "No se pudieron guardar");
    } finally {
      setGuardando(false);
    }
  }

  if (!rubrica) {
    return (
      <div className="mt-4">
        <h3 className="text-[11px] uppercase tracking-wider font-bold text-gray-500 mb-2">
          🎯 Evaluación contra la rúbrica
        </h3>
        <p className="text-xs text-gray-500 italic">
          Este cargo todavía no tiene rúbrica cargada. Sin rúbrica no hay con qué calificar.
        </p>
      </div>
    );
  }

  const porId = new Map((ev?.veredictos ?? []).map((v) => [v.criterio_id, v]));
  const delAgente = criteriosDelAgente(rubrica);
  const deWellness = criteriosDeWellness(rubrica);
  const pendientes = (ev?.veredictos ?? []).filter((v) => v.estado === "sin_evidencia" && v.pregunta);

  // Agrupar por EJE y luego por bloque. El eje tiene que estar a la vista: un
  // «20 %» de capacidad junto a un «85 %» de ajuste, sin decir a qué eje
  // pertenece cada uno, se lee como si sumaran — y no suman.
  const ejes: { titulo: string; grupos: { bloque: Bloque; criterios: Criterio[] }[] }[] = [
    { titulo: "Capacidad", grupos: [] },
    { titulo: "Ajuste · TS Standard", grupos: [] },
  ];
  const idsCapacidad = new Set(rubrica.capacidad.map((b) => b.id));
  for (const { bloque, criterio } of delAgente) {
    const eje = ejes[idsCapacidad.has(bloque.id) ? 0 : 1];
    let g = eje.grupos.find((x) => x.bloque.id === bloque.id);
    if (!g) { g = { bloque, criterios: [] }; eje.grupos.push(g); }
    g.criterios.push(criterio);
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <h3 className="text-[11px] uppercase tracking-wider font-bold text-gray-500">
          🎯 Evaluación contra la rúbrica
        </h3>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
          {rubrica.cargo} v{rubrica.version}
        </span>
        <button
          type="button"
          onClick={correr}
          disabled={corriendo}
          className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-md bg-gray-900 text-white disabled:opacity-50"
        >
          {corriendo ? "Leyendo el expediente…" : ev ? "Volver a correr" : "Correr el agente"}
        </button>
      </div>

      {cargando && <p className="text-xs text-gray-400 italic">Cargando evaluación…</p>}

      {error && (
        <div className="mb-2 text-xs bg-red-50 border border-red-200 text-red-800 rounded-lg px-3 py-2">
          <p className="font-semibold">{error}</p>
          {detalle && <p className="mt-0.5 text-red-700">{detalle}</p>}
        </div>
      )}

      {!cargando && !ev && !error && (
        <p className="text-xs text-gray-500 italic">
          Todavía no se ha evaluado. El agente lee los documentos del expediente y responde
          criterio por criterio con la cita de dónde lo sacó.
        </p>
      )}

      {ev && (
        <>
          <div className={"flex items-center gap-2 border rounded-lg px-3 py-2 mb-2 " + SEM_ESTILO[ev.semaforo]}>
            <span className={"w-2 h-2 rounded-full shrink-0 " + SEM_PUNTO[ev.semaforo]} />
            <span className="text-[12.5px] font-semibold">{SEMAFORO_LABEL[ev.semaforo]}</span>
            {ev.bloqueado_por?.length > 0 && (
              <span className="text-[12px]">· {ev.bloqueado_por.join(", ")}</span>
            )}
            <span className="ml-auto text-[10.5px] opacity-70 font-mono">
              {new Date(ev.run_at).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
            </span>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Puntaje
              titulo="Capacidad"
              bajada="Si sirve para el cargo. Ordena la terna."
              puntaje={ev.capacidad_puntaje}
              cobertura={ev.capacidad_cobertura}
            />
            <Puntaje
              titulo="Ajuste · TS Standard"
              bajada="Si encaja con la compañía. No se suma al anterior."
              puntaje={ev.ajuste_puntaje}
              cobertura={ev.ajuste_cobertura}
            />
          </div>

          {(ev.documentos_leidos?.length > 0 || ev.documentos_omitidos?.length > 0) && (
            <p className="mt-2 text-[11px] text-gray-500 leading-snug">
              Leyó: {ev.documentos_leidos?.join(", ") || "nada"}.
              {ev.documentos_omitidos?.length > 0 && (
                <span className="text-amber-700"> No pudo leer: {ev.documentos_omitidos.join(", ")}.</span>
              )}
            </p>
          )}

          {pendientes.length > 0 && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-[11px] uppercase tracking-wider font-bold text-amber-800 mb-1.5">
                Qué preguntar en entrevista ({pendientes.length})
              </p>
              <ul className="space-y-1">
                {pendientes.map((v) => (
                  <li key={v.criterio_id} className="text-[12.5px] text-gray-800 leading-snug">
                    · {v.pregunta}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={() => setAbierto((x) => !x)}
            className="mt-3 text-[11.5px] text-gray-500 underline hover:text-gray-900"
          >
            {abierto ? "Ocultar el detalle criterio por criterio" : "Ver el detalle criterio por criterio"}
          </button>

          {abierto && (
            <div className="mt-2 space-y-4">
              {ejes.filter((e) => e.grupos.length > 0).map((e) => (
                <div key={e.titulo}>
                  <p className="text-[10.5px] uppercase tracking-wider font-bold text-gray-400 mb-1.5">
                    Eje de {e.titulo}
                  </p>
                  <div className="space-y-2">
                    {e.grupos.map((g) => (
                      <div key={g.bloque.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center gap-2">
                          <span className="text-[12.5px] font-bold text-gray-900">{g.bloque.nombre}</span>
                          <span className="ml-auto font-mono text-[11px] text-gray-500">
                            {g.bloque.peso}% del eje
                          </span>
                        </div>
                        <div className="px-3">
                          {g.criterios.map((c) => (
                            <FilaVeredicto key={c.id} c={c} v={porId.get(c.id)} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Lo que nadie puede leer de un documento. */}
      {deWellness.length > 0 && (
        <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-amber-50 px-3 py-2 border-b border-amber-200">
            <p className="text-[12.5px] font-bold text-amber-900">Lo que califica Wellness</p>
            <p className="text-[11px] text-amber-800 mt-0.5 leading-snug">
              Assessment, juego de roles y entrevista. El agente no los toca: nadie puede leer de un
              PDF cómo alguien ejecutó en una sala.
            </p>
          </div>
          <div className="px-3 py-1">
            {deWellness.map(({ bloque, criterio: c }, i, arr) => (
              <div key={c.id}>
                {/* Rótulo del eje cuando cambia, para no mezclar capacidad con ajuste. */}
                {(i === 0 || idsCapacidad.has(arr[i - 1].bloque.id) !== idsCapacidad.has(bloque.id)) && (
                  <p className="text-[10.5px] uppercase tracking-wider font-bold text-gray-400 pt-2.5 pb-0.5">
                    Eje de {idsCapacidad.has(bloque.id) ? "capacidad" : "ajuste · TS Standard"}
                  </p>
                )}
                <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-gray-900">{c.nombre}</span>
                    {c.excluyente && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-50 text-red-700">
                        excluyente
                      </span>
                    )}
                  </div>
                  <p className="text-[11.5px] text-gray-500 leading-snug mt-0.5">{c.observar}</p>
                  {c.anclas && (
                    <p className="text-[11px] text-gray-400 leading-snug mt-1">
                      1: {c.anclas.n1} · 3: {c.anclas.n3} · 5: {c.anclas.n5}
                    </p>
                  )}
                </div>
                <select
                  value={manual[c.id] ?? ""}
                  onChange={(e) => setManual((p) => ({ ...p, [c.id]: e.target.value }))}
                  className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white shrink-0"
                >
                  <option value="">Sin calificar</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={String(n)}>{n}</option>
                  ))}
                </select>
                </div>
              </div>
            ))}
          </div>
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex items-center gap-2">
            <button
              type="button"
              onClick={guardarManuales}
              disabled={guardando}
              className="text-xs font-semibold px-3 py-1.5 rounded-md bg-gray-900 text-white disabled:opacity-50"
            >
              {guardando ? "Guardando…" : "Guardar calificaciones"}
            </button>
            <span className="text-[11px] text-gray-500">
              Cada guardado queda como un registro nuevo. No se pisa el anterior.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
