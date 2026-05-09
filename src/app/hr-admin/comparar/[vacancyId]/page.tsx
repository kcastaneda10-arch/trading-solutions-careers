"use client";

/**
 * Vista "Comparar candidatos" por vacante.
 *
 * Muestra ranking de candidatos con sus evaluaciones (Recruiter + CWO + HM)
 * lado a lado, con score agregado y heatmap por mandato. Sortable.
 *
 * URL: /hr-admin/comparar/[vacancyId]
 */
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CEO_MANDATES, MANDATE_SCORE_SYMBOLS, MANDATE_SCORE_COLORS, MandateScore } from "@/lib/ceo-mandates";

type Evaluation = {
  verdict: "strong_yes" | "maybe" | "no" | null;
  verdict_summary: string | null;
  pct: number;
  pass: number;
  partial: number;
  fail: number;
  not_probed: number;
  data: number;
  mandate_scores: Record<string, MandateScore>;
  interviewer_email: string;
  interview_date: string;
} | null;

type Row = {
  candidate_id: string;
  name: string;
  email: string;
  stage: string;
  status: string;
  salary: string | null;
  english_level: string | null;
  evaluations: { recruiter: Evaluation; cwo: Evaluation; hm: Evaluation };
  aggregate_pct: number | null;
  combined_verdict: "strong_yes" | "maybe" | "no" | null;
  evaluations_count: number;
};

const VERDICT_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  strong_yes: { bg: "bg-emerald-100", fg: "text-emerald-800", label: "Strong Yes" },
  maybe: { bg: "bg-amber-100", fg: "text-amber-800", label: "Maybe" },
  no: { bg: "bg-red-100", fg: "text-red-800", label: "No" },
};

