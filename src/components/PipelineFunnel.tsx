"use client";

import React, { useEffect, useState, useMemo } from "react";

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

          {/* Elevare results — solo si ya hizo el assessment */}
          {(cand.status === "completed" || cand.status === "in_progress" ||
            String(cand.stage || "").startsWith("assessment_")) && (
            <ElevareResultsBlock candidateId={cand.id} candidateStatus={cand.status} />
          )}

          {/* Entrevista IA — disponible desde assessment_completado en adelante */}
          {(cand.status === "completed" ||
            ["assessment_completado","entrevista_ia","recruiter_interview"].includes(String(cand.stage || ""))) && (
            <AIInterviewBlock candidateId={cand.id} />
          )}

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

// ─── Bloque Entrevista IA · ElevenLabs Conversational AI ──────────
function AIInterviewBlock({ candidateId }: { candidateId: string }) {
  const [interview, setInterview] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [feedback, setFeedback] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      // We don't have a direct endpoint for "list ai_interviews by candidate"
      // — let's use a simpler check via candidates endpoint or skip and just
      // show button always.
      const r = await fetch(`/api/headhunting/candidates/${candidateId}/ai-interview-status`, { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        setInterview(j.interview || null);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [candidateId]);

  React.useEffect(() => { load(); }, [load]);

  async function sendInterview() {
    if (sending) return;
    if (!confirm("¿Enviar entrevista IA por voz a este candidato? Se creará un draft en Gmail.")) return;
    setSending(true);
    setFeedback("Generando entrevista IA…");
    try {
      const r = await fetch(`/api/headhunting/candidates/${candidateId}/send-ai-interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const j = await r.json();
      if (j.success) {
        setFeedback(`✅ Entrevista lista · revisa tu Gmail Drafts y envía a candidato`);
        load();
      } else {
        setFeedback(`❌ ${j.error || "Error"}`);
      }
    } catch (e) {
      setFeedback(`❌ ${(e as Error).message}`);
    } finally {
      setSending(false);
    }
  }

  if (loading) return null;

  const recoColor =
    interview?.ai_recommendation === "AVANZA" ? "#10B981" :
    interview?.ai_recommendation === "EN ESPERA" ? "#F59E0B" :
    interview?.ai_recommendation === "NO AVANZA" ? "#EF4444" : "#6B7280";

  return (
    <Section title="🎙️ Entrevista IA por voz">
      {interview && interview.status === "completed" && interview.ai_score != null ? (
        <>
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background: recoColor }}>
                {interview.ai_recommendation}
              </span>
              <div className="flex items-baseline gap-1"><span className="text-xl font-extrabold">{Math.round(interview.ai_score)}</span><span className="text-[10px] text-gray-500">global</span></div>
              {interview.competency_score != null && (
                <div className="flex items-baseline gap-1"><span className="text-xl font-extrabold text-purple-700">{Math.round(interview.competency_score)}</span><span className="text-[10px] text-gray-500">competencias</span></div>
              )}
              {interview.english_level && interview.english_level !== "no_evaluated" && (
                <div className="flex items-baseline gap-1"><span className="text-xl font-extrabold text-blue-700">{interview.english_level}</span><span className="text-[10px] text-gray-500">inglés</span></div>
              )}
            </div>
            {interview.ai_summary && (
              <p className="text-xs text-gray-700 leading-relaxed">{interview.ai_summary}</p>
            )}
          </div>

          {/* Audio player */}
          {interview.audio_url && (
            <div className="mb-3">
              <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">🎧 Audio de la entrevista</p>
              <audio src={interview.audio_url} controls className="w-full" preload="none" />
            </div>
          )}

          {/* Competencias detalladas */}
          {Array.isArray(interview.competencies_scores) && interview.competencies_scores.length > 0 && (
            <details className="mb-3">
              <summary className="text-xs font-bold cursor-pointer text-purple-800 mb-2">📊 Detalle de competencias ({interview.competencies_scores.length})</summary>
              <div className="space-y-1.5 mt-2 pl-2">
                {interview.competencies_scores.map((c: any, i: number) => {
                  const color = c.score >= 8 ? "bg-emerald-500" : c.score >= 6 ? "bg-amber-500" : "bg-red-500";
                  return (
                    <div key={i} className="text-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 truncate font-semibold">{c.name}</div>
                        <div className="flex items-center gap-1">
                          <div className="w-12 h-1.5 bg-gray-200 rounded">
                            <div className={`h-full rounded ${color}`} style={{ width: `${(c.score || 0) * 10}%` }} />
                          </div>
                          <span className="font-bold w-6 text-right">{c.score}</span>
                        </div>
                      </div>
                      {c.evidence && (<p className="text-[10px] text-gray-600 italic mt-0.5 pl-1">&quot;{c.evidence}&quot;</p>)}
                    </div>
                  );
                })}
              </div>
            </details>
          )}

          {/* Inglés detallado */}
          {interview.english_detail && interview.english_level !== "no_evaluated" && (
            <details className="mb-3">
              <summary className="text-xs font-bold cursor-pointer text-blue-800 mb-2">🌎 Detalle de inglés ({interview.english_level})</summary>
              <div className="mt-2 pl-2 text-xs space-y-1">
                <div className="grid grid-cols-2 gap-1">
                  {[["Fluidez", interview.english_detail.fluency], ["Pronunciación", interview.english_detail.pronunciation], ["Gramática", interview.english_detail.grammar], ["Vocabulario", interview.english_detail.vocabulary], ["Comprensión", interview.english_detail.comprehension]].map(([label, score]: any, i) => (
                    <div key={i} className="flex justify-between"><span className="text-gray-600">{label}:</span><span className="font-bold">{score}/10</span></div>
                  ))}
                </div>
                {interview.english_detail.professional_readiness && (
                  <div className="mt-2 pt-2 border-t border-blue-100">
                    <strong>Listo para clientes:</strong>{" "}
                    {interview.english_detail.professional_readiness === "ready_for_clients" ? "✅ Sí" :
                     interview.english_detail.professional_readiness === "needs_practice" ? "⚠️ Necesita práctica" : "❌ No listo"}
                  </div>
                )}
                {interview.english_detail.summary && (<p className="text-[11px] text-gray-700 italic mt-1">{interview.english_detail.summary}</p>)}
              </div>
            </details>
          )}

          {/* Strengths & gaps */}
          {(interview.ai_strengths?.length > 0 || interview.ai_gaps?.length > 0) && (
            <details className="mb-3">
              <summary className="text-xs font-bold cursor-pointer text-gray-700 mb-2">💪 Fortalezas y gaps</summary>
              <div className="mt-2 pl-2 space-y-2 text-xs">
                {interview.ai_strengths?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase font-bold text-emerald-700 mb-1">Fortalezas</p>
                    <ul className="space-y-1">
                      {interview.ai_strengths.map((s: any, i: number) => (
                        <li key={i}><strong>{s.area}:</strong> <span className="text-gray-600 italic">&quot;{s.evidence}&quot;</span></li>
                      ))}
                    </ul>
                  </div>
                )}
                {interview.ai_gaps?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase font-bold text-red-700 mb-1">Gaps</p>
                    <ul className="space-y-1">
                      {interview.ai_gaps.map((g: any, i: number) => (
                        <li key={i}><strong>{g.area}</strong> <span className={g.severity === "high" ? "text-red-700" : g.severity === "medium" ? "text-amber-700" : "text-gray-500"}>({g.severity})</span>: <span className="text-gray-600 italic">&quot;{g.evidence}&quot;</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Red flags */}
          {interview.ai_red_flags && interview.ai_red_flags.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3">
              <p className="text-[10px] uppercase font-bold text-red-700 mb-1">🚩 Red flags ({interview.ai_red_flags.length})</p>
              <ul className="text-xs text-red-800 list-disc pl-4 space-y-0.5">
                {interview.ai_red_flags.map((f: string, i: number) => (<li key={i}>{f}</li>))}
              </ul>
            </div>
          )}
        </>
      ) : interview && interview.status === "in_progress" ? (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3 text-xs text-blue-900">
          ⏳ Candidato en entrevista — esperando que termine. Iniciada: {new Date(interview.started_at).toLocaleString("es-CO")}
        </div>
      ) : interview && interview.status === "invited" ? (
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 mb-3 text-xs text-yellow-900">
          📩 Entrevista enviada. Esperando que el candidato la inicie. Token expira: {new Date(interview.token_expires_at).toLocaleDateString("es-CO")}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 text-xs text-gray-600">
          Aún no se ha enviado entrevista IA a este candidato.
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={sendInterview}
          disabled={sending || (interview && interview.status === "in_progress")}
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? "…" :
            interview && interview.status === "completed" ? "🔄 Reenviar entrevista" :
            interview && interview.status === "invited" ? "🔄 Reenviar enlace" :
            "🎙️ Enviar entrevista IA"}
        </button>
        {interview?.token && (
          <a
            href={`/entrevista-ia/${interview.token}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold px-3 py-1.5 rounded-full border-2 border-pink-400 text-pink-800 hover:bg-pink-50"
          >
            👀 Ver enlace candidato
          </a>
        )}
      </div>
      {feedback && (<div className="mt-2 text-xs text-gray-600 italic">{feedback}</div>)}
    </Section>
  );
}

// ─── Bloque de resultados de Elevare con AI scoring + auditor anti-cheat ─
function ElevareResultsBlock({
  candidateId,
  candidateStatus,
}: {
  candidateId: string;
  candidateStatus?: string;
}) {
  const [data, setData] = React.useState<{
    result: any;
    audit: any;
  }>({ result: null, audit: null });
  const [loading, setLoading] = React.useState(true);
  const [scoring, setScoring] = React.useState(false);
  const [auditing, setAuditing] = React.useState(false);
  const [feedback, setFeedback] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/headhunting/results/${candidateId}`, { cache: "no-store" });
      const j = await r.json();
      setData({
        result: j.result,
        audit: j.result?.benchmark_comparison?.proctoring?.ai_audit || null,
      });
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function runScoring() {
    if (scoring) return;
    setScoring(true);
    setFeedback("Calculando con Claude…");
    try {
      const r = await fetch(`/api/headhunting/candidates/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidateId }),
      });
      const j = await r.json();
      if (j.success) {
        setFeedback(`✅ Match ${Math.round(j.match_percentage)}% · ${j.recommendation}`);
        load();
      } else {
        setFeedback(`❌ ${j.error || "Error"}${j.details ? `: ${j.details.slice(0, 80)}` : ""}`);
      }
    } catch (e) {
      setFeedback(`❌ ${(e as Error).message}`);
    } finally {
      setScoring(false);
    }
  }

  async function runAudit() {
    if (auditing) return;
    setAuditing(true);
    setFeedback("Auditando anti-cheat con Claude…");
    try {
      const r = await fetch(`/api/headhunting/results/${candidateId}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const j = await r.json();
      if (j.success) {
        setFeedback(`✅ ${j.audit.verdict} · integridad ${j.audit.integrity_score}/100`);
        load();
      } else {
        setFeedback(`❌ ${j.error || "Error"}${j.detail ? `: ${j.detail.slice(0, 80)}` : ""}`);
      }
    } catch (e) {
      setFeedback(`❌ ${(e as Error).message}`);
    } finally {
      setAuditing(false);
    }
  }

  if (loading) {
    return (
      <Section title="🧠 Resultados Elevare">
        <div className="text-xs text-gray-400">Cargando…</div>
      </Section>
    );
  }

  const result = data.result;
  const audit = data.audit;
  const proctoring = result?.benchmark_comparison?.proctoring;
  const matchPct = result?.match_percentage ?? 0;
  const recoColor =
    result?.recommendation === "AVANZA"
      ? "#10B981"
      : result?.recommendation === "EN ESPERA"
      ? "#F59E0B"
      : result?.recommendation === "NO AVANZA"
      ? "#EF4444"
      : "#6B7280";
  const verdictColor =
    audit?.verdict === "CONFIABLE"
      ? "#10B981"
      : audit?.verdict === "SOSPECHOSO"
      ? "#F59E0B"
      : audit?.verdict === "NO CONFIABLE"
      ? "#EF4444"
      : "#6B7280";

  const hasResult = !!result && (result.match_percentage > 0 || result.recommendation !== "PENDIENTE");

  return (
    <Section title="🧠 Resultados Elevare">
      {/* Resumen */}
      {hasResult ? (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-3 mb-2">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-bold text-white"
              style={{ background: recoColor }}
            >
              {result.recommendation}
            </span>
            <span className="text-xl font-extrabold">{Math.round(matchPct)}%</span>
            <span className="text-xs text-gray-500">match</span>
            {result.benchmark_comparison?.percentile_rank && (
              <span className="text-xs text-gray-500 ml-auto">
                P{result.benchmark_comparison.percentile_rank}
              </span>
            )}
          </div>
          {result.recommendation_reason && (
            <p className="text-xs text-gray-700 leading-relaxed">
              {result.recommendation_reason}
            </p>
          )}
          {result.red_flags?.length > 0 && (
            <div className="mt-2 pt-2 border-t border-purple-200">
              <p className="text-[10px] uppercase font-bold text-red-700 mb-1">
                Red flags ({result.red_flags.length})
              </p>
              <ul className="text-xs text-red-800 list-disc pl-4 space-y-0.5">
                {result.red_flags.slice(0, 3).map((f: string, i: number) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 text-xs text-gray-600">
          {candidateStatus === "completed"
            ? "Candidato completó la evaluación. Calcula el score con IA para ver match y recomendación."
            : "Aún no hay resultados (status: " + (candidateStatus || "—") + ")"}
        </div>
      )}

      {/* Anti-cheat audit */}
      {audit ? (
        <div
          className="border-l-4 rounded-r-lg p-3 mb-3 bg-gray-50"
          style={{ borderColor: verdictColor }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold" style={{ color: verdictColor }}>
              ● {audit.verdict}
            </span>
            <span className="text-xs text-gray-500">
              · integridad {audit.integrity_score}/100
            </span>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed">{audit.verdict_reason}</p>
          {audit.red_flags?.length > 0 && (
            <details className="mt-1.5">
              <summary className="text-xs font-semibold cursor-pointer text-gray-600">
                {audit.red_flags.length} red flags · ver detalle
              </summary>
              <ul className="mt-1 text-[11px] text-gray-700 space-y-1 pl-3">
                {audit.red_flags.map((f: any, i: number) => (
                  <li key={i}>
                    <span
                      className={
                        "px-1 py-0.5 rounded text-[9px] font-bold mr-1 " +
                        (f.severity === "high"
                          ? "bg-red-200 text-red-800"
                          : f.severity === "medium"
                          ? "bg-amber-200 text-amber-800"
                          : "bg-gray-200 text-gray-700")
                      }
                    >
                      {f.severity}
                    </span>
                    <strong>{f.category}:</strong> {f.evidence}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      ) : proctoring ? (
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-2.5 mb-3 text-xs text-yellow-900">
          📹 Proctoring: cámara {proctoring.camera_enabled ? "✓" : "✗"} ·{" "}
          {proctoring.total_tab_switches ?? 0} cambios pestaña ·{" "}
          {proctoring.total_camera_snapshots ?? 0} snapshots
          <div className="text-[10px] text-yellow-700 mt-1">
            Sin auditoría IA aún · ejecuta el auditor para evaluar trampa
          </div>
        </div>
      ) : null}

      {/* Acciones */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={runScoring}
          disabled={scoring || candidateStatus !== "completed"}
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {scoring ? "…" : hasResult ? "🔄 Recalcular" : "🧠 Calcular score"}
        </button>
        <button
          onClick={runAudit}
          disabled={auditing || !hasResult}
          className="text-xs font-semibold px-3 py-1.5 rounded-full border-2 border-amber-400 text-amber-800 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title={!hasResult ? "Calcula el score primero" : "Auditar anti-cheat con IA"}
        >
          {auditing ? "…" : audit ? "🔄 Re-auditar" : "🔍 Auditar trampa"}
        </button>
        <a
          href={`/hr-admin/report/${candidateId}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-black text-white hover:bg-gray-800"
        >
          📄 Ver informe completo →
        </a>
      </div>

      {feedback && (
        <div className="mt-2 text-xs text-gray-600 italic">{feedback}</div>
      )}
    </Section>
  );
}
