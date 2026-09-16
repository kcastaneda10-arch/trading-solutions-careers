"use client";

/**
 * RÚBRICAS · con qué se califica a cada cargo
 *
 * Pantalla de lectura. Existe para que la pregunta «¿por qué este candidato
 * quedó por encima del otro?» tenga una respuesta que se pueda señalar en la
 * pantalla, y no dependa de que quien armó el proceso esté en la sala.
 *
 * Los dos ejes se muestran lado a lado y NO se suman: promediarlos escondería
 * justamente lo que hay que ver.
 */

import { useState } from "react";
import {
  RUBRICAS,
  FUENTE_LABEL,
  FUENTE_LA_CARGA,
  pesoEfectivo,
  type Bloque,
  type Criterio,
  type Rubrica,
} from "@/lib/rubricas";

function Chip({ fuente }: { fuente: Criterio["fuente"] }) {
  const laCarga = FUENTE_LA_CARGA[fuente];
  return (
    <span
      title={laCarga === "agente" ? "El agente puede leer esta fuente" : "Lo califica Wellness; nadie lo puede leer de un documento"}
      className={
        "text-[10.5px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap " +
        (laCarga === "agente"
          ? "bg-emerald-50 text-emerald-800"
          : "bg-amber-50 text-amber-800")
      }
    >
      {FUENTE_LABEL[fuente]}
    </span>
  );
}

function CriterioFila({ b, c }: { b: Bloque; c: Criterio }) {
  const [abierto, setAbierto] = useState(false);
  const tieneAnclas = !!c.anclas;
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div className="flex items-start gap-3 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">{c.nombre}</span>
            {c.excluyente && (
              <span className="text-[10.5px] font-mono px-1.5 py-0.5 rounded bg-red-50 text-red-700">
                excluyente
              </span>
            )}
            <Chip fuente={c.fuente} />
          </div>
          <p className="text-[13px] text-gray-500 mt-0.5 leading-snug">{c.observar}</p>
          {tieneAnclas && (
            <button
              onClick={() => setAbierto((v) => !v)}
              className="text-[11.5px] text-gray-500 underline mt-1.5 hover:text-gray-900"
            >
              {abierto ? "Ocultar anclas" : "Ver anclas de conducta"}
            </button>
          )}
          {abierto && c.anclas && (
            <dl className="mt-2 grid grid-cols-[28px_1fr] gap-x-3 gap-y-1.5 text-[12.5px] bg-gray-50 rounded-lg p-3">
              <dt className="font-mono text-red-700">1</dt>
              <dd className="text-gray-700 m-0">{c.anclas.n1}</dd>
              <dt className="font-mono text-amber-700">3</dt>
              <dd className="text-gray-700 m-0">{c.anclas.n3}</dd>
              <dt className="font-mono text-emerald-700">5</dt>
              <dd className="text-gray-700 m-0">{c.anclas.n5}</dd>
            </dl>
          )}
        </div>
        <div className="text-right whitespace-nowrap">
          <div className="font-mono text-sm text-gray-900">{c.peso}%</div>
          <div className="font-mono text-[11px] text-gray-400">
            {pesoEfectivo(b, c).toFixed(1)} pts
          </div>
        </div>
      </div>
    </div>
  );
}

function BloqueCard({ b }: { b: Bloque }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-start gap-3">
        <div className="flex-1">
          <h4 className="text-[15px] font-bold text-gray-900">{b.nombre}</h4>
          {b.nota && <p className="text-[12.5px] text-gray-500 mt-1 leading-snug">{b.nota}</p>}
        </div>
        <span className="font-mono text-lg font-semibold text-gray-900">{b.peso}%</span>
      </div>
      <div className="px-4">
        {b.criterios.map((c) => (
          <CriterioFila key={c.id} b={b} c={c} />
        ))}
      </div>
    </div>
  );
}

function Eje({
  titulo,
  bajada,
  bloques,
}: {
  titulo: string;
  bajada: string;
  bloques: Bloque[];
}) {
  const suma = bloques.reduce((a, b) => a + b.peso, 0);
  return (
    <section>
      <div className="flex items-baseline gap-3 flex-wrap mb-1">
        <h3 className="text-base font-bold text-gray-900">{titulo}</h3>
        <span
          className={
            "font-mono text-xs " + (suma === 100 ? "text-gray-400" : "text-red-600 font-semibold")
          }
        >
          suma {suma}%
        </span>
      </div>
      <p className="text-[13px] text-gray-500 mb-3 max-w-2xl">{bajada}</p>
      <div className="grid gap-3">
        {bloques.map((b) => (
          <BloqueCard key={b.id} b={b} />
        ))}
      </div>
    </section>
  );
}

export default function RubricasPanel() {
  const [key, setKey] = useState(RUBRICAS[0]?.key ?? "");
  const r: Rubrica | undefined = RUBRICAS.find((x) => x.key === key);

  if (!r) {
    return <p className="text-sm text-gray-500 py-10">Todavía no hay rúbricas cargadas.</p>;
  }

  return (
    <div>
      <div className="flex items-end gap-4 flex-wrap mb-1">
        <div>
          <h2 className="text-xl font-bold">Rúbricas</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Con qué se califica cada cargo. Es lo que se señala cuando alguien pregunta por qué
            un candidato quedó por encima de otro.
          </p>
        </div>
        {RUBRICAS.length > 1 && (
          <select
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="ml-auto text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            {RUBRICAS.map((x) => (
              <option key={x.key} value={x.key}>
                {x.cargo}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mt-5 flex items-center gap-3 flex-wrap text-sm">
        <span className="font-semibold text-gray-900">{r.cargo}</span>
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
          v{r.version}
        </span>
        <span className="text-xs text-gray-400">vigente desde {r.vigente_desde}</span>
      </div>

      <div className="mt-6 grid gap-8">
        <Eje
          titulo="Eje de capacidad"
          bajada="Si sirve para el cargo. Es el puntaje que ordena la terna."
          bloques={r.capacidad}
        />
        <Eje
          titulo="Eje de ajuste"
          bajada="Si encaja con la compañía. Se reporta al lado del anterior y NO se suma: promediar los dos escondería justo lo que hay que ver."
          bloques={r.ajuste}
        />
      </div>

      {/* Declarar los límites es lo que hace auditable un instrumento propio. */}
      <section className="mt-9">
        <h3 className="text-base font-bold text-gray-900 mb-1">Lo que esta rúbrica no mide</h3>
        <p className="text-[13px] text-gray-500 mb-3 max-w-2xl">
          Un instrumento se vuelve defendible no por afirmar mucho, sino por declarar dónde se
          detiene.
        </p>
        <ul className="space-y-2">
          {r.no_mide.map((t, i) => (
            <li
              key={i}
              className="text-[13.5px] text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 leading-relaxed"
            >
              {t}
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-gray-400 mt-8 max-w-2xl leading-relaxed">
        Las fuentes en verde las puede leer el agente de IA. Las de ámbar las califica Wellness:
        nadie puede leer de un PDF cómo alguien ejecutó en una sala.
      </p>
    </div>
  );
}