export default function CompareVacancyPage() {
  const params = useParams();
  const vacancyId = params?.vacancyId as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  useEffect(() => {
    if (!vacancyId) return;
    fetch(`/api/admin/vacancy-comparison/${vacancyId}`, { cache: "no-store" })
      .then(r => r.json())
      .then(j => {
        if (j.error) setError(j.error);
        else setData(j);
        setLoading(false);
      })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, [vacancyId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Cargando comparación…</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">Error: {error}</div>;
  if (!data) return null;

  const candidates = data.candidates as Row[];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-[10px] uppercase tracking-[2.5px] font-bold text-gray-500 mb-1">Comparativa por vacante</div>
            <h1 className="text-2xl font-extrabold tracking-tight">{data.vacancy.title}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {data.counts.total} candidatos en proceso · {data.counts.with_evaluations} con al menos una evaluación · {data.counts.without_evaluations} sin evaluar
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className="text-xs font-semibold px-4 py-2 border border-gray-300 rounded-full hover:bg-white"
            >
              {showHeatmap ? "Ocultar heatmap" : "Ver heatmap 16 mandatos"}
            </button>
            <button
              onClick={() => window.print()}
              className="text-xs font-bold px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800"
            >
              🖨️ Imprimir
            </button>
          </div>
        </div>

        {/* Tabla de comparación */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-black text-white">
                <th className="px-3 py-3 text-left font-semibold w-12">#</th>
                <th className="px-3 py-3 text-left font-semibold">Candidato</th>
                <th className="px-3 py-3 text-center font-semibold w-32">Score Agregado</th>
                <th className="px-3 py-3 text-center font-semibold w-28">Recruiter</th>
                <th className="px-3 py-3 text-center font-semibold w-28">CWO</th>
                <th className="px-3 py-3 text-center font-semibold w-28">HM</th>
                <th className="px-3 py-3 text-left font-semibold w-32">Verdict</th>
                <th className="px-3 py-3 text-left font-semibold">Stage</th>
                <th className="px-3 py-3 text-right font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 && (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">Sin candidatos en proceso para esta vacante.</td></tr>
              )}
              {candidates.map((c, i) => (
                <RowDisplay key={c.candidate_id} c={c} index={i + 1} showHeatmap={showHeatmap} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="text-[11px] text-gray-500 mt-4 italic">
          Score agregado = promedio de % de pass+partial sobre los 16 mandatos, ponderado por las evaluaciones disponibles. Cuantas más evaluaciones (Recruiter + CWO + HM), más confiable el ranking.
        </div>
      </div>
    </div>
  );
}

function RowDisplay({ c, index, showHeatmap }: { c: Row; index: number; showHeatmap: boolean }) {
  const aggBg = c.aggregate_pct === null ? "bg-gray-100 text-gray-500" :
                c.aggregate_pct >= 70 ? "bg-emerald-100 text-emerald-800" :
                c.aggregate_pct >= 50 ? "bg-amber-100 text-amber-800" :
                "bg-red-100 text-red-800";
  const verdictStyle = c.combined_verdict ? VERDICT_STYLES[c.combined_verdict] : null;

  return (
    <>
      <tr className="border-t border-gray-100 hover:bg-gray-50">
        <td className="px-3 py-3 align-middle text-gray-500 font-bold">{index}</td>
        <td className="px-3 py-3 align-middle">
          <div className="font-bold">{c.name}</div>
          <div className="text-[10px] text-gray-500 truncate">{c.email}</div>
          {(c.salary || c.english_level) && (
            <div className="text-[10px] text-gray-400 mt-0.5">
              {c.salary && <span>💰 {c.salary}</span>}
              {c.salary && c.english_level && <span> · </span>}
              {c.english_level && <span>🌎 {c.english_level}</span>}
            </div>
          )}
        </td>
        <td className="px-3 py-3 align-middle text-center">
          <div className={`inline-block px-3 py-1.5 rounded-lg font-bold text-sm ${aggBg}`}>
            {c.aggregate_pct === null ? "—" : `${c.aggregate_pct}%`}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">{c.evaluations_count} eval{c.evaluations_count !== 1 ? "s" : ""}</div>
        </td>
        <EvaluationCell ev={c.evaluations.recruiter} />
        <EvaluationCell ev={c.evaluations.cwo} />
        <EvaluationCell ev={c.evaluations.hm} />
        <td className="px-3 py-3 align-middle">
          {verdictStyle ? (
            <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold ${verdictStyle.bg} ${verdictStyle.fg}`}>
              {verdictStyle.label}
            </span>
          ) : (
            <span className="text-[10px] text-gray-400 italic">Sin verdict</span>
          )}
        </td>
        <td className="px-3 py-3 align-middle text-[11px] text-gray-600">{c.stage}</td>
        <td className="px-3 py-3 align-middle text-right">
          <a
            href={`/hr-admin#funnel`}
            className="text-[10px] font-bold text-gray-700 hover:text-black"
          >
            Ver →
          </a>
        </td>
      </tr>
      {showHeatmap && (
        <HeatmapRow c={c} />
      )}
    </>
  );
}

function EvaluationCell({ ev }: { ev: Evaluation }) {
  if (!ev) {
    return (
      <td className="px-3 py-3 align-middle text-center">
        <div className="inline-block w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300 text-xs">—</div>
        <div className="text-[10px] text-gray-400 mt-0.5">pending</div>
      </td>
    );
  }
  const bg = ev.pct >= 70 ? "bg-emerald-100 text-emerald-800 border-emerald-300" :
             ev.pct >= 50 ? "bg-amber-100 text-amber-800 border-amber-300" :
             "bg-red-100 text-red-800 border-red-300";
  return (
    <td className="px-3 py-3 align-middle text-center">
      <div className={`inline-block w-14 px-2 py-1.5 rounded-lg border font-bold text-sm ${bg}`}>
        {ev.pct}%
      </div>
      <div className="text-[10px] text-gray-500 mt-0.5">
        ✅{ev.pass} ◐{ev.partial} ❌{ev.fail}
      </div>
    </td>
  );
}

function HeatmapRow({ c }: { c: Row }) {
  return (
    <tr className="bg-gray-50/40 border-t border-gray-100">
      <td colSpan={9} className="px-6 py-3">
        <div className="text-[10px] uppercase tracking-wide font-bold text-gray-600 mb-2">
          Heatmap · {c.name}
        </div>
        <div className="space-y-1.5">
          {(["recruiter", "cwo", "hm"] as const).map(role => {
            const ev = c.evaluations[role];
            if (!ev) {
              return (
                <div key={role} className="flex items-center gap-2">
                  <div className="text-[10px] font-bold w-16 text-gray-400 capitalize">{role}</div>
                  <div className="text-[10px] text-gray-400 italic">Sin evaluación</div>
                </div>
              );
            }
            return (
              <div key={role} className="flex items-center gap-2">
                <div className="text-[10px] font-bold w-16 capitalize">{role}</div>
                <div className="flex gap-0.5">
                  {CEO_MANDATES.map(m => {
                    const score = ev.mandate_scores?.[String(m.num)] || "not_probed";
                    const colors = MANDATE_SCORE_COLORS[score];
                    return (
                      <div
                        key={m.num}
                        title={`${m.label}: ${score}`}
                        className="w-7 h-7 rounded text-[10px] flex items-center justify-center font-bold cursor-help"
                        style={{ background: colors.bg, color: colors.fg, border: `1px solid ${colors.ring}` }}
                      >
                        {MANDATE_SCORE_SYMBOLS[score]}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </td>
    </tr>
  );
}
