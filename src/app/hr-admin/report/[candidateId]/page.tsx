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

// ─── Benchmarks (TS top performers) usados para overlay en gráficas ───
const BENCHMARKS: Record<string, number> = {
  D: 47.9, I: 50.3, S: 47.1, C: 56.7,
  IQ: 117.6, "Verbal Comprehension": 72.9, "Attention and Memory": 87.9,
  "Perceptual Speed": 85.9, "Nonverbal Reasoning": 49.6,
  Agreeableness: 33.8, Openness: 63.8, Extraversion: 66.5,
  Conscientiousness: 77.9, Neuroticism: 29.9,
  "Fi Score": 91.7, "Bi Score": 77.0, "Bd Score": 70.6, "Fd Score": 75.7,
  Logros_media: 4.3, "Afiliación_media": 4.3, Poder_media: 4.5,
};

// ─── Radar/Spider chart con 8 dimensiones psicométricas principales ──
function RadarChart({ ps }: { ps: Record<string, number> }) {
  const dims = [
    { key: "Cognitivo", value: Math.min(100, ((ps.IQ ?? 100) - 70) / 0.75) },
    { key: "Extroversión", value: ps.Extraversion ?? 50 },
    { key: "Decisión", value: ps.D ?? 50 },
    { key: "Influencia", value: ps.I ?? 50 },
    { key: "Disciplina", value: ps.Conscientiousness ?? 50 },
    { key: "Logro", value: ((ps.Logros_media ?? 3) / 5) * 100 },
    { key: "Estab. Emocional", value: 100 - (ps.Neuroticism ?? 50) },
    { key: "Analítico", value: ps.C ?? 50 },
  ];
  const benchVals = [
    ((BENCHMARKS.IQ - 70) / 0.75),
    BENCHMARKS.Extraversion,
    BENCHMARKS.D,
    BENCHMARKS.I,
    BENCHMARKS.Conscientiousness,
    (BENCHMARKS.Logros_media / 5) * 100,
    100 - BENCHMARKS.Neuroticism,
    BENCHMARKS.C,
  ];
  const cx = 180, cy = 180, r = 120;
  const n = dims.length;
  function point(value: number, idx: number) {
    const angle = (idx / n) * Math.PI * 2 - Math.PI / 2;
    const radius = (Math.min(100, Math.max(0, value)) / 100) * r;
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
  }
  const candidatePoints = dims.map((d, i) => point(d.value, i));
  const benchPoints = benchVals.map((v, i) => point(v, i));
  return (
    <svg viewBox="0 0 360 360" width="100%" style={{ maxWidth: 360 }}>
      {/* Concentric circles */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <circle key={f} cx={cx} cy={cy} r={r * f} fill="none" stroke="#e5e7eb" strokeWidth={0.6} />
      ))}
      {/* Axes */}
      {dims.map((d, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        const ex = cx + Math.cos(angle) * r;
        const ey = cy + Math.sin(angle) * r;
        return <line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke="#e5e7eb" strokeWidth={0.6} />;
      })}
      {/* Benchmark polygon (red dashed) */}
      <polygon
        points={benchPoints.map((p) => p.join(",")).join(" ")}
        fill="rgba(239,68,68,0.06)"
        stroke="#ef4444"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      {/* Candidate polygon (filled) */}
      <polygon
        points={candidatePoints.map((p) => p.join(",")).join(" ")}
        fill="rgba(44,100,237,0.18)"
        stroke="#2C64ED"
        strokeWidth={2}
      />
      {/* Vertices */}
      {candidatePoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} fill="#2C64ED" />
      ))}
      {/* Labels */}
      {dims.map((d, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        const lx = cx + Math.cos(angle) * (r + 22);
        const ly = cy + Math.sin(angle) * (r + 22);
        return (
          <g key={d.key}>
            <text
              x={lx}
              y={ly}
              fontSize={10}
              fontWeight={600}
              fill="#1a1a1a"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {d.key}
            </text>
            <text
              x={lx}
              y={ly + 12}
              fontSize={9}
              fill="#2C64ED"
              fontWeight={700}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {Math.round(d.value)}
            </text>
          </g>
        );
      })}
      {/* Legend */}
      <g transform="translate(8,8)">
        <rect width={10} height={2} y={4} fill="#2C64ED" />
        <text x={14} y={7} fontSize={9} fill="#1a1a1a" fontWeight={600}>Candidato</text>
        <line x1={0} y1={20} x2={10} y2={20} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="2 2" />
        <text x={14} y={23} fontSize={9} fill="#1a1a1a" fontWeight={600}>Benchmark</text>
      </g>
    </svg>
  );
}

