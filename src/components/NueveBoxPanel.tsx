"use client";

/**
 * DECISIONES DE UNA VACANTE · dos momentos, dos reglas
 *
 * MOMENTO 1 · ¿QUIÉN PASA A ENTREVISTA?
 * Decide la capacidad sola, y no es una concesión: en este proceso las pruebas
 * van antes de la entrevista, así que el eje de ajuste está incompleto por
 * diseño. Exigirlo acá sería pedir el resultado de la entrevista para autorizar
 * la entrevista. Se muestra una lista en tres bandas, no una matriz: con un
 * solo eje con evidencia, dibujar una grilla sería fingir que hay dos.
 *
 * MOMENTO 2 · ¿QUIÉN ENTRA A LA TERNA?
 * Ahí sí el 9-box, con los dos ejes. Después de la entrevista el TS Standard
 * ya tiene con qué.
 *
 * LA GRILLA NO ESTÁ PINTADA POR «BUENO»
 * Un degradado verde-rojo en diagonal afirmaría que los ejes se suman, que es
 * justo lo que esta rúbrica se negó a hacer. Lo único que recede son las tres
 * celdas donde no hay nada que decidir.
 *
 * QUIÉN NO ENTRA
 * El que tiene un excluyente por debajo del mínimo y el que no tiene evidencia
 * suficiente. Van en bandejas aparte, con el motivo.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CELDAS, COLUMNAS, CORTES, COBERTURA_MINIMA, FILAS, BANDA_LABEL,
  VEREDICTO_LABEL, VEREDICTOS_DECIDIBLES, DECISION_DEL_GRUPO,
  celdaDe, fugaDeCapaces, ubicar, ubicarAvance,
  type Avance, type Banda, type Celda, type Ubicacion, type Veredicto,
} from "@/lib/nuevebox";
import { pedirAbrirCandidato } from "@/lib/abrirCandidato";
import { normalizeStage, stageLabel, stageOrder } from "@/lib/stage-labels";
import { getRubrica, rubricaDeVacante } from "@/lib/rubricas";
import CargaDeSala from "./CargaDeSala";

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
  niveles_manuales: Record<string, number> | null;
  preguntas_pendientes: string[];
};

type Fila = { id: string; nombre: string; etapa: string | null; evaluacion: Evaluacion | null };
type Vacante = { id: string; title: string; status?: string };

type Momento = "avance" | "terna" | "cargar";

/**
 * Qué etapas mira cada momento. Sale de stage-labels, que es la fuente única
 * del proceso: batería 5, assessment 6, entrevista 7, terna 8.
 *
 * Existe porque la primera versión traía a todo el mundo, incluidos los que
 * todavía están en prefiltro. Alguien que ni siquiera presentó la batería no
 * es una decisión pendiente: es ruido que hace ver el tablero lleno de huecos.
 */
const POBLACION: Record<Momento, { min: number; max: number; nota: string }> = {
  avance: { min: 5, max: 6, nota: "Batería y assessment presencial · los que todavía no han sido entrevistados" },
  terna: { min: 7, max: 8, nota: "Entrevista de reclutador en adelante · los que ya tienen evidencia de ajuste" },
  cargar: { min: 5, max: 6, nota: "Batería y assessment presencial · los que pasaron por la sala" },
};

function n2(x: number | null | undefined) {
  return x == null ? "—" : Number(x).toFixed(2);
}

/* ─────────────────────────── piezas compartidas ─────────────────────────── */

function Barra({ cobertura }: { cobertura: number | null }) {
  const c = cobertura ?? 0;
  return (
    <div className="w-16 shrink-0">
      <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={"h-full rounded-full " + (c >= 100 ? "bg-emerald-500" : "bg-amber-400")}
          style={{ width: `${Math.min(100, c)}%` }}
        />
      </div>
      <p className="text-[9.5px] text-gray-400 mt-0.5 font-mono">{c}%</p>
    </div>
  );
}

