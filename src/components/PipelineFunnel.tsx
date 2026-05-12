"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Inbox, ClipboardList, ClipboardCheck, AlertTriangle, Mail, Hourglass, Target,
  Video, ListChecks, MessageSquare, UserCheck, Building2, Trophy, Send,
  CheckCircle2, XCircle, ArrowRight,
  User, Users,
} from "lucide-react";
import RejectionModal from "./RejectionModal";
import RecruiterAssessmentCard from "./RecruiterAssessmentCard";
import JointSchedulingModal from "./JointSchedulingModal";

// Map de stage → icono Lucide. Centralizado para reutilizar en cualquier render.
const STAGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  aplico: Inbox,
  prefiltro_enviado: ClipboardList,
  prefiltro_pasado: ClipboardCheck,
  prefiltro_revision: AlertTriangle,
  assessment_invitado: Mail,
  assessment_en_progreso: Hourglass,
  assessment_completado: Target,
  entrevista_ia: Video,
  bateria_psicometrica: ListChecks,
  recruiter_interview: MessageSquare,
  cwo_interview: UserCheck,
  touring: Building2,
  terna: Trophy,
  oferta: Send,
  contratado: CheckCircle2,
  rechazado: XCircle,
};

export function StageIcon({ stage, className = "w-4 h-4" }: { stage: string; className?: string }) {
  const Icon = STAGE_ICONS[stage] || Inbox;
  return <Icon className={className} />;
}

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
  // Rejection metadata · llenado al rechazar con motivo
  rejection_category?: string | null;
  rejection_sub_detail?: string | null;
  rejection_save_for_future?: boolean | null;
  rejected_at?: string | null;
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

// Definición del funnel — agrupado por fase semántica con paleta TS sobria
// (negros, grises y solo 2 acentos: emerald para terminal positivo, red para rechazo).
// La distinción entre stages se hace por categoría visual, no por colores brillantes.
type StageCategory = "screening" | "assessment" | "interview" | "decision" | "terminal-positive" | "terminal-negative";
// Owner = de quién depende mover la pelota en este stage.
//   candidate → estamos esperando que el candidato responda/haga algo
//   recruiter → la pelota está en cancha de Talento (revisar, decidir, agendar)
//   shared    → coordinación entre ambos (touring requiere agenda + asistencia)
type StageOwner = "candidate" | "recruiter" | "shared" | "terminal";

// 2026-05-12 v3: Pipeline definitivo de Kelly al cierre · simplificado y sin Elevare/IA.
// 3 entrevistas antes de psico (Recruiter → Hiring Lead → CWO+HM) · luego pruebas Mary.
// Onboarding agregado como etapa post-contratación.
const STAGES: Array<{ id: string; label: string; category: StageCategory; owner: StageOwner }> = [
  { id: "aplico",                  label: "Aplicó",                       category: "screening",  owner: "recruiter" },
  { id: "prefiltro_enviado",       label: "Prefiltro enviado",            category: "screening",  owner: "candidate" },
  { id: "prefiltro_pasado",        label: "Prefiltro · Pass",             category: "screening",  owner: "recruiter" },
  { id: "prefiltro_revision",      label: "Prefiltro · Review",           category: "screening",  owner: "recruiter" },
  { id: "recruiter_interview",     label: "Entrevista Recruiter",         category: "interview",  owner: "recruiter" },
  { id: "hiring_lead_interview",   label: "Entrevista Hiring Lead",       category: "interview",  owner: "recruiter" },
  { id: "cwo_interview",           label: "CWO + Hiring Manager",         category: "interview",  owner: "recruiter" },
  { id: "bateria_psicometrica",    label: "Pruebas Psicométricas",        category: "assessment", owner: "recruiter" },
  { id: "solicitud_enviada_mary",  label: "Solicitud a HR Specialist",    category: "assessment", owner: "shared" },
  { id: "touring",                 label: "Máquina de Turing",            category: "assessment", owner: "shared" },
  { id: "terna",                   label: "Terna · Finalistas",           category: "decision",   owner: "recruiter" },
  { id: "oferta",                  label: "Oferta",                       category: "decision",   owner: "candidate" },
  { id: "contratado",              label: "Contratado",                   category: "terminal-positive", owner: "terminal" },
  { id: "onboarding",              label: "Onboarding",                   category: "terminal-positive", owner: "shared" },
];

const REJECTED_STAGE = { id: "rechazado", label: "Rechazado", category: "terminal-negative" as StageCategory, owner: "terminal" as StageOwner };

const OWNER_STYLE: Record<StageOwner, { label: string; barColor: string; bgTint: string }> = {
  candidate: { label: "Candidato",  barColor: "#1e40af", bgTint: "rgba(30,64,175,0.04)" },  // azul corporativo
  recruiter: { label: "Reclutador", barColor: "#0a0a0a", bgTint: "rgba(10,10,10,0.04)" },   // negro TS
  shared:    { label: "Compartido", barColor: "#b45309", bgTint: "rgba(180,83,9,0.04)" },    // ámbar
  terminal:  { label: "—",          barColor: "#737373", bgTint: "transparent" },
};

// Paleta sobria por categoría (estilo editorial TS · NO neón)
const CATEGORY_STYLE: Record<StageCategory, { headerBg: string; headerText: string; accentBar: string; columnBg: string }> = {
  "screening":         { headerBg: "#1a1a1a", headerText: "#ffffff", accentBar: "#737373", columnBg: "#fafafa" },
  "assessment":        { headerBg: "#1a1a1a", headerText: "#ffffff", accentBar: "#b45309", columnBg: "#fafafa" },
  "interview":         { headerBg: "#1a1a1a", headerText: "#ffffff", accentBar: "#1e40af", columnBg: "#fafafa" },
  "decision":          { headerBg: "#0a0a0a", headerText: "#ffffff", accentBar: "#1a7d3e", columnBg: "#fafafa" },
  "terminal-positive": { headerBg: "#1a7d3e", headerText: "#ffffff", accentBar: "#1a7d3e", columnBg: "#f4faf6" },
  "terminal-negative": { headerBg: "#c41818", headerText: "#ffffff", accentBar: "#c41818", columnBg: "#fdf6f6" },
};

