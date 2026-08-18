"use client";

/**
 * Tiempos del funnel · foto de hoy
 *
 * Responde una sola pregunta: ¿dónde se está quedando la gente?
 *
 * Por etapa muestra días promedio contra el SLA, cuántos candidatos hay, y
 * al hacer click abre la lista de quiénes están ahí ordenados por más tiempo
 * esperando. Las etapas "Pruebas" y "Prueba técnica / Assessment" además
 * despliegan el desglose de sub-evaluaciones, porque una etapa lenta no
 * dice nada si no se sabe cuál de las seis pruebas la está frenando.
 *
 * Los días salen de ht_candidate_stage_events. Cuando un candidato no tiene
 * historial todavía se cae a updated_at y se marca como aproximado.
 */

import { Fragment, useCallback, useEffect, useState } from "react";

type Status = "ok" | "warning" | "serious" | "critical";

interface Breakdown {
  id: string; label: string; owner: string; sla: number;
  count: number; avg_days: number; status: Status;
}
interface Candidate {
  id: string; name: string; vacancy_title: string;
  days: number; approx: boolean; pending_tests: string[];
}
interface Stage {
  id: string; order: number; phase: string; phase_label: string;
  label: string; label_long: string; owner: string; action: string;
  sla: number; count: number; avg_days: number; max_days: number;
  over_sla_count: number; status: Status;
  breakdown: Breakdown[] | null;
  candidates: Candidate[];
}
interface PhaseSummary { id: string; label: string; count: number; total_days: number }
interface Totals {
  active: number; stuck: number; stuck_pct: number; end_to_end_days: number;
  open_vacancies: number;
  bottleneck: { id: string; label: string; avg_days: number; sla: number; count: number } | null;
}
interface Data {
  stages: Stage[]; phases: PhaseSummary[]; totals: Totals; approx_ratio: number;
}

const STATUS_CHIP: Record<Status, { label: string; cls: string; dot: string }> = {
  ok:       { label: "En SLA",        cls: "text-green-700 border-green-200 bg-green-50",   dot: "bg-green-600" },
  warning:  { label: "Al límite",     cls: "text-amber-700 border-amber-200 bg-amber-50",   dot: "bg-amber-500" },
  serious:  { label: "Pasado de SLA", cls: "text-orange-700 border-orange-200 bg-orange-50",dot: "bg-orange-500" },
  critical: { label: "Crítico",       cls: "text-red-700 border-red-200 bg-red-50",         dot: "bg-red-600" },
};

const BAR_COLOR: Record<Status, string> = {
  ok: "#2a78d6", warning: "#2a78d6", serious: "#ec835a", critical: "#d03b3b",
};

function fmt(n: number): string {
  return n.toFixed(1).replace(".", ",").replace(",0", "");
}

