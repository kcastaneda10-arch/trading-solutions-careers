"use client";

/**
 * /hr-admin/report/[candidateId]
 *
 * Informe psicométrico completo estilo Elevare. Diseñado para impresión
 * (descargar como PDF). Lee datos de ht_results, ht_responses, ht_scenarios.
 *
 * Botón "Imprimir / Descargar PDF" usa window.print() — el CSS print
 * asegura layout limpio en una página continua.
 */
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Result = {
  id: string;
  candidate_id: string;
  vacancy_id: string;
  profile_scores: Record<string, number>;
  dimension_scores: Record<string, number>;
  match_percentage: number;
  match_breakdown: Record<string, { score: number; ideal_min: number; ideal_max: number; match: number }>;
  benchmark_comparison: {
    vs_mean?: Record<string, number>;
    percentile_rank?: number;
    proctoring?: {
      camera_enabled?: boolean;
      total_tab_switches?: number;
      total_camera_snapshots?: number;
      integrity_score?: number;
      ai_audit?: {
        integrity_score: number;
        verdict: "CONFIABLE" | "SOSPECHOSO" | "NO CONFIABLE";
        verdict_reason: string;
        red_flags: { category: string; severity: string; evidence: string; interpretation: string }[];
        positive_signals: string[];
        recommendation: string;
      };
    };
  };
  red_flags: string[];
  recommendation: string;
  recommendation_reason: string;
  total_time_seconds: number;
};

type Candidate = {
  id: string;
  name: string;
  email: string;
  vacancy_id: string;
  completed_at?: string | null;
};
type Vacancy = { id: string; title: string; area?: string; position_level?: string };
type Client = { id: string; name: string };
type Scenario = {
  id: string;
  block: string;
  competency_key: string;
  competency_label: string;
  target_columns: string[];
  order_index: number;
};
type Response = {
  scenario_id: string;
  response_text: string;
  response_data: Record<string, unknown> | null;
  time_spent_seconds: number;
  is_final: boolean;
};

const BLOCK_LABELS: Record<string, string> = {
  cognitivo: "Resolución",
  comportamental: "Liderazgo",
  caracter: "Valores",
  bienestar_trayectoria: "Balance",
};

function safeNum(n: number | undefined | null, decimals = 1): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return Number(n).toFixed(decimals);
}

function reportId(candidateId: string): string {
  // Replicar formato Elevare: ELV-DDMMYY-LAST6CHARS
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  const tail = (candidateId || "").replace(/-/g, "").slice(-6).toUpperCase();
  return `TS-${dd}${mm}${yy}-${tail}`;
}