export default function PipelineFunnel() {
  const [candidates, setCandidates] = useState<Cand[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  // Inicializar vacFilter desde URL query (?vacancy=UUID) — persiste entre reloads.
  // Usamos query string (no hash) porque el HR Admin ya usa el hash para el tab.
  const [vacFilter, setVacFilterState] = useState(() => {
    if (typeof window === 'undefined') return 'all';
    const params = new URLSearchParams(window.location.search);
    return params.get('vacancy') || 'all';
  });
  const setVacFilter = (v: string) => {
    setVacFilterState(v);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (v === 'all') params.delete('vacancy');
      else params.set('vacancy', v);
      const search = params.toString();
      // Preservar el hash (que tiene el tab)
      const newUrl = `${window.location.pathname}${search ? '?' + search : ''}${window.location.hash}`;
      window.history.replaceState(null, '', newUrl);
    }
  };
  const [loading, setLoading] = useState(true);
  const [selectedCand, setSelectedCand] = useState<Cand | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number; ok: number; fail: number } | null>(null);

  useEffect(() => { void load(); }, []);

  // Listener para back/forward del browser (popstate)
  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('vacancy') || 'all';
      setVacFilterState(v);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }
  function clearSelection() { setSelectedIds(new Set()); }
  function selectAllInStage(stageId: string) {
    const ids = (candidates.filter(c => (c.stage || "aplico") === stageId && (vacFilter === "all" || c.vacancy_id === vacFilter))).map(c => c.id);
    setSelectedIds(prev => {
      const n = new Set(prev);
      ids.forEach(id => n.add(id));
      return n;
    });
  }

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

  // Stages a renderizar (ocultar las terminales · van en footer aparte)
  const visibleStages = STAGES.filter(s => s.category !== 'terminal-positive');
  const hiredCount = (byStage['contratado'] || []).length;
  const rejectedCount = (byStage['rechazado'] || []).length;
  const activeCount = totals - hiredCount - rejectedCount;

  return (
    <div className="font-sans">
      {/* ════════════════ HEADER EDITORIAL ════════════════ */}
      <div className="mb-8 pb-6 border-b border-[var(--ts-gray-10)]">
        <div className="flex items-end justify-between flex-wrap gap-6">
          <div>
            <div className="ts-eyebrow mb-3">Talent Acquisition · Pipeline</div>
            <h1 className="ts-display text-[44px] md:text-[56px] text-[var(--ts-black)] m-0">
              Funnel
            </h1>
            <p className="text-[15px] text-[var(--ts-gray-60)] mt-3 max-w-[640px] leading-[1.55]">
              Vista del proceso completo · {totals} candidatos
              {vacFilter !== "all" && <span className="text-[var(--ts-black)] font-semibold"> · filtro activo</span>}
              <span className="text-[var(--ts-gray-40)]"> · </span>
              <span className="ts-tabular">{activeCount}</span> activos
              <span className="text-[var(--ts-gray-40)]"> · </span>
              <span className="ts-tabular text-[var(--ts-green)]">{hiredCount}</span> contratados
              <span className="text-[var(--ts-gray-40)]"> · </span>
              <span className="ts-tabular text-[var(--ts-red)]">{rejectedCount}</span> rechazados
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="ts-eyebrow text-[10px]">Vacante</span>
            <div className="flex items-center gap-2">
              <select
                value={vacFilter}
                onChange={(e) => setVacFilter(e.target.value)}
                className="text-sm font-medium border border-[var(--ts-gray-20)] bg-white px-4 py-2.5 hover:border-[var(--ts-black)] focus:border-[var(--ts-black)] outline-none transition-colors min-w-[240px]"
                style={{ borderRadius: 0 }}
              >
                <option value="all">Todas las vacantes</option>
                {vacancies.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}
              </select>
              {vacFilter !== "all" && (
                <a
                  href={`/hr-admin/comparar/${vacFilter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold px-3 py-2.5 bg-black text-white hover:bg-gray-800 transition-colors whitespace-nowrap"
                  style={{ borderRadius: 0 }}
                  title="Ver tabla comparativa de todos los candidatos de esta vacante con sus evaluaciones"
                >
                  📊 Comparar
                </a>
              )}
              <button
                type="button"
                onClick={async () => {
                  if (bulkRunning) return;
                  const stage = "recruiter_interview";
                  const vacancyParam = vacFilter !== "all" ? vacFilter : null;
                  const msg = vacancyParam
                    ? `Generar listado de candidatos en Recruiter Interview de la vacante filtrada para Yohanna?`
                    : `Generar listado COMPLETO de candidatos en Recruiter Interview para Yohanna? (todas las vacantes)`;
                  if (!confirm(msg)) return;
                  setBulkRunning(true);
                  try {
                    const r = await fetch(`/api/admin/export-pipeline-to-yohanna`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ stage, vacancy_id: vacancyParam }),
                    });
                    const j = await r.json();
                    if (j.success) {
                      alert(`✅ Draft listo en Gmail · ${j.candidates_count} candidatos listados\n\nTo: ${j.to}\nRevisa el draft y envíalo cuando estés ready.`);
                    } else {
                      alert(`❌ ${j.error || "Error generando draft"}`);
                    }
                  } catch (e) {
                    alert(`❌ ${(e as Error).message}`);
                  } finally {
                    setBulkRunning(false);
                  }
                }}
                disabled={bulkRunning}
                className="text-xs font-bold px-3 py-2.5 border-2 border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors whitespace-nowrap disabled:opacity-50"
                style={{ borderRadius: 0 }}
                title="Genera draft Gmail a Yohanna con TODOS los candidatos en Recruiter Interview · incluye CV, LinkedIn, contacto y prefilter. Si tenés una vacante filtrada, solo manda los de esa vacante."
              >
                📋 Exportar a Yohanna
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (bulkRunning) return;
                  const queueCount = filtered.filter(c => (c.stage || "aplico") === "bateria_psicometrica").length;
                  if (queueCount === 0) {
                    alert("No hay candidatos en cola de Pruebas Psicométricas.");
                    return;
                  }
                  const vacancyParam = vacFilter !== "all" ? vacFilter : null;
                  const msg = `Enviar batch a Mary con ${queueCount} candidato${queueCount > 1 ? "s" : ""} en cola? Se generará UN draft consolidado y se moverán todos a "Solicitud a HR Specialist".`;
                  if (!confirm(msg)) return;
                  setBulkRunning(true);
                  try {
                    const r = await fetch(`/api/admin/send-batch-to-mary`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ vacancy_id: vacancyParam }),
                    });
                    const j = await r.json();
                    if (j.success) {
                      alert(`✅ Draft consolidado listo en Gmail · ${j.candidates_count} candidatos\n\nTo: ${j.to}\n${j.moved_count} candidatos movidos a "Solicitud a HR Specialist".\n\nRevisa el draft y envíalo.`);
                      await load(); // refresca el funnel
                    } else {
                      alert(`❌ ${j.error || "Error generando draft"}`);
                    }
                  } catch (e) {
                    alert(`❌ ${(e as Error).message}`);
                  } finally {
                    setBulkRunning(false);
                  }
                }}
                disabled={bulkRunning}
                className="text-xs font-bold px-3 py-2.5 border-2 border-emerald-400 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 transition-colors whitespace-nowrap disabled:opacity-50"
                style={{ borderRadius: 0 }}
                title="Crea UN draft consolidado a Mary con todos los candidatos en cola de Pruebas Psicométricas · los mueve a 'Solicitud a HR Specialist' · se usa 2x/día (mañana/tarde)"
              >
                📨 Batch a Mary
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 ts-eyebrow text-[var(--ts-gray-40)]">Cargando pipeline…</div>
      ) : (
        <>
          {/* ════════════════ LEYENDA DE OWNERS ════════════════ */}
          <div className="flex items-center gap-5 mb-3 pb-3 border-b border-[var(--ts-gray-10)]">
            <div className="ts-eyebrow text-[10px]">¿De quién depende?</div>
            <LegendItem icon={User} label="Candidato" color={OWNER_STYLE.candidate.barColor} />
            <LegendItem icon={UserCheck} label="Reclutador" color={OWNER_STYLE.recruiter.barColor} />
            <LegendItem icon={Users} label="Compartido" color={OWNER_STYLE.shared.barColor} />
            <div className="text-[11px] text-[var(--ts-gray-40)] ml-auto italic">
              La barra superior de cada columna indica quién mueve la pelota.
            </div>
          </div>

          {/* ════════════════ KANBAN FUNNEL ════════════════ */}
          <div className="overflow-x-auto pb-4 -mx-6 px-6">
            <div className="flex gap-2 min-w-max">
              {visibleStages.map((stage) => {
                const cands = byStage[stage.id] || [];
                const stageSelected = cands.filter(c => selectedIds.has(c.id)).length;
                const style = CATEGORY_STYLE[stage.category];
                const ownerStyle = OWNER_STYLE[stage.owner];
                const OwnerIcon = stage.owner === 'candidate' ? User : stage.owner === 'recruiter' ? UserCheck : stage.owner === 'shared' ? Users : null;
                return (
                  <div key={stage.id} className="w-[260px] flex-shrink-0">
                    {/* Owner bar · indica de quién depende mover este stage */}
                    <div
                      className="h-[5px] flex items-center"
                      style={{ background: ownerStyle.barColor }}
                      title={`Depende de: ${ownerStyle.label}`}
                    />
                    {/* Column header · negro editorial con accent bar lateral */}
                    <div
                      className="px-3.5 py-3 relative"
                      style={{
                        background: style.headerBg,
                        color: style.headerText,
                        borderLeft: `3px solid ${style.accentBar}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <StageIcon stage={stage.id} className="w-3.5 h-3.5 opacity-70 flex-shrink-0" />
                          {OwnerIcon && (
                            <OwnerIcon
                              className="w-3 h-3 opacity-60"
                              aria-label={`Depende de: ${ownerStyle.label}`}
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {cands.length > 0 && (
                            <button
                              onClick={() => stageSelected === cands.length ? cands.forEach(c => toggleSelect(c.id)) : selectAllInStage(stage.id)}
                              className="text-[9px] font-bold uppercase tracking-wider opacity-50 hover:opacity-100 transition-opacity"
                              title={stageSelected === cands.length ? "Deseleccionar" : "Seleccionar todos"}
                            >
                              {stageSelected === cands.length ? "−" : "+"}
                            </button>
                          )}
                          <span className="text-[18px] font-extrabold ts-tabular leading-none" style={{ letterSpacing: '-0.04em' }}>
                            {cands.length}
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-[1.8px] leading-tight">
                        {stage.label}
                      </div>
                      <div
                        className="text-[9px] uppercase tracking-[1.5px] mt-1.5 opacity-60"
                        style={{ color: style.headerText }}
                      >
                        {ownerStyle.label}
                      </div>
                    </div>
                    {/* Column body */}
                    <div
                      className="border-l border-r border-b border-[var(--ts-gray-10)] p-2 min-h-[120px] max-h-[600px] overflow-y-auto"
                      style={{ background: style.columnBg }}
                    >
                      {cands.length === 0 ? (
                        <div className="ts-eyebrow text-[9px] text-[var(--ts-gray-40)] text-center py-6">
                          Sin candidatos
                        </div>
                      ) : cands.map(c => {
                        const isSelected = selectedIds.has(c.id);
                        return (
                          <div
                            key={c.id}
                            className={`relative bg-white border p-3 mb-2 transition-all ${
                              isSelected
                                ? "border-[var(--ts-black)] shadow-sm"
                                : "border-[var(--ts-gray-10)] hover:border-[var(--ts-gray-60)]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => { e.stopPropagation(); toggleSelect(c.id); }}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute top-2.5 right-2.5 w-3.5 h-3.5 cursor-pointer accent-[var(--ts-black)]"
                              title="Seleccionar para acción masiva"
                            />
                            <button onClick={() => setSelectedCand(c)} className="w-full text-left pr-5">
                              <div className="text-[14px] font-bold leading-tight text-[var(--ts-black)]" style={{ letterSpacing: '-0.01em' }}>
                                {c.name}
                              </div>
                              <div className="text-[11px] text-[var(--ts-gray-60)] truncate mt-1 ts-tabular">
                                {c.email}
                              </div>
                              <div className="mt-2 inline-block ts-eyebrow text-[9px] tracking-[1.5px] text-[var(--ts-gray-90)] border border-[var(--ts-gray-20)] px-1.5 py-0.5">
                                {c.ht_vacancies?.title || "—"}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ════════════════ TERMINAL FOOTER · contratados + rechazados ════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--ts-gray-20)] mt-6 border border-[var(--ts-gray-20)]">
            <ContractedColumn
              cands={byStage['contratado'] || []}
              selectedIds={selectedIds}
              onToggle={toggleSelect}
              onSelect={setSelectedCand}
            />
            <RejectedColumn
              cands={byStage['rechazado'] || []}
              selectedIds={selectedIds}
              onToggle={toggleSelect}
              onSelect={setSelectedCand}
            />
          </div>

          {/* Bulk action bar — floating bottom */}
          {selectedIds.size > 0 && (
            <BulkActionBar
              selectedCands={candidates.filter(c => selectedIds.has(c.id))}
              onClear={clearSelection}
              onActionComplete={() => { clearSelection(); load(); }}
              running={bulkRunning}
              setRunning={setBulkRunning}
              progress={bulkProgress}
              setProgress={setBulkProgress}
            />
          )}

          {/* Rechazados — colapsable + búsqueda + agrupado por vacante */}
          <RejectedSection
            cands={byStage[REJECTED_STAGE.id] || []}
            onSelect={setSelectedCand}
          />
          {/* end rechazados */}
        </>
      )}

      {/* Side panel con detalles del candidato */}
      {selectedCand && <CandDetailPanel cand={selectedCand} onClose={() => setSelectedCand(null)} onChanged={() => { void load(); }} />}
    </div>
  );
}

// Mapa de transiciones naturales (avanzar al siguiente stage)
// 2026-05-12 v3: Pipeline final · 3 entrevistas → psico (con Mary, batch 2x/día) → Turing → terna → oferta → contratado → onboarding
const NEXT_STAGE: Record<string, { id: string; label: string; emoji: string }> = {
  aplico: { id: "prefiltro_enviado", label: "Enviar prefiltro", emoji: "📋" },
  prefiltro_pasado: { id: "recruiter_interview", label: "Pasar a Entrevista Recruiter", emoji: "💬" },
  prefiltro_revision: { id: "recruiter_interview", label: "Pasar a Entrevista Recruiter (override)", emoji: "💬" },
  // Legacy · candidatos que ya estaban en Elevare/IA salen igual a recruiter_interview
  assessment_completado: { id: "recruiter_interview", label: "Pasar a Entrevista Recruiter", emoji: "💬" },
  entrevista_ia: { id: "recruiter_interview", label: "Pasar a Entrevista Recruiter", emoji: "💬" },
  // 3 rondas de entrevista en secuencia
  recruiter_interview: { id: "hiring_lead_interview", label: "Pasar a Entrevista Hiring Lead", emoji: "👤" },
  hiring_lead_interview: { id: "cwo_interview", label: "Pasar a CWO + Hiring Manager", emoji: "👔" },
  // Post 3-rondas · cola de Pruebas Psicométricas (Mary aplica en batch 2x/día)
  cwo_interview: { id: "bateria_psicometrica", label: "Pasar a cola Pruebas Psicométricas", emoji: "🧪" },
  // Batch enviado a Mary · ella mueve a Touring (o rechaza)
  bateria_psicometrica: { id: "solicitud_enviada_mary", label: "Enviar solicitud a HR Specialist", emoji: "📨" },
  solicitud_enviada_mary: { id: "touring", label: "Pasar a Máquina de Turing", emoji: "🧮" },
  // Final
  touring: { id: "terna", label: "Pasar a Terna", emoji: "🏆" },
  terna: { id: "oferta", label: "Pasar a Oferta", emoji: "📨" },
  oferta: { id: "contratado", label: "Marcar Contratado", emoji: "🎉" },
  contratado: { id: "onboarding", label: "Iniciar Onboarding", emoji: "🚀" },
};

// ─── Rechazados · sección rediseñada (colapsable + búsqueda + grupos) ─
function RejectedSection({
  cands, onSelect,
}: {
  cands: Cand[];
  onSelect: (c: Cand) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");

  // Filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cands;
    return cands.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.ht_vacancies?.title || "").toLowerCase().includes(q)
    );
  }, [cands, search]);

  // Group by vacancy
  const groups = useMemo(() => {
    const m: Record<string, Cand[]> = {};
    filtered.forEach(c => {
      const key = c.ht_vacancies?.title || "Sin vacante";
      if (!m[key]) m[key] = [];
      m[key].push(c);
    });
    // Sort groups by size desc
    return Object.entries(m).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  if (cands.length === 0) {
    return (
      <div className="mt-6 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
        <span className="text-xs text-gray-400 italic">Sin rechazos por ahora.</span>
      </div>
    );
  }

  return (
    <div className="mt-6 border border-red-200 rounded-xl bg-red-50/30 overflow-hidden">
      {/* Header bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-red-100/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">❌</span>
          <span className="text-sm font-bold uppercase tracking-wide text-red-700">Rechazados</span>
          <span className="text-xs font-bold bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
            {cands.length}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-red-700">
          {!expanded && (
            <span className="text-[10px] text-gray-500 italic">click para expandir</span>
          )}
          <span className="font-bold">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-red-200 bg-white px-4 py-3">
          {/* Search */}
          <div className="mb-3 flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Buscar por nombre, email, vacante…"
              className="flex-1 text-xs border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-xs text-gray-500 hover:text-black px-2"
              >
                ✕
              </button>
            )}
            <span className="text-[11px] text-gray-500 whitespace-nowrap">
              {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}
            </span>
          </div>

          {/* Groups */}
          {groups.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-4">Sin coincidencias.</p>
          ) : (
            <div className="space-y-3">
              {groups.map(([vacancy, list]) => (
                <details key={vacancy} open={groups.length <= 2 || !!search}>
                  <summary className="text-[11px] uppercase font-bold text-gray-600 cursor-pointer mb-1.5 hover:text-red-700 select-none">
                    {vacancy}{" "}
                    <span className="font-normal text-gray-400">·</span>{" "}
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">{list.length}</span>
                  </summary>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-1.5 ml-1">
                    {list.map(c => (
                      <button
                        key={c.id}
                        onClick={() => onSelect(c)}
                        className="text-left bg-white hover:bg-red-50 border border-red-100 rounded-md px-2 py-1.5 transition-colors group"
                        title={c.email}
                      >
                        <div className="text-[11px] font-semibold text-gray-800 truncate group-hover:text-red-900">
                          {c.name}
                        </div>
                        <div className="text-[9px] text-gray-400 truncate group-hover:text-red-600">
                          {c.email}
                        </div>
                      </button>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Floating bulk action bar ─────────────────────────────────────
function BulkActionBar({
  selectedCands, onClear, onActionComplete,
  running, setRunning, progress, setProgress,
}: {
  selectedCands: Cand[];
  onClear: () => void;
  onActionComplete: () => void;
  running: boolean;
  setRunning: (v: boolean) => void;
  progress: { done: number; total: number; ok: number; fail: number } | null;
  setProgress: (p: { done: number; total: number; ok: number; fail: number } | null) => void;
}) {
  const n = selectedCands.length;
  if (n === 0) return null;

  // Detect dominant stage for contextual actions
  const stageCounts: Record<string, number> = {};
  selectedCands.forEach(c => { const s = c.stage || "aplico"; stageCounts[s] = (stageCounts[s] || 0) + 1; });
  const dominantStage = Object.entries(stageCounts).sort((a, b) => b[1] - a[1])[0][0];
  const allSameStage = Object.keys(stageCounts).length === 1;

  const stageActions: Record<string, { label: string; emoji: string; endpoint: (id: string) => string; method: "POST" }> = {
    aplico: { label: "Enviar prefiltro", emoji: "📋", endpoint: (id) => `/api/headhunting/candidates/${id}/send-prefilter`, method: "POST" },
    // 2026-05-12 v3: post-prefiltro va directo a Recruiter Interview
    prefiltro_pasado: { label: "Pasar a Entrevista Recruiter", emoji: "💬", endpoint: (id) => `/api/headhunting/candidates/${id}/stage`, method: "POST" },
    prefiltro_revision: { label: "Pasar a Entrevista Recruiter (override)", emoji: "💬", endpoint: (id) => `/api/headhunting/candidates/${id}/stage`, method: "POST" },
    // Legacy · candidatos ya en Elevare/IA salen igual a Recruiter Interview
    assessment_completado: { label: "Pasar a Entrevista Recruiter", emoji: "💬", endpoint: (id) => `/api/headhunting/candidates/${id}/stage`, method: "POST" },
    entrevista_ia: { label: "Pasar a Entrevista Recruiter", emoji: "💬", endpoint: (id) => `/api/headhunting/candidates/${id}/stage`, method: "POST" },
    // 3 rondas de entrevista en secuencia
    recruiter_interview: { label: "Pasar a Hiring Lead", emoji: "👤", endpoint: (id) => `/api/headhunting/candidates/${id}/stage`, method: "POST" },
    hiring_lead_interview: { label: "Pasar a CWO + Hiring Manager", emoji: "👔", endpoint: (id) => `/api/headhunting/candidates/${id}/stage`, method: "POST" },
    cwo_interview: { label: "Pasar a Pruebas Psicométricas", emoji: "🧪", endpoint: (id) => `/api/headhunting/candidates/${id}/stage`, method: "POST" },
    // Mary terminó pruebas · pasar a Máquina de Turing
    solicitud_enviada_mary: { label: "Pasar a Máquina de Turing", emoji: "🧮", endpoint: (id) => `/api/headhunting/candidates/${id}/stage`, method: "POST" },
    touring: { label: "Pasar a Terna", emoji: "🏆", endpoint: (id) => `/api/headhunting/candidates/${id}/stage`, method: "POST" },
    rechazado: { label: "Enviar encuesta NPS", emoji: "📊", endpoint: (id) => `/api/headhunting/candidates/${id}/send-experience-survey?send=true`, method: "POST" },
    contratado: { label: "Iniciar onboarding", emoji: "🚀", endpoint: (id) => `/api/headhunting/candidates/${id}/stage`, method: "POST" },
  };
  const stageAction = allSameStage ? stageActions[dominantStage] : null;

  async function runBulk(action: "stage_action" | "advance" | "reject") {
    if (running) return;
    if (!confirm(`Aplicar acción a ${n} candidatos seleccionados? Se crearán drafts en tu Gmail (revisar antes de enviar).`)) return;
    setRunning(true);
    setProgress({ done: 0, total: n, ok: 0, fail: 0 });
    let ok = 0, fail = 0;

    for (let i = 0; i < selectedCands.length; i++) {
      const c = selectedCands[i];
      try {
        let url = "";
        let body: object | null = null;
        if (action === "stage_action" && stageAction) {
          url = stageAction.endpoint(c.id);
          // For stage transitions: incluir el target stage en el body
          // 2026-05-12 v3 · pipeline: Prefiltro → Recruiter → Hiring Lead → CWO+HM → Pruebas Psicométricas → Solicitud Mary → Turing → Terna
          if (dominantStage === "prefiltro_pasado" || dominantStage === "prefiltro_revision") {
            body = { stage: "recruiter_interview" };
          } else if (
            dominantStage === "assessment_completado" ||
            dominantStage === "entrevista_ia"
          ) {
            // Legacy · siguen a recruiter_interview
            body = { stage: "recruiter_interview" };
          } else if (dominantStage === "recruiter_interview") {
            body = { stage: "hiring_lead_interview" };
          } else if (dominantStage === "hiring_lead_interview") {
            body = { stage: "cwo_interview" };
          } else if (dominantStage === "cwo_interview") {
            body = { stage: "bateria_psicometrica" };
          } else if (dominantStage === "solicitud_enviada_mary") {
            body = { stage: "touring" };
          } else if (dominantStage === "touring") {
            body = { stage: "terna" };
          } else if (dominantStage === "contratado") {
            body = { stage: "onboarding" };
          }
        } else if (action === "advance") {
          const next = NEXT_STAGE[c.stage || "aplico"];
          if (!next) { fail++; setProgress({ done: i + 1, total: n, ok, fail }); continue; }
          url = `/api/headhunting/candidates/${c.id}/stage`;
          body = { stage: next.id };
        } else if (action === "reject") {
          url = `/api/headhunting/candidates/${c.id}/stage`;
          body = { stage: "rechazado" };
        }
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
        });
        if (r.ok) ok++; else fail++;
      } catch { fail++; }
      setProgress({ done: i + 1, total: n, ok, fail });
    }

    setRunning(false);
    setTimeout(() => {
      setProgress(null);
      onActionComplete();
    }, 2500);
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-black text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 max-w-3xl">
      <div className="flex items-center gap-2">
        <span className="bg-purple-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center">{n}</span>
        <span className="text-xs font-semibold">seleccionado{n > 1 ? "s" : ""}</span>
        {!allSameStage && (
          <span className="text-[10px] bg-amber-500/30 text-amber-100 px-2 py-0.5 rounded">⚠️ etapas mixtas</span>
        )}
      </div>

      {progress && (
        <div className="text-xs flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
          <span>{progress.done}/{progress.total}</span>
          {progress.ok > 0 && <span className="text-emerald-400">✓ {progress.ok}</span>}
          {progress.fail > 0 && <span className="text-red-400">✗ {progress.fail}</span>}
        </div>
      )}

      {!running && (
        <>
          {stageAction && allSameStage && (
            <button
              onClick={() => runBulk("stage_action")}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-pink-600 hover:bg-pink-700 inline-flex items-center gap-1.5"
              title={`${stageAction.label} a los ${n} seleccionados`}
            >
              <span>{stageAction.label}</span>
              <span className="text-[10px] opacity-80 tabular-nums">({n})</span>
            </button>
          )}
          <button
            onClick={() => runBulk("advance")}
            className="text-xs font-bold px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700"
            title="Avanzar cada uno a su siguiente etapa"
          >
            → Avanzar etapa
          </button>
          <button
            onClick={() => runBulk("reject")}
            className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700"
          >
            ❌ Rechazar
          </button>
          <button
            onClick={onClear}
            className="text-xs px-2 py-1.5 text-gray-300 hover:text-white"
          >
            Limpiar
          </button>
        </>
      )}
    </div>
  );
}

// ─── Terminal footer columns · contratados + rechazados ──────────
function ContractedColumn({
  cands,
  selectedIds,
  onToggle,
  onSelect,
}: {
  cands: Cand[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (c: Cand) => void;
}) {
  return (
    <div className="bg-white p-5">
      <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-[var(--ts-gray-10)]">
        <div className="flex items-baseline gap-3">
          <CheckCircle2 className="w-4 h-4 text-[var(--ts-green)] flex-shrink-0 self-center" />
          <div className="ts-eyebrow text-[var(--ts-green)]">Contratados</div>
        </div>
        <div className="text-[28px] font-extrabold ts-tabular text-[var(--ts-green)]" style={{ letterSpacing: '-0.04em' }}>
          {cands.length}
        </div>
      </div>
      {cands.length === 0 ? (
        <div className="ts-eyebrow text-[10px] text-[var(--ts-gray-40)] py-4">Sin contrataciones aún</div>
      ) : (
        <div className="space-y-2">
          {cands.map(c => {
            const isSelected = selectedIds.has(c.id);
            return (
              <div
                key={c.id}
                className={`relative bg-white border p-3 transition-all ${isSelected ? 'border-[var(--ts-black)]' : 'border-[var(--ts-green-border)] hover:border-[var(--ts-green)]'}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(c.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2.5 right-2.5 w-3.5 h-3.5 cursor-pointer accent-[var(--ts-black)]"
                />
                <button onClick={() => onSelect(c)} className="w-full text-left pr-5">
                  <div className="text-[14px] font-bold text-[var(--ts-black)] leading-tight" style={{ letterSpacing: '-0.01em' }}>
                    {c.name}
                  </div>
                  <div className="text-[11px] text-[var(--ts-gray-60)] mt-1">{c.ht_vacancies?.title || '—'}</div>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Etiquetas cortas por category_key para badges en cards
const REJECTION_CATEGORY_SHORT: Record<string, string> = {
  experiencia_insuficiente: "Experiencia",
  match_cultural: "Cultural",
  pretension_salarial: "Salario",
  disponibilidad_movilidad: "Disponibilidad",
  resultado_evaluacion: "Evaluación",
  comunicacion_proceso: "Comunicación",
  decision_candidato: "Decisión cand",
};

function RejectedColumn({
  cands,
  selectedIds,
  onToggle,
  onSelect,
}: {
  cands: Cand[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (c: Cand) => void;
}) {
  // Filtro por categoría · solo los rechazos clasificados
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Agrupar por categoría para los chips
  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    cands.forEach(c => {
      const k = c.rejection_category || "sin_clasificar";
      map[k] = (map[k] || 0) + 1;
    });
    return map;
  }, [cands]);

  const visibleCands = useMemo(() => {
    return cands.filter(c => {
      if (showSavedOnly && !c.rejection_save_for_future) return false;
      if (categoryFilter === "all") return true;
      if (categoryFilter === "sin_clasificar") return !c.rejection_category;
      return c.rejection_category === categoryFilter;
    });
  }, [cands, categoryFilter, showSavedOnly]);

  const savedCount = cands.filter(c => c.rejection_save_for_future).length;

  return (
    <div className="bg-white p-5">
      <div className="flex items-baseline justify-between mb-3 pb-3 border-b border-[var(--ts-gray-10)]">
        <div className="flex items-baseline gap-3">
          <XCircle className="w-4 h-4 text-[var(--ts-red)] flex-shrink-0 self-center" />
          <div className="ts-eyebrow text-[var(--ts-red)]">Rechazados</div>
        </div>
        <div className="text-[28px] font-extrabold ts-tabular text-[var(--ts-red)]" style={{ letterSpacing: '-0.04em' }}>
          {visibleCands.length}<span className="text-[14px] text-[var(--ts-gray-40)]">/{cands.length}</span>
        </div>
      </div>

      {/* Filtros · categoría + saved for future */}
      {cands.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`text-[10px] uppercase tracking-[1px] px-2 py-1 border ${categoryFilter === "all" ? "border-[var(--ts-black)] bg-[var(--ts-black)] text-white" : "border-[var(--ts-gray-10)] text-[var(--ts-gray-60)] hover:border-[var(--ts-gray-40)]"}`}
          >
            Todos
          </button>
          {Object.entries(byCategory).map(([key, count]) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              className={`text-[10px] uppercase tracking-[1px] px-2 py-1 border ${categoryFilter === key ? "border-[var(--ts-black)] bg-[var(--ts-black)] text-white" : "border-[var(--ts-gray-10)] text-[var(--ts-gray-60)] hover:border-[var(--ts-gray-40)]"}`}
            >
              {REJECTION_CATEGORY_SHORT[key] || key} · {count}
            </button>
          ))}
          {savedCount > 0 && (
            <button
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className={`text-[10px] uppercase tracking-[1px] px-2 py-1 border ${showSavedOnly ? "border-[var(--ts-green)] bg-[var(--ts-green)] text-white" : "border-[var(--ts-green-border,#bce3c5)] text-[var(--ts-green)] hover:border-[var(--ts-green)]"}`}
              title="CV Bank · perfiles guardados para futuras búsquedas"
            >
              ★ Saved · {savedCount}
            </button>
          )}
        </div>
      )}

      {visibleCands.length === 0 ? (
        <div className="ts-eyebrow text-[10px] text-[var(--ts-gray-40)] py-4">
          {cands.length === 0 ? "Sin rechazos" : "Sin coincidencias con el filtro"}
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
          {visibleCands.map(c => {
            const isSelected = selectedIds.has(c.id);
            const catShort = c.rejection_category ? REJECTION_CATEGORY_SHORT[c.rejection_category] : null;
            return (
              <div
                key={c.id}
                className={`relative bg-white border p-2.5 transition-all ${isSelected ? 'border-[var(--ts-black)]' : 'border-[var(--ts-red-border)] hover:border-[var(--ts-red)]'}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(c.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2 right-2 w-3.5 h-3.5 cursor-pointer accent-[var(--ts-black)]"
                />
                <button onClick={() => onSelect(c)} className="w-full text-left pr-5">
                  <div className="text-[13px] font-semibold text-[var(--ts-gray-90)] leading-tight">
                    {c.name}
                    {c.rejection_save_for_future && (
                      <span className="ml-1.5 text-[var(--ts-green)]" title="Guardado para CV Bank">★</span>
                    )}
                  </div>
                  <div className="text-[10px] text-[var(--ts-gray-60)] mt-0.5">{c.ht_vacancies?.title || '—'}</div>
                  {catShort && (
                    <div className="text-[9px] uppercase tracking-[1px] text-[var(--ts-red)] mt-1 font-bold">
                      {catShort}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Side panel con detalle + respuestas del prefiltro ──────────────
function CandDetailPanel({ cand, onClose, onChanged }: { cand: Cand; onClose: () => void; onChanged?: () => void }) {
  const pf = cand.prefilter_data;
  const decision = cand.prefilter_decision;
  const decisionBadge = decision === "pass" ? { label: "✅ PASS", color: "#10B981" }
    : decision === "review" ? { label: "⚠️ REVIEW", color: "#F59E0B" }
    : decision === "reject" ? { label: "❌ REJECT", color: "#EF4444" }
    : null;

  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showJointScheduling, setShowJointScheduling] = useState(false);
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
        // Re-fetch sin reload: preserva filtro de vacante
        setTimeout(() => {
          onChanged?.();
          onClose();
        }, 1000);
      } else {
        setFeedback(`❌ ${j.error || "Error"}`);
      }
    } catch (e) {
      setFeedback(`❌ ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  function reject() {
    // Abre el modal con clasificación obligatoria · ya no usamos confirm() ni el path legacy
    setShowRejectModal(true);
  }

  return (
    <>
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
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center gap-2 flex-wrap">
          {!isTerminal && nextStage && (
            <button
              onClick={() => moveToStage(nextStage.id, nextStage.label)}
              disabled={busy}
              className="text-xs font-semibold px-4 py-2 rounded-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <span>{nextStage.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Move to ANY stage dropdown */}
          <select
            value=""
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              const s = [...STAGES, REJECTED_STAGE].find(x => x.id === v);
              if (s) moveToStage(s.id, `Movido a ${s.label}`);
              e.target.value = "";
            }}
            disabled={busy}
            className="text-xs font-semibold px-3 py-2 rounded-full border-2 border-purple-300 text-purple-800 bg-white hover:bg-purple-50 disabled:opacity-50 cursor-pointer"
            title="Mover a cualquier etapa (salta el flujo lineal)"
          >
            <option value="">Mover a etapa…</option>
            {STAGES.filter(s => s.id !== currentStage).map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
            <option disabled>──────────</option>
            <option value={REJECTED_STAGE.id}>{REJECTED_STAGE.label}</option>
          </select>

          {!isTerminal && (
            <button
              onClick={async () => {
                if (busy) return;
                setBusy(true);
                setFeedback("Generando Calendly…");
                try {
                  const r = await fetch(`/api/admin/candidates/${cand.id}/send-calendly`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                  });
                  const j = await r.json();
                  if (j.success) {
                    setFeedback("✅ Draft Gmail listo · WhatsApp link copiado");
                    if (j.wa_link) {
                      try { await navigator.clipboard.writeText(j.wa_link); } catch {}
                    }
                    setTimeout(() => setFeedback(""), 4000);
                  } else {
                    setFeedback(`❌ ${j.error || "Error"}`);
                  }
                } catch (e) {
                  setFeedback(`❌ ${(e as Error).message}`);
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
              className="text-xs font-bold px-4 py-2 rounded-full border-2 border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
              title="Genera draft Gmail con link Calendly + copia link WhatsApp al portapapeles"
            >
              📅 Enviar Calendly
            </button>
          )}

          {!isTerminal && currentStage === "cwo_interview" && (
            <button
              onClick={async () => {
                if (busy) return;
                setBusy(true);
                setFeedback("Generando draft para Mary…");
                try {
                  const r = await fetch(`/api/admin/candidates/${cand.id}/send-to-mary-psico`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                  });
                  const j = await r.json();
                  if (j.success) {
                    // Mueve a Pruebas Psicométricas (cola) · el batch a Mary se dispara aparte
                    await moveToStage("bateria_psicometrica", "Pasó las 3 entrevistas · va a Pruebas Psicométricas");
                    setFeedback("✅ Draft individual para Mary listo · candidato en Pruebas Psicométricas");
                    setTimeout(() => setFeedback(""), 4000);
                  } else {
                    setFeedback(`❌ ${j.error || "Error"}`);
                  }
                } catch (e) {
                  setFeedback(`❌ ${(e as Error).message}`);
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
              className="text-xs font-bold px-4 py-2 rounded-full border-2 border-emerald-400 text-emerald-800 bg-white hover:bg-emerald-50 disabled:opacity-50"
              title="Pasó las 3 entrevistas · genera draft Gmail individual a Mary Banquez y mueve a cola de Pruebas Psicométricas. (El batch 2x/día se hace desde la columna Pruebas Psicométricas)"
            >
              🧪 Pasar a Pruebas · Mary
            </button>
          )}

          {/* Botón "Agendar conjunta" oculto · usar "Enviar Calendly" que ya dispara
              el Calendly Collective (Kelly + Yohanna) para la vacante TAL.
              El código backend del joint-scheduling sigue disponible si el sucesor
              quiere arreglar bugs de TZ/almuerzo y revivirlo. */}
          {false && !isTerminal && (
            <button
              onClick={() => setShowJointScheduling(true)}
              disabled={busy}
              className="text-xs font-bold px-4 py-2 rounded-full border-2 border-purple-300 text-purple-700 hover:bg-purple-50 disabled:opacity-50"
              title="Agendar entrevista conjunta con varios entrevistadores (CWO + Hiring Manager) · sin Calendly"
            >
              📅 Agendar conjunta
            </button>
          )}

          {!isTerminal && (
            <button
              onClick={reject}
              disabled={busy}
              className="text-xs font-bold px-4 py-2 rounded-full border-2 border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
              title="Clasificá el motivo + edita el mensaje al candidato"
            >
              ❌ Rechazar con motivo
            </button>
          )}

          {isTerminal && (
            <span className="text-xs text-gray-500 italic">
              {currentStage === "rechazado" ? "❌ Etapa terminal — usa dropdown para reactivar" : "🎉 Contratado — usa dropdown si necesitas mover"}
            </span>
          )}

          {feedback && (
            <span className="text-xs ml-auto text-gray-700">{feedback}</span>
          )}
        </div>

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
            <Row k="Status Integridad" v={cand.status} />
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

          {/* Motivo de rechazo · solo si ya está clasificado */}
          {cand.stage === "rechazado" && cand.rejection_category && (
            <RejectionDetailBlock cand={cand} />
          )}

          {/* Elevare results — solo si ya hizo el assessment */}
          {(cand.status === "completed" || cand.status === "in_progress" ||
            String(cand.stage || "").startsWith("assessment_")) && (
            <ElevareResultsBlock candidateId={cand.id} candidateStatus={cand.status} />
          )}

          {/* Entrevista IA — disponible desde assessment_completado en adelante */}
          {(cand.status === "completed" ||
            ["assessment_completado","entrevista_ia","recruiter_interview"].includes(String(cand.stage || ""))) && (
            <AIInterviewBlock candidateId={cand.id} candidateEmail={cand.email} />
          )}

          {/* Recruiter Assessment · 16 mandatos del CEO · visible desde recruiter_interview en adelante */}
          {["recruiter_interview","cwo_interview","touring","terna","oferta","contratado","rechazado"].includes(String(cand.stage || "")) && (
            <RecruiterAssessmentCard candidateId={cand.id} candidateName={cand.name || ""} stage="recruiter_interview" />
          )}

          {/* CWO Assessment · 16 mandatos del CEO desde el lente de la CWO · visible desde cwo_interview en adelante */}
          {["cwo_interview","touring","terna","oferta","contratado","rechazado"].includes(String(cand.stage || "")) && (
            <RecruiterAssessmentCard candidateId={cand.id} candidateName={cand.name || ""} stage="cwo_interview" />
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

    {showRejectModal && (
      <RejectionModal
        candidateId={cand.id}
        candidateName={cand.name}
        vacancyTitle={cand.ht_vacancies?.title || "la posición"}
        onClose={() => setShowRejectModal(false)}
        onRejected={() => {
          setShowRejectModal(false);
          setFeedback("✅ Rechazado · clasificado · draft listo en Gmail");
          setTimeout(() => {
            onChanged?.();
            onClose();
          }, 1200);
        }}
      />
    )}

    {showJointScheduling && (
      <JointSchedulingModal
        candidateId={cand.id}
        candidateName={cand.name || ""}
        candidateEmail={cand.email || ""}
        vacancyTitle={cand.ht_vacancies?.title || "la posición"}
        onClose={() => setShowJointScheduling(false)}
        onCreated={() => setFeedback("✅ Sesión de agendamiento conjunto creada · revisa el link en el modal")}
      />
    )}
    </>
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

// ─── Bloque de motivo de rechazo · pull lazy del catálogo para mostrar labels humanos
function RejectionDetailBlock({ cand }: { cand: Cand }) {
  const [catalog, setCatalog] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/rejection-categories")
      .then(r => r.json())
      .then(j => setCatalog(j.categories || []))
      .catch(() => {});
  }, []);

  const cat = catalog.find((c: any) => c.category_key === cand.rejection_category);
  const subDetail = cat?.sub_details?.find((sd: any) => sd.key === cand.rejection_sub_detail);

  return (
    <div className="border border-[var(--ts-red-border,#fbcfcf)] bg-[var(--ts-red-bg,#fff5f5)] p-4">
      <h3 className="text-[11px] uppercase tracking-[1.5px] font-bold text-[var(--ts-red)] mb-3">
        Motivo de rechazo
      </h3>
      <div className="space-y-2 text-[13px]">
        <div>
          <div className="text-[10px] uppercase tracking-[1px] text-[var(--ts-gray-60)]">Categoría</div>
          <div className="font-semibold text-[var(--ts-black)]">
            {cat?.category_label || cand.rejection_category}
          </div>
        </div>
        {subDetail && (
          <div>
            <div className="text-[10px] uppercase tracking-[1px] text-[var(--ts-gray-60)]">Detalle</div>
            <div className="font-semibold text-[var(--ts-black)]">{subDetail.label}</div>
          </div>
        )}
        {(cand as any).rejection_note_private && (
          <div>
            <div className="text-[10px] uppercase tracking-[1px] text-[var(--ts-gray-60)]">Nota privada · interna</div>
            <div className="text-[var(--ts-gray-90)] italic leading-relaxed">
              {(cand as any).rejection_note_private}
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 pt-2 border-t border-[var(--ts-red-border,#fbcfcf)]">
          {cand.rejection_save_for_future ? (
            <span className="text-[11px] font-semibold text-[var(--ts-green)]">★ Guardado en CV Bank</span>
          ) : (
            <span className="text-[11px] text-[var(--ts-gray-60)]">Sin marcar para CV Bank</span>
          )}
          {cand.rejected_at && (
            <span className="text-[11px] text-[var(--ts-gray-60)] ml-auto">
              {new Date(cand.rejected_at).toLocaleDateString("es-CO")}
            </span>
          )}
        </div>
      </div>
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
function AIInterviewBlock({ candidateId, candidateEmail }: { candidateId: string; candidateEmail?: string }) {
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

          {/* Audio player con manejo de errores */}
          {interview.audio_url && (
            <RobustAudioPlayer
              audioUrl={interview.audio_url}
              candidateEmail={candidateEmail}
              label="🎧 Audio de la entrevista"
            />
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
      ) : interview && interview.status === "completed" && interview.conversation_id && interview.ai_score == null ? (
        <PendingScoringPanel interview={interview} onScored={() => load()} candidateEmail={candidateEmail} />
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

// ─── Botón inline para correr scoring AI de UNA entrevista pendiente ─
function PendingScoringPanel({ interview, onScored, candidateEmail }: { interview: any; onScored: () => void; candidateEmail?: string }) {
  const [running, setRunning] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [result, setResult] = React.useState<{ ok: boolean; message: string; score?: number; error_kind?: string } | null>(null);

  // Cronómetro mientras corre
  React.useEffect(() => {
    if (!running) { setElapsed(0); return; }
    const start = Date.now();
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [running]);

  const runScoring = async () => {
    setRunning(true);
    setResult(null);
    try {
      // Timeout 100s — un poco más que el del backend (90s) para no cortar antes
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 100_000);

      const r = await fetch('/api/admin/rescore-ai-interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interview_ids: [interview.id] }),
        signal: ctrl.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!r.ok) {
        setResult({ ok: false, message: `HTTP ${r.status}: el endpoint falló. Mirá logs de Vercel.` });
        return;
      }

      const j = await r.json();
      const myResult = j.results?.find((x: any) => x.interview_id === interview.id);
      if (myResult?.success) {
        setResult({ ok: true, message: `Score: ${myResult.score}/100`, score: myResult.score });
        setTimeout(() => onScored(), 800);
      } else {
        setResult({
          ok: false,
          message: myResult?.error || j.error || 'Error desconocido (sin detalle del backend)',
          error_kind: myResult?.error_kind,
        });
      }
    } catch (e: any) {
      const isAbort = e?.name === 'AbortError';
      setResult({
        ok: false,
        message: isAbort
          ? 'Timeout cliente (>100s). Probablemente Vercel cortó la conexión. Revisá logs.'
          : (e?.message || 'Error de red'),
        error_kind: isAbort ? 'timeout' : 'network',
      });
    } finally {
      setRunning(false);
    }
  };

  // Mensaje de ayuda según el tipo de error
  const errorHelp = (kind?: string): string | null => {
    if (kind === 'no_transcript') {
      return 'Solución: Click "Reenviar entrevista" para que el candidato la haga otra vez. ElevenLabs ya borró el audio/transcripción de la sesión anterior.';
    }
    if (kind === 'timeout') {
      return 'Solución: Reintentar (a veces Anthropic tarda más con transcripts largos). Si persiste, revisar logs en Vercel.';
    }
    return null;
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-xs text-amber-900">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="font-bold">✓ Entrevista completada</div>
          <div className="text-[11px] text-amber-700 mt-0.5">conversation_id ya capturado · falta correr scoring AI (~1 min)</div>
        </div>
      </div>
      {interview.audio_url && (
        <RobustAudioPlayer
          audioUrl={interview.audio_url}
          candidateEmail={candidateEmail}
          label="🎧 Audio disponible"
        />
      )}
      {result ? (
        <div className={`mt-2 p-2.5 rounded text-[11px] ${result.ok ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'}`}>
          <div className="font-bold">
            {result.ok ? `✅ Scoring completado · ${result.message} · refrescando…` : `❌ ${result.message}`}
          </div>
          {!result.ok && errorHelp(result.error_kind) && (
            <div className="mt-1.5 text-[10px] font-medium opacity-90">→ {errorHelp(result.error_kind)}</div>
          )}
          {!result.ok && (
            <button
              onClick={() => { setResult(null); }}
              className="mt-2 text-[10px] font-bold underline"
            >
              Reintentar
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={runScoring}
          disabled={running}
          className="w-full bg-black hover:bg-gray-800 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-full flex items-center justify-center gap-1.5"
        >
          {running ? `⏳ Corriendo 3 agentes Claude · ${elapsed}s/90s` : '🤖 Correr scoring AI ahora'}
        </button>
      )}
    </div>
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
      <Section title="🧠 Resultados Integridad">
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
    <Section title="🧠 Resultado prueba virtual">
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

/* ─── Robust Audio Player · maneja errores y diagnostica ────────── */
function RobustAudioPlayer({
  audioUrl,
  candidateEmail,
  label = '🎧 Audio de la entrevista',
}: {
  audioUrl: string;
  candidateEmail?: string;
  label?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagResult, setDiagResult] = useState<any>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const runDiagnosis = async () => {
    if (!candidateEmail) return;
    setDiagnosing(true);
    setDiagResult(null);
    try {
      const r = await fetch(`/api/admin/diag/audio?email=${encodeURIComponent(candidateEmail)}`, { cache: 'no-store' });
      const j = await r.json();
      setDiagResult(j);
    } catch (e: any) {
      setDiagResult({ error: e?.message || 'Error de red' });
    } finally {
      setDiagnosing(false);
    }
  };

  return (
    <div className="mb-3">
      <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">{label}</p>
      {!error ? (
        <audio
          key={reloadKey}
          src={audioUrl}
          controls
          className="w-full"
          preload="metadata"
          onError={(e) => {
            const target = e.currentTarget as HTMLAudioElement;
            const code = target.error?.code;
            const codeName = code === 1 ? 'MEDIA_ERR_ABORTED'
              : code === 2 ? 'MEDIA_ERR_NETWORK'
              : code === 3 ? 'MEDIA_ERR_DECODE'
              : code === 4 ? 'MEDIA_ERR_SRC_NOT_SUPPORTED'
              : 'desconocido';
            setError(codeName);
          }}
        />
      ) : (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-xs">
          <div className="font-bold text-red-900 mb-1">No se pudo cargar el audio</div>
          <div className="text-red-700 mb-2">Error: {error}. Causas comunes: el conversation_id de ElevenLabs ya no tiene audio guardado, o la API key cambió.</div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setError(null); setReloadKey(k => k + 1); }}
              className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white border border-gray-300 hover:border-black"
            >
              ↻ Reintentar
            </button>
            {candidateEmail && (
              <button
                onClick={runDiagnosis}
                disabled={diagnosing}
                className="text-[11px] font-semibold px-3 py-1 rounded-full bg-black text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {diagnosing ? 'Diagnosticando…' : '🔬 Diagnosticar'}
              </button>
            )}
          </div>
          {diagResult && (
            <div className="mt-2 p-2 bg-white border border-red-100 rounded text-[10px] font-mono whitespace-pre-wrap break-all">
              <div className="font-bold mb-1">Diagnóstico:</div>
              {diagResult.recommendation && (
                <div className="text-red-900 font-semibold mb-1 not-italic">→ {diagResult.recommendation}</div>
              )}
              <pre className="text-gray-700">{JSON.stringify({
                has_conversation_id: diagResult.diagnosis?.has_conversation_id,
                audio_url_kind: diagResult.diagnosis?.audio_url_kind,
                elevenlabs_check: diagResult.elevenlabs_check,
              }, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ─── Legend item · usado en la barra superior del Funnel ──────────
function LegendItem({ icon: Icon, label, color }: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-3 h-[3px]" style={{ background: color }} />
      <Icon className="w-3 h-3" style={{ color }} />
      <span className="text-[11px] font-semibold text-[var(--ts-gray-90)]">{label}</span>
    </div>
  );
}

