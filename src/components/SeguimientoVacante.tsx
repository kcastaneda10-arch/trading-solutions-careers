"use client";

/**
 * SEGUIMIENTO DE CONTACTOS · dentro del funnel, para la vacante que se mira
 *
 * Arriba del tablero: cuántos candidatos activos de esta vacante escribieron y
 * esperan respuesta nuestra, y cuántos no tienen ningún contacto registrado.
 * Clic en el nombre abre su ficha, donde está el historial completo.
 *
 * Solo candidatos activos: vacante abierta y etapa en curso. Los rechazados,
 * los contratados y los procesos cerrados no aparecen, porque no hay a quién
 * responderle.
 *
 * Al elegir una vacante revisa Gmail solo para los activos que todavía no se
 * han revisado, así que lo que se ve está al día sin apretar nada.
 */

import { useCallback, useEffect, useState } from "react";

type Fila = {
  id: string;
  nombre: string;
  etapa: string;
  contactos: number;
  correos: number;
  whatsapps: number;
  ultimo: { at: string; canal: string; direccion: string; resumen: string | null } | null;
  dias_sin_contacto: number | null;
  esperando_respuesta_nuestra: boolean;
  esperando_desde: string | null;
  gmail_revisado: string | null;
};

const CANAL: Record<string, string> = { email: "correo", whatsapp: "WhatsApp", llamada: "llamada", presencial: "en persona", otro: "otro" };

