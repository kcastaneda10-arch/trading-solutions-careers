"use client";

/**
 * Bateria psicometrica · bloque del Dashboard.
 *
 * Responde tres preguntas y nada mas: cuantas mande, quien me esta frenando
 * el proceso, y quienes son los mejores hasta ahora. El detalle completo
 * sigue en /hr-admin/bateria; esto es el diagnostico.
 */

import { useEffect, useMemo, useState } from "react";

type Sesion = {
  token: string;
  candidate_name: string | null;
  vacancy_title: string | null;
  status: string;
  respuestas?: number;
  match?: number | null;
  alertasMatch?: number;
  conInforme?: boolean;
  calculada?: boolean;
  invited_at?: string | null;
  validity?: { veredicto?: string } | null;
  duration_seconds?: number | null;
};

const VEREDICTO_TXT: Record<string, string> = {
  sin_alertas: "sin alertas",
  con_reservas: "leer con reservas",
  no_interpretable: "no interpretable",
};

function dias(desde: string): number {
  return Math.floor((Date.now() - new Date(desde).getTime()) / 86_400_000);
}

function Tile({ label, value, nota }: { label: string; value: string; nota?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-4">
      <div className="text-[11px] tracking-[1.2px] text-gray-500 uppercase font-semibold">{label}</div>
      <div className="text-[28px] font-extrabold mt-1 tracking-tight tabular-nums">{value}</div>
      {nota && <div className="text-xs font-medium mt-0.5 text-gray-500">{nota}</div>}
    </div>
  );
}

export default function BateriaDashboard() {
  const [sesiones, setSesiones] = useState<Sesion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/bateria/list", { cache: "no-store" });
        const j = await r.json();
        if (j.error) { setError(j.error); return; }
        setSesiones(j.sessions ?? []);
      } catch {
        setError("No se pudo leer el estado de la batería.");
      }
    })();
  }, []);

  const d = useMemo(() => {
    const s = sesiones ?? [];
    const candidatos = s.filter((x) => x.status !== "invalidated");
    const enviadas = candidatos.filter((x) => x.invited_at);
    const terminadas = candidatos.filter((x) => x.status === "completed");
    const enCurso = candidatos.filter((x) => x.status === "in_progress" || x.status === "consented");
    const sinAbrir = enviadas.filter((x) => x.status === "created");

    const conResultado = terminadas
      .filter((x) => x.match != null)
      .sort((a, b) => (b.match ?? 0) - (a.match ?? 0));

    // Frenan el proceso: se les mando hace 2 dias o mas y no han terminado.
    const demorados = enviadas
      .filter((x) => x.status !== "completed" && x.invited_at && dias(x.invited_at) >= 2)
      .sort((a, b) => dias(b.invited_at!) - dias(a.invited_at!));

    return { candidatos, enviadas, terminadas, enCurso, sinAbrir, conResultado, demorados };
  }, [sesiones]);

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-[13px] text-red-700">{error}</div>
    );
  }
  if (!sesiones) {
    return <div className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-[13px] text-gray-500">Cargando…</div>;
  }
  if (!d.candidatos.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-5 text-[13px] text-gray-500">
        Todavía no hay nadie con la batería.{" "}
        <a href="/hr-admin/bateria" className="font-semibold underline text-black">Enviarla desde el panel de la batería</a>{" "}
        o desde el Funnel, seleccionando candidatos.
      </div>
    );
  }

  const pendientes = d.enviadas.length - d.terminadas.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label="Enviadas" value={String(d.enviadas.length)} nota={pendientes > 0 ? `${pendientes} sin resultado` : "todas resueltas"} />
        <Tile label="Sin abrir" value={String(d.sinAbrir.length)} nota="recibieron el correo" />
        <Tile label="En curso" value={String(d.enCurso.length)} nota="empezaron y no han cerrado" />
        <Tile label="Con resultado" value={String(d.terminadas.length)} nota={d.conResultado.length < d.terminadas.length ? `${d.terminadas.length - d.conResultado.length} sin calcular` : "todas calculadas"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* ── Mejores por match ── */}
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-4">
          <div className="text-[11px] tracking-[1.2px] text-gray-500 uppercase font-semibold mb-3">
            Mejores por match con el cargo
          </div>
          {!d.conResultado.length ? (
            <p className="text-[13px] text-gray-500 m-0">Todavía nadie ha terminado la prueba.</p>
          ) : (
            <ul className="m-0 p-0 list-none space-y-2.5">
              {d.conResultado.slice(0, 6).map((s) => {
                const v = s.validity?.veredicto;
                return (
                  <li key={s.token}>
                    <a href={`/hr-admin/bateria/informe/${s.token}`} target="_blank" rel="noreferrer" className="block group">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[13.5px] font-semibold text-black truncate group-hover:underline">
                          {s.candidate_name || "(sin nombre)"}
                        </span>
                        <span className="text-[13.5px] font-bold tabular-nums text-black shrink-0">{s.match}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.max(2, Math.min(100, s.match ?? 0))}%` }} />
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                        {v && v !== "sin_alertas" && (
                          <span className="text-amber-700 font-semibold">Validez: {VEREDICTO_TXT[v] ?? v}</span>
                        )}
                        {!!s.alertasMatch && (
                          <span className="text-red-700 font-semibold">
                            {s.alertasMatch} alerta{s.alertasMatch > 1 ? "s" : ""} de perfil
                          </span>
                        )}
                        {!s.conInforme && <span>sin análisis del psicólogo</span>}
                      </div>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
          <a href="/hr-admin/bateria" className="inline-block mt-3 text-[12px] font-semibold underline text-black">
            Ver el ranking completo
          </a>
        </div>

        {/* ── Los que frenan el proceso ── */}
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-4">
          <div className="text-[11px] tracking-[1.2px] text-gray-500 uppercase font-semibold mb-3">
            Llevan días con la prueba pendiente
          </div>
          {!d.demorados.length ? (
            <p className="text-[13px] text-gray-500 m-0">Nadie lleva más de dos días sin presentarla.</p>
          ) : (
            <ul className="m-0 p-0 list-none space-y-2">
              {d.demorados.slice(0, 8).map((s) => (
                <li key={s.token} className="flex items-baseline justify-between gap-3">
                  <span className="text-[13.5px] text-black truncate">{s.candidate_name || "(sin nombre)"}</span>
                  <span className="text-[12px] text-gray-500 shrink-0 tabular-nums">
                    {s.status === "created" ? "sin abrir" : `${s.respuestas ?? 0} de 172`} · {dias(s.invited_at!)} d
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[11.5px] text-gray-400 mt-3 mb-0 leading-snug">
            La prueba se responde en una sola sesión de ~90 minutos. Quien la dejó a medias tiene que empezar de nuevo:
            si alguien lleva varios días ahí, vale más una llamada que otro correo.
          </p>
        </div>

      </div>
    </div>
  );
}
