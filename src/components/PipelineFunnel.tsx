"use client";

import { useEffect, useState, useMemo } from "react";

type Cand = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  stage: string | null;
  vacancy_id: string;
  prefilter_decision: string | null;
  prefilter_completed_at: string | null;
  prefilter_data: PrefilterData | null;
  cv_url: string | null;
  ht_vacancies?: { title: string };
};

type PrefilterData = {
  doc_type?: string;
  doc_number?: string;
  phone?: string;
  city?: string;
  salary?: string;
  availability?: string;
  relocate?: string;
  english_level?: string;
  english_cert?: string;
  edu_type?: string;
  years_logistics?: number;
  intl_clients?: boolean;
  excel_level?: number;
  crms?: string[];
  years_sales?: number;
  pricing_exp?: boolean;
  leadership?: boolean;
  team_size?: number;
  why_ts?: string;
  next_role?: string;
  extra?: string;
  submitted_at?: string;
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
      {selectedCand && <CandDetailPanel cand={selectedCand} onClose={() => setSelectedCand(null)} />}
    </div>
  );
}

// Mapa de transiciones naturales (avanzar al siguiente stage)
const NEXT_STAGE: Record<string, { id: string; label: string; emoji: string }> = {
  aplico: { id: "prefiltro_enviado", label: "Enviar prefiltro", emoji: "📋" },
  prefiltro_pasado: { id: "assessment_invitado", label: "Invitar a Elevare", emoji: "📨" },
  prefiltro_revision: { id: "assessment_invitado", label: "Invitar a Elevare (override)", emoji: "📨" },
  assessment_completado: { id: "entrevista_ia", label: "Pasar a Entrevista IA", emoji: "🎥" },
  entrevista_ia: { id: "recruiter_interview", label: "Pasar a Entrevista Recruiter", emoji: "💬" },
  recruiter_interview: { id: "cwo_interview", label: "Pasar a CWO + Hiring", emoji: "👔" },
  cwo_interview: { id: "touring", label: "Pasar a Prueba Touring", emoji: "🏢" },
  touring: { id: "contratado", label: "Marcar Contratado", emoji: "🎉" },
};