function Bandeja({
  titulo, bajada, gente, onVer, tono,
}: {
  titulo: string; bajada: string;
  gente: { id: string; nombre: string; motivo: string | null }[];
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
            <p className="text-[11px] text-gray-500 leading-snug">{p.motivo}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────── momento 1 · avance ──────────────────────── */

const VEREDICTO_ESTILO: Record<string, string> = {
  pasa: "border-gray-900",
  dudoso: "border-amber-300",
  no_pasa: "border-gray-200",
};

function FilaAvance({
  f, a, onVer,
}: {
  f: Fila; a: Avance; onVer: (id: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const ev = f.evaluacion!;
  const preguntas = ev.preguntas_pendientes ?? [];

  return (
    <div className="border-b border-gray-100 last:border-b-0 py-2.5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onVer(f.id)}
          className="min-w-0 flex-1 text-left hover:underline"
          title="Abrir en el Funnel"
        >
          <p className="text-[13.5px] font-semibold text-gray-900 truncate">{f.nombre}</p>
          <p className="text-[11px] text-gray-500">{stageLabel(normalizeStage(f.etapa))}</p>
        </button>

        <div className="text-right shrink-0">
          <p className="font-mono text-[15px] font-semibold text-gray-900">
            {n2(ev.capacidad_puntaje)}
          </p>
          <p className="text-[9.5px] text-gray-400 uppercase tracking-wide">capacidad</p>
        </div>
        <Barra cobertura={ev.capacidad_cobertura} />
      </div>

      {/* El ajuste se muestra pero no decide. Decirlo evita que alguien lo
          lea como un puntaje incompleto y lo use igual. */}
      <p className="text-[11px] text-gray-400 mt-1">
        Ajuste {n2(ev.ajuste_puntaje)} con {ev.ajuste_cobertura ?? 0}% de cobertura — no decide acá,
        se completa en la entrevista.
      </p>

      {preguntas.length > 0 && (
        <>
          <button
            onClick={() => setAbierto((v) => !v)}
            className="text-[11.5px] text-gray-500 underline mt-1.5 hover:text-gray-900"
          >
            {abierto ? "Ocultar" : `Ver las ${preguntas.length} preguntas para su entrevista`}
          </button>
          {abierto && (
            <ul className="mt-1.5 space-y-1 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
              {preguntas.map((q, i) => (
                <li key={i} className="text-[12px] text-gray-800 leading-snug">· {q}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function GrupoAvance({
  veredicto, gente, onVer,
}: {
  veredicto: Veredicto;
  gente: { f: Fila; a: Avance }[];
  onVer: (id: string) => void;
}) {
  return (
    <div className={"border-l-2 pl-3 " + (VEREDICTO_ESTILO[veredicto] ?? "border-gray-200")}>
      <div className="flex items-baseline gap-2 mb-1">
        <h4 className="text-[13.5px] font-bold text-gray-900">{VEREDICTO_LABEL[veredicto]}</h4>
        <span className="font-mono text-[11px] text-gray-400">{gente.length}</span>
      </div>
      <p className="text-[11.5px] text-gray-500 leading-snug mb-1">
        {DECISION_DEL_GRUPO[veredicto as "pasa" | "dudoso" | "no_pasa"]}
      </p>
      {gente.length === 0 ? (
        <p className="text-[12px] text-gray-300 italic py-2">Nadie acá.</p>
      ) : (
        <div>
          {gente.map(({ f, a }) => (
            <FilaAvance key={f.id} f={f} a={a} onVer={onVer} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────── momento 2 · 9-box ──────────────────────── */

function Chip({ f, onVer }: { f: Fila; onVer: (id: string) => void }) {
  const ev = f.evaluacion!;
  return (
    <button
      onClick={() => onVer(f.id)}
      title="Abrir en el Funnel"
      className="w-full text-left bg-white border border-gray-200 rounded-lg px-2 py-1.5 hover:border-gray-900 transition-colors"
    >
      <p className="text-[12px] font-semibold text-gray-900 truncate leading-tight">{f.nombre}</p>
      <p className="font-mono text-[10.5px] text-gray-500 mt-0.5">
        cap {n2(ev.capacidad_puntaje)} · aju {n2(ev.ajuste_puntaje)}
      </p>
    </button>
  );
}

function CeldaCard({
  celda, gente, onVer,
}: {
  celda: Celda; gente: Fila[]; onVer: (id: string) => void;
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
        {gente.length === 0
          ? <p className="text-[10.5px] text-gray-300 italic">—</p>
          : gente.map((f) => <Chip key={f.id} f={f} onVer={onVer} />)}
      </div>
      {celda.nota && gente.length > 0 && (
        <p className="text-[10px] text-gray-400 leading-snug mt-2 pt-2 border-t border-gray-100">
          {celda.nota}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────── panel ─────────────────────────────── */

export default function NueveBoxPanel() {
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [vacId, setVacId] = useState("");
  const [momento, setMomento] = useState<Momento>("avance");
  const [todasLasEtapas, setTodasLasEtapas] = useState(false);
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

  // La rúbrica sale del título de la vacante seleccionada, igual que en la
  // ficha del candidato. Una sola regla, en un solo lugar.
  const rubrica = useMemo(() => {
    const t = vacantes.find((v) => v.id === vacId)?.title;
    const porTitulo = rubricaDeVacante(t);
    if (porTitulo) return porTitulo;
    // Si alguien ya tiene evaluación, esa evaluación dice con qué rúbrica se
    // corrió: vale más que adivinar por el título.
    const k = filas.find((f) => f.evaluacion?.rubrica_key)?.evaluacion?.rubrica_key;
    return k ? getRubrica(k) : undefined;
  }, [vacantes, vacId, filas]);

  // ── Población: solo los que llegaron al punto donde esta decisión existe ──
  const rango = POBLACION[momento];
  const { dentro, fuera } = useMemo(() => {
    const dentro: Fila[] = [];
    const fuera: Fila[] = [];
    for (const f of filas) {
      const o = stageOrder(normalizeStage(f.etapa));
      (todasLasEtapas || (o >= rango.min && o <= rango.max) ? dentro : fuera).push(f);
    }
    return { dentro, fuera };
  }, [filas, rango.min, rango.max, todasLasEtapas]);

  // ── Momento 1 ──
  const avances = useMemo(
    () => dentro.map((f) => ({ f, a: ubicarAvance(f.evaluacion) })),
    [dentro],
  );
  const porVeredicto = (v: Veredicto) =>
    avances
      .filter((x) => x.a.veredicto === v)
      .sort((a, b) => (b.f.evaluacion?.capacidad_puntaje ?? 0) - (a.f.evaluacion?.capacidad_puntaje ?? 0));

  // ── Momento 2 ──
  const ubicaciones = useMemo(
    () => dentro.map((f) => ({ f, u: ubicar(f.evaluacion) })),
    [dentro],
  );
  const ubicados = ubicaciones.filter((x) => x.u.estado === "ubicado");
  const fuga = fugaDeCapaces(ubicados.map((x) => x.u));

  // ── Bandejas: se arman del momento que esté activo ──
  const bandejaDe = (estados: string[]) =>
    momento === "avance"
      ? avances.filter((x) => estados.includes(x.a.veredicto))
          .map((x) => ({ id: x.f.id, nombre: x.f.nombre, motivo: x.a.motivo }))
      : ubicaciones.filter((x) => estados.includes(x.u.estado))
          .map((x) => ({ id: x.f.id, nombre: x.f.nombre, motivo: x.u.motivo }));

  const bloqueados = bandejaDe(["bloqueado"]);
  const sinEvidencia = bandejaDe(["falta_evidencia"]);
  const sinEvaluar = bandejaDe(["sin_evaluar"]);

  const decidibles =
    momento === "avance"
      ? avances.filter((x) => VEREDICTOS_DECIDIBLES.includes(x.a.veredicto)).length
      : ubicados.length;

  return (
    <div>
      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">Decisiones de la vacante</h2>
          <p className="text-sm text-gray-500 mt-0.5 max-w-2xl">
            Dos momentos con reglas distintas. Quién pasa a entrevista lo decide la capacidad sola;
            quién entra a la terna, los dos ejes.
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

      {/* ── Selector de momento ── */}
      <div className="mt-4 flex gap-2 flex-wrap">
        {([
          ["avance", "¿Quién pasa a entrevista?", "Decide la capacidad sola"],
          ["terna", "¿Quién entra a la terna?", "9-box · los dos ejes"],
          ["cargar", "Cargar notas de la sala", "Assessment y juego de roles"],
        ] as [Momento, string, string][]).map(([id, t, s]) => (
          <button
            key={id}
            onClick={() => setMomento(id)}
            className={
              "text-left border rounded-lg px-3 py-2 transition-colors " +
              (momento === id
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white hover:border-gray-400")
            }
          >
            <span className="block text-[13px] font-semibold">{t}</span>
            <span className={"block text-[11px] " + (momento === id ? "text-gray-300" : "text-gray-500")}>
              {s}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 text-sm bg-red-50 border border-red-200 text-red-800 rounded-lg px-3 py-2">{error}</p>
      )}
      {cargando && <p className="mt-6 text-sm text-gray-400 italic">Cargando…</p>}

      {!cargando && !error && (
        <>
          {/* ── Población ── */}
          <div className="mt-4 flex items-baseline gap-2 flex-wrap text-[12.5px]">
            <span className="text-gray-500">
              {todasLasEtapas ? "Todas las etapas activas" : rango.nota} ·{" "}
              <b className="text-gray-900">{dentro.length}</b> candidatos ·{" "}
              {decidibles} con veredicto
            </span>
            {fuera.length > 0 && !todasLasEtapas && (
              <button
                onClick={() => setTodasLasEtapas(true)}
                className="text-gray-500 underline hover:text-gray-900"
              >
                ver también los {fuera.length} que están en otra etapa
              </button>
            )}
            {todasLasEtapas && (
              <button
                onClick={() => setTodasLasEtapas(false)}
                className="text-gray-500 underline hover:text-gray-900"
              >
                volver a la etapa que corresponde
              </button>
            )}
          </div>

          {/* ══ MOMENTO 1 ══ */}
          {momento === "avance" && (
            <div className="mt-5 space-y-6">
              {VEREDICTOS_DECIDIBLES.map((v) => (
                <GrupoAvance key={v} veredicto={v} gente={porVeredicto(v)} onVer={verEnFunnel} />
              ))}
            </div>
          )}

          {/* ══ CARGA DE LA SALA ══ */}
          {momento === "cargar" && (
            rubrica ? (
              <CargaDeSala
                rubrica={rubrica}
                candidatos={dentro.map((f) => ({
                  id: f.id,
                  nombre: f.nombre,
                  niveles: f.evaluacion?.niveles_manuales ?? null,
                  tieneEvaluacion: !!f.evaluacion,
                }))}
                onGuardado={cargar}
              />
            ) : (
              <p className="mt-5 text-sm text-gray-500 italic">
                Esta vacante no tiene rúbrica, así que no hay criterios que cargar.
              </p>
            )
          )}

          {/* ══ MOMENTO 2 ══ */}
          {momento === "terna" && (
            <>
              <div className="mt-5 flex gap-2">
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
                            gente={ubicados
                              .filter((x) => x.u.capacidad === cap && x.u.ajuste === aju)
                              .map((x) => x.f)}
                            onVer={verEnFunnel}
                          />
                        ))}
                      </div>
                    ))}
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

              {fuga.capacesTotal > 0 && (
                <div className="mt-5 border border-gray-300 rounded-xl px-4 py-3">
                  <p className="text-[12.5px] font-bold text-gray-900">
                    {fuga.conAjusteBajo} de {fuga.capacesTotal} candidatos con capacidad alta cayeron
                    en ajuste bajo
                    {fuga.porcentaje != null && (
                      <span className="font-mono font-normal text-gray-500"> · {fuga.porcentaje} %</span>
                    )}
                  </p>
                  <p className="text-[11.5px] text-gray-500 leading-snug mt-1 max-w-2xl">
                    Es un conteo de este proceso, no una conclusión. Con cuatro candidatos no dice
                    nada; sostenido a lo largo de varias vacantes, es el dato de que lo que se está
                    perdiendo no es talento disponible sino gente capaz a la que el canje no le cierra.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── Los que no entran, en cualquiera de los dos momentos de decisión.
                 En la carga no van: ahí todavía no hay nada que decidir, y
                 repetir a la misma gente abajo solo confunde. ── */}
          {momento !== "cargar" &&
            (bloqueados.length > 0 || sinEvidencia.length > 0 || sinEvaluar.length > 0) && (
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <Bandeja
                titulo="Bloqueados"
                bajada="Un criterio excluyente quedó por debajo del mínimo. No se ubican: no importa dónde caerían."
                gente={bloqueados} onVer={verEnFunnel} tono="rojo"
              />
              <Bandeja
                titulo="Falta evidencia"
                bajada={
                  momento === "avance"
                    ? `Falta cargar el assessment y el juego de roles. Por debajo de ${COBERTURA_MINIMA} % de cobertura en capacidad no hay con qué decidir.`
                    : `Por debajo de ${COBERTURA_MINIMA} % de cobertura el puntaje no es comparable, y una posición en la matriz se leería como un hecho.`
                }
                gente={sinEvidencia} onVer={verEnFunnel} tono="ambar"
              />
              <Bandeja
                titulo="Sin evaluar"
                bajada="Todavía no se les corrió el agente. Están en el proceso, pero no en esta foto."
                gente={sinEvaluar} onVer={verEnFunnel} tono="gris"
              />
            </div>
          )}

          {dentro.length === 0 && (
            <p className="mt-6 text-sm text-gray-500 italic">
              Nadie en esta etapa todavía.
            </p>
          )}

          {/* ── Las reglas, a la vista. En la carga no aplican: ahí la
                 referencia son las anclas, que están en la tabla. ── */}
          <div className={"mt-8 border-t border-gray-200 pt-4 " + (momento === "cargar" ? "hidden" : "")}>
            <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-2">
              Con qué se decide
            </p>
            <ul className="text-[12px] text-gray-600 space-y-1 max-w-3xl leading-relaxed">
              <li>
                · Bandas sobre la escala de anclas 1–5: <b>baja</b> por debajo de{" "}
                <span className="font-mono">{CORTES.medio.toFixed(1)}</span>, <b>media</b> hasta{" "}
                <span className="font-mono">{CORTES.alto.toFixed(1)}</span>, <b>alta</b> de ahí para
                arriba. 3 es «cumple lo esperado», por eso la banda media arranca ahí.
              </li>
              <li>
                · Hace falta al menos <span className="font-mono">{COBERTURA_MINIMA} %</span> de
                cobertura para tener veredicto
                {momento === "avance" ? " en capacidad" : " en los dos ejes"}.
              </li>
              {momento === "avance" ? (
                <li>
                  · <b>El ajuste no decide acá.</b> Siete de los doce criterios del TS Standard salen
                  de la entrevista: exigirlos antes de entrevistar sería pedir el resultado para
                  autorizar la prueba.
                </li>
              ) : (
                <li>
                  · Los ejes <b>no se suman</b> y la grilla no está pintada por «bueno»: un degradado
                  en diagonal afirmaría que se combinan.
                </li>
              )}
              <li>
                · Un excluyente por debajo del mínimo bloquea en los dos momentos, y lo que no tiene
                evidencia no se inventa.
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export { CELDAS };
