"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Kanban,
  Database,
  Video,
  Bot,
  LineChart,
  Linkedin,
  Brain,
  Bell,
  Plus,
  Download,
  Search,
  Calendar,
  Filter,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  Share2,
  Play,
  ExternalLink,
  LogOut,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { jobs } from "@/data/jobs";
import { factorXTS } from "@/data/assessments";

type Tab =
  | "dashboard"
  | "vacantes"
  | "pipeline"
  | "cvbank"
  | "entrevistas"
  | "pruebas"
  | "agentes"
  | "analytics"
  | "linkedin"
  | "datos";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "vacantes", label: "Vacantes", icon: Briefcase },
  { id: "pipeline", label: "Pipeline", icon: Kanban },
  { id: "cvbank", label: "CV Bank", icon: Database },
  { id: "entrevistas", label: "Entrevistas IA", icon: Video },
  { id: "pruebas", label: "Evaluaciones", icon: Brain },
  { id: "agentes", label: "Agentes IA", icon: Bot },
  { id: "analytics", label: "Analytics", icon: LineChart },
  { id: "linkedin", label: "LinkedIn TS", icon: Linkedin },
  { id: "datos", label: "Bases de datos", icon: Database },
];

export default function HRAdminPage() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div className="min-h-screen font-sans" style={{ background: "#EBEBEB" }}>
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-[1440px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white font-bold text-[13px] tracking-[2px]">
            <span className="w-7 h-7 rounded-md bg-white text-black flex items-center justify-center font-extrabold text-[13px]">
              TS
            </span>
            <span>TRADING SOLUTIONS</span>
            <span className="text-[12px] font-medium text-white/60 tracking-normal ml-1">· HR Admin</span>
            <span className="ml-1 text-[10px] font-bold tracking-[1.5px] uppercase text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
              Enabler
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-white/70 hover:text-white relative p-1.5">
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
            </button>
            <div className="flex items-center gap-2 bg-white/10 pl-1 pr-3 py-1 rounded-full text-white text-xs font-medium">
              <span className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-[11px] font-bold">
                KC
              </span>
              Kelly Castañeda
            </div>
            <button
              onClick={async () => {
                try {
                  await fetch("/api/hr-admin/login", { method: "DELETE" });
                } finally {
                  window.location.href = "/hr-admin/login";
                }
              }}
              title="Cerrar sesión"
              className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-medium px-2.5 py-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-[14px] h-[14px]" />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Sub nav tabs */}
      <nav className="sticky top-14 z-40 bg-white border-b border-gray-200">
        <div className="max-w-[1440px] mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex items-center gap-2 px-3.5 py-3.5 text-[13px] whitespace-nowrap border-b-2 transition-colors ${
                tab === id
                  ? "text-black border-black font-semibold"
                  : "text-gray-500 border-transparent hover:text-black font-medium"
              }`}
            >
              <Icon className="w-[15px] h-[15px]" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-[1440px] mx-auto px-6 py-7 pb-16">
        {tab === "dashboard" && <Dashboard />}
        {tab === "vacantes" && <Vacantes />}
        {tab === "pipeline" && <Pipeline />}
        {tab === "cvbank" && <CVBank />}
        {tab === "entrevistas" && <Entrevistas />}
        {tab === "pruebas" && <Pruebas />}
        {tab === "agentes" && <Agentes />}
        {tab === "analytics" && <Analytics />}
        {tab === "linkedin" && <LinkedInTS />}
        {tab === "datos" && <Datos />}
      </main>
    </div>
  );
}

/* ======================================================== */
/* Shared atoms                                             */
/* ======================================================== */
function Card({
  title,
  eyebrow,
  children,
  className = "",
}: {
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl p-5 ${className}`}>
      {(title || eyebrow) && (
        <div className="flex items-center justify-between mb-3">
          {title && <h3 className="text-sm font-bold">{title}</h3>}
          {eyebrow && (
            <span className="text-[11px] tracking-[1.5px] text-gray-500 uppercase font-semibold">
              {eyebrow}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

function KPI({ label, value, delta, tone = "up" }: { label: string; value: string; delta?: string; tone?: "up" | "down" | "neutral" }) {
  const deltaColor = tone === "up" ? "text-emerald-600" : tone === "down" ? "text-red-600" : "text-gray-500";
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-4">
      <div className="text-[11px] tracking-[1.2px] text-gray-500 uppercase font-semibold">{label}</div>
      <div className="text-[28px] font-extrabold mt-1 tracking-tight">{value}</div>
      {delta && <div className={`text-xs font-medium mt-0.5 ${deltaColor}`}>{delta}</div>}
    </div>
  );
}

function PageHead({ title, desc, actions }: { title: string; desc?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-4 mb-5">
      <div>
        <h1 className="text-[28px] font-extrabold tracking-tight m-0">{title}</h1>
        {desc && <p className="text-gray-500 mt-1.5 text-sm">{desc}</p>}
      </div>
      {actions && <div className="flex gap-2 items-center flex-wrap">{actions}</div>}
    </div>
  );
}

function Pill({ children, color = "gray" }: { children: React.ReactNode; color?: "black" | "gray" | "green" | "amber" | "red" | "blue" }) {
  const colors: Record<string, string> = {
    black: "bg-black text-white",
    gray: "bg-gray-100 text-gray-800",
    green: "bg-emerald-800 text-white",
    amber: "bg-amber-700 text-white",
    red: "bg-red-800 text-white",
    blue: "bg-[#0A66C2] text-white",
  };
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${colors[color]}`}>{children}</span>
  );
}

/* ======================================================== */
/* Dashboard                                                */
/* ======================================================== */
type TopCandidate = {
  name: string;
  role: string;
  score: number | null;
  matchPct: number | null;
  light: 'green' | 'amber' | 'red' | 'gray';
  status: string;
};

type DashboardStats = {
  vacancies: number;
  vacanciesLinkedIn: number;
  applications: number;
  applicationsAll: number; // sin filtrar (para KPI total)
  talentPool: number;
  assessmentsSent: number;
  assessmentsInProgress: number;
  assessmentsCompleted: number;
  interviews: number;
  offers: number;
  hires: number;
  bySource: Record<string, number>;
  topCandidates: TopCandidate[];
};

type VacancyOption = { id: number; title: string; status?: string; linkedin_url?: string };

// Extrae score del why_ts cuando la columna `score` aún no está poblada
function extractScoreFromText(why?: string | null): number | null {
  if (!why) return null;
  const m = why.match(/Score 16 Mandamientos:\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

// Convierte score (16 Mandamientos, máximo realista ~75) a % match capado a 100
function scoreToMatchPct(score: number | null): number | null {
  if (score === null || score === undefined) return null;
  return Math.max(0, Math.min(100, Math.round((score / 60) * 100)));
}

function matchLight(matchPct: number | null): 'green' | 'amber' | 'red' | 'gray' {
  if (matchPct === null) return 'gray';
  if (matchPct >= 80) return 'green';
  if (matchPct >= 50) return 'amber';
  return 'red';
}

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVacancyId, setSelectedVacancyId] = useState<number | 'all'>('all');
  const [vacanciesList, setVacanciesList] = useState<VacancyOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const appsUrl = selectedVacancyId === 'all'
          ? '/api/applications?limit=500'
          : `/api/applications?job_id=${selectedVacancyId}&limit=500`;
        const [vacR, appR, appAllR, tpR, asR] = await Promise.all([
          fetch('/api/vacancies', { cache: 'no-store' }).then((r) => r.json()),
          fetch(appsUrl, { cache: 'no-store' }).then((r) => r.json()),
          fetch('/api/applications?limit=500', { cache: 'no-store' }).then((r) => r.json()),
          fetch('/api/talent-pool?limit=1000', { cache: 'no-store' }).then((r) => r.json()),
          fetch('/api/assessments?limit=500', { cache: 'no-store' }).then((r) => r.json()),
        ]);
        if (cancelled) return;

        type Vacancy = { id: number; title: string; status?: string; linkedin_url?: string };
        type Application = {
          id: number;
          job_id: number;
          full_name?: string;
          email?: string;
          why_ts?: string | null;
          score?: number | null;
          status?: string;
        };
        type TalentPoolItem = {
          full_name: string;
          email?: string;
          source?: string;
          tags?: string;
          summary?: string;
        };
        type AssessmentToken = { status: string; score?: number | null; candidate_email?: string };

        const vacsRaw = (Array.isArray(vacR) ? vacR : vacR.data ?? []) as Vacancy[];
        setVacanciesList(vacsRaw.map((v) => ({ id: v.id, title: v.title, status: v.status, linkedin_url: v.linkedin_url })));

        const apps = (appR.applications ?? appR.data ?? []) as Application[];
        const appsAll = (appAllR.applications ?? appAllR.data ?? []) as Application[];
        const tp = (tpR.data ?? []) as TalentPoolItem[];
        const assess = (asR.data ?? []) as AssessmentToken[];

        // Map email → talent_pool source (para resolver source de apps)
        const tpByEmail: Record<string, TalentPoolItem> = {};
        for (const c of tp) {
          if (c.email) tpByEmail[c.email.toLowerCase()] = c;
        }

        // Source distribution: cuando hay filtro, derivamos del set de apps
        // de la vacante (cruzando email contra talent_pool.source). Sin filtro,
        // contamos todo el talent_pool.
        const bySource: Record<string, number> = {};
        const sourceSet = selectedVacancyId === 'all' ? tp : apps.map((a) => tpByEmail[(a.email || '').toLowerCase()]).filter(Boolean) as TalentPoolItem[];
        for (const c of sourceSet) {
          const s = (c.source ?? 'otros').toLowerCase();
          const label = s.includes('linkedin')
            ? 'LinkedIn TS'
            : s.includes('email')
            ? 'Email / directo'
            : s.includes('refer')
            ? 'Referidos'
            : 'Otros';
          bySource[label] = (bySource[label] ?? 0) + 1;
        }
        // Para apps web sin presencia en talent_pool (formulario público) — contarlas como Email/directo
        if (selectedVacancyId !== 'all') {
          const apps_no_tp = apps.filter((a) => !tpByEmail[(a.email || '').toLowerCase()]);
          if (apps_no_tp.length > 0) {
            bySource['Email / directo'] = (bySource['Email / directo'] ?? 0) + apps_no_tp.length;
          }
        }

        // Counts de apps por status (para funnel cuando se filtra vacante)
        const byStatus: Record<string, number> = {};
        for (const a of apps) {
          byStatus[a.status ?? 'new'] = (byStatus[a.status ?? 'new'] ?? 0) + 1;
        }

        // Top candidatos: apps de la vacante seleccionada (o todas), con score,
        // ordenadas DESC, top 5. Score viene de columna `score` o se extrae de why_ts.
        const sourceForTop = apps.length > 0 ? apps : appsAll;
        const enriched = sourceForTop.map((a) => {
          const score = (a.score as number | null | undefined) ?? extractScoreFromText(a.why_ts);
          const matchPct = scoreToMatchPct(score);
          return {
            name: a.full_name ?? '',
            role: vacsRaw.find((v) => v.id === a.job_id)?.title ?? '—',
            score,
            matchPct,
            light: matchLight(matchPct),
            status: a.status ?? 'new',
          } as TopCandidate;
        });
        const topCandidates = enriched
          .filter((c) => c.score !== null && c.status !== 'rejected')
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
          .slice(0, 6);

        // Filtrar assessments para la vacante seleccionada (cruzando emails)
        const emailsInVacancy = new Set(apps.map((a) => (a.email || '').toLowerCase()));
        const assessFiltered = selectedVacancyId === 'all'
          ? assess
          : assess.filter((a) => emailsInVacancy.has((a.candidate_email || '').toLowerCase()));

        setStats({
          vacancies: vacsRaw.length,
          vacanciesLinkedIn: vacsRaw.filter((v) => v.linkedin_url).length,
          applications: apps.length,
          applicationsAll: appsAll.length,
          talentPool: tp.length,
          assessmentsSent: assessFiltered.length,
          assessmentsInProgress: assessFiltered.filter((a) => a.status === 'in_progress').length,
          assessmentsCompleted: assessFiltered.filter((a) => a.status === 'completed').length,
          interviews: byStatus['interview'] ?? 0,
          offers: byStatus['offer'] ?? 0,
          hires: byStatus['hired'] ?? 0,
          bySource,
          topCandidates,
        });
        setLoading(false);
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedVacancyId]);

  const s = stats;

  const filterIsAll = selectedVacancyId === 'all';
  const selectedVacancyTitle = filterIsAll
    ? 'Todas las vacantes'
    : vacanciesList.find((v) => v.id === selectedVacancyId)?.title ?? '—';

  // Funnel: si hay filtro de vacante, sale del breakdown por status de esa vacante.
  // Sin filtro, mantiene la lectura agregada del pipeline completo.
  const rawRows = s
    ? filterIsAll
      ? [
          { label: 'Talent Pool (CV Bank)', value: s.talentPool, kind: 'pool' as const },
          { label: 'Aplicaciones a vacante', value: s.applicationsAll, kind: 'apply' as const },
          { label: 'Parseado CV', value: Math.round(s.applicationsAll * 0.98), kind: 'parse' as const },
          { label: 'Invitaciones enviadas', value: s.assessmentsSent, kind: 'sent' as const },
          { label: 'Candidatos evaluados', value: s.assessmentsCompleted, kind: 'done' as const },
          { label: 'Entrevista humana', value: s.interviews, kind: 'interview' as const },
          { label: 'Oferta', value: s.offers, kind: 'offer' as const },
          { label: 'Contratado', value: s.hires, kind: 'hire' as const },
        ]
      : [
          { label: 'Aplicaciones a esta vacante', value: s.applications, kind: 'apply' as const },
          { label: 'Invitaciones enviadas', value: s.assessmentsSent, kind: 'sent' as const },
          { label: 'Candidatos evaluados', value: s.assessmentsCompleted, kind: 'done' as const },
          { label: 'Entrevista humana', value: s.interviews, kind: 'interview' as const },
          { label: 'Oferta', value: s.offers, kind: 'offer' as const },
          { label: 'Contratado', value: s.hires, kind: 'hire' as const },
        ]
    : [];
  const maxFunnelValue = Math.max(1, ...rawRows.map((r) => r.value));
  const funnelRows = rawRows.map((r, i) => {
    const prev = i > 0 ? rawRows[i - 1] : null;
    const conv = prev && prev.value > 0 ? Math.round((r.value / prev.value) * 100) : null;
    return {
      label: r.label,
      value: r.value,
      pct: Math.round((r.value / maxFunnelValue) * 100),
      conv,
    };
  });

  const totalSource = s
    ? Object.values(s.bySource).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <>
      <PageHead
        title="Dashboard · Talent Acquisition"
        desc={
          filterIsAll
            ? 'Vista ejecutiva en vivo del pipeline real de Trading Solutions.'
            : `Vista filtrada · ${selectedVacancyTitle}`
        }
        actions={
          <>
            <select
              value={selectedVacancyId === 'all' ? 'all' : String(selectedVacancyId)}
              onChange={(e) => setSelectedVacancyId(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
              className="text-xs border border-gray-300 rounded-md px-3 py-2 bg-white"
              style={{ minWidth: 220 }}
              aria-label="Filtrar por vacante"
            >
              <option value="all">Todas las vacantes ({vacanciesList.length})</option>
              {vacanciesList.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}
                </option>
              ))}
            </select>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button className="pill-btn pill-btn-primary text-xs" style={{ padding: "9px 14px" }}>
              <Plus className="w-3.5 h-3.5" /> Nueva vacante
            </button>
          </>
        }
      />

      <div className="grid grid-cols-5 gap-3 mb-4">
        <KPI
          label={filterIsAll ? 'Aplicaciones' : 'Aplicaciones a esta vacante'}
          value={loading ? '…' : String(s?.applications ?? 0)}
          delta={loading ? 'Cargando' : (filterIsAll ? 'En Neon' : `de ${s?.applicationsAll ?? 0} totales`)}
          tone="neutral"
        />
        <KPI
          label={filterIsAll ? 'Vacantes activas' : 'Vacante seleccionada'}
          value={loading ? '…' : (filterIsAll ? String(s?.vacancies ?? 0) : '1')}
          delta={s ? (filterIsAll ? `${s.vacanciesLinkedIn} en LinkedIn` : selectedVacancyTitle.slice(0, 28)) : ''}
          tone="neutral"
        />
        <KPI
          label="Candidatos evaluados"
          value={loading ? '…' : String(s?.assessmentsCompleted ?? 0)}
          delta={s ? `${s.assessmentsInProgress} en progreso` : ''}
          tone="neutral"
        />
        <KPI
          label={filterIsAll ? 'En pipeline' : 'En entrevista'}
          value={loading ? '…' : String(filterIsAll ? (s?.talentPool ?? 0) : (s?.interviews ?? 0))}
          delta={filterIsAll ? 'CV Bank activo' : `${s?.offers ?? 0} ofertas · ${s?.hires ?? 0} hired`}
        />
        <KPI
          label="CV Bank total"
          value={loading ? '…' : String(s?.talentPool ?? 0)}
          delta="Barranquilla"
          tone="neutral"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <Card title="Funnel de conversión · pipeline real" eyebrow="LIVE · /api/applications+assessments">
          {loading ? (
            <div className="text-sm text-gray-400 py-6 text-center">Cargando funnel…</div>
          ) : (
            <Funnel rows={funnelRows} />
          )}
        </Card>
        <Card title="Source of Candidates" eyebrow="DESDE TALENT POOL">
          {loading || !s ? (
            <div className="text-sm text-gray-400 py-6 text-center">Cargando…</div>
          ) : totalSource === 0 ? (
            <div className="text-sm text-gray-400 py-6 text-center">Sin data aún</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(s.bySource)
                .sort((a, b) => b[1] - a[1])
                .map(([label, count]) => {
                  const pct = Math.round((count / totalSource) * 100);
                  const color = label === "LinkedIn TS"
                    ? "#0A66C2"
                    : label === "Email / directo"
                    ? "#111"
                    : label === "Referidos"
                    ? "#6B7280"
                    : "#9CA3AF";
                  return (
                    <SourceBar
                      key={label}
                      label={label}
                      pct={pct}
                      color={color}
                      value={`${pct}% (${count})`}
                    />
                  );
                })}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card title="Bases de datos activas" eyebrow="LIVE · NEON">
          {loading || !s ? (
            <div className="text-sm text-gray-400 py-6 text-center">Cargando…</div>
          ) : (
            <div className="space-y-2">
              {([
                ["vacancies", "Vacantes publicadas", s.vacancies],
                ["talent_pool", "CV Bank (candidatos)", s.talentPool],
                ["applications", "Aplicaciones recibidas", s.applications],
                ["assessment_tokens", "Invitaciones enviadas", s.assessmentsSent],
                ["assessment_tokens · completed", "Candidatos evaluados", s.assessmentsCompleted],
                ["hires", "Firmados (pendiente tabla)", s.hires],
              ] as Array<[string, string, number]>).map(([name, desc, n]) => (
                <div key={name} className="flex justify-between items-center border border-gray-200 rounded-lg px-3 py-2.5">
                  <div>
                    <div className="text-sm font-semibold">{name}</div>
                    <div className="text-xs text-gray-500">{desc}</div>
                  </div>
                  <div className="text-xl font-extrabold">{n.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Top candidatos" eyebrow="MATCH % vs PERFIL IDEAL">
          {loading || !s ? (
            <div className="text-sm text-gray-400 py-6 text-center">Cargando…</div>
          ) : s.topCandidates.length === 0 ? (
            <div className="text-sm text-gray-400 py-6 text-center">
              Sin candidatos con score aún en {filterIsAll ? 'el pipeline' : 'esta vacante'}.
            </div>
          ) : (
            <div className="space-y-2">
              {s.topCandidates.map((c, idx) => {
                const dotColor = c.light === 'green' ? '#10B981' : c.light === 'amber' ? '#F59E0B' : c.light === 'red' ? '#EF4444' : '#9CA3AF';
                const labelColor = c.light === 'green' ? 'text-emerald-700' : c.light === 'amber' ? 'text-amber-700' : c.light === 'red' ? 'text-red-700' : 'text-gray-500';
                return (
                  <div
                    key={`${c.name}-${idx}`}
                    className="flex justify-between items-center border border-gray-200 rounded-lg px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span
                        title={c.light === 'green' ? 'Alto match — invitar' : c.light === 'amber' ? 'Match medio — revisar' : 'Match bajo'}
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: dotColor,
                          flexShrink: 0,
                          boxShadow: c.light === 'green' ? '0 0 0 3px rgba(16,185,129,0.18)' : 'none',
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate">{c.name}</div>
                        <div className="text-xs text-gray-500 truncate">{c.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${labelColor}`}>
                        {c.matchPct !== null ? `${c.matchPct}%` : '—'}
                      </div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                        score {c.score ?? '—'}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="text-[11px] text-gray-400 mt-1.5 px-1">
                <span style={{ color: '#10B981' }}>●</span> verde ≥80% · <span style={{ color: '#F59E0B' }}>●</span> amarillo 50-79% · <span style={{ color: '#EF4444' }}>●</span> rojo &lt;50%
              </div>
            </div>
          )}
        </Card>

        <Card title="LinkedIn Trading Solutions" eyebrow="SINCRONIZADO">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-[#0A66C2] text-white flex items-center justify-center text-xl font-extrabold">in</div>
            <div>
              <div className="font-bold text-[15px]">Trading Solutions</div>
              <div className="text-xs text-gray-500">Página corporativa · Logistics</div>
              <div className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Conectado
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MiniStat
              label="Vacantes sync"
              value={s ? `${s.vacanciesLinkedIn}/${s.vacancies}` : "…"}
              delta={s && s.vacancies > 0 ? `${Math.round((s.vacanciesLinkedIn / s.vacancies) * 100)}%` : ""}
            />
            <MiniStat
              label="Desde LinkedIn"
              value={s ? String(s.bySource["LinkedIn TS"] ?? 0) : "…"}
              delta="candidatos"
            />
            <MiniStat label="Followers" value="—" delta="Graph API" />
            <MiniStat label="InMails" value="—" delta="RSC pending" />
          </div>
        </Card>
      </div>
    </>
  );
}