// ─── Side panel con detalle + respuestas del prefiltro ──────────────
function CandDetailPanel({ cand, onClose }: { cand: Cand; onClose: () => void }) {
  const pf = cand.prefilter_data;
  const decision = cand.prefilter_decision;
  const decisionBadge = decision === "pass" ? { label: "✅ PASS", color: "#10B981" }
    : decision === "review" ? { label: "⚠️ REVIEW", color: "#F59E0B" }
    : decision === "reject" ? { label: "❌ REJECT", color: "#EF4444" }
    : null;

  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const currentStage = cand.stage || "aplico";
  const nextStage = NEXT_STAGE[currentStage];
  const isTerminal = currentStage === "rechazado" || currentStage === "contratado";

  async function moveToStage(targetStage: string, label: string) {
    if (busy) return;
    setBusy(true);
    setFeedback(`${label}…`);
    try {
      const res = await fetch(`/api/headhunting/candidates/${cand.id}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: targetStage }),
      });
      const j = await res.json();
      if (j.success) {
        setFeedback(targetStage === "rechazado"
          ? "✅ Rechazado · draft de descarte creado en tu Gmail"
          : `✅ Movido a ${targetStage}`);
        setTimeout(() => { onClose(); window.location.reload(); }, 1200);
      } else {
        setFeedback(`❌ ${j.error || "Error"}`);
      }
    } catch (e) {
      setFeedback(`❌ ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!confirm(`¿Rechazar a ${cand.name}? Se creará un draft de descarte automático en tu Gmail.`)) return;
    await moveToStage("rechazado", "Rechazando");
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div className="bg-white w-[560px] h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold">{cand.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{cand.ht_vacancies?.title || "—"}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">×</button>
        </div>

        {/* Action bar */}
        {!isTerminal && (
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center gap-2 flex-wrap">
            {nextStage && (
              <button
                onClick={() => moveToStage(nextStage.id, nextStage.label)}
                disabled={busy}
                className="text-xs font-bold px-4 py-2 rounded-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {nextStage.emoji} {nextStage.label} →
              </button>
            )}
            <button
              onClick={reject}
              disabled={busy}
              className="text-xs font-bold px-4 py-2 rounded-full border-2 border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              ❌ Rechazar (draft auto)
            </button>
            {feedback && (
              <span className="text-xs ml-auto text-gray-700">{feedback}</span>
            )}
          </div>
        )}
        {isTerminal && (
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
            <span className="text-xs text-gray-500 italic">
              {currentStage === "rechazado" ? "❌ Candidato rechazado · etapa terminal" : "🎉 Candidato contratado · etapa terminal"}
            </span>
          </div>
        )}

        <div className="p-6 space-y-5 text-sm">
          {/* Identidad */}
          <Section title="Contacto">
            <Row k="Email" v={cand.email} />
            {cand.phone && <Row k="Teléfono" v={cand.phone} />}
            {cand.cv_url && <Row k="LinkedIn" v={<a href={cand.cv_url} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate inline-block max-w-[280px]">{cand.cv_url}</a>} />}
          </Section>

          {/* Estado */}
          <Section title="Estado actual">
            <Row k="Stage" v={<span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{cand.stage || "aplico"}</span>} />
            <Row k="Status Elevare" v={cand.status} />
            {decisionBadge && (
              <Row k="Decisión prefiltro" v={
                <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: decisionBadge.color }}>
                  {decisionBadge.label}
                </span>
              } />
            )}
            {cand.prefilter_completed_at && (
              <Row k="Completó prefiltro" v={new Date(cand.prefilter_completed_at).toLocaleString("es-CO")} />
            )}
          </Section>

          {/* Respuestas del prefiltro */}
          {pf && (
            <>
              <Section title="📋 Datos personales (prefiltro)">
                {pf.doc_type && <Row k="Tipo doc" v={pf.doc_type} />}
                {pf.doc_number && <Row k="Núm doc" v={pf.doc_number} />}
                {pf.phone && <Row k="Celular" v={pf.phone} />}
                {pf.city && <Row k="Ciudad" v={pf.city} />}
              </Section>

              <Section title="💼 Disponibilidad y salario">
                {pf.salary && <Row k="Expectativa salarial" v={<strong>{pf.salary}</strong>} />}
                {pf.availability && <Row k="Inicio disponible" v={pf.availability} />}
                {pf.relocate && <Row k="Mudanza Barranquilla" v={pf.relocate} />}
              </Section>

              <Section title="🌎 Idioma">
                {pf.english_level && <Row k="Nivel inglés" v={pf.english_level} />}
                {pf.english_cert && <Row k="Certifica inglés" v={pf.english_cert} />}
              </Section>

              <Section title="🎓 Formación + experiencia">
                {pf.edu_type && <Row k="Formación" v={pf.edu_type} />}
                {typeof pf.years_logistics === "number" && <Row k="Años logística/comex" v={`${pf.years_logistics} años`} />}
                {typeof pf.intl_clients === "boolean" && <Row k="Clientes internacionales" v={pf.intl_clients ? "Sí" : "No"} />}
                {typeof pf.excel_level === "number" && <Row k="Excel (1-5)" v={`${pf.excel_level}/5`} />}
                {pf.crms && pf.crms.length > 0 && (
                  <Row k="CRMs usados" v={pf.crms.join(", ")} />
                )}
              </Section>

              <Section title="💰 Ventas, pricing, liderazgo">
                {typeof pf.years_sales === "number" && <Row k="Años en ventas" v={`${pf.years_sales} años`} />}
                {typeof pf.pricing_exp === "boolean" && <Row k="Experiencia pricing" v={pf.pricing_exp ? "Sí" : "No"} />}
                {typeof pf.leadership === "boolean" && (
                  <Row k="Lideró equipos" v={
                    pf.leadership ? `Sí — ${pf.team_size || 0} personas` : "No"
                  } />
                )}
              </Section>

              {(pf.why_ts || pf.next_role || pf.extra) && (
                <Section title="✍️ Sobre el candidato">
                  {pf.why_ts && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-2">
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-blue-800 mb-1">¿Por qué TS?</p>
                      <p className="text-sm text-gray-800 leading-relaxed">{pf.why_ts}</p>
                    </div>
                  )}
                  {pf.next_role && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-2">
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-600 mb-1">Qué busca en próximo rol</p>
                      <p className="text-sm text-gray-800 leading-relaxed">{pf.next_role}</p>
                    </div>
                  )}
                  {pf.extra && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-600 mb-1">Algo más</p>
                      <p className="text-sm text-gray-800 leading-relaxed">{pf.extra}</p>
                    </div>
                  )}
                </Section>
              )}
            </>
          )}

          {!pf && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500 italic">Aún no ha completado el prefiltro.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-wider font-bold text-gray-500 mb-2">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-3 text-sm py-1">
      <span className="text-gray-500 flex-shrink-0">{k}:</span>
      <span className="text-right text-gray-900">{v}</span>
    </div>
  );
}