export default function FunnelTiming({
  vacancyFilter = "all",
  country = "all",
}: { vacancyFilter?: string; country?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      if (vacancyFilter && vacancyFilter !== "all") qs.set("vacancy_id", vacancyFilter);
      if (country && country !== "all") qs.set("country", country);
      const r = await fetch(`/api/dashboard/funnel-timing${qs.toString() ? `?${qs}` : ""}`, { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json());
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Error de red");
    } finally {
      setLoading(false);
    }
  }, [vacancyFilter, country]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => { if (alive) await fetchData(); })();
    const t = setInterval(() => {
      if (document.visibilityState === "visible" && alive) fetchData();
    }, 30000);
    return () => { alive = false; clearInterval(t); };
  }, [fetchData]);

  if (loading) return <div className="mb-6 text-sm text-gray-400">Cargando tiempos del funnel…</div>;
  if (error) return (
    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 flex items-center justify-between">
      <span>No se pudieron cargar los tiempos: {error}</span>
      <button onClick={() => { setLoading(true); fetchData(); }} className="font-bold underline ml-2">Reintentar</button>
    </div>
  );
  if (!data || data.stages.length === 0) return (
    <div className="mb-6 text-sm text-gray-500 border border-neutral-200 rounded-lg p-4 bg-white">
      No hay candidatos activos en vacantes abiertas con este filtro.
    </div>
  );

  const { totals, phases, stages, approx_ratio } = data;
  const maxDays = Math.max(1, ...stages.map((s) => s.avg_days));
  const sel = phases.find((p) => p.id === "seleccion");
  const con = phases.find((p) => p.id === "contratacion");

  return (
    <div className="mb-8">
      {/* ── Tarjetas de resumen ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <Tile label="Candidatos activos" value={String(totals.active)}
              foot={`en ${totals.open_vacancies} ${totals.open_vacancies === 1 ? "vacante abierta" : "vacantes abiertas"}`} />
        <Tile label="Estancados · pasados de SLA"
              value={String(totals.stuck)}
              valueSmall={totals.active ? `de ${totals.active} · ${totals.stuck_pct}%` : undefined}
              valueClass={totals.stuck > 0 ? "text-red-700" : ""}
              foot={totals.stuck > 0 ? "Requiere acción" : "Todo dentro de SLA"} />
        <Tile label="Peso del proceso hoy" value={fmt(totals.end_to_end_days)} valueSmall="días"
              foot={`Selección ${fmt(sel?.total_days ?? 0)} · Contratación ${fmt(con?.total_days ?? 0)}`}
              title="Suma de los días promedio actuales de cada etapa. Sirve para comparar el peso de Selección contra el de Contratación. NO es el time-to-hire: baja cuando el funnel se vacía." />
        {totals.bottleneck ? (
          <Tile label="Cuello de botella" text={totals.bottleneck.label}
                foot={`${fmt(totals.bottleneck.avg_days)} días · SLA ${totals.bottleneck.sla} · ${totals.bottleneck.count} esperando`} />
        ) : (
          <Tile label="Cuello de botella" text="Ninguno" foot="Ninguna etapa retiene candidatos sobre su SLA" />
        )}
      </div>

      {approx_ratio > 0 && (
        <div className="mb-3 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          <b>{approx_ratio}%</b> de los candidatos todavía no tiene historial de etapas — para ellos los días
          se estiman desde la última edición del registro y pueden quedarse cortos. El porcentaje baja solo,
          a medida que se mueven candidatos en el funnel.
        </div>
      )}

      {/* ── Tabla de etapas ── */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <Th className="w-[26%]">Etapa</Th>
              <Th className="hidden lg:table-cell w-[30%]">Días promedio en etapa</Th>
              <Th right>Días</Th>
              <Th right>SLA</Th>
              <Th right>Candidatos</Th>
              <Th>Estado</Th>
            </tr>
          </thead>
          <tbody>
            {stages.map((s, i) => {
              const first = i === 0 || stages[i - 1].phase !== s.phase;
              const ph = phases.find((p) => p.id === s.phase);
              const chip = STATUS_CHIP[s.count ? s.status : "ok"];
              const isOpen = !!open[s.id];
              return (
                // La key va en el Fragment, no en los hijos: es el elemento que
                // React reconcilia cuando el poll de 30s reordena las etapas.
                <Fragment key={s.id}>
                  {first && (
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      <td colSpan={6} className="px-4 py-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.09em] text-neutral-600">{s.phase_label}</span>
                        {ph && <span className="text-[11px] text-neutral-400 ml-2">— {ph.count} candidatos · {fmt(ph.total_days)} días de punta a punta</span>}
                      </td>
                    </tr>
                  )}
                  <tr
                      onClick={() => setOpen((o) => ({ ...o, [s.id]: !o[s.id] }))}
                      className="border-b border-neutral-200 cursor-pointer hover:bg-neutral-50">
                    <td className="px-4 py-2.5 align-middle">
                      <div className="flex items-start gap-1.5">
                        <span className={`text-[10px] text-neutral-400 mt-1 transition-transform ${isOpen ? "rotate-90" : ""}`}>▶</span>
                        <span className="text-[11px] text-neutral-400 tabular-nums w-4 mt-0.5">{s.order}</span>
                        <div>
                          <div className="font-medium text-[13.5px] text-neutral-900">{s.label}</div>
                          <div className="text-[11px] text-neutral-400">{s.owner}</div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-4 py-2.5 pr-6">
                      <div className="relative h-4">
                        <div className="absolute top-[3px] left-0 h-2.5 rounded-r"
                             style={{ width: `${(s.avg_days / maxDays) * 100}%`, background: BAR_COLOR[s.count ? s.status : "ok"] }} />
                        <div className="absolute -top-px w-0.5 h-[18px] rounded-sm bg-neutral-600"
                             style={{ left: `${Math.min(100, (s.sla / maxDays) * 100)}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-bold text-[13.5px]">{s.count ? fmt(s.avg_days) : "—"}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-neutral-400">{s.sla}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{s.count}</td>
                    <td className="px-4 py-2.5">
                      {s.count > 0 ? (
                        <span className={`inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded-full border ${chip.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${chip.dot}`} />{chip.label}
                        </span>
                      ) : <span className="text-[11.5px] text-neutral-300">vacía</span>}
                    </td>
                  </tr>

                  {isOpen && (
                    <tr className="bg-neutral-50/60">
                      <td colSpan={6} className="px-4 pb-4 border-b border-neutral-200">
                        {s.breakdown && (
                          <div className="pt-3">
                            <h4 className="text-[12px] font-semibold text-neutral-600 mb-2">Desglose</h4>
                            <table className="w-full text-[13px]">
                              <thead>
                                <tr className="text-[10px] uppercase tracking-wide text-neutral-400">
                                  <th className="text-left font-semibold py-1 pr-3">Evaluación</th>
                                  <th className="text-left font-semibold py-1 pr-3">Responsable</th>
                                  <th className="text-right font-semibold py-1 pr-3">Pendientes</th>
                                  <th className="text-right font-semibold py-1 pr-3">Días</th>
                                  <th className="text-right font-semibold py-1 pr-3">SLA</th>
                                  <th className="text-left font-semibold py-1">Estado</th>
                                </tr>
                              </thead>
                              <tbody>
                                {s.breakdown.map((b) => {
                                  const bc = STATUS_CHIP[b.count ? b.status : "ok"];
                                  return (
                                    <tr key={b.id} className="border-t border-neutral-200">
                                      <td className="py-1.5 pr-3 font-medium">{b.label}</td>
                                      <td className="py-1.5 pr-3 text-neutral-500">{b.owner}</td>
                                      <td className="py-1.5 pr-3 text-right tabular-nums">{b.count}</td>
                                      <td className="py-1.5 pr-3 text-right tabular-nums font-bold">{b.count ? fmt(b.avg_days) : "—"}</td>
                                      <td className="py-1.5 pr-3 text-right tabular-nums text-neutral-400">{b.sla}</td>
                                      <td className="py-1.5">
                                        {b.count > 0 ? (
                                          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${bc.cls}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${bc.dot}`} />{bc.label}
                                          </span>
                                        ) : <span className="text-[11px] text-neutral-300">—</span>}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                            <p className="text-[11px] text-neutral-400 mt-1.5">
                              Un mismo candidato puede tener varias evaluaciones pendientes, por eso la suma no da el total de la etapa.
                            </p>
                          </div>
                        )}

                        <h4 className="text-[12px] font-semibold text-neutral-600 mt-4 mb-2">
                          {s.count} {s.count === 1 ? "candidato" : "candidatos"} en “{s.label}”
                          {s.count > 0 && " · ordenados por más tiempo esperando"}
                        </h4>
                        {s.count === 0 ? (
                          <p className="text-[13px] text-neutral-400">Nadie en esta etapa hoy.</p>
                        ) : (
                          <table className="w-full text-[13px]">
                            <thead>
                              <tr className="text-[10px] uppercase tracking-wide text-neutral-400">
                                <th className="text-left font-semibold py-1 pr-3">Candidato</th>
                                <th className="text-left font-semibold py-1 pr-3">Vacante</th>
                                <th className="text-right font-semibold py-1">Días aquí</th>
                              </tr>
                            </thead>
                            <tbody>
                              {s.candidates.map((c) => (
                                <tr key={c.id} className="border-t border-neutral-200 hover:bg-white">
                                  <td className="py-1.5 pr-3">
                                    <a href={`/hr-admin/report/${c.id}`} className="text-blue-700 font-medium hover:underline">{c.name}</a>
                                    {c.approx && <span className="ml-1.5 text-[10px] text-neutral-400" title="Sin historial de etapa · días estimados">≈</span>}
                                  </td>
                                  <td className="py-1.5 pr-3 text-neutral-500">{c.vacancy_title}</td>
                                  <td className="py-1.5 text-right tabular-nums font-medium">{fmt(c.days)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                        {s.action && (
                          <p className="text-[11.5px] text-neutral-500 mt-3">
                            <b className="text-neutral-700">Qué toca hacer acá:</b> {s.action}
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center gap-2 px-4 py-2 border-t border-neutral-200 text-[11.5px] text-neutral-400">
          <span className="inline-block w-0.5 h-3 bg-neutral-600 rounded-sm" />
          La marca vertical sobre cada barra es el SLA de esa etapa · barra naranja o roja = pasada del SLA
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, valueSmall, valueClass = "", text, foot, title }: {
  label: string; value?: string; valueSmall?: string; valueClass?: string; text?: string; foot?: string; title?: string;
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg px-4 py-3.5" title={title}>
      <div className="text-[12px] text-neutral-600 mb-1.5">{label}</div>
      {text ? (
        <div className="text-[16px] font-semibold leading-snug pt-1">{text}</div>
      ) : (
        <div className={`text-[30px] font-semibold tracking-tight leading-none ${valueClass}`}>
          {value}{valueSmall && <span className="text-[13px] font-medium text-neutral-600 ml-1.5">{valueSmall}</span>}
        </div>
      )}
      {foot && <div className="text-[11.5px] text-neutral-400 mt-1.5">{foot}</div>}
    </div>
  );
}

function Th({ children, right, className = "" }: { children: React.ReactNode; right?: boolean; className?: string }) {
  return (
    <th className={`text-[10.5px] uppercase tracking-[0.07em] text-neutral-400 font-semibold px-4 py-2.5 whitespace-nowrap ${right ? "text-right" : "text-left"} ${className}`}>
      {children}
    </th>
  );
}
