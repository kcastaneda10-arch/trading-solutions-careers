"use client";

/**
 * 9-BOX DE RECLUTAMIENTO
 *
 * Los dos ejes de la rúbrica, cruzados. Es la forma de mirar una terna sin
 * colapsar la decisión en un número: alguien capaz con ajuste bajo y alguien
 * ajustado con capacidad media caen en celdas opuestas, y son conversaciones
 * distintas.
 *
 * LA GRILLA NO ESTÁ PINTADA POR «BUENO»
 * Un degradado verde-rojo en diagonal afirmaría que los ejes se suman, que es
 * justo lo que esta rúbrica se negó a hacer. Las celdas son neutras; lo que
 * cambia es la DECISIÓN escrita en cada una. Lo único que recede son las tres
 * celdas donde no hay nada que decidir.
 *
 * QUIÉN NO ENTRA A LA GRILLA
 * El que tiene un excluyente por debajo del mínimo y el que no tiene evidencia
 * suficiente. Van en bandejas aparte, con el motivo. Ponerlos en una celda
 * daría por cierto algo que no se sabe, y una posición en una matriz se lee
 * como un hecho.
 */

import { useCallback, useEffect, useState } from "react";
import {
  CELDAS, COLUMNAS, CORTES, COBERTURA_MINIMA, FILAS, BANDA_LABEL,
  celdaDe, fugaDeCapaces, ubicar,
  type Banda, type Celda, type Ubicacion,
} from "@/lib/nuevebox";
import { pedirAbrirCandidato } from "@/lib/abrirCandidato";

const TS_CLIENT_ID = "98b62872-5767-4815-9b49-1394b9527c1f";

type Evaluacion = {
  rubrica_key: string;
  rubrica_version: string;
  run_at: string;
  capacidad_puntaje: number | null;
  capacidad_cobertura: number | null;
  ajuste_puntaje: number | null;
  ajuste_cobertura: number | null;
  bloqueado_por: string[];
  semaforo: string;
  preguntas_pendientes: string[];
};

type Fila = { id: string; nombre: string; etapa: string | null; evaluacion: Evaluacion | null };
type Vacante = { id: string; title: string; status?: string };
type Puesto = Fila & { u: Ubicacion };

function n2(x: number | null | undefined) {
  return x == null ? "—" : Number(x).toFixed(2);
}

/** La ficha de un candidato dentro de una celda. */
function Chip({ p, onVer }: { p: Puesto; onVer: (id: string) => void }) {
  const ev = p.evaluacion!;
  return (
    <button
      onClick={() => onVer(p.id)}
      title="Abrir en el Funnel"
      className="w-full text-left bg-white border border-gray-200 rounded-lg px-2 py-1.5 hover:border-gray-900 transition-colors"
    >
      <p className="text-[12px] font-semibold text-gray-900 truncate leading-tight">{p.nombre}</p>
      <p className="font-mono text-[10.5px] text-gray-500 mt-0.5">
        cap {n2(ev.capacidad_puntaje)} · aju {n2(ev.ajuste_puntaje)}
      </p>
    </button>
  );
}

function CeldaCard({
  celda, gente, onVer,
}: {
  celda: Celda; gente: Puesto[]; onVer: (id: string) => void;
}) {
  const apagada = !celda.accionable;
  return (
    <div
      className={
        "rounded-xl border p-2.5 flex flex-col min-h-[132px] " +
        (apagada ? "border-gray-200 bg-gray-50" : "border-gray-300 bg-white")
      }
    >
      <div className="mb-1.5">
        <p className={"text-[12.5px] font-bold leading-tight " + (apagada ? "text-gray-500" : "text-gray-900")}>
          {celda.titulo}
        </p>
        <p className="text-[10.5px] text-gray-500 leading-snug mt-0.5">{celda.decision}</p>
      </div>

      <div className="space-y-1.5 mt-auto">
        {gente.length === 0 ? (
          <p className="text-[10.5px] text-gray-300 italic">—</p>
        ) : (
          gente.map((p) => <Chip key={p.id} p={p} onVer={onVer} />)
        )}
      </div>

      {celda.nota && gente.length > 0 && (
        <p className="text-[10px] text-gray-400 leading-snug mt-2 pt-2 border-t border-gray-100">
          {celda.nota}
        </p>
      )}
    </div>
  );
}

