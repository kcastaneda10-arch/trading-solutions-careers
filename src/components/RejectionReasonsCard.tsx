"use client";

/**
 * RejectionReasonsCard — widget para Dashboard que muestra la distribución
 * de motivos de rechazo en el periodo seleccionado (Q por default).
 *
 * Le da a Kelly una lectura rápida de "por qué estamos perdiendo gente"
 * + cuántos quedaron en CV Bank para reactivar.
 */
import { useEffect, useState } from "react";
import { XCircle, BookmarkCheck, AlertCircle } from "lucide-react";

type Breakdown = {
  category_key: string;
  category_label: string;
  count: number;
  percentage: number;
  top_sub_details: { key: string; label: string; count: number }[];
};

type RejectionData = {
  range: string;
  total: number;
  saved_for_future: number;
  unclassified: number;
  breakdown: Breakdown[];
};

export default function RejectionReasonsCard() {
  const [data, setData] = useState<RejectionData | null>(null);
  const [range, setRange] = useState<"quarter" | "month" | "year">("quarter");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/rejection-reasons?range=${range}`)
      .then(r => r.json())
      .then(j => {
        if (j.error) setError(j.error);
        else setData(j);
        setLoading(false);
      })
      .catch(e => {
        setError(e?.message || "Error al cargar");
        setLoading(false);
      });
  }, [range]);

  return (
    <div className="bg-white border border-[var(--ts-gray-10)] p-6">
      <div className="flex items-baseline justify-between mb-5 pb-4 border-b border-[var(--ts-gray-10)]">
        <div className="flex items-center gap-3">
          <XCircle className="w-4 h-4 text-[var(--ts-red)]" />
          <div>
            <div className="ts-eyebrow text-[var(--ts-red)]">Razones de rechazo</div>
            <h3 className="text-[20px] font-extrabold mt-0.5" style={{ letterSpacing: "-0.02em" }}>
              ¿Por qué estamos perdiendo gente?
            </h3>
          </div>
        </div>
        <div className="flex gap-1">
          {(["month", "quarter", "year"] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-[10px] uppercase tracking-[1.5px] px-2.5 py-1 border ${range === r ? "bg-[var(--ts-black)] text-white border-[var(--ts-black)]" : "border-[var(--ts-gray-10)] text-[var(--ts-gray-60)] hover:border-[var(--ts-gray-40)]"}`}
            >
              {r === "month" ? "Mes" : r === "quarter" ? "Trimestre" : "Año"}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-[12px] text-[var(--ts-gray-60)]">Cargando…</div>
      )}

      {error && (
        <div className="text-[12px] text-[var(--ts-red)] flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-3 gap-0 border border-[var(--ts-gray-10)] mb-5">
            <div className="px-4 py-3 border-r border-[var(--ts-gray-10)]">
              <div className="text-[28px] font-extrabold text-[var(--ts-black)] ts-tabular leading-none" style={{ letterSpacing: "-0.03em" }}>
                {data.total}
              </div>
              <div className="ts-eyebrow text-[var(--ts-gray-60)] mt-1">Total rechazos</div>
            </div>
            <div className="px-4 py-3 border-r border-[var(--ts-gray-10)]">
              <div className="text-[28px] font-extrabold text-[var(--ts-green)] ts-tabular leading-none flex items-center gap-1.5" style={{ letterSpacing: "-0.03em" }}>
                <BookmarkCheck className="w-4 h-4" />
                {data.saved_for_future}
              </div>
              <div className="ts-eyebrow text-[var(--ts-gray-60)] mt-1">Saved · CV Bank</div>
            </div>
            <div className="px-4 py-3">
              <div className={`text-[28px] font-extrabold ts-tabular leading-none ${data.unclassified > 0 ? "text-[var(--ts-amber,#b45309)]" : "text-[var(--ts-gray-40)]"}`} style={{ letterSpacing: "-0.03em" }}>
                {data.unclassified}
              </div>
              <div className="ts-eyebrow text-[var(--ts-gray-60)] mt-1">Sin clasificar</div>
            </div>
          </div>

          {/* Breakdown bar list */}
          {data.breakdown.length === 0 ? (
            <div className="text-[12px] italic text-[var(--ts-gray-60)] py-4">
              Sin rechazos en este periodo.
            </div>
          ) : (
            <div className="space-y-3">
              {data.breakdown.map(b => (
                <div key={b.category_key}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <div className="text-[13px] font-bold text-[var(--ts-black)]">{b.category_label}</div>
                    <div className="text-[11px] text-[var(--ts-gray-60)] ts-tabular">
                      <span className="font-bold text-[var(--ts-black)]">{b.count}</span> · {b.percentage}%
                    </div>
                  </div>
                  <div className="h-1.5 bg-[var(--ts-gray-04,#f7f7f7)] border border-[var(--ts-gray-10)]">
                    <div
                      className="h-full bg-[var(--ts-black)]"
                      style={{ width: `${b.percentage}%` }}
                    />
                  </div>
                  {b.top_sub_details.length > 0 && (
                    <div className="text-[10px] text-[var(--ts-gray-60)] mt-1.5 pl-3">
                      {b.top_sub_details.map(sd => (
                        <span key={sd.key} className="mr-3">
                          {sd.label} <span className="font-semibold text-[var(--ts-gray-90)]">({sd.count})</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {data.unclassified > 0 && (
            <div className="mt-5 pt-4 border-t border-[var(--ts-gray-10)] text-[11px] text-[var(--ts-gray-60)] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-[var(--ts-amber,#b45309)]" />
              Hay <strong className="text-[var(--ts-black)]">{data.unclassified} rechazos sin categoría</strong> · son legacy o se rechazaron antes del nuevo flujo.
            </div>
          )}
        </>
      )}
    </div>
  );
}
