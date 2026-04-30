"use client";

import { useEffect, useState, useMemo } from "react";

type Cand = {
  id: string;
  name: string;
  email: string;
  status: string;
  stage: string | null;
  vacancy_id: string;
  prefilter_decision: string | null;
  ht_vacancies?: { title: string };
};

type Vacancy = { id: string; title: string };

const TS_CLIENT_ID = "98b62872-5767-4815-9b49-1394b9527c1f";

// Definición del funnel — orden importa (de izquierda a derecha)
const STAGES: Array<{ id: string; label: string; emoji: string; color: string }> = [
  { id: "aplico",                 label: "Aplicó",                emoji: "📥", color: "#9CA3AF" },
  { id: "prefiltro_enviado",      label: "Prefiltro enviado",     emoji: "📋", color: "#3B82F6" },
  { id: "prefiltro_pasado",       label: "Prefiltro · Pass",      emoji: "✅", color: "#10B981" },
  { id: "prefiltro_revision",     label: "Prefiltro · Review",    emoji: "⚠️",  color: "#F59E0B" },
  { id: "assessment_invitado",    label: "Elevare invitado",      emoji: "📨", color: "#8B5CF6" },
  { id: "assessment_en_progreso", label: "Elevare en progreso",   emoji: "⏳", color: "#A855F7" },
  { id: "assessment_completado",  label: "Elevare completado",    emoji: "🎯", color: "#7C3AED" },
  { id: "entrevista_ia",          label: "Entrevista IA",         emoji: "🎥", color: "#EC4899" },
  { id: "recruiter_interview",    label: "Entrevista Recruiter",  emoji: "💬", color: "#F472B6" },
  { id: "cwo_interview",          label: "CWO + Hiring",          emoji: "👔", color: "#DB2777" },
  { id: "touring",                label: "Prueba Touring",        emoji: "🏢", color: "#BE185D" },
  { id: "contratado",             label: "Contratado",            emoji: "🎉", color: "#16A34A" },
];

const REJECTED_STAGE = { id: "rechazado", label: "Rechazado", emoji: "❌", color: "#EF4444" };

export default function PipelineFunnel() {
  const [candidates, setCandidates] = useState<Cand[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [vacFilter, setVacFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedCand, setSelectedCand] = useState<Cand | null>(null);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [cRes, vRes] = await Promise.all([
        fetch(`/api/headhunting/candidates?clientId=${TS_CLIENT_ID}`),
        fetch(`/api/headhunting/vacancies?clientId=${TS_CLIENT_ID}`),
      ]);
      const cJ = await cRes.json();
      const vJ = await vRes.json();
      // Excluir internos
      const real = (cJ.candidates || []).filter((c: Cand) => !/@tradingsolutions\.com$/i.test(c.email || ""));
      setCandidates(real);
      setVacancies(vJ.vacancies || []);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(
    () => vacFilter === "all" ? candidates : candidates.filter(c => c.vacancy_id === vacFilter),
    [candidates, vacFilter]
  );

  const byStage = useMemo(() => {
    const m: Record<string, Cand[]> = {};
    [...STAGES, REJECTED_STAGE].forEach(s => { m[s.id] = []; });
    filtered.forEach(c => {
      const stage = c.stage || "aplico";
      if (!m[stage]) m[stage] = [];
      m[stage].push(c);
    });
    return m;
  }, [filtered]);

  const totals = filtered.length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-5">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight m-0">Pipeline · Funnel completo</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totals} candidatos {vacFilter !== "all" && "(filtrado)"} · Vista Kanban del proceso de reclutamiento.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-500">Vacante:</span>
          <select
            value={vacFilter}
            onChange={(e) => setVacFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 font-medium"
          >
            <option value="all">Todas</option>
            {vacancies.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando…</div>
      ) : (
        <>
          {/* Kanban funnel - horizontal scroll */}
          <div className="overflow-x-auto pb-4 -mx-6 px-6">
            <div className="flex gap-3 min-w-max">
              {STAGES.map((stage) => {
                const cands = byStage[stage.id] || [];
                return (
                  <div key={stage.id} className="w-[260px] flex-shrink-0">
                    <div className="rounded-t-xl px-3 py-2.5 flex items-center justify-between" style={{ background: stage.color, color: "white" }}>
                      <div className="flex items-center gap-1.5">
                        <span>{stage.emoji}</span>
                        <span className="text-xs font-bold uppercase tracking-wide">{stage.label}</span>
                      </div>
                      <span className="text-xs font-extrabold bg-white/20 px-2 py-0.5 rounded-full">{cands.length}</span>
                    </div>
                    <div className="bg-white border border-gray-200 border-t-0 rounded-b-xl p-2 min-h-[120px] max-h-[600px] overflow-y-auto">
                      {cands.length === 0 ? (
                        <div className="text-xs text-gray-400 text-center py-4 italic">Vacío</div>
                      ) : cands.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCand(c)}
                          className="w-full text-left bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-2.5 mb-2 transition-colors"
                        >
                          <div className="text-sm font-semibold leading-tight">{c.name}</div>
                          <div className="text-[11px] text-gray-500 truncate mt-0.5">{c.email}</div>
                          <div className="text-[10px] mt-1.5 inline-block bg-gray-100 px-1.5 py-0.5 rounded font-medium text-gray-700">
                            {c.ht_vacancies?.title || "—"}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rechazados separado debajo */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{REJECTED_STAGE.emoji}</span>
              <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: REJECTED_STAGE.color }}>
                {REJECTED_STAGE.label} · {byStage[REJECTED_STAGE.id]?.length || 0}
              </h2>
            </div>
            {byStage[REJECTED_STAGE.id]?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {byStage[REJECTED_STAGE.id].map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCand(c)}
                    className="text-left bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg p-2 transition-colors"
                  >
                    <div className="text-xs font-semibold text-red-900 truncate">{c.name}</div>
                    <div className="text-[10px] text-red-700 truncate">{c.ht_vacancies?.title || "—"}</div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Sin rechazos por ahora.</p>
            )}
          </div>
        </>
      )}

      {/* Side panel con detalles del candidato */}
      {selectedCand && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setSelectedCand(null)}>
          <div className="bg-white w-[480px] h-full overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{selectedCand.name}</h2>
              <button onClick={() => setSelectedCand(null)} className="text-gray-400 hover:text-black text-2xl leading-none">×</button>
            </div>
            <div className="space-y-3 text-sm">
              <div><span className="text-gray-500">Email:</span> <strong>{selectedCand.email}</strong></div>
              <div><span className="text-gray-500">Vacante:</span> <strong>{selectedCand.ht_vacancies?.title || "—"}</strong></div>
              <div><span className="text-gray-500">Stage:</span> <strong>{selectedCand.stage || "aplico"}</strong></div>
              <div><span className="text-gray-500">Status (Elevare):</span> <strong>{selectedCand.status}</strong></div>
              {selectedCand.prefilter_decision && (
                <div><span className="text-gray-500">Decisión prefiltro:</span> <strong>{selectedCand.prefilter_decision}</strong></div>
              )}
              <div className="pt-4 border-t mt-4">
                <p className="text-xs text-gray-500 mb-2">Acciones disponibles según etapa actual:</p>
                <p className="text-xs text-gray-400 italic">Pronto: enviar prefiltro · invitar Elevare · agendar entrevista IA · marcar manual</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
