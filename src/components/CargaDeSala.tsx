"use client";

/**
 * CARGAR LAS NOTAS DE LA SALA · todos los candidatos de una jornada, de corrido
 *
 * POR QUÉ EXISTE
 * El assessment es una sola mañana con ocho personas y una planilla de
 * evaluador. Cargar eso entrando a ocho fichas y bajando hasta el final en cada
 * una convierte diez minutos de trabajo en media hora de scroll, y garantiza
 * que se quede a medias. Acá van las personas en filas y los criterios en
 * columnas, igual que la planilla de papel.
 *
 * QUÉ SE CARGA ACÁ Y QUÉ NO
 * Solo lo de assessment y juego de roles. Los criterios de entrevista NO están
 * en esta tabla aunque también los califique Wellness: la entrevista es
 * posterior, y ponerlos acá invitaría a llenarlos antes de que ocurra.
 *
 * SE GUARDA UNA VEZ, PERSONA POR PERSONA
 * Cada fila es una llamada al mismo endpoint que usa la ficha, así que no hay
 * una segunda forma de escribir estos datos. Si alguna falla, se dice cuál y
 * las demás quedan guardadas: perder las ocho porque una falló sería peor.
 */

import { useMemo, useState } from "react";
import { criteriosDeLaSala } from "@/lib/evaluacion";
import type { Criterio, Rubrica } from "@/lib/rubricas";

type FilaCandidato = {
  id: string;
  nombre: string;
  /** Lo que ya estaba cargado, para no pisarlo sin querer. */
  niveles: Record<string, number> | null;
  tieneEvaluacion: boolean;
};

type Estado = "pendiente" | "guardando" | "ok" | "error";