// ─── DISC quadrant visualization (D arriba, S abajo, C izq, I der) ─
function DiscQuadrant({ ps }: { ps: Record<string, number> }) {
  const D = ps.D ?? 0, I = ps.I ?? 0, S = ps.S ?? 0, C = ps.C ?? 0;
  const cx = 150, cy = 150, r = 110;
  return (
    <svg viewBox="0 0 300 300" width="100%" style={{ maxWidth: 280 }}>
      <circle cx={cx} cy={cy} r={r} fill="#f9fafb" stroke="#e5e7eb" strokeWidth={1.5} />
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="3 3" />
      <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="3 3" />
      {/* Quadrant labels (background) */}
      <text x={cx} y={cy - r + 18} fontSize={28} fontWeight={800} fill="#dc2626" textAnchor="middle">D</text>
      <text x={cx} y={cy - r + 38} fontSize={14} fontWeight={700} fill="#1a1a1a" textAnchor="middle">{Math.round(D)}</text>
      <text x={cx + r - 22} y={cy + 6} fontSize={28} fontWeight={800} fill="#f59e0b" textAnchor="end">I</text>
      <text x={cx + r - 22} y={cy + 22} fontSize={14} fontWeight={700} fill="#1a1a1a" textAnchor="end">{Math.round(I)}</text>
      <text x={cx} y={cy + r - 6} fontSize={28} fontWeight={800} fill="#10b981" textAnchor="middle">S</text>
      <text x={cx} y={cy + r - 26} fontSize={14} fontWeight={700} fill="#1a1a1a" textAnchor="middle">{Math.round(S)}</text>
      <text x={cx - r + 22} y={cy + 6} fontSize={28} fontWeight={800} fill="#2563eb" textAnchor="start">C</text>
      <text x={cx - r + 22} y={cy + 22} fontSize={14} fontWeight={700} fill="#1a1a1a" textAnchor="start">{Math.round(C)}</text>
    </svg>
  );
}

// ─── BETESA brain grid 2×2 ─────────────────────────────────────
function BetesaGrid({ ps }: { ps: Record<string, number> }) {
  const fi = ps["Fi Score"] ?? 0;
  const bi = ps["Bi Score"] ?? 0;
  const bd = ps["Bd Score"] ?? 0;
  const fd = ps["Fd Score"] ?? 0;
  const labels = [
    { v: fi, name: "Frontal Izquierdo", bench: BENCHMARKS["Fi Score"] },
    { v: fd, name: "Frontal Derecho", bench: BENCHMARKS["Fd Score"] },
    { v: bi, name: "Basal Izquierdo", bench: BENCHMARKS["Bi Score"] },
    { v: bd, name: "Basal Derecho", bench: BENCHMARKS["Bd Score"] },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {labels.map((l) => {
        const delta = l.v - l.bench;
        const pct = Math.min(100, Math.max(0, ((l.v - 40) / 80) * 100));
        return (
          <div key={l.name} style={{ background: "#f9fafb", padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>{l.name}</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>{Math.round(l.v * 10) / 10}</div>
            <div style={{ height: 4, background: "#e5e7eb", borderRadius: 2, marginTop: 6, position: "relative" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "#2C64ED", borderRadius: 2 }} />
              <div style={{
                position: "absolute",
                left: `${Math.min(100, Math.max(0, ((l.bench - 40) / 80) * 100))}%`,
                top: -2, bottom: -2, width: 2, background: "#ef4444",
              }} />
            </div>
            <div style={{ fontSize: 9, color: delta >= 0 ? "#10b981" : "#ef4444", fontWeight: 700, marginTop: 4 }}>
              {delta >= 0 ? "+" : ""}{Math.round(delta * 10) / 10} vs bm {l.bench}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Bar with benchmark marker ───────────────────────────────
function BarWithBenchmark({
  label, value, benchmark, max = 100, decimals = 1,
}: { label: string; value: number; benchmark: number; max?: number; decimals?: number }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const benchPct = Math.min(100, Math.max(0, (benchmark / max) * 100));
  const delta = value - benchmark;
  return (
    <div className="bar-row">
      <span>{label}</span>
      <div className="bar-track" style={{ position: "relative" }}>
        <div className="bar-fill" style={{ width: `${pct}%` }} />
        <div style={{
          position: "absolute", left: `${benchPct}%`, top: 0, bottom: 0,
          width: 2, background: "#ef4444",
        }} title={`bm ${benchmark.toFixed(decimals)}`} />
      </div>
      <span style={{ textAlign: "right", fontWeight: 600, fontSize: 10 }}>
        {value.toFixed(decimals)}
        <span style={{ display: "block", color: delta >= 0 ? "#10b981" : "#ef4444", fontSize: 9 }}>
          {delta >= 0 ? "+" : ""}{delta.toFixed(decimals)}
        </span>
      </span>
    </div>
  );
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

      {/* Spider chart resumen */}
      <h2>Resumen Visual del Perfil</h2>
      <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
        <RadarChart ps={ps} />
      </div>

      {/* Perfil DISC con quadrant + bars */}
      <h2>Perfil DISC</h2>
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, alignItems: "center" }}>
        <DiscQuadrant ps={ps} />
        <div>
          {(["D", "I", "S", "C"] as const).map((k) => (
            <BarWithBenchmark
              key={k}
              label={k === "D" ? "Dominancia" : k === "I" ? "Influencia" : k === "S" ? "Estabilidad" : "Cumplimiento"}
              value={ps[k] || 0}
              benchmark={BENCHMARKS[k]}
            />
          ))}
        </div>
      </div>

      {/* Cognitivo */}
      <h2>Análisis Cognitivo</h2>
      {[
        ["IQ", "Coeficiente Intelectual", 145],
        ["Verbal Comprehension", "Comprensión Verbal", 100],
        ["Attention and Memory", "Atención y Memoria", 100],
        ["Perceptual Speed", "Velocidad Perceptual", 100],
        ["Nonverbal Reasoning", "Razonamiento No Verbal", 100],
      ].map(([k, label, max]) => (
        <BarWithBenchmark
          key={String(k)}
          label={String(label)}
          value={ps[String(k)] || 0}
          benchmark={BENCHMARKS[String(k)] || 50}
          max={Number(max)}
        />
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
        <BarWithBenchmark
          key={k}
          label={label}
          value={ps[k] || 0}
          benchmark={BENCHMARKS[k] || 50}
        />
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
      <BetesaGrid ps={ps} />

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