function Funnel({
  rows,
}: {
  rows: { label: string; pct: number; value: number; conv: number | null }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => (
        <div
          key={r.label}
          className="grid items-center gap-2.5"
          style={{ gridTemplateColumns: "180px 1fr 50px 70px" }}
        >
          <span className="text-sm text-gray-600 font-medium">{r.label}</span>
          <div className="h-7 bg-gray-100 rounded-lg overflow-hidden">
            <div
              className="h-full bg-black rounded-l-lg flex items-center justify-end px-2.5 text-[11px] font-semibold text-white"
              style={{ width: `${Math.max(r.pct, r.value > 0 ? 4 : 0)}%` }}
            >
              {r.value > 0 ? r.value : ""}
            </div>
          </div>
          <span
            className={`text-right text-[11px] font-medium ${
              r.conv === null
                ? "text-gray-300"
                : r.conv >= 80
                ? "text-emerald-600"
                : r.conv >= 50
                ? "text-amber-600"
                : "text-gray-400"
            }`}
            title="Conversión vs. etapa anterior"
          >
            {r.conv !== null ? `${r.conv}%` : "—"}
          </span>
          <span className="text-right font-bold text-sm">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function SourceBar({ label, pct, color, value }: { label: string; pct: number; color: string; value: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
        <span>{label}</span>
        <span className="font-semibold text-black">{value}</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, delta }: { label: string; value: string; delta?: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2.5">
      <div className="text-[10px] tracking-[0.08em] text-gray-500 uppercase font-semibold">{label}</div>
      <div className="text-lg font-extrabold mt-0.5">{value}</div>
      {delta && <div className="text-[10px] text-emerald-600 font-semibold">{delta}</div>}
    </div>
  );
}

/* ======================================================== */
/* Vacantes                                                 */
/* ======================================================== */
type LiveVacancy = {
  id: number;
  slug: string;
  title: string;
  title_es?: string;
  title_en?: string;
  department: string;
  location: string;
  work_mode: string;
  level?: string;
  linkedin_url?: string;
  apply_email?: string;
  posted_at?: string;
  status?: string;
};

type VacancyAppStats = {
  total: number;
  new: number;
  reviewing: number;
  interview: number;
  offer: number;
  hired: number;
  rejected: number;
  byScore: { green: number; amber: number; red: number };
  topRanking: Array<{
    id: number;
    name: string;
    email: string;
    score: number | null;
    matchPct: number | null;
    light: 'green' | 'amber' | 'red' | 'gray';
    status: string;
    why_ts: string | null;
    prefilter_data: Record<string, unknown> | null;
    assessmentStatus: 'none' | 'sent' | 'in_progress' | 'completed' | 'expired';
    assessmentToken: string | null;
    assessmentScore: number | null;
  }>;
};

type ScreeningModalData = {
  candidate: { id: number; name: string; email: string; status: string };
  vacancyId: number;
  score: number | null;
  category: string;
  breakdown: Record<string, number>;
  reasons: string[];
  notes: string;
  assessmentStatus: string;
  assessmentToken: string | null;
};

type AgentDetailModalData = {
  agent: 'recepcion' | 'pareo' | 'screening' | 'assessment';
};

function Vacantes() {
  const [vacancies, setVacancies] = useState<LiveVacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'active' | 'closed'>('active');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [statsByVacancy, setStatsByVacancy] = useState<Record<number, VacancyAppStats>>({});
  const [showJobWriter, setShowJobWriter] = useState(false);
  const [showMarketResearch, setShowMarketResearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [screeningModal, setScreeningModal] = useState<ScreeningModalData | null>(null);
  const [agentModal, setAgentModal] = useState<AgentDetailModalData | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  // Filtros por vacante (key = vacancy_id)
  const [filterByVacancy, setFilterByVacancy] = useState<Record<number, { search: string; status: string; sort: 'score' | 'date' | 'name' }>>({});
  const [selectedCandidates, setSelectedCandidates] = useState<Record<number, Set<number>>>({});

  function getFilters(vid: number) {
    return filterByVacancy[vid] ?? { search: '', status: 'all', sort: 'score' as const };
  }
  function setFilter(vid: number, patch: Partial<{ search: string; status: string; sort: 'score' | 'date' | 'name' }>) {
    setFilterByVacancy((prev) => ({ ...prev, [vid]: { ...getFilters(vid), ...patch } }));
  }
  function toggleSelect(vid: number, candId: number) {
    setSelectedCandidates((prev) => {
      const cur = new Set(prev[vid] ?? []);
      if (cur.has(candId)) cur.delete(candId);
      else cur.add(candId);
      return { ...prev, [vid]: cur };
    });
  }
  async function bulkSendTest(vid: number, candidates: Array<{ id: number; name: string; email: string }>, vacancyTitle: string) {
    if (candidates.length === 0) return;
    if (!confirm(`Enviar prueba Elevare a ${candidates.length} candidatos?`)) return;
    setActionBusy(`bulk-${vid}`);
    let ok = 0;
    for (const c of candidates) {
      try {
        await fetch('/api/assessments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidate_name: c.name,
            candidate_email: c.email,
            vacancy_id: vid,
            vacancy_title: vacancyTitle,
            send_email: true,
            source: 'bulk_send_from_vacantes',
          }),
        });
        ok += 1;
      } catch { /* sigue */ }
    }
    setActionBusy(null);
    alert(`✓ Invitaciones enviadas: ${ok}/${candidates.length}`);
    setSelectedCandidates((prev) => ({ ...prev, [vid]: new Set() }));
    window.location.reload();
  }

  // Cargar vacantes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/vacancies', { cache: 'no-store' });
        const j = await r.json();
        if (!cancelled) {
          const list = (Array.isArray(j) ? j : j.data ?? []) as LiveVacancy[];
          setVacancies(list);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'fetch_failed');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Cargar stats per vacancy en paralelo (apps + scores + ranking + assessment status)
  useEffect(() => {
    if (vacancies.length === 0) return;
    (async () => {
      const out: Record<number, VacancyAppStats> = {};

      // Primero traer todos los assessment_tokens (un solo fetch, indexar por email)
      let allTokens: Array<{ candidate_email: string; status: string; token: string; score: number | null }> = [];
      try {
        const tR = await fetch('/api/assessments?limit=500', { cache: 'no-store' });
        const tJ = await tR.json();
        allTokens = (tJ.data ?? []) as typeof allTokens;
      } catch { /* ignore */ }
      const tokensByEmail: Record<string, typeof allTokens[number]> = {};
      for (const t of allTokens) {
        const em = (t.candidate_email || '').toLowerCase();
        // Mantener el más reciente (la API ya viene ordenada DESC por sent_at)
        if (em && !tokensByEmail[em]) tokensByEmail[em] = t;
      }

      await Promise.all(vacancies.map(async (v) => {
        try {
          const r = await fetch(`/api/applications?job_id=${v.id}&limit=300`, { cache: 'no-store' });
          const j = await r.json();
          const apps = (j.applications ?? j.data ?? []) as Array<{ id: number; full_name?: string; email?: string; status?: string; score?: number | null; why_ts?: string | null; prefilter_data?: Record<string, unknown> | null }>;
          const stats: VacancyAppStats = {
            total: apps.length,
            new: 0, reviewing: 0, interview: 0, offer: 0, hired: 0, rejected: 0,
            byScore: { green: 0, amber: 0, red: 0 },
            topRanking: [],
          };
          const enriched = apps.map((a) => {
            const score = (a.score ?? null) || extractScoreFromText(a.why_ts);
            const matchPct = scoreToMatchPct(score);
            const light = matchLight(matchPct);
            const st = (a.status ?? 'new') as 'new' | 'reviewing' | 'interview' | 'offer' | 'hired' | 'rejected';
            if (st in stats && typeof stats[st] === 'number') {
              (stats[st] as number) = (stats[st] as number) + 1;
            }
            if (light === 'green') stats.byScore.green += 1;
            else if (light === 'amber') stats.byScore.amber += 1;
            else if (light === 'red') stats.byScore.red += 1;
            const token = tokensByEmail[(a.email || '').toLowerCase()];
            return {
              id: a.id,
              name: a.full_name ?? '',
              email: a.email ?? '',
              score,
              matchPct,
              light,
              status: a.status ?? 'new',
              why_ts: a.why_ts ?? null,
              prefilter_data: a.prefilter_data ?? null,
              assessmentStatus: (token?.status as VacancyAppStats['topRanking'][number]['assessmentStatus']) ?? 'none',
              assessmentToken: token?.token ?? null,
              assessmentScore: token?.score ?? null,
            };
          });
          // TODOS los candidatos (no solo top 8). El filtro/orden se aplica
          // en la UI con controles. Excluimos hired/rejected del ranking
          // operativo pero los mostramos en la vista filtrada.
          stats.topRanking = enriched
            .sort((a, b) => {
              // hired al final, rejected aún más al final
              const sw = (s: string) => s === 'hired' ? -1 : s === 'rejected' ? -2 : 0;
              const diff = sw(b.status) - sw(a.status);
              if (diff !== 0) return diff;
              return (b.score ?? 0) - (a.score ?? 0);
            });
          out[v.id] = stats;
        } catch { /* ignore single-vacancy errors */ }
      }));
      setStatsByVacancy(out);
    })();
  }, [vacancies]);

  const active = vacancies.filter((v) => !v.status || v.status === 'open' || v.status === 'active');
  const closed = vacancies.filter((v) => v.status === 'closed' || v.status === 'filled' || v.status === 'paused');
  const list = tab === 'active' ? active : closed;
  const totalApplications = Object.values(statsByVacancy).reduce((s, x) => s + x.total, 0);

  function exportToExcel() {
    // Simple CSV export (Excel-compatible). Una hoja con vacantes + stats.
    const rows: string[][] = [
      ['ID', 'Vacante', 'Departamento', 'Status', 'Ubicación', 'Modalidad', 'Nivel', 'Publicada', 'LinkedIn', 'Total Apps', 'New', 'Reviewing', 'Interview', 'Offer', 'Hired', 'Rejected', 'Verde', 'Amber', 'Rojo'],
    ];
    for (const v of vacancies) {
      const st = statsByVacancy[v.id] ?? {
        total: 0, new: 0, reviewing: 0, interview: 0, offer: 0, hired: 0, rejected: 0,
        byScore: { green: 0, amber: 0, red: 0 }, topRanking: [],
      };
      rows.push([
        String(v.id),
        v.title_es ?? v.title ?? v.slug,
        v.department ?? '',
        v.status ?? 'open',
        v.location ?? '',
        v.work_mode ?? '',
        v.level ?? '',
        v.posted_at ? new Date(v.posted_at).toISOString().slice(0, 10) : '',
        v.linkedin_url ?? '',
        String(st.total), String(st.new), String(st.reviewing), String(st.interview), String(st.offer), String(st.hired), String(st.rejected),
        String(st.byScore.green), String(st.byScore.amber), String(st.byScore.red),
      ]);
    }
    const csv = rows.map((r) => r.map((c) => `"${(c ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vacantes_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHead
        title="Vacantes · Centro de reclutamiento"
        desc={loading ? 'Cargando desde Neon…' : `${active.length} activa(s) · ${closed.length} cerrada(s) · ${totalApplications} aplicaciones totales`}
        actions={
          <>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: '9px 14px' }} onClick={() => setShowSettings(true)}>
              ⚙ Email & Calendly
            </button>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: '9px 14px' }} onClick={exportToExcel}>
              <Download className="w-3.5 h-3.5" /> Export Excel
            </button>
            <button className="pill-btn text-xs bg-[#0F172A] text-white hover:bg-black" style={{ padding: '9px 14px' }} onClick={() => setShowJobWriter(true)}>
              <Sparkles className="w-3.5 h-3.5" /> Agente Job Writer
            </button>
            <button className="pill-btn text-xs bg-[#1F4FBF] text-white hover:bg-[#163E96]" style={{ padding: '9px 14px' }} onClick={() => setShowMarketResearch(true)}>
              <Sparkles className="w-3.5 h-3.5" /> Agente Market Research
            </button>
            <button className="pill-btn pill-btn-primary text-xs" style={{ padding: '9px 14px' }}>
              <Plus className="w-3.5 h-3.5" /> Nueva requisición
            </button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <KPI label="Activas" value={loading ? '…' : String(active.length)} delta="En Neon" tone="neutral" />
        <KPI label="Cerradas" value={loading ? '…' : String(closed.length)} delta="Histórico" tone="neutral" />
        <KPI label="Aplicaciones totales" value={String(totalApplications)} delta="Across all vacancies" />
        <KPI label="Departamentos" value={String(new Set(vacancies.map((v) => v.department)).size)} delta="Áreas activas" tone="neutral" />
      </div>

      {/* Active / Closed tabs */}
      <div className="flex gap-2 mb-3 border-b border-gray-200">
        <button
          className={`px-3 py-2 text-sm font-medium border-b-2 ${tab === 'active' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          onClick={() => setTab('active')}
        >
          Activas ({active.length})
        </button>
        <button
          className={`px-3 py-2 text-sm font-medium border-b-2 ${tab === 'closed' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          onClick={() => setTab('closed')}
        >
          Cerradas ({closed.length})
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-800">
          Error cargando vacantes: <code>{error}</code>
        </div>
      )}

      {!loading && list.length === 0 && (
        <div className="text-sm text-gray-500 py-6 text-center bg-white rounded-xl border border-gray-200">
          {tab === 'active' ? 'Sin vacantes activas.' : 'Sin vacantes cerradas aún.'}
        </div>
      )}

      <div className="space-y-3">
        {list.map((v) => {
          const title = v.title_es ?? v.title ?? v.title_en ?? v.slug;
          const stats = statsByVacancy[v.id];
          const expanded = expandedId === v.id;
          return (
            <div key={v.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Header — siempre visible */}
              <div
                className="flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedId(expanded ? null : v.id)}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-2 h-2 rounded-full ${tab === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold truncate">{title}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {v.department} · {v.location} · {v.work_mode} · {v.level ?? '—'}
                      {v.posted_at ? ` · ${new Date(v.posted_at).toISOString().slice(0, 10)}` : ''}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  {stats && (
                    <>
                      <Pill color="gray">{stats.total} apps</Pill>
                      {stats.byScore.green > 0 && <Pill color="green">{stats.byScore.green} verde</Pill>}
                      {stats.hired > 0 && <Pill color="black">{stats.hired} hired</Pill>}
                    </>
                  )}
                  <Pill color="black">id={v.id}</Pill>
                  {v.linkedin_url && (
                    <a
                      href={v.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0A66C2] p-1"
                      title="Ver en LinkedIn"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </div>
              </div>

              {/* Detail expandido */}
              {expanded && (
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 space-y-4">
                  {/* Pipeline horizontal */}
                  <PipelineSummary stats={stats} />

                  {/* Agentes activos — clickables para ver detalle y modificar */}
                  <div className="grid grid-cols-4 gap-3">
                    <AgenteBox icon="📥" title="Recepción" desc="Recibe aplicación · valida email" status="active" onClick={() => setAgentModal({ agent: 'recepcion' })} />
                    <AgenteBox icon="🔍" title="Pareo HDV" desc="Anthropic CV parser · extrae skills" status="active" onClick={() => setAgentModal({ agent: 'pareo' })} />
                    <AgenteBox icon="✅" title="Screening" desc="16 Mandamientos · score 0-100" status={stats && stats.total > 0 ? 'active' : 'idle'} onClick={() => setAgentModal({ agent: 'screening' })} />
                    <AgenteBox icon="📧" title="Assessment" desc="Envío + tracking de prueba Elevare" status={stats && stats.reviewing > 0 ? 'active' : 'idle'} onClick={() => setAgentModal({ agent: 'assessment' })} />
                  </div>

                  {/* Ranking + filtros + bulk */}
                  <div>
                    {(() => {
                      const f = getFilters(v.id);
                      const sel = selectedCandidates[v.id] ?? new Set<number>();
                      const all = stats?.topRanking ?? [];
                      // aplicar filtros
                      const filtered = all.filter((c) => {
                        if (f.search) {
                          const q = f.search.toLowerCase();
                          if (!c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false;
                        }
                        if (f.status !== 'all' && c.status !== f.status) return false;
                        return true;
                      });
                      filtered.sort((a, b) => {
                        if (f.sort === 'score') return (b.score ?? 0) - (a.score ?? 0);
                        if (f.sort === 'name') return a.name.localeCompare(b.name);
                        return 0; // date sort = original order
                      });
                      const selectedList = Array.from(sel).map((id) => all.find((c) => c.id === id)).filter(Boolean) as typeof all;
                      const sendableSelected = selectedList.filter((c) => c.assessmentStatus === 'none');

                      return (
                        <>
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <div className="text-xs uppercase text-gray-500 font-semibold tracking-wider">
                              Candidatos · {filtered.length} de {all.length}
                            </div>
                            <div className="flex gap-2 items-center">
                              <input
                                type="text"
                                placeholder="Buscar por nombre o email…"
                                value={f.search}
                                onChange={(e) => setFilter(v.id, { search: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                                style={{ width: 200 }}
                              />
                              <select
                                value={f.status}
                                onChange={(e) => setFilter(v.id, { status: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                              >
                                <option value="all">Todos los status</option>
                                <option value="reviewing">Reviewing</option>
                                <option value="new">New</option>
                                <option value="interview">Interview</option>
                                <option value="offer">Offer</option>
                                <option value="hired">Hired</option>
                                <option value="rejected">Rejected</option>
                              </select>
                              <select
                                value={f.sort}
                                onChange={(e) => setFilter(v.id, { sort: e.target.value as 'score' | 'date' | 'name' })}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                              >
                                <option value="score">↓ Score</option>
                                <option value="name">A-Z nombre</option>
                                <option value="date">Por fecha</option>
                              </select>
                            </div>
                          </div>

                          {/* Bulk action bar */}
                          {sel.size > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-2 flex items-center gap-2">
                              <div className="text-sm text-blue-900 flex-1">
                                {sel.size} candidato{sel.size > 1 ? 's' : ''} seleccionado{sel.size > 1 ? 's' : ''}
                                {sendableSelected.length < sel.size && (
                                  <span className="text-blue-700 ml-2">({sendableSelected.length} sin prueba enviada)</span>
                                )}
                              </div>
                              <button
                                disabled={sendableSelected.length === 0 || actionBusy === `bulk-${v.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  bulkSendTest(v.id, sendableSelected, v.title_es ?? v.title ?? '');
                                }}
                                className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                {actionBusy === `bulk-${v.id}` ? 'Enviando…' : `✉ Enviar prueba a ${sendableSelected.length}`}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCandidates((prev) => ({ ...prev, [v.id]: new Set() }));
                                }}
                                className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-white"
                              >
                                Limpiar
                              </button>
                            </div>
                          )}

                    {!stats || filtered.length === 0 ? (
                      <div className="text-sm text-gray-400 py-4 bg-white rounded-lg border border-gray-200 text-center">
                        {all.length === 0 ? 'Sin candidatos en esta vacante.' : 'Ningún candidato cumple los filtros.'}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {filtered.map((c, idx) => {
                          const dot = c.light === 'green' ? '#10B981' : c.light === 'amber' ? '#F59E0B' : c.light === 'red' ? '#EF4444' : '#9CA3AF';
                          const hasAssessment = c.assessmentStatus !== 'none';
                          const isSelected = sel.has(c.id);
                          const assessmentDone = c.assessmentStatus === 'completed';

                          // Botón principal asessment (contextual)
                          let assessmentButton: React.ReactNode = null;
                          if (assessmentDone) {
                            // Bajar PDF de resultados
                            assessmentButton = (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (c.assessmentToken) {
                                    window.open(`/api/assessments/${c.assessmentToken}/pdf`, '_blank');
                                  }
                                }}
                                className="text-xs px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                title="Bajar PDF con resultados de la prueba"
                              >
                                ↓ PDF
                              </button>
                            );
                          } else if (hasAssessment) {
                            // Ya enviada, en progreso o expirada — mostrar status + reenviar
                            const label = c.assessmentStatus === 'in_progress' ? 'En curso' : c.assessmentStatus === 'expired' ? 'Expirada' : 'Enviada';
                            assessmentButton = (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!confirm(`Reenviar invitación a ${c.name}?`)) return;
                                  setActionBusy(`resend-${c.id}`);
                                  try {
                                    await fetch('/api/assessments', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        candidate_name: c.name,
                                        candidate_email: c.email,
                                        vacancy_id: v.id,
                                        vacancy_title: v.title_es ?? v.title,
                                        send_email: true,
                                        source: 'resend_from_vacantes_tab',
                                      }),
                                    });
                                    alert('Invitación reenviada');
                                  } finally { setActionBusy(null); }
                                }}
                                className="text-xs px-2.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50"
                                title={`Estado: ${c.assessmentStatus} — click para reenviar`}
                              >
                                {label} · ↻
                              </button>
                            );
                          } else {
                            // Sin token aún — Enviar prueba
                            assessmentButton = (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!confirm(`Enviar prueba Elevare a ${c.name} (${c.email})?`)) return;
                                  setActionBusy(`send-${c.id}`);
                                  try {
                                    const r = await fetch('/api/assessments', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        candidate_name: c.name,
                                        candidate_email: c.email,
                                        vacancy_id: v.id,
                                        vacancy_title: v.title_es ?? v.title,
                                        send_email: true,
                                        source: 'send_from_vacantes_tab',
                                      }),
                                    });
                                    const j = await r.json();
                                    if (j.email?.sent) {
                                      alert(`✓ Prueba enviada a ${c.email}`);
                                    } else if (j.link) {
                                      navigator.clipboard.writeText(j.link);
                                      alert(`Token creado. Link copiado:\n${j.link}`);
                                    }
                                    window.location.reload();
                                  } finally { setActionBusy(null); }
                                }}
                                disabled={actionBusy === `send-${c.id}`}
                                className="text-xs px-2.5 py-1 rounded border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                                title="Generar token y enviar invitación por email"
                              >
                                {actionBusy === `send-${c.id}` ? '…' : '✉ Enviar prueba'}
                              </button>
                            );
                          }

                          return (
                            <div key={c.id} className={`flex items-center gap-2 bg-white rounded-lg border px-3 py-2 ${isSelected ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200'}`}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => { e.stopPropagation(); toggleSelect(v.id, c.id); }}
                                onClick={(e) => e.stopPropagation()}
                                className="cursor-pointer"
                              />
                              <span className="text-xs text-gray-400 font-mono w-6">{idx + 1}</span>
                              <span style={{ width: 9, height: 9, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                              <div className="text-sm font-medium flex-1 min-w-0 truncate">{c.name}</div>
                              <Pill color={c.status === 'hired' ? 'green' : c.status === 'interview' ? 'black' : 'gray'}>{c.status}</Pill>
                              <div className="text-sm font-bold text-right" style={{ minWidth: 48 }}>
                                {c.matchPct !== null ? `${c.matchPct}%` : '—'}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setScreeningModal({
                                    candidate: { id: c.id, name: c.name, email: c.email, status: c.status },
                                    vacancyId: v.id,
                                    score: c.score,
                                    category: ((c.prefilter_data as Record<string, unknown> | null)?.category as string) ?? '—',
                                    breakdown: ((c.prefilter_data as Record<string, unknown> | null)?.breakdown as Record<string, number>) ?? {},
                                    reasons: ((c.prefilter_data as Record<string, unknown> | null)?.reasons as string[]) ?? [],
                                    notes: c.why_ts ?? '',
                                    assessmentStatus: c.assessmentStatus,
                                    assessmentToken: c.assessmentToken,
                                  });
                                }}
                                className="text-xs px-2.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50"
                                title="Ver detalle del screening (16 Mandamientos)"
                              >
                                🔍 Screening
                              </button>
                              {assessmentButton}
                            </div>
                          );
                        })}
                      </div>
                    )}
                        </>
                      );
                    })()}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-200">
                    <button
                      className="text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100"
                      onClick={() => window.open(`/api/assessments?vacancy_id=${v.id}&format=pdf`, '_blank')}
                    >
                      📄 Bajar pruebas en PDF
                    </button>
                    <button
                      className="text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100"
                      onClick={() => window.open(`/vacantes/${v.slug}`, '_blank')}
                    >
                      Ver pública ↗
                    </button>
                    {tab === 'active' && (
                      <button
                        className="text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100 ml-auto"
                        onClick={async () => {
                          if (!confirm(`Cerrar vacante "${title}"?`)) return;
                          await fetch(`/api/vacancies/${v.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'closed' }),
                          });
                          window.location.reload();
                        }}
                      >
                        Cerrar vacante
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showJobWriter && <JobWriterModal onClose={() => setShowJobWriter(false)} />}
      {showMarketResearch && <MarketResearchModal vacancies={vacancies} onClose={() => setShowMarketResearch(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {screeningModal && <ScreeningDetailModal data={screeningModal} onClose={() => setScreeningModal(null)} />}
      {agentModal && <AgentDetailModal agent={agentModal.agent} onClose={() => setAgentModal(null)} />}
    </>
  );
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  const [config, setConfig] = useState<{ email_from: string; email_bcc: string; email_reply_to: string; booking_url: string; resend_domain_status: string } | null>(null);
  const [gmailStatus, setGmailStatus] = useState<{ connected: boolean; email?: string } | null>(null);
  const [bookingDraft, setBookingDraft] = useState('');
  const [bccDraft, setBccDraft] = useState('');
  const [replyToDraft, setReplyToDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [r, g] = await Promise.all([
        fetch('/api/recruiter-config').then((x) => x.json()),
        fetch('/api/google/status').then((x) => x.json()).catch(() => ({ connected: false })),
      ]);
      setConfig(r);
      setBookingDraft(r.booking_url ?? '');
      setBccDraft(r.email_bcc ?? '');
      setReplyToDraft(r.email_reply_to ?? '');
      setGmailStatus(g);
    })();
  }, []);

  async function disconnectGmail() {
    if (!confirm('¿Desconectar Gmail? Los próximos correos volverán a salir desde Resend (Elevare default).')) return;
    await fetch('/api/google/disconnect', { method: 'POST' });
    setGmailStatus({ connected: false });
  }

  async function save() {
    setSaving(true);
    try {
      await fetch('/api/recruiter-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_url: bookingDraft, email_bcc: bccDraft, email_reply_to: replyToDraft }),
      });
      alert('✓ Configuración guardada');
      onClose();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <div>
            <div className="text-lg font-bold">Email & Agenda</div>
            <div className="text-xs text-gray-500">Configuración del envío de invitaciones y agendamiento de entrevistas</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <div className="px-6 py-5 space-y-5 text-sm">

          {/* GMAIL CONNECTION (preferred path) */}
          <div className={`rounded-lg p-4 border-2 ${gmailStatus?.connected ? 'bg-emerald-50 border-emerald-300' : 'bg-blue-50 border-blue-300'}`}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="text-xs uppercase font-semibold tracking-wider text-gray-700">Gmail · Conexión directa (recomendado)</div>
                <div className="text-sm font-bold mt-1">
                  {gmailStatus?.connected ? `✓ Conectado como ${gmailStatus.email}` : '⚠ No conectado'}
                </div>
              </div>
              {gmailStatus?.connected ? (
                <button onClick={disconnectGmail} className="text-xs px-3 py-1.5 rounded border border-red-300 text-red-700 hover:bg-red-50">
                  Desconectar
                </button>
              ) : (
                <a
                  href="/api/google/auth"
                  className="text-xs px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 font-semibold"
                >
                  Conectar Gmail
                </a>
              )}
            </div>
            <div className="text-xs text-gray-700 leading-relaxed">
              {gmailStatus?.connected ? (
                <>
                  Los correos del ATS salen <strong>desde tu cuenta {gmailStatus.email}</strong> directamente, con tu firma y branding TS.
                  Cada email queda en tu carpeta <strong>Enviados</strong> de Gmail. Reply-To y BCC funcionan sobre tu cuenta real.
                </>
              ) : (
                <>
                  Conecta tu Google Workspace una sola vez y los correos del ATS saldrán desde tu cuenta directamente.
                  Sin verificación de dominio, sin Resend, sin Elevare. Tus candidatos ven al remitente correcto, y cada email
                  queda en tu Enviados como si lo hubieras mandado a mano.
                  <br /><br />
                  <strong>Antes de conectar:</strong> el admin de Vercel debe tener configuradas las env vars{' '}
                  <code>GOOGLE_CLIENT_ID</code> y <code>GOOGLE_CLIENT_SECRET</code> (Google Cloud Console).
                </>
              )}
            </div>
          </div>

          {/* FROM (Resend fallback) */}
          <div>
            <div className="text-xs uppercase font-semibold text-gray-500 tracking-wider mb-2">{gmailStatus?.connected ? 'Resend fallback (no usado mientras Gmail esté conectado)' : 'From (remitente · EMAIL_FROM env var)'}</div>
            <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs break-all">
              {config ? config.email_from : 'cargando…'}
            </div>
            {config && config.resend_domain_status !== 'verified_ts' && (
              <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                <strong>⚠ Para que salga desde @tradingsolutions.com (no Elevare):</strong>
                <ol className="list-decimal ml-4 mt-1 space-y-0.5">
                  <li>En Resend (resend.com → Domains) agrega <code>tradingsolutions.com</code></li>
                  <li>Como tradingsolutions.com está en Google Workspace, copias los 3 registros DNS (SPF, DKIM, DMARC) y los pegas en Google Domains o el proveedor donde compraste el dominio</li>
                  <li>Espera ~10 min, click "Verify" en Resend</li>
                  <li>En Vercel → Settings → Environment Variables, edita <code>EMAIL_FROM</code>:</li>
                </ol>
                <code className="block mt-1 bg-white p-2 rounded">{`Trading Solutions Recruiting <noreply@tradingsolutions.com>`}</code>
                <div className="mt-1 text-gray-600">Recomendado: usa <code>noreply@</code> o <code>jointheteam@</code> como From, y configura abajo tu correo personal en Reply-To para que las respuestas de candidatos te lleguen directo.</div>
              </div>
            )}
          </div>

          {/* Reply-To */}
          <div>
            <label className="text-xs uppercase font-semibold text-gray-500 tracking-wider block mb-1">Reply-To (a quién responde el candidato)</label>
            <input
              type="email"
              value={replyToDraft}
              onChange={(e) => setReplyToDraft(e.target.value)}
              placeholder="kcastaneda@tradingsolutions.com"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <div className="text-xs text-gray-500 mt-1">
              Si el candidato hace click en "Responder", el correo te llega aquí (no a la bandeja noreply).
              Recomendado: tu correo de TS o Yohanna.
            </div>
          </div>

          {/* BCC */}
          <div>
            <label className="text-xs uppercase font-semibold text-gray-500 tracking-wider block mb-1">BCC (copia oculta · registro)</label>
            <input
              type="email"
              value={bccDraft}
              onChange={(e) => setBccDraft(e.target.value)}
              placeholder="kcastaneda@tradingsolutions.com"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <div className="text-xs text-gray-500 mt-1">
              Cada email saliente te llega también acá como copia oculta — el candidato no ve este correo.
              Útil para auditoría y registro sin entrar a Resend.
            </div>
          </div>

          {/* Booking URL */}
          <div>
            <label className="text-xs uppercase font-semibold text-gray-500 tracking-wider block mb-1">URL de agendamiento · entrevistas</label>
            <input
              type="url"
              value={bookingDraft}
              onChange={(e) => setBookingDraft(e.target.value)}
              placeholder="https://calendar.app.google/xxxxxxxxx"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <div className="text-xs text-gray-500 mt-1 space-y-1">
              <div><strong>Recomendado · Google Calendar Appointment Schedules</strong> (incluido en tu Google Workspace TS, sin Calendly aparte):</div>
              <ol className="list-decimal ml-5">
                <li>En Google Calendar (con tu cuenta @tradingsolutions.com), click <strong>+ Create</strong> → <strong>Appointment schedule</strong></li>
                <li>Define "Entrevista TS · 30 min", elige tus disponibilidades</li>
                <li>Activa Google Meet automático</li>
                <li>Guarda y copia el <strong>"Booking page URL"</strong> (algo como <code>calendar.app.google/...</code>)</li>
                <li>Pégalo arriba</li>
              </ol>
              <div>El sistema lo incluye automáticamente como botón "Agenda tu entrevista" en el correo cuando muevas un candidato a <code>interview</code>.</div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200 flex gap-2">
            <button onClick={save} disabled={saving} className="pill-btn pill-btn-primary text-sm flex-1 disabled:opacity-50">
              {saving ? 'Guardando…' : 'Guardar configuración'}
            </button>
            <button onClick={onClose} className="pill-btn pill-btn-outline text-sm">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScreeningDetailModal({ data, onClose }: { data: ScreeningModalData; onClose: () => void }) {
  const breakdownEntries = Object.entries(data.breakdown);
  const totalPts = breakdownEntries.reduce((s, [, v]) => s + v, 0);
  const KEYWORD_LABELS: Record<string, string> = {
    Ing: 'Ingeniería (+15)', Eng: 'Inglés bilingüe (+8)', Mat: 'Analytics/data (+4)',
    Crea: 'Creatividad (+3)', Beca: 'Beca/honors (+5)', Gest: 'Liderazgo (+3)',
    Com: 'Comunicación (+3)', Tech: 'Tools (CargoWise, CRM…) (+4)', Multi: 'Internacional (+5)',
    Comp: 'Aduanas/compras (+3)', Vend: 'Comercial (+4)', Sales: 'Sales role (+10)',
    Pricing: 'Pricing role (+10)', Documentation: 'Doc/customs role (+10)', Log: 'Logística (+5)',
  };
  const catColor = data.category === 'TOP' ? 'text-emerald-700 bg-emerald-50' : data.category === 'MEDIO' ? 'text-amber-700 bg-amber-50' : data.category === 'BAJO' ? 'text-red-700 bg-red-50' : 'text-gray-700 bg-gray-50';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <div>
            <div className="text-lg font-bold">Screening · {data.candidate.name}</div>
            <div className="text-xs text-gray-500">{data.candidate.email} · status {data.candidate.status}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Veredicto */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Score 16M</div>
              <div className="text-2xl font-bold">{data.score ?? '—'}</div>
            </div>
            <div className={`rounded-lg p-3 ${catColor}`}>
              <div className="text-[10px] uppercase tracking-wider opacity-70 font-semibold">Categoría</div>
              <div className="text-2xl font-bold">{data.category}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Prueba Elevare</div>
              <div className="text-base font-semibold mt-1">
                {data.assessmentStatus === 'completed' ? '✓ Completada' : data.assessmentStatus === 'in_progress' ? 'En curso' : data.assessmentStatus === 'sent' ? 'Enviada' : 'No enviada'}
              </div>
            </div>
          </div>

          {/* Breakdown 16 Mandamientos */}
          <div>
            <div className="text-xs uppercase font-semibold tracking-wider text-gray-500 mb-2">Detalle 16 Mandamientos · {totalPts} pts</div>
            {breakdownEntries.length === 0 ? (
              <div className="text-sm text-gray-400 italic">Sin breakdown disponible (prefilter no calculado)</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {breakdownEntries.sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center bg-emerald-50 border border-emerald-200 rounded px-2 py-1.5">
                    <div className="text-xs">{KEYWORD_LABELS[k] ?? k}</div>
                    <div className="text-sm font-bold text-emerald-700">+{v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filtros duros */}
          {data.reasons.length > 0 && (
            <div>
              <div className="text-xs uppercase font-semibold tracking-wider text-red-700 mb-2">⚠ Filtros duros activados</div>
              <ul className="text-xs space-y-1 ml-4 list-disc text-red-700">
                {data.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}

          {/* Notas / fuente CV */}
          {data.notes && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500 font-semibold uppercase tracking-wider">Notas y CV detectado</summary>
              <pre className="mt-2 bg-gray-50 rounded p-3 whitespace-pre-wrap text-[11px] max-h-60 overflow-y-auto">{data.notes}</pre>
            </details>
          )}

          <div className="border-t pt-3 text-[11px] text-gray-500">
            El screening lo ejecuta el agente <strong>Prefilter 16 Mandamientos</strong> (src/lib/agent/prefilter.ts). El humano siempre decide rechazos finales.
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentDetailModal({ agent, onClose }: { agent: 'recepcion' | 'pareo' | 'screening' | 'assessment'; onClose: () => void }) {
  const AGENT_INFO: Record<string, { icon: string; title: string; description: string; trigger: string; logic: string; modify_path: string; outputs: string[] }> = {
    recepcion: {
      icon: '📥',
      title: 'Agente de Recepción',
      description: 'Primer contacto. Toma cualquier aplicación entrante y la normaliza al ATS sin importar la fuente (formulario web, CSV LinkedIn, email, referido).',
      trigger: 'POST /api/applications · POST /api/candidates/import',
      logic: 'Valida email (regex), upserta talent_pool por email, guarda why_ts/notes, dispara prefilter inmediato.',
      modify_path: 'src/app/api/applications/route.ts · src/app/api/candidates/import/route.ts',
      outputs: ['Candidato en applications + talent_pool', 'Trigger automático del Pareo HDV y Screening'],
    },
    pareo: {
      icon: '🔍',
      title: 'Agente de Pareo HDV',
      description: 'Lee el CV y extrae estructura: experiencia, educación, herramientas, idiomas, ubicación, expectativa salarial. Usa Anthropic Sonnet 4.5.',
      trigger: 'Cuando hay cv_data en la aplicación · POST /api/cv-parse',
      logic: 'Anthropic SDK + prompt con schema JSON. Extrae years_experience, current_role, skills, education_level, languages, salary_expected.',
      modify_path: 'src/lib/cv-parser.ts · src/app/api/cv-parse/route.ts',
      outputs: ['cv_parsed_data (JSONB) en talent_pool', 'Skills inferidas para el Screening'],
    },
    screening: {
      icon: '✅',
      title: 'Agente de Screening (16 Mandamientos)',
      description: 'Calcula score 0-100 contra 16 criterios CEO (Ing, Eng, Tech, Multi, Sales, Log…), aplica filtros duros (salario tope, idioma) y categoriza TOP/MEDIO/BAJO/FILTRO_DURO. Política firme: NUNCA auto-rechaza.',
      trigger: 'Automático en cada INSERT a applications · src/lib/agent/prefilter.ts',
      logic: '13 keywords pesadas + 3 role bonuses (sales/pricing/documentation) + 2 filtros duros (salary_cap, requires_english). Output: score, breakdown, reasons, decision.',
      modify_path: 'src/lib/agent/prefilter.ts (KEYWORDS, ROLE_BONUS, VACANCY_CONFIG)',
      outputs: ['applications.score (INT)', 'applications.prefilter_data (JSONB con breakdown y reasons)', 'status inicial: reviewing/new (nunca rejected)'],
    },
    assessment: {
      icon: '📧',
      title: 'Agente de Assessment',
      description: 'Genera token único, envía invitación por email vía Resend, trackea status (sent → in_progress → completed) con anti-trampa (cámara + tab tracking).',
      trigger: 'POST /api/assessments con send_email:true · disponible desde Vacantes y Evaluaciones',
      logic: 'Crea fila en assessment_tokens (Neon) o ht_candidates (Supabase). Email HTML bilingüe. Link válido 30d. Auto-save cada respuesta.',
      modify_path: 'src/app/api/assessments/route.ts · src/app/api/headhunting/candidates/invite/route.ts · src/app/assessment/ht/[token]/page.tsx',
      outputs: ['assessment_tokens row + email enviado', 'ht_responses con cada respuesta del candidato', 'Reporte final con benchmark TS DNA'],
    },
  };
  const info = AGENT_INFO[agent];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{info.icon}</div>
            <div>
              <div className="text-lg font-bold">{info.title}</div>
              <div className="text-xs text-gray-500">Agente activo · módulo del ATS</div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4 text-sm">
          <p className="text-gray-700 leading-relaxed">{info.description}</p>

          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Trigger</span>
              <div className="font-mono text-xs">{info.trigger}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Lógica</span>
              <div className="text-xs">{info.logic}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Outputs</span>
              <ul className="text-xs ml-4 list-disc">
                {info.outputs.map((o, i) => <li key={i}>{o}</li>)}
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-blue-400 bg-blue-50 px-3 py-2 rounded-r">
            <div className="text-[10px] uppercase tracking-wider text-blue-700 font-semibold mb-1">Para modificar este agente</div>
            <div className="text-xs font-mono text-blue-900">{info.modify_path}</div>
            <div className="text-[11px] text-gray-600 mt-1">
              Edita el archivo, redeploy a Vercel y el agente toma los cambios en frío. Para staging seguro, prueba primero en /assessment/ht/preview.
            </div>
          </div>

          <div className="border-t pt-3 text-[11px] text-gray-500">
            La modificación profunda (re-prompts, nuevos campos, cambios en scoring) la haremos juntas en próximas sesiones — esta vista es para auditoría rápida.
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineSummary({ stats }: { stats?: VacancyAppStats }) {
  if (!stats) return <div className="h-12" />;
  const stages = [
    { label: 'Recibidas', value: stats.total },
    { label: 'En revisión', value: stats.new + stats.reviewing },
    { label: 'Entrevista', value: stats.interview },
    { label: 'Oferta', value: stats.offer },
    { label: 'Hired', value: stats.hired },
  ];
  const max = Math.max(1, ...stages.map((s) => s.value));
  return (
    <div className="grid grid-cols-5 gap-2">
      {stages.map((s, i) => (
        <div key={s.label} className="bg-white rounded-lg border border-gray-200 px-3 py-2">
          <div className="text-[10px] uppercase tracking-wide text-gray-500">{s.label}</div>
          <div className="text-lg font-bold">{s.value}</div>
          <div className="h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${(s.value / max) * 100}%` }} />
          </div>
          {i < stages.length - 1 && stages[i].value > 0 && (
            <div className="text-[10px] text-gray-400 mt-1">
              → {stages[i + 1].value > 0 ? `${Math.round((stages[i + 1].value / s.value) * 100)}%` : '0%'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AgenteBox({ icon, title, desc, status, onClick }: { icon: string; title: string; desc: string; status: 'active' | 'idle'; onClick?: () => void }) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={`text-left bg-white rounded-lg border border-gray-200 p-3 ${onClick ? 'hover:border-black hover:shadow-sm transition cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-base">{icon}</span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
          {status === 'active' ? 'ACTIVO' : 'STANDBY'}
        </span>
      </div>
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-gray-500 leading-tight mt-0.5">{desc}</div>
      {onClick && <div className="text-[10px] text-blue-600 mt-1.5">Ver detalle ↗</div>}
    </Wrapper>
  );
}

function MarketResearchModal({ vacancies, onClose }: { vacancies: LiveVacancy[]; onClose: () => void }) {
  const [vacancyId, setVacancyId] = useState<number | ''>('');
  const [role, setRole] = useState('');
  const [locale, setLocale] = useState<'colombia' | 'latam' | 'us_remote' | 'global'>('colombia');
  const [extras, setExtras] = useState('');
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);

  // Auto-rellenar role cuando se elige vacancy
  useEffect(() => {
    if (vacancyId !== '') {
      const v = vacancies.find((x) => x.id === vacancyId);
      if (v) setRole(v.title_es ?? v.title ?? '');
    }
  }, [vacancyId, vacancies]);

  async function generate() {
    setGenerating(true);
    setReport(null);
    try {
      const r = await fetch('/api/agents/market-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vacancy_id: vacancyId || null, role, locale, extras }),
      });
      const j = await r.json();
      setReport(j.report);
    } catch (e) {
      setReport({ error: e instanceof Error ? e.message : 'unknown' });
    } finally {
      setGenerating(false);
    }
  }

  const r = report as Record<string, unknown> | null;
  const sb = r?.salary_benchmark as Record<string, unknown> | undefined;
  const ts = r?.talent_supply as Record<string, unknown> | undefined;
  const bi = r?.bilingualism as Record<string, unknown> | undefined;
  const cm = r?.competitiveness as Record<string, unknown> | undefined;
  const eb = r?.employer_brand_impact as Record<string, unknown> | undefined;
  const actions = (r?.recommended_actions as Array<Record<string, unknown>>) ?? [];
  const sources = (r?.sources as Array<Record<string, unknown>>) ?? [];
  const alerts = (r?.alerts as string[]) ?? [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <div className="text-lg font-bold">Agente Market Research</div>
            <div className="text-xs text-gray-500">Estudio de mercado · benchmark salarial · employer brand</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>

        <div className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 block mb-1">Vacante (opcional, autorellena rol)</label>
              <select value={vacancyId === '' ? '' : String(vacancyId)} onChange={(e) => setVacancyId(e.target.value === '' ? '' : parseInt(e.target.value, 10))} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                <option value="">— sin vacante específica —</option>
                {vacancies.map((v) => (<option key={v.id} value={v.id}>{v.title_es ?? v.title}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Geografía</label>
              <select value={locale} onChange={(e) => setLocale(e.target.value as typeof locale)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                <option value="colombia">Colombia (BAQ + Bogotá + Medellín)</option>
                <option value="latam">Latinoamérica</option>
                <option value="us_remote">USA remote (talent latam)</option>
                <option value="global">Global</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">Rol específico</label>
            <input value={role} onChange={(e) => setRole(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="ej. Inside Sales Support Specialist" />
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">Contexto adicional (opcional)</label>
            <textarea value={extras} onChange={(e) => setExtras(e.target.value)} rows={2} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="ej. requirimos inglés C1, viajes, equipo internacional…" />
          </div>
          <button onClick={generate} disabled={!role || generating} className="pill-btn pill-btn-primary text-sm w-full disabled:opacity-50" style={{ backgroundColor: '#1F4FBF' }}>
            {generating ? 'Investigando mercado…' : '🌍 Generar estudio de mercado'}
          </button>

          {/* RESULTADO */}
          {r && (
            <div className="space-y-4 pt-3">
              {(r.executive_summary as string | undefined) && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-blue-700 mb-1">Resumen ejecutivo</div>
                  <div className="text-sm text-blue-900">{r.executive_summary as string}</div>
                </div>
              )}

              {alerts.length > 0 && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 space-y-1.5">
                  <div className="text-xs uppercase font-semibold text-amber-800 tracking-wider">⚠ Alertas</div>
                  {alerts.map((a, i) => (
                    <div key={i} className="text-xs text-amber-900">• {a}</div>
                  ))}
                </div>
              )}

              {sb && (
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="text-xs uppercase font-semibold text-gray-500 tracking-wider mb-2">Benchmark salarial · {sb.currency as string}</div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-gray-50 rounded px-2 py-1.5">
                      <div className="text-[10px] text-gray-500">Mín</div>
                      <div className="text-sm font-bold">{(sb.market_low as number | undefined)?.toLocaleString() ?? '—'}</div>
                    </div>
                    <div className="bg-gray-50 rounded px-2 py-1.5">
                      <div className="text-[10px] text-gray-500">Mediana</div>
                      <div className="text-sm font-bold">{(sb.market_median as number | undefined)?.toLocaleString() ?? '—'}</div>
                    </div>
                    <div className="bg-gray-50 rounded px-2 py-1.5">
                      <div className="text-[10px] text-gray-500">Máx</div>
                      <div className="text-sm font-bold">{(sb.market_high as number | undefined)?.toLocaleString() ?? '—'}</div>
                    </div>
                    <div className={`rounded px-2 py-1.5 ${sb.ts_position === 'below' ? 'bg-red-50' : sb.ts_position === 'above' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                      <div className="text-[10px] text-gray-500">TS actual</div>
                      <div className="text-sm font-bold">{(sb.ts_current as number | undefined)?.toLocaleString() ?? '—'}</div>
                      <div className="text-[10px]">{sb.ts_position as string} · {sb.delta_vs_median_pct as number}%</div>
                    </div>
                  </div>
                  {sb.notes ? <div className="text-[11px] text-gray-500 mt-2">{sb.notes as string}</div> : null}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {ts && (
                  <div className="border border-gray-200 rounded-lg p-3">
                    <div className="text-xs uppercase font-semibold text-gray-500 tracking-wider mb-2">Oferta de talento</div>
                    <div className="text-sm">Pool total: <strong>{ts.total_pool_estimated as string}</strong></div>
                    <div className="text-sm">Calificados: <strong>{ts.qualified_for_role_estimated as string}</strong></div>
                    <div className="text-sm mt-1">Competencia: <span className={`font-semibold ${ts.competition_for_talent === 'high' ? 'text-red-700' : ts.competition_for_talent === 'medium' ? 'text-amber-700' : 'text-emerald-700'}`}>{ts.competition_for_talent as string}</span></div>
                    {Array.isArray(ts.biggest_local_employers_competing) && (
                      <div className="text-[11px] text-gray-500 mt-1">Compiten: {(ts.biggest_local_employers_competing as string[]).join(', ')}</div>
                    )}
                  </div>
                )}
                {bi && (
                  <div className="border border-gray-200 rounded-lg p-3">
                    <div className="text-xs uppercase font-semibold text-gray-500 tracking-wider mb-2">Bilingüismo</div>
                    <div className="text-sm">Nivel requerido: <strong>{bi.english_required_level as string}</strong></div>
                    <div className="text-sm">% bilingüe local: <strong>{bi.pct_bilingual_locally as number}%</strong></div>
                    <div className="text-sm">% al nivel: <strong>{bi.pct_at_required_level as number}%</strong></div>
                    <div className="text-sm mt-1">Escasez: <span className={`font-semibold ${bi.scarcity_factor === 'very_scarce' ? 'text-red-700' : bi.scarcity_factor === 'scarce' ? 'text-amber-700' : 'text-emerald-700'}`}>{bi.scarcity_factor as string}</span></div>
                    {bi.notes ? <div className="text-[11px] text-gray-500 mt-1">{bi.notes as string}</div> : null}
                  </div>
                )}
              </div>

              {cm && (
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xs uppercase font-semibold text-gray-500 tracking-wider">Competitividad TS</div>
                    <div className="text-2xl font-bold">{cm.overall_score_0_100 as number}<span className="text-xs text-gray-400">/100</span></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {(['vs_lean_solutions', 'vs_multinacionales', 'vs_freelance_us_market'] as const).map((k) => {
                      const x = cm[k] as Record<string, unknown> | undefined;
                      if (!x) return null;
                      return (
                        <div key={k} className="bg-gray-50 rounded px-2 py-1.5">
                          <div className="text-[10px] text-gray-500 uppercase">{k.replace('vs_', '').replace('_', ' ')}</div>
                          <div>Salario: {x.salary as string}</div>
                          {x.benefits ? <div>Beneficios: {x.benefits as string}</div> : null}
                          {x.brand ? <div>Brand: {x.brand as string}</div> : null}
                          {x.feasibility ? <div>Feasible: {x.feasibility as string}</div> : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {eb && (
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="text-xs uppercase font-semibold text-gray-500 tracking-wider mb-2">Employer brand · impacto</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-emerald-50 rounded px-2 py-1.5"><div className="text-[10px] uppercase text-emerald-700 font-semibold">Fortaleza</div>{eb.current_strength as string}</div>
                    <div className="bg-red-50 rounded px-2 py-1.5"><div className="text-[10px] uppercase text-red-700 font-semibold">Debilidad</div>{eb.current_weakness as string}</div>
                    <div className="bg-blue-50 rounded px-2 py-1.5 col-span-2"><div className="text-[10px] uppercase text-blue-700 font-semibold">Story para top talent</div>{eb.story_to_tell_top_talent as string}</div>
                    <div className="bg-purple-50 rounded px-2 py-1.5 col-span-2"><div className="text-[10px] uppercase text-purple-700 font-semibold">Moat competitivo</div>{eb.competitive_moat as string}</div>
                  </div>
                </div>
              )}

              {actions.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="text-xs uppercase font-semibold text-gray-500 tracking-wider mb-2">Acciones recomendadas</div>
                  <div className="space-y-1.5">
                    {actions.map((a, i) => {
                      const p = a.priority as string;
                      const color = p === 'high' ? 'border-red-300 bg-red-50' : p === 'medium' ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-gray-50';
                      return (
                        <div key={i} className={`border ${color} rounded px-2 py-1.5 text-xs`}>
                          <div className="font-semibold uppercase text-[10px]">{p}</div>
                          <div>{a.action as string}</div>
                          <div className="text-gray-600 italic">→ {a.expected_impact as string}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {sources.length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500 font-semibold uppercase tracking-wider">Fuentes citadas ({sources.length})</summary>
                  <ul className="mt-2 space-y-1 ml-4 list-disc">
                    {sources.map((s, i) => (
                      <li key={i}>
                        <strong>{s.name as string}</strong>
                        {s.url_hint ? <span className="text-gray-500"> · {s.url_hint as string}</span> : null}
                        {s.needs_verification ? <span className="ml-1 text-amber-700">⚠ verificar</span> : null}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function JobWriterModal({ onClose }: { onClose: () => void }) {
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('mid');
  const [extras, setExtras] = useState('');
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string>('');

  async function generate() {
    setGenerating(true);
    setResult('');
    try {
      const r = await fetch('/api/agents/job-writer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, department, level, extras, language }),
      });
      const j = await r.json();
      if (j.error) {
        setResult(`Error: ${j.error}`);
      } else {
        setResult(j.posting ?? '');
      }
    } catch (e) {
      setResult(`Error: ${e instanceof Error ? e.message : 'unknown'}`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <div>
            <div className="text-lg font-bold">Agente Job Writer</div>
            <div className="text-xs text-gray-500">Genera el posting con el formato Trading Solutions</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div>
            <label className="text-xs text-gray-600 block mb-1">Rol / título</label>
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="ej. Pricing Senior Analyst" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-600 block mb-1">Departamento</label>
              <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Comercial / Finanzas / Operaciones" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Nivel</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                <option value="junior">Junior</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead / Manager</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Idioma</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value as 'es' | 'en')} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">Contexto adicional (opcional)</label>
            <textarea value={extras} onChange={(e) => setExtras(e.target.value)} rows={3} placeholder="Necesidades específicas: herramientas, certificaciones, equipo a liderar, etc." className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
          </div>
          <button
            onClick={generate}
            disabled={!role || generating}
            className="pill-btn pill-btn-primary text-sm w-full disabled:opacity-50"
          >
            {generating ? 'Generando…' : '✨ Escribir job posting'}
          </button>
          {result && (
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs uppercase font-semibold text-gray-500">Borrador generado</div>
                <button
                  onClick={() => navigator.clipboard.writeText(result)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Copiar
                </button>
              </div>
              <pre className="text-xs whitespace-pre-wrap font-sans">{result}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ======================================================== */
/* Pipeline Kanban                                          */
/* ======================================================== */
type LiveCandidate = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  source: string | null;
  tags: string | null;
  notes: string | null;
  summary: string | null;
};

type PipelineStage = "aplicacion" | "pruebas" | "completada" | "entrevista" | "oferta";

function Pipeline() {
  const [vacs, setVacs] = useState<LiveVacancy[]>([]);
  const [vacancyId, setVacancyId] = useState<number | null>(null);
  const [tokens, setTokens] = useState<LiveToken[]>([]);
  const [pool, setPool] = useState<LiveCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Cargar vacantes y seleccionar la primera por defecto
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/vacancies", { cache: "no-store" });
      const j = await r.json();
      const list = (Array.isArray(j) ? j : j.data ?? []) as LiveVacancy[];
      setVacs(list);
      if (list.length > 0 && vacancyId === null) setVacancyId(list[0].id);
    })();
  }, [vacancyId]);

  // 2. Cargar talent_pool + assessments cada vez que cambia la vacante
  useEffect(() => {
    if (!vacancyId) return;
    setLoading(true);
    (async () => {
      try {
        const [tpR, asR] = await Promise.all([
          fetch("/api/talent-pool?limit=500", { cache: "no-store" }).then((r) => r.json()),
          fetch(`/api/assessments?vacancy_id=${vacancyId}&limit=500`, { cache: "no-store" }).then((r) => r.json()),
        ]);
        setPool((tpR.data ?? []) as LiveCandidate[]);
        setTokens((asR.data ?? []) as LiveToken[]);
      } finally {
        setLoading(false);
      }
    })();
  }, [vacancyId]);

  const currentVac = vacs.find((v) => v.id === vacancyId);
  const slug = currentVac?.slug ?? "";

  // 3. Filtrar candidatos del pool que aplican a esta vacante (por tags o notes)
  const candidatesForVacancy = useMemo(() => {
    if (!slug) return [] as LiveCandidate[];
    return pool.filter((c) => {
      const hay = `${c.tags ?? ""} ${c.notes ?? ""}`.toLowerCase();
      return hay.includes(slug.toLowerCase()) || hay.includes(currentVac?.title_es?.toLowerCase() ?? "z__");
    });
  }, [pool, slug, currentVac]);

  // 4. Mapear cada candidato al stage según su token de assessment
  const tokenByEmail = useMemo(() => {
    const m: Record<string, LiveToken> = {};
    for (const t of tokens) m[t.candidate_email.toLowerCase()] = t;
    return m;
  }, [tokens]);

  function stageFor(c: LiveCandidate): PipelineStage {
    const t = tokenByEmail[c.email.toLowerCase()];
    if (!t) return "aplicacion";
    if (t.status === "completed") {
      const s = t.score ?? 0;
      if (s >= 85) return "oferta";
      if (s >= 70) return "entrevista";
      return "completada";
    }
    if (t.status === "in_progress" || t.status === "sent" || t.status === "expired") return "pruebas";
    return "aplicacion";
  }

  const stages: { id: PipelineStage; label: string }[] = [
    { id: "aplicacion", label: "APLICACIÓN" },
    { id: "pruebas", label: "PRUEBA ENVIADA" },
    { id: "completada", label: "PRUEBA COMPLETA" },
    { id: "entrevista", label: "ENTREVISTA HUMANA" },
    { id: "oferta", label: "OFERTA & FIRMA" },
  ];

  const grouped: Record<PipelineStage, LiveCandidate[]> = {
    aplicacion: [],
    pruebas: [],
    completada: [],
    entrevista: [],
    oferta: [],
  };
  for (const c of candidatesForVacancy) grouped[stageFor(c)].push(c);

  const totalApps = candidatesForVacancy.length;

  return (
    <>
      <PageHead
        title={`Pipeline · ${currentVac?.title_es ?? currentVac?.title ?? "—"}`}
        desc={
          loading
            ? "Cargando…"
            : `${totalApps} candidato(s) en este pipeline · Etapas según estado de la evaluación`
        }
        actions={
          <>
            <select
              value={vacancyId ?? ""}
              onChange={(e) => setVacancyId(e.target.value ? Number(e.target.value) : null)}
              className="pill-btn pill-btn-outline text-xs cursor-pointer"
              style={{ padding: "9px 14px", appearance: "none" }}
            >
              {vacs.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title_es ?? v.title ?? v.slug}
                </option>
              ))}
            </select>
          </>
        }
      />

      <div className="grid grid-cols-5 gap-2.5 overflow-x-auto">
        {stages.map((s) => {
          const list = grouped[s.id];
          return (
            <div
              key={s.id}
              className="bg-white border border-gray-200 rounded-2xl p-2.5 min-h-[520px] flex flex-col"
            >
              <div className="flex justify-between items-center px-1 pb-2.5 border-b border-gray-200 mb-2">
                <h4 className="text-[12px] font-bold tracking-wide m-0">{s.label}</h4>
                <span className="text-[11px] text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded-full">
                  {list.length}
                </span>
              </div>
              <div className="space-y-2 overflow-y-auto">
                {loading && list.length === 0 && (
                  <div className="text-[11px] text-gray-400 text-center py-4">Cargando…</div>
                )}
                {!loading && list.length === 0 && (
                  <div className="text-[11px] text-gray-300 text-center py-4">—</div>
                )}
                {list.map((c) => {
                  const t = tokenByEmail[c.email.toLowerCase()];
                  const score = t?.score ?? null;
                  const src = (c.source ?? "").toLowerCase();
                  const srcLabel = src.includes("linkedin")
                    ? "LinkedIn TS"
                    : src.includes("elevare")
                    ? "Elevare"
                    : src.includes("email") || src.includes("manual")
                    ? "Email"
                    : src || "—";
                  const color: "green" | "black" | "amber" = score
                    ? score >= 85
                      ? "green"
                      : score >= 70
                      ? "black"
                      : "amber"
                    : "gray" as "black";
                  // Sacar primera línea de notes para meta
                  const meta = (c.summary || c.notes || "").split("\n")[0].slice(0, 60);
                  return (
                    <div
                      key={c.id}
                      className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 hover:border-black transition-colors"
                    >
                      <div className="text-[13px] font-semibold truncate">{c.full_name}</div>
                      {meta && (
                        <div className="text-[11px] text-gray-500 mt-0.5 truncate">{meta}</div>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <span
                          className={`text-[10px] font-semibold ${
                            srcLabel === "LinkedIn TS" ? "text-[#0A66C2]" : "text-gray-600"
                          }`}
                        >
                          {srcLabel === "LinkedIn TS" && "in · "}
                          {srcLabel}
                        </span>
                        {score !== null && <Pill color={color}>{score}</Pill>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ======================================================== */
/* CV Bank                                                  */
/* ======================================================== */
function CVBank() {
  const [pool, setPool] = useState<LiveCandidate[]>([]);
  const [tokens, setTokens] = useState<LiveToken[]>([]);
  const [vacs, setVacs] = useState<LiveVacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeChip, setActiveChip] = useState("todos");
  const [matchVacancyId, setMatchVacancyId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const [tpR, asR, vacR] = await Promise.all([
        fetch("/api/talent-pool?limit=1000", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/assessments?limit=500", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/vacancies", { cache: "no-store" }).then((r) => r.json()),
      ]);
      setPool((tpR.data ?? []) as LiveCandidate[]);
      setTokens((asR.data ?? []) as LiveToken[]);
      const vacList = (Array.isArray(vacR) ? vacR : vacR.data ?? []) as LiveVacancy[];
      setVacs(vacList);
      if (vacList.length > 0) setMatchVacancyId(vacList[0].id);
      setLoading(false);
    })();
  }, []);

  const tokenByEmail = useMemo(() => {
    const m: Record<string, LiveToken> = {};
    for (const t of tokens) m[t.candidate_email.toLowerCase()] = t;
    return m;
  }, [tokens]);

  // Conteos para los chips
  const counts = useMemo(() => {
    const total = pool.length;
    const fromLI = pool.filter((c) => (c.source ?? "").toLowerCase().includes("linkedin")).length;
    const fromElevare = pool.filter((c) => (c.source ?? "").toLowerCase().includes("elevare")).length;
    const fromEmail = pool.filter((c) => (c.source ?? "").toLowerCase().includes("email") || (c.source ?? "").toLowerCase().includes("manual")).length;
    const baq = pool.filter((c) => `${c.notes ?? ""} ${c.summary ?? ""}`.toLowerCase().includes("barranq")).length;
    const matchedHigh = pool.filter((c) => {
      const t = tokenByEmail[c.email.toLowerCase()];
      return t && t.score && t.score >= 80;
    }).length;
    const completedAssessment = pool.filter((c) => {
      const t = tokenByEmail[c.email.toLowerCase()];
      return t?.status === "completed";
    }).length;
    return { total, fromLI, fromElevare, fromEmail, baq, matchedHigh, completedAssessment };
  }, [pool, tokenByEmail]);

  const chips = [
    { id: "todos", label: `Todos · ${counts.total}` },
    { id: "match80", label: `Match ≥ 80 · ${counts.matchedHigh}` },
    { id: "evaluados", label: `Candidatos evaluados · ${counts.completedAssessment}` },
    { id: "linkedin", label: `LinkedIn TS · ${counts.fromLI}` },
    { id: "elevare", label: `Elevare · ${counts.fromElevare}` },
    { id: "email", label: `Email/Manual · ${counts.fromEmail}` },
    { id: "baq", label: `Barranquilla · ${counts.baq}` },
  ];

  // Filtrado por chip + búsqueda
  const filtered = useMemo(() => {
    let list = pool;
    if (activeChip === "match80")
      list = list.filter((c) => {
        const t = tokenByEmail[c.email.toLowerCase()];
        return t && t.score && t.score >= 80;
      });
    else if (activeChip === "evaluados")
      list = list.filter((c) => tokenByEmail[c.email.toLowerCase()]?.status === "completed");
    else if (activeChip === "linkedin")
      list = list.filter((c) => (c.source ?? "").toLowerCase().includes("linkedin"));
    else if (activeChip === "elevare")
      list = list.filter((c) => (c.source ?? "").toLowerCase().includes("elevare"));
    else if (activeChip === "email")
      list = list.filter((c) => {
        const s = (c.source ?? "").toLowerCase();
        return s.includes("email") || s.includes("manual");
      });
    else if (activeChip === "baq")
      list = list.filter((c) => `${c.notes ?? ""} ${c.summary ?? ""}`.toLowerCase().includes("barranq"));

    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((c) =>
        `${c.full_name} ${c.email} ${c.tags ?? ""} ${c.notes ?? ""} ${c.summary ?? ""}`
          .toLowerCase()
          .includes(s)
      );
    }
    return list;
  }, [pool, activeChip, search, tokenByEmail]);

  const matchVac = vacs.find((v) => v.id === matchVacancyId);

  return (
    <>
      <PageHead
        title="CV Bank · Talent Pool"
        desc={
          loading
            ? "Cargando perfiles…"
            : `${counts.total} perfiles activos · LinkedIn TS, Elevare, Email/Manual · Re-matching contra cualquier vacante`
        }
        actions={
          <>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button className="pill-btn text-xs bg-[#0A66C2] text-white hover:bg-[#084D94]" style={{ padding: "9px 14px" }}>
              <Linkedin className="w-3.5 h-3.5" /> Importar LinkedIn TS
            </button>
          </>
        }
      />

      <div className="flex gap-2 mb-3">
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-full">
          <Search className="w-3.5 h-3.5 text-gray-500" />
          <input
            className="flex-1 bg-transparent outline-none text-sm"
            placeholder="Busca por nombre, email, empresa, skill, idioma…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={matchVacancyId ?? ""}
          onChange={(e) => setMatchVacancyId(e.target.value ? Number(e.target.value) : null)}
          className="pill-btn pill-btn-outline text-xs cursor-pointer"
          style={{ padding: "9px 14px", appearance: "none" }}
        >
          {vacs.map((v) => (
            <option key={v.id} value={v.id}>
              Match contra: {v.title_es ?? v.title ?? v.slug}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 flex-wrap mb-4">
        {chips.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveChip(c.id)}
            className={`filter-chip ${activeChip === c.id ? "active" : ""}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        <KPI label="Total perfiles" value={loading ? "…" : String(counts.total)} delta="En Neon" tone="neutral" />
        <KPI label="Desde LinkedIn TS" value={String(counts.fromLI)} delta={`${counts.total > 0 ? Math.round((counts.fromLI / counts.total) * 100) : 0}%`} tone="neutral" />
        <KPI label="Candidatos evaluados" value={String(counts.completedAssessment)} delta="Con score" />
        <KPI label="Mostrando" value={String(filtered.length)} delta={`de ${counts.total}`} tone="neutral" />
      </div>

      <h3 className="text-sm font-bold mb-3">
        {matchVac
          ? `Match contra · ${matchVac.title_es ?? matchVac.title ?? matchVac.slug}`
          : "Coincidencias"}{" "}
        ({filtered.length})
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {filtered.slice(0, 60).map((c) => {
          const t = tokenByEmail[c.email.toLowerCase()];
          const score = t?.score ?? null;
          const init = c.full_name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase() ?? "")
            .join("");
          const src = (c.source ?? "").toLowerCase();
          const srcLabel = src.includes("linkedin")
            ? "LinkedIn TS"
            : src.includes("elevare")
            ? "Elevare"
            : src.includes("email") || src.includes("manual")
            ? "Email"
            : src || "—";
          // Sacar primer "rol/empresa" del notes
          const noteFirst = (c.notes ?? "").split("\n")[0].slice(0, 60);
          // Detectar inglés del summary/notes
          const engMatch = `${c.notes ?? ""} ${c.summary ?? ""}`.match(/\b(EN[:\s]*|inglés[:\s]*)?(C[12]|B[12]|A[12]|nativo|bilingüe|advanced)\b/i);
          const en = engMatch ? engMatch[2].toUpperCase().slice(0, 2) : "—";
          // Match calculado: si tiene assessment para esta vacante usamos ese score
          const matchHere = matchVac && t?.vacancy_slug === matchVac.slug ? score : null;
          return (
            <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-4 relative">
              <span
                className={`absolute top-2.5 right-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  srcLabel === "LinkedIn TS"
                    ? "bg-[#E7F1FA] text-[#0A66C2]"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {srcLabel === "LinkedIn TS" && "in · "}
                {srcLabel}
              </span>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-[13px]">
                  {init || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold truncate">{c.full_name}</div>
                  <div className="text-xs text-gray-500 truncate">{noteFirst || c.email}</div>
                </div>
              </div>
              <div className="flex gap-3 text-xs text-gray-500 mt-2">
                <div>
                  <b className="block text-black text-[13px] leading-tight">{en}</b>Inglés
                </div>
                <div>
                  <b className="block text-black text-[13px] leading-tight truncate max-w-[80px]">{c.email.split("@")[0]}</b>Email
                </div>
              </div>
              <div className="pt-2.5 mt-2.5 border-t border-gray-100 text-xs text-gray-500">
                {matchHere !== null ? (
                  <div className="flex justify-between items-center mt-1">
                    <span>Match {matchVac?.title_es ?? matchVac?.title}</span>
                    <Pill color={matchHere >= 85 ? "green" : matchHere >= 75 ? "black" : "amber"}>
                      {matchHere}
                    </Pill>
                  </div>
                ) : score !== null ? (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[11px] text-gray-500">Ya completó prueba en otra vacante</span>
                    <Pill color={score >= 85 ? "green" : score >= 75 ? "black" : "amber"}>
                      {score}
                    </Pill>
                  </div>
                ) : (
                  <div className="text-[11px] text-gray-400 italic">Aún no ha sido evaluado</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length > 60 && (
        <div className="text-center text-xs text-gray-500 mt-4">
          Mostrando 60 de {filtered.length}. Refina con la búsqueda para ver más.
        </div>
      )}
    </>
  );
}

/* ======================================================== */
/* Entrevistas IA                                           */
/* ======================================================== */
type InterviewQuestion = {
  n: number;
  dimension: string;
  type: 'validate_flag' | 'confirm_strength' | 'situational';
  question: string;
  look_for: string;
  red_flag: string;
};

type InterviewGuide = {
  summary?: string;
  questions?: InterviewQuestion[];
  interpretation_guide?: string;
  raw?: string;
};

type InterviewPrepResponse = {
  candidate: { id: number; name: string; email: string; status: string; score_16_mandamientos: number | null };
  vacancy: { id?: number; title?: string; department?: string };
  profile_snapshot: Record<string, unknown>;
  focus_points: string[];
  low_signals: string[];
  strengths: string[];
  guide: InterviewGuide;
};

function Entrevistas() {
  const [apps, setApps] = useState<Array<{ id: number; full_name: string; email: string; status: string; score: number | null; job_id: number; job_title: string }>>([]);
  const [vacs, setVacs] = useState<LiveVacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [vacancyFilter, setVacancyFilter] = useState<number | 'all'>('all');
  const [activeApp, setActiveApp] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [guide, setGuide] = useState<InterviewPrepResponse | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [synthesizing, setSynthesizing] = useState(false);
  const [dossier, setDossier] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    (async () => {
      const [appR, vacR] = await Promise.all([
        fetch('/api/applications?limit=500', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/vacancies', { cache: 'no-store' }).then((r) => r.json()),
      ]);
      const arr = (appR.applications ?? appR.data ?? []) as typeof apps;
      setApps(arr.filter((a) => ['reviewing', 'interview'].includes(a.status)));
      setVacs((Array.isArray(vacR) ? vacR : vacR.data ?? []) as LiveVacancy[]);
      setLoading(false);
    })();
  }, []);

  const filtered = vacancyFilter === 'all' ? apps : apps.filter((a) => a.job_id === vacancyFilter);
  const activeAppData = apps.find((a) => a.id === activeApp) ?? null;

  async function generatePrep(applicationId: number) {
    setGenerating(true);
    setGuide(null);
    setAnswers({});
    setDossier(null);
    try {
      const r = await fetch('/api/agents/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId }),
      });
      const j = await r.json();
      setGuide(j as InterviewPrepResponse);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  }

  async function synthesize() {
    if (!guide?.guide?.questions || !activeApp) return;
    const formatted = guide.guide.questions.map((q) => ({
      n: q.n,
      dimension: q.dimension,
      question: q.question,
      answer: answers[q.n] ?? '(sin respuesta)',
    }));
    setSynthesizing(true);
    setDossier(null);
    try {
      const r = await fetch('/api/agents/interview-synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: activeApp, answers: formatted }),
      });
      const j = await r.json();
      setDossier(j.dossier);
    } catch (e) {
      console.error(e);
    } finally {
      setSynthesizing(false);
    }
  }

  return (
    <>
      <PageHead
        title="Entrevistas IA · Complemento al perfil psicométrico"
        desc="La entrevista IA genera preguntas STAR específicas según los puntos a validar de la prueba Elevare. No es un cuestionario genérico — es targeted al candidato y a la vacante."
        actions={
          <>
            <select
              value={vacancyFilter === 'all' ? 'all' : String(vacancyFilter)}
              onChange={(e) => setVacancyFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
              className="text-xs border border-gray-300 rounded-md px-3 py-2 bg-white"
              style={{ minWidth: 220 }}
            >
              <option value="all">Todas las vacantes ({apps.length})</option>
              {vacs.map((v) => (
                <option key={v.id} value={v.id}>{v.title_es ?? v.title}</option>
              ))}
            </select>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <KPI label="Listos para entrevista" value={loading ? '…' : String(apps.length)} delta="Status reviewing/interview" />
        <KPI label="Por vacante seleccionada" value={loading ? '…' : String(filtered.length)} delta={vacancyFilter === 'all' ? 'sin filtro' : 'filtrados'} tone="neutral" />
        <KPI label="Modelo IA" value="Sonnet 4.5" delta="Anthropic" tone="neutral" />
        <KPI label="Cobertura test" value="29 escenarios" delta="21 dim psicométricas" tone="neutral" />
      </div>

      <div className="grid grid-cols-3 gap-4" style={{ gridTemplateColumns: '1fr 2fr' }}>
        {/* Lista de candidatos */}
        <Card title="Candidatos listos" eyebrow="reviewing + interview">
          {loading && <div className="text-sm text-gray-400 py-6 text-center">Cargando…</div>}
          {!loading && filtered.length === 0 && (
            <div className="text-sm text-gray-400 py-6 text-center">
              Sin candidatos en estado para entrevista.
            </div>
          )}
          <div className="space-y-1">
            {filtered.map((a) => {
              const isActive = activeApp === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => { setActiveApp(a.id); setGuide(null); setAnswers({}); setDossier(null); }}
                  className={`w-full text-left border rounded-lg px-3 py-2 transition ${isActive ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold truncate">{a.full_name}</div>
                      <div className="text-xs text-gray-500 truncate">{a.job_title}</div>
                    </div>
                    <div className="text-right shrink-0">
                      {a.score !== null && <div className="text-sm font-bold">{a.score}</div>}
                      <Pill color={a.status === 'interview' ? 'black' : 'green'}>{a.status}</Pill>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Panel de entrevista */}
        <Card title="Guía de entrevista IA" eyebrow={activeAppData ? activeAppData.full_name.toUpperCase() : 'SELECCIONA UN CANDIDATO'}>
          {!activeAppData && (
            <div className="text-sm text-gray-400 py-12 text-center">
              Selecciona un candidato a la izquierda y genera la guía.
            </div>
          )}

          {activeAppData && !guide && !generating && (
            <div className="py-10 text-center">
              <div className="text-sm text-gray-600 mb-1">Listo para generar guía de entrevista IA para <strong>{activeAppData.full_name}</strong>.</div>
              <div className="text-xs text-gray-400 mb-4">El agente cruzará el CV + prefilter + prueba Elevare (si la completó) y generará 6-8 preguntas STAR targeted.</div>
              <button onClick={() => generatePrep(activeAppData.id)} className="pill-btn pill-btn-primary text-sm">
                <Sparkles className="w-3.5 h-3.5" /> Generar guía IA
              </button>
            </div>
          )}

          {generating && (
            <div className="text-sm text-gray-500 py-12 text-center">Generando guía con Anthropic Sonnet 4.5…</div>
          )}

          {guide && (
            <div className="space-y-4">
              {/* Profile snapshot */}
              <div className="bg-gray-50 rounded-lg p-3 text-xs">
                <div className="font-semibold uppercase tracking-wider text-gray-500 mb-1">Perfil del candidato</div>
                <div>Score 16M: <strong>{guide.candidate.score_16_mandamientos ?? '—'}</strong> · Categoría: <strong>{(guide.profile_snapshot.categoria as string) ?? '—'}</strong> · Prueba: <strong>{(guide.profile_snapshot.assessment_status as string) ?? 'no enviada'}</strong>{guide.profile_snapshot.assessment_score ? ` · ${guide.profile_snapshot.assessment_score}/100` : ''}</div>
                {guide.focus_points.length > 0 && (
                  <div className="mt-2"><span className="font-semibold text-amber-700">⚠ Puntos a validar:</span> <span className="text-gray-700">{guide.focus_points.join(' · ')}</span></div>
                )}
                {guide.low_signals.length > 0 && (
                  <div className="mt-1"><span className="font-semibold text-red-700">▼ Señales bajas:</span> <span className="text-gray-700">{guide.low_signals.slice(0, 3).join(' · ')}</span></div>
                )}
              </div>

              {/* Summary */}
              {guide.guide?.summary && (
                <div className="text-sm border-l-4 border-blue-400 pl-3 italic text-gray-700">{guide.guide.summary}</div>
              )}

              {/* Questions */}
              {guide.guide?.questions && guide.guide.questions.length > 0 && (
                <div className="space-y-3">
                  {guide.guide.questions.map((q) => {
                    const tagColor = q.type === 'validate_flag' ? 'amber' : q.type === 'confirm_strength' ? 'green' : 'gray';
                    return (
                      <div key={q.n} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono text-gray-400 w-6">#{q.n}</span>
                          <Pill color={tagColor as 'amber' | 'green' | 'gray'}>{q.dimension}</Pill>
                          <span className="text-[10px] uppercase tracking-wider text-gray-400">{q.type.replace('_', ' ')}</span>
                        </div>
                        <div className="text-sm font-medium mb-2">{q.question}</div>
                        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                          <div className="bg-emerald-50 rounded px-2 py-1.5 text-emerald-800">
                            <span className="font-semibold">✓ Buscar:</span> {q.look_for}
                          </div>
                          <div className="bg-red-50 rounded px-2 py-1.5 text-red-800">
                            <span className="font-semibold">✗ Red flag:</span> {q.red_flag}
                          </div>
                        </div>
                        <textarea
                          value={answers[q.n] ?? ''}
                          onChange={(e) => setAnswers((prev) => ({ ...prev, [q.n]: e.target.value }))}
                          rows={2}
                          placeholder="Respuesta del candidato (notas o transcript)…"
                          className="w-full border border-gray-200 rounded text-xs px-2 py-1.5"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Interpretation guide */}
              {guide.guide?.interpretation_guide && (
                <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-900">
                  <div className="font-semibold mb-1">Cómo triangular las respuestas:</div>
                  {guide.guide.interpretation_guide}
                </div>
              )}

              {/* Synthesis */}
              <div className="border-t border-gray-200 pt-3">
                <button
                  onClick={synthesize}
                  disabled={synthesizing || Object.keys(answers).length === 0}
                  className="pill-btn pill-btn-primary text-sm w-full disabled:opacity-50"
                >
                  {synthesizing ? 'Sintetizando dossier…' : '📊 Generar dossier complementario (psicometría + entrevista)'}
                </button>
              </div>

              {dossier && (
                <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-lg p-4 space-y-3 text-sm">
                  <div className="font-bold uppercase tracking-wider text-gray-500 text-xs">Dossier triangulado</div>
                  {(dossier.triangulation_summary as string | undefined) && (
                    <div className="text-sm">{dossier.triangulation_summary as string}</div>
                  )}
                  {Array.isArray(dossier.confirmations) && (dossier.confirmations as Array<Record<string, string>>).length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-emerald-700 mb-1">✓ Confirmaciones</div>
                      <ul className="text-xs space-y-1 ml-4 list-disc">
                        {(dossier.confirmations as Array<Record<string, string>>).map((c, i) => (
                          <li key={i}><strong>{c.dimension}:</strong> prueba {c.evidence_test}; entrevista {c.evidence_interview}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(dossier.contradictions) && (dossier.contradictions as Array<Record<string, string>>).length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-amber-700 mb-1">⚠ Contradicciones</div>
                      <ul className="text-xs space-y-1 ml-4 list-disc">
                        {(dossier.contradictions as Array<Record<string, string>>).map((c, i) => (
                          <li key={i}><strong>{c.dimension}:</strong> prueba dice {c.test_says}; entrevista dice {c.interview_says}. Interpretación: {c.interpretation}. Próximo paso: {c.next_step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(dossier.new_signals) && (dossier.new_signals as Array<Record<string, string>>).length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-blue-700 mb-1">+ Señales nuevas (solo entrevista)</div>
                      <ul className="text-xs space-y-1 ml-4 list-disc">
                        {(dossier.new_signals as Array<Record<string, string>>).map((c, i) => (
                          <li key={i}><strong>{c.topic}:</strong> {c.what_we_learned}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(dossier.final_recommendation as Record<string, string> | undefined) && (
                    <div className="bg-black text-white rounded-lg p-3">
                      <div className="text-xs uppercase tracking-wider opacity-60 mb-1">Recomendación final</div>
                      <div className="text-base font-bold">
                        {(dossier.final_recommendation as Record<string, string>).decision === 'advance_to_offer' && 'AVANZAR A OFERTA'}
                        {(dossier.final_recommendation as Record<string, string>).decision === 'second_round' && 'SEGUNDA RONDA'}
                        {(dossier.final_recommendation as Record<string, string>).decision === 'discard' && 'DESCARTAR'}
                        <span className="ml-2 text-xs opacity-70">confianza {(dossier.final_recommendation as Record<string, string>).confidence}</span>
                      </div>
                      <div className="text-xs opacity-90 mt-1">{(dossier.final_recommendation as Record<string, string>).rationale}</div>
                      {(dossier.final_recommendation as Record<string, string>).if_advance_concerns_to_address && (
                        <div className="text-xs opacity-90 mt-2">
                          <strong>Si avanza, abordar:</strong> {(dossier.final_recommendation as Record<string, string>).if_advance_concerns_to_address}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

/* ======================================================== */
/* Evaluaciones                                    */
/* ======================================================== */
type LiveToken = {
  id: number;
  token: string;
  candidate_name: string;
  candidate_email: string;
  vacancy_id: number | null;
  vacancy_slug: string | null;
  vacancy_title_es?: string | null;
  assessment_ids: string | null;
  status: string;
  score: number | null;
  sent_at: string;
  completed_at: string | null;
  source: string | null;
};

function Pruebas() {
  const [tokens, setTokens] = useState<LiveToken[]>([]);
  const [vacs, setVacs] = useState<LiveVacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendModal, setSendModal] = useState(false);
  const [importModal, setImportModal] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [tr, vr] = await Promise.all([
        fetch("/api/assessments", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/vacancies", { cache: "no-store" }).then((r) => r.json()),
      ]);
      setTokens(tr.data ?? []);
      setVacs(Array.isArray(vr) ? vr : vr.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = {
    sent: tokens.length,
    completed: tokens.filter((t) => t.status === "completed").length,
    inProgress: tokens.filter((t) => t.status === "in_progress").length,
  };

  return (
    <>
      <PageHead
        title="Evaluación de Competencias TS"
        desc="Una sola evaluación integral del candidato. Calibrada contra los top performers de Trading Solutions. Output: Match% y recomendación accionable."
        actions={
          <>
            <button
              className="pill-btn pill-btn-outline text-xs"
              style={{ padding: "9px 14px" }}
              onClick={() => setImportModal(true)}
            >
              <Plus className="w-3.5 h-3.5" /> Importar candidatos (CSV)
            </button>
            <button
              className="pill-btn pill-btn-primary text-xs"
              style={{ padding: "9px 14px" }}
              onClick={() => setSendModal(true)}
            >
              <Plus className="w-3.5 h-3.5" /> Enviar prueba
            </button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-3 mb-5">
        <KPI label="Tokens enviados" value={loading ? "…" : String(stats.sent)} delta="Total en Neon" tone="neutral" />
        <KPI label="En progreso" value={String(stats.inProgress)} delta="Activos" tone="neutral" />
        <KPI label="Completadas" value={String(stats.completed)} delta="Score listo" />
        <KPI label="Tiempo prom. candidato" value="88 min" delta="5 pruebas" tone="neutral" />
      </div>

      <h3 className="text-sm font-bold mb-3">La prueba aplicada a todos los candidatos</h3>
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0"
            style={{ background: factorXTS.color }}
          >
            <Brain className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-base">{factorXTS.title.es}</div>
            <p className="text-xs text-gray-600 leading-relaxed mt-1">{factorXTS.summary.es}</p>
            <div className="flex gap-4 mt-3 text-[11px] text-gray-500 font-semibold">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{factorXTS.duration} min</span>
              <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{factorXTS.questions} preguntas</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{factorXTS.dimensions.length} dimensiones</span>
              <span className="flex items-center gap-1">{factorXTS.sections.length} secciones</span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-3 mt-2">
          <div className="text-[11px] tracking-[0.1em] text-gray-500 font-semibold uppercase mb-2">
            Secciones de la prueba
          </div>
          <div className="grid grid-cols-3 gap-2">
            {factorXTS.sections.map((s, idx) => (
              <div key={s.id} className="border border-gray-100 rounded-lg px-3 py-2">
                <div className="text-[11px] text-gray-400 font-mono">{String(idx + 1).padStart(2, "0")}</div>
                <div className="text-xs font-bold mt-0.5">{s.name}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {s.questions} preg · {s.duration} min
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Card title="Invitaciones enviadas a candidatos" eyebrow="LIVE · API /api/assessments">
        <div className="space-y-2">
          {loading && (
            <div className="text-sm text-gray-500 py-6 text-center">Cargando…</div>
          )}
          {!loading && tokens.length === 0 && (
            <div className="text-sm text-gray-500 py-8 text-center">
              No hay pruebas enviadas aún. Click en <b>Enviar prueba</b> para empezar.
            </div>
          )}
          {tokens.map((t) => {
            const numAssessments = (t.assessment_ids ?? "")
              .split(",")
              .filter(Boolean).length;
            const statusColor: "green" | "amber" | "gray" =
              t.status === "completed"
                ? "green"
                : t.status === "in_progress"
                ? "amber"
                : "gray";
            const origin =
              typeof window !== "undefined" ? window.location.origin : "";
            const link = `${origin}/assessment/${t.token}`;
            return (
              <div
                key={t.id}
                className="flex justify-between items-center border border-gray-200 rounded-lg px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">
                    {t.candidate_name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {t.vacancy_title_es ?? t.vacancy_slug ?? "—"} · {numAssessments} pruebas · {t.candidate_email}
                    {t.source === "linkedin_recruiter" && " · via LinkedIn"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Pill color={statusColor}>{t.status.toUpperCase()}</Pill>
                  {t.score !== null && t.score !== undefined && (
                    <Pill color="black">{t.score}/100</Pill>
                  )}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(link);
                    }}
                    className="p-1.5 border border-gray-200 rounded-lg hover:border-black text-[11px] font-medium px-2"
                    title="Copiar link"
                  >
                    Copiar link
                  </button>
                  <a
                    href={`mailto:${t.candidate_email}?subject=${encodeURIComponent(
                      "Trading Solutions · Evaluación"
                    )}&body=${encodeURIComponent(
                      `Hola ${t.candidate_name.split(" ")[0]},\n\nPor favor completa la evaluación aquí:\n${link}\n\nEl link es válido 30 días.`
                    )}`}
                    className="p-1.5 border border-gray-200 rounded-lg hover:border-black text-[11px] font-medium px-2"
                    title="Abrir email"
                  >
                    mailto:
                  </a>
                  <a
                    href={`/assessment/${t.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 border border-gray-200 rounded-lg hover:border-black"
                    title="Abrir como candidato"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {sendModal && (
        <SendAssessmentModal
          vacancies={vacs}
          onClose={() => setSendModal(false)}
          onCreated={async () => {
            await refresh();
          }}
        />
      )}
      {importModal && (
        <ImportCSVModal
          onClose={() => setImportModal(false)}
          onImported={async () => {
            await refresh();
          }}
        />
      )}
    </>
  );
}

/* ===== modal: Enviar prueba ===== */
type ExistingToken = {
  token: string;
  status: string;
  score: number | null;
  sent_at: string;
  completed_at: string | null;
  vacancy_id: number | null;
  vacancy_slug: string | null;
  source: string | null;
};

function SendAssessmentModal({
  vacancies,
  onClose,
  onCreated,
}: {
  vacancies: LiveVacancy[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [vacancyId, setVacancyId] = useState<number | null>(vacancies[0]?.id ?? null);
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ link: string; mailto: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Validación de duplicados: consulta /api/assessments?email=X cuando se teclea un email válido
  const [existing, setExisting] = useState<ExistingToken[]>([]);
  const [checking, setChecking] = useState(false);
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  useEffect(() => {
    setExisting([]);
    setOverrideConfirmed(false);
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
    const handle = setTimeout(async () => {
      setChecking(true);
      try {
        const r = await fetch(
          `/api/assessments?email=${encodeURIComponent(email.toLowerCase().trim())}`,
          { cache: "no-store" }
        );
        const j = await r.json();
        setExisting((j.data ?? []) as ExistingToken[]);
      } finally {
        setChecking(false);
      }
    }, 400); // debounce
    return () => clearTimeout(handle);
  }, [email]);

  // ¿Bloquear o permitir?
  //  - completed  → bloquear fuerte (requiere checkbox de confirmación explícita)
  //  - expired    → warning amarillo, permitir sin confirmación
  //  - in_progress / sent → warning azul, permitir sin confirmación
  const sameVacancy = existing.find((t) => t.vacancy_id === vacancyId);
  const needsOverride =
    sameVacancy?.status === "completed" && !overrideConfirmed;

  const send = async () => {
    setSaving(true);
    setErr(null);
    try {
      const vac = vacancies.find((v) => v.id === vacancyId);
      const r = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_name: name,
          candidate_email: email,
          vacancy_id: vacancyId,
          vacancy_slug: vac?.slug ?? null,
          language,
          source: "manual",
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErr(j.error ?? "error");
      } else {
        setResult({ link: j.link, mailto: j.mailto });
        onCreated();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "error");
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = (s: string) =>
    s === "completed"
      ? "Completada"
      : s === "in_progress"
      ? "En progreso"
      : s === "expired"
      ? "Expirada"
      : s === "sent"
      ? "Enviada"
      : s;

  const statusTone = (s: string) =>
    s === "completed"
      ? "bg-red-50 border-red-300 text-red-900"
      : s === "expired"
      ? "bg-amber-50 border-amber-300 text-amber-900"
      : "bg-blue-50 border-blue-300 text-blue-900";

  const vacancyName = (vid: number | null) => {
    const v = vacancies.find((x) => x.id === vid);
    return v ? v.title_es ?? v.title ?? v.slug : vid ? `id=${vid}` : "—";
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6">
        <h3 className="text-lg font-bold mb-4">Enviar evaluación al candidato</h3>
        {!result ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">Nombre completo</label>
              <input
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Ana García"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Email</label>
              <input
                type="email"
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="ana@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {checking && (
                <div className="text-[11px] text-gray-400 mt-1">
                  Buscando si ya tiene pruebas…
                </div>
              )}
            </div>

            {existing.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] tracking-[0.08em] text-gray-500 font-semibold uppercase">
                  ⚠ Este candidato ya tiene {existing.length} prueba(s)
                </div>
                {existing.map((t) => (
                  <div
                    key={t.token}
                    className={`border rounded-lg p-3 text-xs ${statusTone(t.status)}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-bold">{statusLabel(t.status)}</div>
                      {t.score && (
                        <span className="font-bold">{t.score}/100</span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] opacity-80">
                      Vacante: <b>{vacancyName(t.vacancy_id)}</b>
                      {t.completed_at && (
                        <> · completada el {new Date(t.completed_at).toLocaleDateString("es-CO")}</>
                      )}
                      {!t.completed_at && t.sent_at && (
                        <> · enviada el {new Date(t.sent_at).toLocaleDateString("es-CO")}</>
                      )}
                      {t.source && <> · fuente: {t.source}</>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">Vacante</label>
                <select
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={vacancyId ?? ""}
                  onChange={(e) => setVacancyId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">(Sin vacante específica)</option>
                  {vacancies.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title_es ?? v.title ?? v.slug}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Idioma del test</label>
                <select
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "es" | "en")}
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
            {sameVacancy?.status === "completed" && (
              <label className="flex items-start gap-2 bg-red-50 border border-red-300 rounded-lg p-3 text-xs text-red-900 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={overrideConfirmed}
                  onChange={(e) => setOverrideConfirmed(e.target.checked)}
                />
                <span>
                  <b>Este candidato ya completó la prueba para esta vacante</b> con score{" "}
                  <b>{sameVacancy.score}/100</b>. Marca esta casilla solo si quieres que vuelva
                  a hacerla (re-evaluación). El nuevo token reemplaza al anterior.
                </span>
              </label>
            )}

            {err && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">
                {err}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-3">
              <button
                className="pill-btn pill-btn-outline text-xs"
                style={{ padding: "9px 14px" }}
                onClick={onClose}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                className="pill-btn pill-btn-primary text-xs"
                style={{ padding: "9px 14px" }}
                disabled={!name || !email || saving || needsOverride}
                onClick={send}
              >
                {saving
                  ? "Creando…"
                  : needsOverride
                  ? "Marca la casilla para continuar"
                  : sameVacancy
                  ? "Reenviar prueba"
                  : "Crear token"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-900 font-medium">
              Token creado en Neon. Envía ahora por tu canal preferido:
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Link del candidato</label>
              <div className="flex gap-2 mt-1">
                <input
                  readOnly
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono"
                  value={result.link}
                />
                <button
                  className="pill-btn pill-btn-outline text-xs"
                  style={{ padding: "9px 14px" }}
                  onClick={() => navigator.clipboard.writeText(result.link)}
                >
                  Copiar
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={result.mailto}
                className="pill-btn pill-btn-primary text-xs flex-1 justify-center"
                style={{ padding: "9px 14px" }}
              >
                Abrir email (mailto:)
              </a>
              <button
                className="pill-btn pill-btn-outline text-xs"
                style={{ padding: "9px 14px" }}
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== modal: Import CSV desde LinkedIn Recruiter ===== */
function ImportCSVModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: Array<{ email: string; reason: string }>;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const parseCSV = (csv: string) => {
    // Heurística simple: separar por líneas, detectar header por presencia de "email"
    const lines = csv.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length === 0) return [];
    const header = lines[0].toLowerCase().split(/[,;\t]/).map((h) => h.trim());
    const idx = (label: string) =>
      header.findIndex((h) => h.includes(label.toLowerCase()));
    const emailIdx = idx("email");
    if (emailIdx < 0) return [];
    const firstIdx = idx("first");
    const lastIdx = idx("last");
    const fullIdx = idx("name");
    const phoneIdx = idx("phone");
    const companyIdx = idx("company");
    const titleIdx = idx("title");
    const liIdx = idx("linkedin");
    const locIdx = idx("location");
    return lines.slice(1).map((line) => {
      const cols = line.split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ""));
      return {
        first_name: firstIdx >= 0 ? cols[firstIdx] : undefined,
        last_name: lastIdx >= 0 ? cols[lastIdx] : undefined,
        full_name:
          fullIdx >= 0 && fullIdx !== firstIdx && fullIdx !== lastIdx
            ? cols[fullIdx]
            : undefined,
        email: cols[emailIdx],
        phone: phoneIdx >= 0 ? cols[phoneIdx] : undefined,
        company: companyIdx >= 0 ? cols[companyIdx] : undefined,
        title: titleIdx >= 0 ? cols[titleIdx] : undefined,
        linkedin_url: liIdx >= 0 ? cols[liIdx] : undefined,
        location: locIdx >= 0 ? cols[locIdx] : undefined,
      };
    });
  };

  const doImport = async () => {
    setSaving(true);
    setErr(null);
    try {
      const candidates = parseCSV(text);
      if (candidates.length === 0) {
        setErr("No se detectaron filas válidas. Asegúrate de que el CSV tenga columna 'Email'.");
        setSaving(false);
        return;
      }
      const r = await fetch("/api/candidates/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidates,
          source: "linkedin_recruiter",
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErr(j.error ?? "error");
      } else {
        setResult({ imported: j.imported, skipped: j.skipped, errors: j.errors ?? [] });
        onImported();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6">
        <h3 className="text-lg font-bold mb-2">Importar candidatos · CSV</h3>
        <p className="text-xs text-gray-500 mb-4">
          Exporta la lista desde LinkedIn Recruiter (o Talent Hub) y pega aquí el contenido.
          Columnas soportadas: First Name, Last Name, Email, Phone, Current Company, Current Title,
          LinkedIn URL, Location.
        </p>
        {!result ? (
          <>
            <textarea
              className="w-full h-56 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono"
              placeholder={`First Name,Last Name,Email,Phone,Current Company,Current Title,LinkedIn URL,Location\nAna,García,ana@mail.com,+57...,Kuehne+Nagel,Ops Senior,https://linkedin.com/in/ana,Barranquilla`}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            {err && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 mt-2">
                {err}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-3">
              <button
                className="pill-btn pill-btn-outline text-xs"
                style={{ padding: "9px 14px" }}
                onClick={onClose}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                className="pill-btn pill-btn-primary text-xs"
                style={{ padding: "9px 14px" }}
                onClick={doImport}
                disabled={!text.trim() || saving}
              >
                {saving ? "Importando…" : "Importar al CV Bank"}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-900">
              <b>{result.imported}</b> candidatos importados al CV Bank ·{" "}
              {result.skipped > 0 && <span>{result.skipped} omitidos</span>}
            </div>
            {result.errors.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
                <b>Omitidos:</b>
                <ul className="mt-1 list-disc pl-5">
                  {result.errors.slice(0, 5).map((e, i) => (
                    <li key={i}>
                      {e.email}: {e.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end">
              <button
                className="pill-btn pill-btn-primary text-xs"
                style={{ padding: "9px 14px" }}
                onClick={onClose}
              >
                Listo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ======================================================== */
/* Agentes IA                                               */
/* ======================================================== */
function Agentes() {
  const [stats, setStats] = useState<{
    applications: number;
    talentPool: number;
    completedAssessments: number;
    sentAssessments: number;
    vacancies: number;
    linkedinCount: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const [appR, tpR, asR, vacR] = await Promise.all([
        fetch("/api/applications", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/talent-pool?limit=1000", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/assessments?limit=500", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/vacancies", { cache: "no-store" }).then((r) => r.json()),
      ]);
      type App = unknown;
      type TP = { source?: string | null };
      type Tok = { status: string };
      type V = unknown;
      const apps = (appR.applications ?? appR.data ?? []) as App[];
      const tp = (tpR.data ?? []) as TP[];
      const tokens = (asR.data ?? []) as Tok[];
      const vacs = (Array.isArray(vacR) ? vacR : vacR.data ?? []) as V[];
      setStats({
        applications: apps.length,
        talentPool: tp.length,
        completedAssessments: tokens.filter((t) => t.status === "completed").length,
        sentAssessments: tokens.length,
        vacancies: vacs.length,
        linkedinCount: tp.filter((c) => (c.source ?? "").toLowerCase().includes("linkedin")).length,
      });
    })();
  }, []);

  const s = stats;
  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
  const completionRate = s ? pct(s.completedAssessments, s.sentAssessments) : 0;

  // Los agentes son conceptuales (el pipeline real). Sus números vienen del estado de la BD.
  const agents = s
    ? [
        {
          name: "Job Writer Agent",
          role: "Redacción de vacantes (ES/EN)",
          stats: [
            ["Vacantes publicadas", String(s.vacancies)],
            ["Idiomas", "2"],
            ["Estado", "✓"],
          ] as [string, string][],
        },
        {
          name: "Intake Agent",
          role: "Recepción de aplicaciones",
          stats: [
            ["Aplicaciones", String(s.applications)],
            ["CV Bank", String(s.talentPool)],
            ["Fuentes", "3"],
          ] as [string, string][],
        },
        {
          name: "CV Parser Agent",
          role: "Extracción de datos de CV",
          stats: [
            ["Perfiles parseados", String(s.talentPool)],
            ["Desde LinkedIn", String(s.linkedinCount)],
            ["Cobertura", `${pct(s.linkedinCount, s.talentPool)}%`],
          ] as [string, string][],
        },
        {
          name: "Screening Agent",
          role: "Match contra vacantes",
          stats: [
            ["Scorings", String(s.completedAssessments)],
            ["Dimensiones", "24"],
            ["Benchmark", "15 top TS"],
          ] as [string, string][],
        },
        {
          name: "Assessment Agent",
          role: "Genera invitaciones, monitorea progreso y guarda resultados",
          stats: [
            ["Enviadas", String(s.sentAssessments)],
            ["Completadas", String(s.completedAssessments)],
            ["Tasa", `${completionRate}%`],
          ] as [string, string][],
        },
        {
          name: "Ranker Agent",
          role: "Top candidatos por vacante",
          stats: [
            ["Vacantes activas", String(s.vacancies)],
            ["Top con score", String(s.completedAssessments)],
            ["Estado", "✓"],
          ] as [string, string][],
        },
        {
          name: "Interview Agent",
          role: "Video async + transcript (fase 2)",
          stats: [
            ["Grabaciones", "0"],
            ["Estado", "Pendiente"],
            ["ETA", "Q3 2026"],
          ] as [string, string][],
        },
        {
          name: "Report Agent",
          role: "One-pagers y recomendaciones",
          stats: [
            ["Candidatos scored", String(s.completedAssessments)],
            ["Blobs JSON", String(s.completedAssessments)],
            ["Estado", "✓"],
          ] as [string, string][],
        },
        {
          name: "Scheduler Agent",
          role: "Calendarios + entrevistas humanas",
          stats: [
            ["Meetings", "0"],
            ["Estado", "Manual"],
            ["ETA", "Q3 2026"],
          ] as [string, string][],
        },
        {
          name: "Offer Agent",
          role: "Cartas de oferta + negociación",
          stats: [
            ["Ofertas enviadas", "0"],
            ["Estado", "Pendiente"],
            ["Tabla", "offers"],
          ] as [string, string][],
        },
        {
          name: "BGC + Reference Agents",
          role: "Verificación + referencias laborales",
          stats: [
            ["Contactadas", "0"],
            ["Estado", "Pendiente"],
            ["Tabla", "background_checks"],
          ] as [string, string][],
        },
        {
          name: "Contract + e-Sign Agents",
          role: "Contrato laboral + firma digital",
          stats: [
            ["Contratos", "0"],
            ["Estado", "Pendiente"],
            ["Países", "1 (CO)"],
          ] as [string, string][],
        },
      ]
    : [];

  return (
    <>
      <PageHead
        title="Agentes IA · Activity & performance"
        desc={
          s
            ? `12 agentes del pipeline · Contadores derivados de tu BD Neon · Live`
            : "Cargando…"
        }
        actions={
          <>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>Histórico ▾</button>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>Ver logs</button>
          </>
        }
      />
      <div className="grid grid-cols-4 gap-3 mb-4">
        <KPI label="Aplicaciones procesadas" value={s ? String(s.applications) : "…"} delta="Intake + Parser" tone="neutral" />
        <KPI label="CV Bank activo" value={s ? String(s.talentPool) : "…"} delta={s ? `${s.linkedinCount} desde LI` : ""} tone="neutral" />
        <KPI label="Pruebas" value={s ? `${s.completedAssessments}/${s.sentAssessments}` : "…"} delta={`${completionRate}% completadas`} />
        <KPI label="Vacantes cubiertas" value={s ? String(s.vacancies) : "…"} delta="En producción" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {agents.map((a) => {
          const pending = a.stats.some(([, v]) => v === "Pendiente" || v === "Manual");
          return (
            <div key={a.name} className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="text-sm font-bold">{a.name}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{a.role}</div>
                </div>
                {pending ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.1em] text-amber-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.18)]" />
                    PENDIENTE
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.1em] text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" />
                    ON
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
                {a.stats.map(([l, v]) => (
                  <div key={l}>
                    <div className="text-[10px] tracking-[0.08em] text-gray-500 uppercase font-semibold">{l}</div>
                    <div className="text-[15px] font-bold mt-0.5">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ======================================================== */
/* Analytics                                                */
/* ======================================================== */
function Analytics() {
  const [data, setData] = useState<{
    tokens: LiveToken[];
    pool: LiveCandidate[];
    vacs: LiveVacancy[];
  } | null>(null);

  useEffect(() => {
    (async () => {
      const [asR, tpR, vacR] = await Promise.all([
        fetch("/api/assessments?limit=500", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/talent-pool?limit=1000", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/vacancies", { cache: "no-store" }).then((r) => r.json()),
      ]);
      setData({
        tokens: (asR.data ?? []) as LiveToken[],
        pool: (tpR.data ?? []) as LiveCandidate[],
        vacs: (Array.isArray(vacR) ? vacR : vacR.data ?? []) as LiveVacancy[],
      });
    })();
  }, []);

  const d = data;
  const loading = !d;

  // Métricas reales que sí podemos calcular
  const completed = d?.tokens.filter((t) => t.status === "completed") ?? [];
  const avgScore =
    completed.length > 0
      ? Math.round(completed.reduce((s, t) => s + (t.score ?? 0), 0) / completed.length)
      : 0;
  const avanza = completed.filter((t) => (t.score ?? 0) >= 70).length;
  const enEspera = completed.filter((t) => (t.score ?? 0) < 70 && (t.score ?? 0) >= 50).length;
  const noAvanza = completed.filter((t) => (t.score ?? 0) < 50).length;
  const completionRate = d && d.tokens.length > 0 ? Math.round((completed.length / d.tokens.length) * 100) : 0;

  // Source effectiveness: cuántos por fuente
  const bySource: Record<string, number> = {};
  for (const c of d?.pool ?? []) {
    const s = (c.source ?? "otros").toLowerCase();
    const label = s.includes("linkedin")
      ? "LinkedIn TS"
      : s.includes("elevare")
      ? "Elevare"
      : s.includes("email") || s.includes("manual")
      ? "Email/Manual"
      : "Otros";
    bySource[label] = (bySource[label] ?? 0) + 1;
  }
  const maxSource = Math.max(...Object.values(bySource), 1);

  // Score por vacante
  const scoresByVac: Record<string, number[]> = {};
  for (const t of completed) {
    const key = t.vacancy_slug ?? "sin_vacante";
    if (!scoresByVac[key]) scoresByVac[key] = [];
    if (t.score) scoresByVac[key].push(t.score);
  }

  return (
    <>
      <PageHead
        title="Analytics · Indicadores para mejora continua"
        desc={
          loading
            ? "Cargando data…"
            : "Métricas reales derivadas de las pruebas completadas. QoH, time-to-hire y cost-per-hire requieren histórico de contrataciones (pendiente)."
        }
        actions={
          <>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>Todo el histórico ▾</button>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>Descargar CSV</button>
          </>
        }
      />
      <div className="grid grid-cols-4 gap-3 mb-4">
        <KPI
          label="Score promedio"
          value={loading ? "…" : `${avgScore}/100`}
          delta={`de ${completed.length} completadas`}
          tone="neutral"
        />
        <KPI
          label="Tasa AVANZA"
          value={loading ? "…" : `${completed.length > 0 ? Math.round((avanza / completed.length) * 100) : 0}%`}
          delta={`${avanza}/${completed.length} pasan filtro`}
        />
        <KPI
          label="Tasa de completación"
          value={loading ? "…" : `${completionRate}%`}
          delta={d ? `${completed.length}/${d.tokens.length} tokens` : ""}
          tone="neutral"
        />
        <KPI
          label="Hired Quality (pendiente)"
          value="—"
          delta="Requiere tabla hires"
          tone="neutral"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card title="Distribución de resultados" eyebrow="AVANZA / EN ESPERA / NO AVANZA">
          {loading ? (
            <div className="text-sm text-gray-400 py-6 text-center">Cargando…</div>
          ) : completed.length === 0 ? (
            <div className="text-sm text-gray-400 py-6 text-center">Sin pruebas completadas</div>
          ) : (
            <div className="space-y-3">
              <SourceBar
                label={`AVANZA (score ≥ 70)`}
                pct={(avanza / completed.length) * 100}
                color="#059669"
                value={`${avanza} · ${Math.round((avanza / completed.length) * 100)}%`}
              />
              <SourceBar
                label={`EN ESPERA (50-69)`}
                pct={(enEspera / completed.length) * 100}
                color="#F59E0B"
                value={`${enEspera} · ${Math.round((enEspera / completed.length) * 100)}%`}
              />
              <SourceBar
                label={`NO AVANZA (<50)`}
                pct={(noAvanza / completed.length) * 100}
                color="#DC2626"
                value={`${noAvanza} · ${completed.length > 0 ? Math.round((noAvanza / completed.length) * 100) : 0}%`}
              />
            </div>
          )}
        </Card>
        <Card title="Candidatos por fuente" eyebrow="TALENT POOL">
          {loading ? (
            <div className="text-sm text-gray-400 py-6 text-center">Cargando…</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(bySource)
                .sort((a, b) => b[1] - a[1])
                .map(([label, count]) => {
                  const color =
                    label === "LinkedIn TS"
                      ? "#0A66C2"
                      : label === "Elevare"
                      ? "#111"
                      : label === "Email/Manual"
                      ? "#6B7280"
                      : "#9CA3AF";
                  return (
                    <SourceBar
                      key={label}
                      label={label}
                      pct={(count / maxSource) * 100}
                      color={color}
                      value={String(count)}
                    />
                  );
                })}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card title="Score promedio por vacante" eyebrow="FACTOR X">
          {loading ? (
            <div className="text-sm text-gray-400 py-6 text-center">Cargando…</div>
          ) : Object.keys(scoresByVac).length === 0 ? (
            <div className="text-sm text-gray-400 py-6 text-center">Sin data aún</div>
          ) : (
            <div className="space-y-2">
              {Object.entries(scoresByVac).map(([slug, scores]) => {
                const vac = d?.vacs.find((v) => v.slug === slug);
                const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                return (
                  <div
                    key={slug}
                    className="flex justify-between items-center border border-gray-200 rounded-lg px-3 py-2.5"
                  >
                    <div>
                      <div className="text-sm font-semibold">
                        {vac?.title_es ?? vac?.title ?? slug}
                      </div>
                      <div className="text-xs text-gray-500">{scores.length} completadas</div>
                    </div>
                    <Pill color={avg >= 80 ? "green" : avg >= 70 ? "black" : "amber"}>{avg}</Pill>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
        <Card title="Métricas pendientes · requieren histórico" eyebrow="ROADMAP">
          <div className="space-y-2">
            {[
              ["Time-to-hire", "Días entre aplicación y firma de contrato", "Requiere tabla hires con fechas", "amber"],
              ["Quality of Hire", "Desempeño a 90 días del nuevo empleado", "Requiere evaluación 30-60-90", "amber"],
              ["Cost-per-hire", "Inversión en pautas + tiempo recruiter", "Requiere budget tracking", "amber"],
              ["Early attrition 90d", "Renuncias en primeros 90 días", "Requiere tabla hires + fecha salida", "amber"],
            ].map(([n, d, s, c]) => (
              <div
                key={n as string}
                className="flex justify-between items-center border border-gray-200 rounded-lg px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{n}</div>
                  <div className="text-xs text-gray-500">{d}</div>
                </div>
                <Pill color={c as "amber"}>{s as string}</Pill>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

/* ======================================================== */
/* LinkedIn TS                                              */
/* ======================================================== */
function LinkedInTS() {
  const [vacs, setVacs] = useState<LiveVacancy[]>([]);
  const [pool, setPool] = useState<LiveCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [vacR, tpR] = await Promise.all([
        fetch("/api/vacancies", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/talent-pool?limit=1000", { cache: "no-store" }).then((r) => r.json()),
      ]);
      setVacs((Array.isArray(vacR) ? vacR : vacR.data ?? []) as LiveVacancy[]);
      setPool((tpR.data ?? []) as LiveCandidate[]);
      setLoading(false);
    })();
  }, []);

  const vacsInLI = vacs.filter((v) => v.linkedin_url);
  const fromLI = pool.filter((c) => (c.source ?? "").toLowerCase().includes("linkedin")).length;
  const totalPool = pool.length;

  return (
    <>
      <PageHead
        title="LinkedIn · Trading Solutions (página de compañía)"
        desc="Integración oficial con la cuenta corporativa. Publicación, branding y talent pool."
        actions={
          <>
            <a
              href="/hr-admin/linkedin-setup"
              className="pill-btn pill-btn-outline text-xs"
              style={{ padding: "9px 14px" }}
            >
              Configurar
            </a>
            <a
              href="https://www.linkedin.com/talent/home"
              target="_blank"
              rel="noopener noreferrer"
              className="pill-btn text-xs bg-[#0A66C2] text-white hover:bg-[#084D94]"
              style={{ padding: "9px 14px" }}
            >
              Abrir LinkedIn Recruiter
            </a>
          </>
        }
      />

      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4 grid gap-5 items-center" style={{ gridTemplateColumns: "64px 1fr auto" }}>
        <div className="w-16 h-16 rounded-xl bg-[#0A66C2] text-white flex items-center justify-center font-extrabold text-2xl">in</div>
        <div>
          <h3 className="text-lg font-bold m-0">Trading Solutions</h3>
          <div className="text-[13px] text-gray-500 mt-1">
            linkedin.com/company/trading-solutions · Logistics &amp; Supply Chain · URN 1372457
          </div>
          <div className="inline-flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            App OAuth verificada · Yohanna Franco (admin)
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-gray-500">App ID</div>
          <div className="text-sm font-bold">230367072</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <MiniStat
          label="Vacantes publicadas"
          value={loading ? "…" : `${vacsInLI.length} / ${vacs.length}`}
          delta={vacs.length > 0 ? `${Math.round((vacsInLI.length / vacs.length) * 100)}% sync` : ""}
        />
        <MiniStat
          label="Candidatos desde LinkedIn"
          value={loading ? "…" : String(fromLI)}
          delta={totalPool > 0 ? `${Math.round((fromLI / totalPool) * 100)}% del pool` : ""}
        />
        <MiniStat label="Followers" value="—" delta="Requiere Graph API" />
        <MiniStat label="InMails" value="—" delta="Requiere Recruiter API" />
        <MiniStat label="Scopes activos" value="4" delta="openid + profile + email + w_member_social" />
        <MiniStat label="Easy Apply webhook" value="—" delta="Requiere RSC aprobación" />
        <MiniStat label="Empleados en LI" value="—" delta="Requiere Graph API" />
        <MiniStat label="Alumni network" value="—" delta="Requiere Graph API" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card title="Vacantes sincronizadas con LinkedIn TS" eyebrow="LIVE · /api/vacancies">
          <div className="space-y-2">
            {loading && <div className="text-sm text-gray-400 py-4 text-center">Cargando…</div>}
            {!loading &&
              vacs.map((v) => {
                const title = v.title_es ?? v.title ?? v.slug;
                const liId = v.linkedin_url?.split("/jobs/view/")[1]?.replace(/\/$/, "");
                return (
                  <div key={v.id} className="flex justify-between items-center border border-gray-200 rounded-lg px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold truncate">{title}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {v.linkedin_url ? `LinkedIn job ID ${liId}` : "No publicada en LinkedIn"}
                      </div>
                    </div>
                    {v.linkedin_url ? (
                      <a href={v.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <Pill color="blue">ACTIVA</Pill>
                      </a>
                    ) : (
                      <Pill color="gray">OFFLINE</Pill>
                    )}
                  </div>
                );
              })}
          </div>
        </Card>

        <Card title="Capacidades de la integración" eyebrow="ESTADO ACTUAL">
          <div className="space-y-2">
            {[
              ["OAuth Sign In", "Usuarios se autentican con LinkedIn", true],
              ["Share on LinkedIn", "Postear como miembro en el feed", true],
              ["Publicación a Company Page", "Requiere Marketing Developer Platform", false],
              ["Easy Apply al pipeline", "Requiere Recruiter System Connect", false],
              ["InMail desde el ATS", "Requiere Recruiter API", false],
              ["Followers → CV Bank", "Requiere Graph API", false],
              ["Advocacy / Employee re-share", "Requiere Community Management API", false],
            ].map(([n, d, on]) => (
              <div key={n as string} className="flex justify-between items-center border border-gray-200 rounded-lg px-3 py-2.5">
                <div>
                  <div className="text-sm font-semibold">{n}</div>
                  <div className="text-xs text-gray-500">{d}</div>
                </div>
                <Pill color={on ? "green" : "amber"}>{on ? "ON" : "Pendiente"}</Pill>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

/* ======================================================== */
/* Bases de datos                                           */
/* ======================================================== */
function Datos() {
  const [counts, setCounts] = useState<Record<string, number | null>>({
    vacancies: null,
    talent_pool: null,
    applications: null,
    assessment_tokens: null,
    assessment_tokens_completed: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [vacR, appR, tpR, asR] = await Promise.all([
        fetch("/api/vacancies", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/applications", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/talent-pool?limit=1000", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/assessments?limit=500", { cache: "no-store" }).then((r) => r.json()),
      ]);
      type Tok = { status: string };
      const vacs = Array.isArray(vacR) ? vacR : vacR.data ?? [];
      const apps = appR.applications ?? appR.data ?? [];
      const tp = tpR.data ?? [];
      const tokens = (asR.data ?? []) as Tok[];
      setCounts({
        vacancies: vacs.length,
        talent_pool: tp.length,
        applications: apps.length,
        assessment_tokens: tokens.length,
        assessment_tokens_completed: tokens.filter((t) => t.status === "completed").length,
      });
      setLoading(false);
    })();
  }, []);

  const fmt = (n: number | null) => (n === null ? "…" : n.toLocaleString());

  // Tablas que existen ahora vs. las que vendrán con el roadmap
  const liveTables: { name: string; desc: string; value: string | null }[] = [
    { name: "vacancies", desc: "Vacantes activas + cerradas (Neon)", value: fmt(counts.vacancies) },
    { name: "talent_pool", desc: "CV Bank · perfiles (Neon)", value: fmt(counts.talent_pool) },
    { name: "applications", desc: "Aplicaciones desde /vacantes (Neon)", value: fmt(counts.applications) },
    { name: "assessment_tokens", desc: "Invitaciones enviadas (Neon)", value: fmt(counts.assessment_tokens) },
    { name: "assessment_tokens · completed", desc: "Candidatos con resultados", value: fmt(counts.assessment_tokens_completed) },
  ];

  const futureTables: { name: string; desc: string }[] = [
    { name: "hires", desc: "Nuevos empleados contratados" },
    { name: "offers", desc: "Cartas de oferta generadas" },
    { name: "contracts", desc: "Contratos laborales + anexos" },
    { name: "signatures", desc: "Logs de firma digital e-Sign" },
    { name: "interviews_ai", desc: "Video + transcript (fase 2)" },
    { name: "interview_scores", desc: "Rúbricas + dimensiones de entrevistas humanas" },
    { name: "background_checks", desc: "Verificación de antecedentes" },
    { name: "cv_embeddings", desc: "Vectores para matching semántico" },
    { name: "agent_logs", desc: "Acciones de cada agente IA (audit)" },
    { name: "audit_trail", desc: "Cambios inmutables de todo el ATS" },
  ];

  return (
    <>
      <PageHead
        title="Bases de datos · Schema del ATS"
        desc={
          loading
            ? "Cargando conteos…"
            : `${liveTables.length} tablas activas en Neon con ${Object.values(counts).reduce((a, b) => (a ?? 0) + (b ?? 0), 0)?.toLocaleString()} registros totales. Roadmap: ${futureTables.length} tablas más en fase 2.`
        }
        actions={
          <>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>Export schema</button>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>Ver API docs</button>
          </>
        }
      />

      <h3 className="text-sm font-bold mb-3">Tablas activas · data en vivo</h3>
      <div className="grid grid-cols-4 gap-3 mb-6">
        {liveTables.map((t) => (
          <div
            key={t.name}
            className="bg-white border border-gray-200 rounded-2xl p-4 flex justify-between items-center"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold truncate">{t.name}</div>
              <div className="text-xs text-gray-500 mt-0.5 truncate">{t.desc}</div>
            </div>
            <div className="text-xl font-extrabold ml-2">{t.value}</div>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-bold mb-3">Roadmap · tablas que vienen en fase 2</h3>
      <div className="grid grid-cols-4 gap-3 mb-4">
        {futureTables.map((t) => (
          <div
            key={t.name}
            className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-4 flex justify-between items-center opacity-70"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold truncate text-gray-600">{t.name}</div>
              <div className="text-xs text-gray-500 mt-0.5 truncate">{t.desc}</div>
            </div>
            <Pill color="amber">pendiente</Pill>
          </div>
        ))}
      </div>

      <Card title="Relaciones principales entre tablas" eyebrow="ER SIMPLIFICADO">
        <pre className="bg-black text-gray-200 p-4 rounded-lg text-xs font-mono leading-relaxed overflow-x-auto m-0">
{`vacancies  ──1:N──▶  applications
    │                     │
    │                     ├──▶ (fase 2) offers ──▶ contracts ──▶ hires
    │                     └──▶ (fase 2) interviews_ai ──▶ interview_scores
    │
talent_pool ─N:M─▶ assessment_tokens ─N:1─▶ vacancies
    │                     │
    │                     └── status: sent | in_progress | completed | expired
    │                         results: JSON con DISC + IQ + Big5 + BETESA + McClelland + cognitivo
    │
    └── source: linkedin_recruiter | elevare | email | manual

Fase 2: agent_logs, audit_trail, cv_embeddings, background_checks, signatures`}
        </pre>
      </Card>
    </>
  );
}