function hace(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return "hace menos de 1 h";
  if (h < 48) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} días`;
}

export default function SeguimientoVacante({
  vacancyId,
  onAbrir,
  onEsperando,
}: {
  vacancyId: string;
  onAbrir: (candidateId: string) => void;
  /** Ids de quienes esperan respuesta, para marcarlos en las tarjetas. */
  onEsperando?: (ids: Set<string>) => void;
}) {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [cargando, setCargando] = useState(true);
  const [revisando, setRevisando] = useState("");
  const [error, setError] = useState("");
  const [abierto, setAbierto] = useState<"esperando" | "sin_contacto" | null>(null);

  const leer = useCallback(async () => {
    const r = await fetch(`/api/admin/contactos/resumen?vacancy_id=${vacancyId}`, { cache: "no-store" });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "No se pudo cargar el seguimiento");
    const f: Fila[] = j.candidatos || [];
    setFilas(f);
    onEsperando?.(new Set(f.filter((x) => x.esperando_respuesta_nuestra).map((x) => x.id)));
    return f;
  }, [vacancyId, onEsperando]);

  const revisarGmail = useCallback(
    async (todos: boolean) => {
      setError("");
      let revisados = 0;
      for (let vuelta = 0; vuelta < 20; vuelta++) {
        const r = await fetch("/api/admin/contactos/sync-gmail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lote: 15, todos, vacancy_id: vacancyId }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Gmail no respondió");
        revisados += j.procesados;
        setRevisando(`Revisando Gmail… ${revisados} listos, faltan ${j.restantes}`);
        if (j.procesados === 0 || j.restantes === 0) break;
      }
      setRevisando("");
      await leer();
    },
    [vacancyId, leer],
  );

  useEffect(() => {
    let vivo = true;
    (async () => {
      setCargando(true);
      setError("");
      setAbierto(null);
      try {
        const f = await leer();
        if (!vivo) return;
        setCargando(false);
        // Los que nunca se revisaron en Gmail se revisan solos al entrar.
        if (f.some((x) => !x.gmail_revisado)) await revisarGmail(false);
      } catch (e: any) {
        if (vivo) setError(e.message);
      } finally {
        if (vivo) {
          setCargando(false);
          setRevisando("");
        }
      }
    })();
    return () => {
      vivo = false;
    };
  }, [vacancyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const esperando = filas
    .filter((f) => f.esperando_respuesta_nuestra)
    .sort((a, b) => new Date(a.esperando_desde!).getTime() - new Date(b.esperando_desde!).getTime());
  const sinContacto = filas.filter((f) => f.contactos === 0);
  const lista = abierto === "esperando" ? esperando : abierto === "sin_contacto" ? sinContacto : [];

  return (
    <div className="mb-4 border border-[var(--ts-gray-10)] bg-white">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
        <div className="ts-eyebrow text-[10px]">Seguimiento de contactos</div>

        {cargando ? (
          <span className="text-[12px] text-[var(--ts-gray-40)]">Cargando…</span>
        ) : (
          <>
            <button
              onClick={() => setAbierto(abierto === "esperando" ? null : "esperando")}
              className={`text-[12px] px-2.5 py-1 border ${abierto === "esperando" ? "border-[var(--ts-black)]" : "border-transparent hover:border-[var(--ts-gray-20)]"} ${esperando.length ? "text-amber-800 font-bold" : "text-[var(--ts-gray-60)]"}`}
            >
              {esperando.length} esperan respuesta nuestra
            </button>
            <button
              onClick={() => setAbierto(abierto === "sin_contacto" ? null : "sin_contacto")}
              className={`text-[12px] px-2.5 py-1 border ${abierto === "sin_contacto" ? "border-[var(--ts-black)]" : "border-transparent hover:border-[var(--ts-gray-20)]"} text-[var(--ts-gray-60)]`}
            >
              {sinContacto.length} sin ningún contacto
            </button>
            <span className="text-[12px] text-[var(--ts-gray-40)]">
              {filas.length} activos · {filas.reduce((s, f) => s + f.contactos, 0)} contactos registrados
            </span>
          </>
        )}

        <span className="ml-auto flex items-center gap-2">
          {revisando && <span className="text-[11px] text-[var(--ts-gray-60)]">{revisando}</span>}
          <button
            onClick={() => void revisarGmail(true).catch((e) => setError(e.message))}
            disabled={Boolean(revisando) || cargando}
            title="Vuelve a leer Gmail para los activos de esta vacante"
            className="text-[10px] uppercase tracking-[1px] font-bold px-2 py-1 border border-[var(--ts-gray-10)] text-[var(--ts-gray-60)] hover:border-[var(--ts-black)] hover:text-[var(--ts-black)] disabled:opacity-40"
          >
            Revisar Gmail
          </button>
        </span>
      </div>

      {error && <div className="px-4 pb-2 text-[12px] text-red-700">{error}</div>}

      {abierto && (
        <div className="border-t border-[var(--ts-gray-10)]">
          {lista.length === 0 ? (
            <p className="px-4 py-3 text-[12px] text-[var(--ts-gray-40)] italic">
              {abierto === "esperando" ? "Nadie esperando respuesta. Al día." : "Todos tienen al menos un contacto."}
            </p>
          ) : (
            <ul className="divide-y divide-[var(--ts-gray-10)]">
              {lista.map((f) => (
                <li key={f.id}>
                  <button
                    onClick={() => onAbrir(f.id)}
                    className="w-full text-left px-4 py-2 hover:bg-[var(--ts-gray-5,#fafafa)] flex flex-wrap gap-x-4 gap-y-0.5 items-baseline"
                  >
                    <span className="text-[13px] font-bold text-[var(--ts-black)] min-w-[200px]">{f.nombre}</span>
                    <span className="text-[11px] font-mono text-[var(--ts-gray-40)]">{f.etapa}</span>
                    {abierto === "esperando" && f.esperando_desde && f.ultimo ? (
                      <span className="text-[12px] text-amber-800">
                        Escribió por {CANAL[f.ultimo.canal] || f.ultimo.canal} {hace(f.esperando_desde)}
                        {f.ultimo.resumen ? <span className="text-[var(--ts-gray-60)]"> · «{f.ultimo.resumen.slice(0, 90)}»</span> : null}
                      </span>
                    ) : (
                      <span className="text-[12px] text-[var(--ts-gray-40)]">
                        {f.gmail_revisado ? "Sin correos ni WhatsApp registrados" : "Gmail todavía sin revisar"}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="px-4 py-2 text-[10.5px] text-[var(--ts-gray-40)] border-t border-[var(--ts-gray-10)]">
            Clic en el nombre para abrir la ficha: ahí está el historial completo y el botón para importar el chat de
            WhatsApp.
          </p>
        </div>
      )}
    </div>
  );
}