function formatDate(iso?: string): string {
  if (!iso) return new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

const VERDICT_COLOR: Record<string, string> = {
  CONFIABLE: "#10B981",
  SOSPECHOSO: "#F59E0B",
  "NO CONFIABLE": "#EF4444",
};

const RECO_COLOR: Record<string, string> = {
  AVANZA: "#10B981",
  "EN ESPERA": "#F59E0B",
  "NO AVANZA": "#EF4444",
  PENDIENTE: "#6B7280",
};

export default function ReportPage() {
  const params = useParams();
  const candidateId = String(params?.candidateId || "");
  const [data, setData] = useState<{
    candidate: Candidate;
    result: Result | null;
    responses: Response[];
    vacancy: Vacancy | null;
    client: Client | null;
    scenarios?: Scenario[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/headhunting/results/${candidateId}`, { cache: "no-store" });
        if (!r.ok) throw new Error(`API error ${r.status}`);
        const j = await r.json();
        if (!cancelled) {
          setData(j);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Error cargando datos");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  if (loading) {
    return <div className="p-12 text-center text-gray-400">Cargando informe…</div>;
  }
  if (error || !data) {
    return <div className="p-12 text-center text-red-500">Error: {error || "Sin datos"}</div>;
  }

  const { candidate, result, vacancy, client, responses, scenarios = [] } = data;
  const proctoring = result?.benchmark_comparison?.proctoring;
  const audit = proctoring?.ai_audit;
  const ps = result?.profile_scores || {};
  const matchPct = result?.match_percentage ?? 0;
  const percentile = result?.benchmark_comparison?.percentile_rank ?? 50;
  const id = reportId(candidate?.id || candidateId);

  // Group scenarios by block
  const scenariosByBlock: Record<string, Scenario[]> = {};
  for (const sc of scenarios) {
    const b = sc.block || "otro";
    if (!scenariosByBlock[b]) scenariosByBlock[b] = [];
    scenariosByBlock[b].push(sc);
  }
  for (const b of Object.keys(scenariosByBlock)) {
    scenariosByBlock[b].sort((a, b) => a.order_index - b.order_index);
  }

  // Determinar respuestas por escenario
  const respByScenario: Record<string, Response> = {};
  for (const r of responses) respByScenario[r.scenario_id] = r;

  return (
    <div className="report-root">
      <style jsx global>{`
        @page { size: A4; margin: 18mm; }
        body { background: #f5f5f5; }
        .report-root {
          max-width: 800px; margin: 0 auto; background: white; padding: 32px 40px;
          font-family: 'Inter', -apple-system, system-ui, sans-serif; color: #1a1a1a;
          line-height: 1.5; font-size: 13px;
        }
        .report-root h1 { font-size: 22px; font-weight: 800; margin: 0 0 4px; letter-spacing: -0.5px; }
        .report-root h2 { font-size: 16px; font-weight: 700; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
        .report-root h3 { font-size: 13px; font-weight: 700; margin: 16px 0 8px; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; }
        .header-bar { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #1a1a1a; margin-bottom: 24px; }
        .logo-block { display: flex; align-items: center; gap: 12px; }
        .logo-mark { width: 32px; height: 32px; background: #1a1a1a; color: white; border-radius: 6px; display:flex; align-items:center; justify-content:center; font-weight: 800; }
        .header-meta { font-size: 11px; color: #6b7280; text-align: right; line-height: 1.5; }
        .reco-block { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
        .reco-flex { display: flex; gap: 24px; align-items: stretch; }
        .reco-tag { padding: 6px 14px; border-radius: 8px; color: white; font-weight: 700; font-size: 13px; letter-spacing: 0.5px; display: inline-block; }
        .reco-stats { display: flex; gap: 20px; margin-left: auto; }
        .stat-block { text-align: center; min-width: 80px; }
        .stat-value { font-size: 22px; font-weight: 800; }
        .stat-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.6px; margin-top: 2px; }
        .bar-row { display: grid; grid-template-columns: 200px 1fr 60px; gap: 12px; align-items: center; margin-bottom: 6px; font-size: 12px; }
        .bar-track { height: 16px; background: #f3f4f6; border-radius: 4px; overflow: hidden; position: relative; }
        .bar-fill { height: 100%; background: #1a1a1a; border-radius: 4px; }
        .bar-bench { position: absolute; top: 0; bottom: 0; width: 2px; background: #ef4444; }
        .table-clean { width: 100%; border-collapse: collapse; font-size: 11px; }
        .table-clean th { background: #f9fafb; text-align: left; padding: 8px 10px; font-weight: 700; color: #374151; border-bottom: 1px solid #e5e7eb; }
        .table-clean td { padding: 7px 10px; border-bottom: 1px solid #f3f4f6; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
        .badge-green { background: #d1fae5; color: #065f46; }
        .badge-amber { background: #fef3c7; color: #92400e; }
        .badge-red { background: #fee2e2; color: #991b1b; }
        .delta-pos { color: #10b981; font-weight: 600; }
        .delta-neg { color: #ef4444; font-weight: 600; }
        .audit-card { border-left: 4px solid; padding: 12px 16px; background: #f9fafb; margin: 12px 0; border-radius: 0 8px 8px 0; }
        .flags-list { font-size: 11px; color: #4b5563; }
        .flag-item { padding: 6px 0; border-bottom: 1px dashed #e5e7eb; }
        .flag-item:last-child { border-bottom: none; }
        .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; line-height: 1.6; }
        .print-btn { position: fixed; top: 16px; right: 16px; background: #1a1a1a; color: white; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; }
        .print-btn:hover { background: #000; }
        @media print {
          body { background: white; }
          .report-root { box-shadow: none; padding: 0; max-width: 100%; }
          .print-btn { display: none; }
          h2 { page-break-after: avoid; }
          .table-clean { page-break-inside: avoid; }
        }
      `}</style>

      <button className="print-btn" onClick={() => window.print()}>
        Imprimir / Descargar PDF
      </button>

      {/* Header */}
      <div className="header-bar">
        <div className="logo-block">
          <div className="logo-mark">TS</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>TRADING SOLUTIONS</div>
            <div style={{ fontSize: 10, color: "#6b7280" }}>Strategic Talent Assessment</div>
          </div>
        </div>
        <div className="header-meta">
          <div><strong>ID:</strong> {id}</div>
          <div>{formatDate(candidate?.completed_at || undefined)}</div>
          <div>Cliente: {client?.name || "Trading Solutions"}</div>
          <div style={{ marginTop: 4, color: "#9ca3af" }}>v2.1</div>
        </div>
      </div>

      <h1>Informe de Evaluación Psicométrica</h1>
      <div style={{ marginBottom: 16, fontSize: 14 }}>
        <strong>{candidate?.name}</strong> · <span style={{ color: "#6b7280" }}>{candidate?.email}</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24, fontSize: 11 }}>
        <span className="badge badge-green">{vacancy?.title || "—"}</span>
        {vacancy?.area && <span className="badge badge-amber">{vacancy.area}</span>}
        {vacancy?.position_level && <span className="badge badge-amber">{vacancy.position_level}</span>}
      </div>

      {/* Recomendación */}
      <div className="reco-block">
        <div className="reco-flex">
          <div style={{ flex: 1 }}>
            <h3 style={{ marginTop: 0 }}>Recomendación</h3>
            <span
              className="reco-tag"
              style={{ background: RECO_COLOR[result?.recommendation || "PENDIENTE"] || "#6B7280" }}
            >
              {result?.recommendation || "PENDIENTE"}
            </span>
            <p style={{ marginTop: 12, fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
              {result?.recommendation_reason ||
                "Pendiente de calificación — ejecuta el agente de scoring."}
            </p>
          </div>
          <div className="reco-stats">
            <div className="stat-block">
              <div className="stat-value">{Math.round(matchPct)}%</div>
              <div className="stat-label">Match</div>
            </div>
            <div className="stat-block">
              <div className="stat-value">P{percentile}</div>
              <div className="stat-label">Percentil</div>
            </div>
            <div className="stat-block">
              <div
                className="stat-value"
                style={{ color: VERDICT_COLOR[audit?.verdict || ""] || "#9ca3af" }}
              >
                {audit?.integrity_score ?? proctoring?.integrity_score ?? "—"}
              </div>
              <div className="stat-label">Integridad</div>
            </div>
          </div>
        </div>
      </div>

      {/* Anti-cheat audit */}
      {audit && (
        <>
          <h2>Auditoría Anti-Cheat (IA)</h2>
          <div
            className="audit-card"
            style={{ borderColor: VERDICT_COLOR[audit.verdict] || "#9ca3af" }}
          >
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              <span style={{ color: VERDICT_COLOR[audit.verdict] }}>● {audit.verdict}</span>{" "}
              · Score de integridad: {audit.integrity_score}/100
            </div>
            <p style={{ margin: "8px 0", fontSize: 12 }}>{audit.verdict_reason}</p>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>
              <strong>Recomendación:</strong> {audit.recommendation}
            </div>
          </div>
          {audit.red_flags?.length > 0 && (
            <>
              <h3>Red Flags Detectadas</h3>
              <div className="flags-list">
                {audit.red_flags.map((f, i) => (
                  <div key={i} className="flag-item">
                    <span
                      className={
                        f.severity === "high"
                          ? "badge badge-red"
                          : f.severity === "medium"
                          ? "badge badge-amber"
                          : "badge badge-green"
                      }
                      style={{ marginRight: 8 }}
                    >
                      {f.severity}
                    </span>
                    <strong>{f.category}:</strong> {f.evidence} — <em>{f.interpretation}</em>
                  </div>
                ))}
              </div>
            </>
          )}
          {audit.positive_signals?.length > 0 && (
            <>
              <h3>Señales Positivas</h3>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 11, color: "#374151" }}>
                {audit.positive_signals.map((s, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{s}</li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {/* Datos de proctoring crudos */}
      <h3>Datos de proctoring</h3>
      <div style={{ fontSize: 11, color: "#4b5563", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
        <div><strong>Cámara:</strong> {proctoring?.camera_enabled ? "Activada" : "Desactivada"}</div>
        <div><strong>Cambios de pestaña:</strong> {proctoring?.total_tab_switches ?? 0}</div>
        <div><strong>Snapshots de cámara:</strong> {proctoring?.total_camera_snapshots ?? 0}</div>
        <div><strong>Tiempo total:</strong> {Math.round((result?.total_time_seconds || 0) / 60)} min</div>
      </div>

      {/* Perfil DISC */}
      <h2>Perfil DISC</h2>
      {(["D", "I", "S", "C"] as const).map((k) => (
        <div key={k} className="bar-row">
          <span>
            {k === "D" ? "Dominancia" : k === "I" ? "Influencia" : k === "S" ? "Estabilidad" : "Cumplimiento"}
          </span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${Math.min(100, ps[k] || 0)}%` }} />
          </div>
          <span style={{ textAlign: "right", fontWeight: 600 }}>{safeNum(ps[k])}</span>
        </div>
      ))}

      {/* Cognitivo */}
      <h2>Análisis Cognitivo</h2>
      {[
        ["IQ", "Coeficiente Intelectual"],
        ["Verbal Comprehension", "Comprensión Verbal"],
        ["Attention and Memory", "Atención y Memoria"],
        ["Perceptual Speed", "Velocidad Perceptual"],
        ["Nonverbal Reasoning", "Razonamiento No Verbal"],
      ].map(([k, label]) => (
        <div key={k} className="bar-row">
          <span>{label}</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${Math.min(
                  100,
                  k === "IQ"
                    ? ((ps[k] || 70) - 70) / 0.75
                    : ps[k] || 0
                )}%`,
              }}
            />
          </div>
          <span style={{ textAlign: "right", fontWeight: 600 }}>{safeNum(ps[k])}</span>
        </div>
      ))}

      {/* Cinco Grandes */}
      <h2>Personalidad (Cinco Grandes)</h2>
      {[
        ["Agreeableness", "Amabilidad"],
        ["Openness", "Apertura"],
        ["Extraversion", "Extraversión"],
        ["Conscientiousness", "Responsabilidad"],
        ["Neuroticism", "Neuroticismo"],
      ].map(([k, label]) => (
        <div key={k} className="bar-row">
          <span>{label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${Math.min(100, ps[k] || 0)}%` }} />
          </div>
          <span style={{ textAlign: "right", fontWeight: 600 }}>{safeNum(ps[k])}</span>
        </div>
      ))}

      {/* Motivación */}
      <h2>Perfil Motivacional</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, fontSize: 13 }}>
        <div style={{ background: "#f9fafb", padding: 16, borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#6b7280" }}>Motivación de Logro</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{safeNum(ps["Logros_media"])}/5.0</div>
        </div>
        <div style={{ background: "#f9fafb", padding: 16, borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#6b7280" }}>Motivación de Afiliación</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{safeNum(ps["Afiliación_media"])}/5.0</div>
        </div>
        <div style={{ background: "#f9fafb", padding: 16, borderRadius: 8, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#6b7280" }}>Motivación de Poder</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{safeNum(ps["Poder_media"])}/5.0</div>
        </div>
      </div>

      {/* Dominancia Cerebral */}
      <h2>Dominancia Cerebral (BETESA)</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, fontSize: 12 }}>
        {[
          ["Fi Score", "Frontal Izquierdo"],
          ["Bi Score", "Basal Izquierdo"],
          ["Bd Score", "Basal Derecho"],
          ["Fd Score", "Frontal Derecho"],
        ].map(([k, label]) => (
          <div key={k} style={{ background: "#f9fafb", padding: 12, borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{safeNum(ps[k])}</div>
          </div>
        ))}
      </div>

      {/* Match breakdown table */}
      {result?.match_breakdown && Object.keys(result.match_breakdown).length > 0 && (
        <>
          <h2>Ajuste al Perfil del Cargo · {vacancy?.title}</h2>
          <table className="table-clean">
            <thead>
              <tr>
                <th>Dimensión</th>
                <th style={{ textAlign: "right" }}>Score</th>
                <th style={{ textAlign: "right" }}>Rango Ideal</th>
                <th style={{ textAlign: "right" }}>Ajuste %</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(result.match_breakdown).map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td style={{ textAlign: "right" }}>{safeNum(v.score)}</td>
                  <td style={{ textAlign: "right" }}>
                    {safeNum(v.ideal_min)} – {safeNum(v.ideal_max)}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>
                    <span className={v.match >= 80 ? "delta-pos" : v.match < 50 ? "delta-neg" : ""}>
                      {Math.round(v.match)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Red flags del scoring */}
      {result?.red_flags && result.red_flags.length > 0 && (
        <>
          <h3>Red Flags del Perfil</h3>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 11, color: "#991b1b" }}>
            {result.red_flags.map((rf, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{rf}</li>
            ))}
          </ul>
        </>
      )}

      {/* Competencias evaluadas */}
      <h2>Competencias Evaluadas</h2>
      {Object.keys(scenariosByBlock).length === 0 ? (
        <p style={{ fontSize: 11, color: "#9ca3af" }}>(Detalle de escenarios no disponible)</p>
      ) : (
        Object.entries(scenariosByBlock).map(([block, scs]) => (
          <div key={block} style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 8 }}>
              {BLOCK_LABELS[block] || block}
            </h3>
            <table className="table-clean">
              <thead>
                <tr>
                  <th style={{ width: 30 }}>#</th>
                  <th>Competencia</th>
                  <th>Dimensiones medidas</th>
                  <th style={{ textAlign: "right" }}>Tiempo</th>
                  <th style={{ width: 30, textAlign: "center" }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {scs.map((sc, i) => {
                  const r = respByScenario[sc.id];
                  const answered = !!(r && (r.response_text || r.response_data));
                  const t = r?.time_spent_seconds ?? 0;
                  const mins = Math.floor(t / 60);
                  const secs = t % 60;
                  return (
                    <tr key={sc.id}>
                      <td>{i + 1}</td>
                      <td>{sc.competency_label}</td>
                      <td style={{ fontSize: 10, color: "#6b7280" }}>
                        {(sc.target_columns || []).join(", ")}
                      </td>
                      <td style={{ textAlign: "right", fontSize: 10 }}>
                        {mins}m {secs}s
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {answered ? (
                          <span style={{ color: "#10b981", fontWeight: 700 }}>✓</span>
                        ) : (
                          <span style={{ color: "#ef4444" }}>✗</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))
      )}

      {/* Footer */}
      <div className="footer">
        <p>
          <strong>Nota Metodológica:</strong> Evaluación basada en Juicio Situacional (SJT) con 29 escenarios
          calibrados específicamente para Trading Solutions. Los puntajes se normalizan contra el benchmark
          interno (top performers actuales). El SJT mide tendencias comportamentales, no capacidades absolutas.
          La auditoría anti-cheat usa Claude Sonnet 4 para detectar patrones sospechosos en proctoring,
          tiempos de respuesta y consistencia.
        </p>
        <p style={{ marginTop: 12 }}>
          {id} · v2.1 · Generado: {formatDate()} · TS Headhunting · ATS
        </p>
        <p>
          Documento confidencial. Uso exclusivo del área de Talent Acquisition de Trading Solutions.
        </p>
      </div>
    </div>
  );
}