export default function CargaDeSala({
  rubrica,
  candidatos,
  onGuardado,
}: {
  rubrica: Rubrica;
  candidatos: FilaCandidato[];
  /** Para que el tablero se refresque cuando termina. */
  onGuardado: () => void;
}) {
  const criterios = useMemo(() => criteriosDeLaSala(rubrica), [rubrica]);

  const [valores, setValores] = useState<Record<string, Record<string, string>>>(() => {
    const init: Record<string, Record<string, string>> = {};
    for (const c of candidatos) {
      init[c.id] = {};
      for (const { criterio } of criterios) {
        const v = c.niveles?.[criterio.id];
        init[c.id][criterio.id] = v == null ? "" : String(v);
      }
    }
    return init;
  });

  const [estados, setEstados] = useState<Record<string, Estado>>({});
  const [guardando, setGuardando] = useState(false);
  const [resumen, setResumen] = useState("");
  const [anclasDe, setAnclasDe] = useState<Criterio | null>(null);

  function set(candId: string, critId: string, v: string) {
    setValores((p) => ({ ...p, [candId]: { ...p[candId], [critId]: v } }));
    setEstados((p) => ({ ...p, [candId]: "pendiente" }));
  }

  /** Copiar el valor de la primera fila hacia abajo no existe a propósito:
      calificar a ocho personas igual es lo que esta tabla debe hacer difícil. */

  function cuantosLlenos(candId: string) {
    return criterios.filter(({ criterio }) => valores[candId]?.[criterio.id]).length;
  }

  async function guardar() {
    setGuardando(true);
    setResumen("");
    let ok = 0;
    const fallaron: string[] = [];

    for (const c of candidatos) {
      const niveles: Record<string, number> = {};
      for (const { criterio } of criterios) {
        const v = valores[c.id]?.[criterio.id];
        if (v) niveles[criterio.id] = Number(v);
      }
      // Sin nada cargado no se llama: escribir una fila vacía solo ensucia el
      // historial de la persona.
      if (Object.keys(niveles).length === 0) continue;

      setEstados((p) => ({ ...p, [c.id]: "guardando" }));
      try {
        const r = await fetch("/api/agents/evaluate-candidate", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidate_id: c.id,
            rubrica: rubrica.key,
            // Se manda lo que ya había MÁS lo nuevo: el endpoint reemplaza el
            // objeto completo, así que omitir un criterio de entrevista ya
            // cargado lo borraría.
            niveles_manuales: { ...(c.niveles ?? {}), ...niveles },
          }),
        });
        if (!r.ok) throw new Error((await r.json()).error || "falló");
        setEstados((p) => ({ ...p, [c.id]: "ok" }));
        ok++;
      } catch {
        setEstados((p) => ({ ...p, [c.id]: "error" }));
        fallaron.push(c.nombre);
      }
    }

    setGuardando(false);
    setResumen(
      fallaron.length
        ? `Se guardaron ${ok}. No se pudo con: ${fallaron.join(", ")}. Volvé a darle guardar.`
        : `Listo. Se guardaron ${ok} candidatos.`,
    );
    if (ok > 0) onGuardado();
  }

  if (candidatos.length === 0) {
    return (
      <p className="mt-5 text-sm text-gray-500 italic">
        No hay candidatos en esta etapa para cargar.
      </p>
    );
  }

  return (
    <div className="mt-5">
      <p className="text-[12.5px] text-gray-500 max-w-3xl leading-snug mb-3">
        Lo que se vio en la sala: assessment y juego de roles. En los de assessment el agente ya
        propuso un nivel leyendo el caso escrito; lo que pongas acá manda sobre eso, porque vos
        estuviste ahí. Los de entrevista no están porque la entrevista todavía no ocurrió. Tocá el
        nombre de una columna para ver sus anclas de conducta.
      </p>

      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-[11.5px] font-bold text-gray-600 px-3 py-2.5 sticky left-0 bg-gray-50 min-w-[180px]">
                Candidato
              </th>
              {criterios.map(({ criterio }) => (
                <th key={criterio.id} className="px-2 py-2.5 min-w-[104px] align-bottom">
                  <button
                    onClick={() => setAnclasDe(anclasDe?.id === criterio.id ? null : criterio)}
                    className="text-[11px] font-semibold text-gray-700 leading-tight text-center hover:text-gray-900 hover:underline"
                  >
                    {criterio.nombre}
                  </button>
                </th>
              ))}
              <th className="px-3 py-2.5 text-[11.5px] font-bold text-gray-600 text-right">Estado</th>
            </tr>
          </thead>
          <tbody>
            {candidatos.map((c) => {
              const est = estados[c.id] ?? "pendiente";
              const llenos = cuantosLlenos(c.id);
              return (
                <tr key={c.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-3 py-2 sticky left-0 bg-white">
                    <p className="text-[13px] font-semibold text-gray-900">{c.nombre}</p>
                    {!c.tieneEvaluacion && (
                      <p className="text-[10.5px] text-gray-400">sin agente corrido</p>
                    )}
                  </td>
                  {criterios.map(({ criterio }) => (
                    <td key={criterio.id} className="px-2 py-2 text-center">
                      <select
                        value={valores[c.id]?.[criterio.id] ?? ""}
                        onChange={(e) => set(c.id, criterio.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded-md px-1.5 py-1 bg-white w-14"
                      >
                        <option value="">—</option>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={String(n)}>{n}</option>
                        ))}
                      </select>
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {est === "guardando" && <span className="text-[11px] text-gray-400">guardando…</span>}
                    {est === "ok" && <span className="text-[11px] text-emerald-700">guardado</span>}
                    {est === "error" && <span className="text-[11px] text-red-700">falló</span>}
                    {est === "pendiente" && (
                      <span className="text-[11px] font-mono text-gray-400">
                        {llenos}/{criterios.length}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {anclasDe && (
        <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-[12.5px] font-bold text-gray-900">{anclasDe.nombre}</p>
          <p className="text-[12px] text-gray-600 leading-snug mt-0.5">{anclasDe.observar}</p>
          {anclasDe.anclas ? (
            <dl className="mt-2 grid grid-cols-[22px_1fr] gap-x-3 gap-y-1.5 text-[12px]">
              <dt className="font-mono text-red-700">1</dt>
              <dd className="text-gray-700 m-0">{anclasDe.anclas.n1}</dd>
              <dt className="font-mono text-amber-700">3</dt>
              <dd className="text-gray-700 m-0">{anclasDe.anclas.n3}</dd>
              <dt className="font-mono text-emerald-700">5</dt>
              <dd className="text-gray-700 m-0">{anclasDe.anclas.n5}</dd>
            </dl>
          ) : (
            <p className="text-[12px] text-gray-500 italic mt-1.5">
              Este criterio no tiene anclas escritas. 3 es «cumple lo esperado».
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <button
          onClick={guardar}
          disabled={guardando}
          className="text-sm font-semibold px-4 py-2 rounded-lg bg-gray-900 text-white disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Guardar todo"}
        </button>
        <span className="text-[11.5px] text-gray-500">
          Lo que quede en «—» no se toca. Cada guardado entra como registro nuevo, no pisa el anterior.
        </span>
      </div>

      {resumen && (
        <p className="mt-2 text-[12.5px] text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          {resumen}
        </p>
      )}
    </div>
  );
}