function Bandeja({
  titulo, bajada, gente, onVer, tono,
}: {
  titulo: string; bajada: string; gente: Puesto[];
  onVer: (id: string) => void; tono: "rojo" | "ambar" | "gris";
}) {
  if (gente.length === 0) return null;
  const estilo =
    tono === "rojo" ? "border-red-200 bg-red-50"
    : tono === "ambar" ? "border-amber-200 bg-amber-50"
    : "border-gray-200 bg-gray-50";
  return (
    <div className={"border rounded-xl p-3 " + estilo}>
      <p className="text-[12.5px] font-bold text-gray-900">
        {titulo} <span className="font-mono text-[11px] text-gray-500">({gente.length})</span>
      </p>
      <p className="text-[11px] text-gray-600 leading-snug mt-0.5 mb-2">{bajada}</p>
      <div className="space-y-1.5">
        {gente.map((p) => (
          <button
            key={p.id}
            onClick={() => onVer(p.id)}
            className="w-full text-left bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 hover:border-gray-900 transition-colors"
          >
            <p className="text-[12.5px] font-semibold text-gray-900">{p.nombre}</p>
            <p className="text-[11px] text-gray-500 leading-snug">{p.u.motivo}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function NueveBoxPanel() {
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [vacId, setVacId] = useState("");
  const [filas, setFilas] = useState<Fila[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/headhunting/vacancies?clientId=${TS_CLIENT_ID}`, { cache: "no-store" });
        const j = await r.json();
        const abiertas = (j.vacancies || []).filter((v: Vacante) => (v.status ?? "open") === "open");
        setVacantes(abiertas);
        if (abiertas.length) setVacId(abiertas[0].id);
        else setCargando(false);
      } catch {
        setError("No se pudieron cargar las vacantes");
        setCargando(false);
      }
    })();
  }, []);

  const cargar = useCallback(async () => {
    if (!vacId) return;
    setCargando(true);
    setError("");
    try {
      const r = await fetch(`/api/ranking?vacancy_id=${vacId}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo cargar el ranking");
      setFilas(j.candidatos ?? []);
    } catch (e: any) {
      setError(e.message || "No se pudo cargar");
      setFilas([]);
    } finally {
      setCargando(false);
    }
  }, [vacId]);

  useEffect(() => { cargar(); }, [cargar]);

  function verEnFunnel(id: string) {
    pedirAbrirCandidato(id);
    window.location.hash = "funnel";
  }

  const puestos: Puesto[] = filas.map((f) => ({ ...f, u: ubicar(f.evaluacion) }));
  const ubicados = puestos.filter((p) => p.u.estado === "ubicado");
  const bloqueados = puestos.filter((p) => p.u.estado === "bloqueado");
  const sinEvidencia = puestos.filter((p) => p.u.estado === "falta_evidencia");
  const sinEvaluar = puestos.filter((p) => p.u.estado === "sin_evaluar");
  const fuga = fugaDeCapaces(ubicados.map((p) => p.u));

  function enCelda(cap: Banda, aju: Banda) {
    return ubicados.filter((p) => p.u.capacidad === cap && p.u.ajuste === aju);
  }

  return (
    <div>
      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">9-box de reclutamiento</h2>
          <p className="text-sm text-gray-500 mt-0.5 max-w-2xl">
            Los dos ejes de la rúbrica, cruzados. Sirve para decidir una terna sin colapsar la
            decisión en un solo número.
          </p>
        </div>
        {vacantes.length > 0 && (
          <select
            value={vacId}
            onChange={(e) => setVacId(e.target.value)}
            className="ml-auto text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white max-w-xs"
          >
            {vacantes.map((v) => (
              <option key={v.id} value={v.id}>{v.title}</option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <p className="mt-4 text-sm bg-red-50 border border-red-200 text-red-800 rounded-lg px-3 py-2">{error}</p>
      )}
      {cargando && <p className="mt-6 text-sm text-gray-400 italic">Cargando…</p>}

      {!cargando && !error && (
        <>
          <p className="mt-4 text-[12.5px] text-gray-500">
            {puestos.length} candidatos en proceso · {ubicados.length} ubicables ·{" "}
            {puestos.length - ubicados.length} todavía no
          </p>

          {/* ── La grilla ── */}
          <div className="mt-4 flex gap-2">
            {/* Rótulo del eje vertical */}
            <div className="flex items-center">
              <span
                className="text-[11px] uppercase tracking-wider font-bold text-gray-400 whitespace-nowrap"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                Capacidad · sirve para el cargo
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-[46px_1fr_1fr_1fr] gap-2">
                {FILAS.map((cap) => (
                  <div key={cap} className="contents">
                    <div className="flex items-center justify-end pr-1">
                      <span className="text-[11px] font-semibold text-gray-500">{BANDA_LABEL[cap]}</span>
                    </div>
                    {COLUMNAS.map((aju) => (
                      <CeldaCard
                        key={cap + aju}
                        celda={celdaDe(cap, aju)}
                        gente={enCelda(cap, aju)}
                        onVer={verEnFunnel}
                      />
                    ))}
                  </div>
                ))}

                {/* Rótulos del eje horizontal */}
                <div />
                {COLUMNAS.map((aju) => (
                  <div key={aju} className="text-center">
                    <span className="text-[11px] font-semibold text-gray-500">{BANDA_LABEL[aju]}</span>
                  </div>
                ))}
              </div>

              <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 text-center mt-1.5">
                Ajuste · TS Standard
              </p>
            </div>
          </div>

          {/* ── El conteo que sirve para la conversación con dirección ── */}
          {fuga.capacesTotal > 0 && (
            <div className="mt-5 border border-gray-300 rounded-xl px-4 py-3">
              <p className="text-[12.5px] font-bold text-gray-900">
                {fuga.conAjusteBajo} de {fuga.capacesTotal} candidatos con capacidad alta cayeron en
                ajuste bajo
                {fuga.porcentaje != null && (
                  <span className="font-mono font-normal text-gray-500"> · {fuga.porcentaje} %</span>
                )}
              </p>
              <p className="text-[11.5px] text-gray-500 leading-snug mt-1 max-w-2xl">
                Es un conteo de este proceso, no una conclusión. Con cuatro candidatos no dice nada;
                sostenido a lo largo de varias vacantes, es el dato de que lo que se está perdiendo
                no es talento disponible sino gente capaz a la que el canje no le cierra.
              </p>
            </div>
          )}

          {/* ── Los que no entran a la grilla ── */}
          {(bloqueados.length > 0 || sinEvidencia.length > 0 || sinEvaluar.length > 0) && (
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Bandeja
                titulo="Bloqueados"
                bajada="Un criterio excluyente quedó por debajo del mínimo. No se ubican: no importa dónde caerían."
                gente={bloqueados} onVer={verEnFunnel} tono="rojo"
              />
              <Bandeja
                titulo="Falta evidencia"
                bajada={`Por debajo de ${COBERTURA_MINIMA} % de cobertura el puntaje no es comparable, y una posición en la matriz se leería como un hecho.`}
                gente={sinEvidencia} onVer={verEnFunnel} tono="ambar"
              />
              <Bandeja
                titulo="Sin evaluar"
                bajada="Todavía no se les corrió el agente. Están en el proceso, pero no en esta foto."
                gente={sinEvaluar} onVer={verEnFunnel} tono="gris"
              />
            </div>
          )}

          {puestos.length === 0 && (
            <p className="mt-6 text-sm text-gray-500 italic">
              Esta vacante no tiene candidatos activos.
            </p>
          )}

          {/* ── Las reglas, a la vista ── */}
          <div className="mt-8 border-t border-gray-200 pt-4">
            <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-2">
              Con qué se dibuja esta matriz
            </p>
            <ul className="text-[12px] text-gray-600 space-y-1 max-w-3xl leading-relaxed">
              <li>
                · Bandas sobre la escala de anclas 1–5: <b>baja</b> por debajo de{" "}
                <span className="font-mono">{CORTES.medio.toFixed(1)}</span>, <b>media</b> hasta{" "}
                <span className="font-mono">{CORTES.alto.toFixed(1)}</span>, <b>alta</b> de ahí para
                arriba. 3 es «cumple lo esperado», por eso la banda media arranca ahí.
              </li>
              <li>
                · Se ubica a quien tenga al menos{" "}
                <span className="font-mono">{COBERTURA_MINIMA} %</span> de cobertura en los dos ejes.
              </li>
              <li>
                · Los ejes <b>no se suman</b> y la grilla no está pintada por «bueno»: un degradado en
                diagonal afirmaría que se combinan.
              </li>
              <li>
                · Las celdas nombran decisiones, no personas. Un expediente sostiene o no sostiene
                una decisión; nadie es una casilla.
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

/* Se exporta para que otra pantalla pueda reusar la lista de celdas sin
   volver a derivarla. */
export { CELDAS };
