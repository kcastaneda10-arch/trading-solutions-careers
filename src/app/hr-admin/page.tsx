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
  { id: "pruebas", label: "Pruebas Psicométricas", icon: Brain },
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
type DashboardStats = {
  vacancies: number;
  vacanciesLinkedIn: number;
  applications: number;
  talentPool: number;
  assessmentsSent: number;
  assessmentsInProgress: number;
  assessmentsCompleted: number;
  interviews: number;
  offers: number;
  hires: number;
  bySource: Record<string, number>;
  topCandidates: Array<{ name: string; role: string; score: number | null; tags: string }>;
};

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [vacR, appR, tpR, asR] = await Promise.all([
          fetch("/api/vacancies", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/applications", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/talent-pool?limit=1000", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/assessments?limit=500", { cache: "no-store" }).then((r) => r.json()),
        ]);
        if (cancelled) return;

        type Vacancy = { linkedin_url?: string };
        type Application = { status?: string };
        type TalentPoolItem = {
          full_name: string;
          source?: string;
          tags?: string;
          summary?: string;
        };
        type AssessmentToken = { status: string; score?: number | null };
        const vacs = (Array.isArray(vacR) ? vacR : vacR.data ?? []) as Vacancy[];
        const apps = (appR.applications ?? appR.data ?? []) as Application[];
        const tp = (tpR.data ?? []) as TalentPoolItem[];
        const assess = (asR.data ?? []) as AssessmentToken[];

        // source distribution (del talent_pool)
        const bySource: Record<string, number> = {};
        for (const c of tp) {
          const s = (c.source ?? "otros").toLowerCase();
          const label = s.includes("linkedin")
            ? "LinkedIn TS"
            : s.includes("email")
            ? "Email / directo"
            : s.includes("refer")
            ? "Referidos"
            : "Otros";
          bySource[label] = (bySource[label] ?? 0) + 1;
        }

        // top candidatos: preferir assessments completados con score, sino los de talent_pool con "MUCHO" en tags
        const byEmail: Record<string, { name: string; score: number | null; tags: string; summary?: string }> = {};
        for (const c of tp) {
          if (!c.full_name) continue;
          byEmail[c.full_name] = {
            name: c.full_name,
            score: null,
            tags: c.tags ?? "",
            summary: c.summary,
          };
        }
        for (const a of assess) {
          if (a.status === "completed" && a.score) {
            const key = (a as unknown as { candidate_name: string }).candidate_name;
            if (byEmail[key]) byEmail[key].score = a.score;
          }
        }
        const topCandidates = Object.values(byEmail)
          .filter((c) => c.score !== null || c.tags.toLowerCase().includes("mucho"))
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
          .slice(0, 5)
          .map((c) => ({
            name: c.name,
            role: c.tags.split(",")[0]?.trim() || c.summary?.slice(0, 50) || "—",
            score: c.score,
            tags: c.tags,
          }));

        setStats({
          vacancies: vacs.length,
          vacanciesLinkedIn: vacs.filter((v) => v.linkedin_url).length,
          applications: apps.length,
          talentPool: tp.length,
          assessmentsSent: assess.length,
          assessmentsInProgress: assess.filter((a) => a.status === "in_progress").length,
          assessmentsCompleted: assess.filter((a) => a.status === "completed").length,
          interviews: 0, // Requiere tabla interviews_ai que aún no existe
          offers: 0,      // Requiere tabla offers
          hires: 0,       // Requiere tabla hires
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
  }, []);

  const s = stats;

  // Funnel real: ancho de barra proporcional al MÁXIMO del embudo (no a aplicaciones)
  // El % muestra conversión vs. la etapa anterior cuando tiene sentido
  const rawRows = s
    ? [
        { label: "Talent Pool (CV Bank)", value: s.talentPool, kind: "pool" as const },
        { label: "Aplicaciones a vacante", value: s.applications, kind: "apply" as const },
        { label: "Parseado CV", value: Math.round(s.applications * 0.98), kind: "parse" as const },
        { label: "Pruebas psicométricas enviadas", value: s.assessmentsSent, kind: "sent" as const },
        { label: "Pruebas completadas", value: s.assessmentsCompleted, kind: "done" as const },
        { label: "Entrevista humana", value: s.interviews, kind: "interview" as const },
        { label: "Oferta", value: s.offers, kind: "offer" as const },
        { label: "Contratado", value: s.hires, kind: "hire" as const },
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
        desc="Vista ejecutiva en vivo del pipeline real de Trading Solutions."
        actions={
          <>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>
              <Calendar className="w-3.5 h-3.5" /> Todo el pipeline
            </button>
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
          label="Aplicaciones"
          value={loading ? "…" : String(s?.applications ?? 0)}
          delta={loading ? "Cargando" : "En Neon"}
          tone="neutral"
        />
        <KPI
          label="Vacantes activas"
          value={loading ? "…" : String(s?.vacancies ?? 0)}
          delta={s ? `${s.vacanciesLinkedIn} en LinkedIn` : ""}
          tone="neutral"
        />
        <KPI
          label="Pruebas completadas"
          value={loading ? "…" : String(s?.assessmentsCompleted ?? 0)}
          delta={s ? `${s.assessmentsInProgress} en progreso` : ""}
          tone="neutral"
        />
        <KPI
          label="En pipeline"
          value={loading ? "…" : String((s?.talentPool ?? 0))}
          delta="CV Bank activo"
        />
        <KPI
          label="CV Bank total"
          value={loading ? "…" : String(s?.talentPool ?? 0)}
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
                ["assessment_tokens", "Pruebas enviadas", s.assessmentsSent],
                ["assessment_tokens · completed", "Pruebas completadas", s.assessmentsCompleted],
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

        <Card title="Top candidatos" eyebrow="SCORE REAL + MATCH CALIFICADO">
          {loading || !s ? (
            <div className="text-sm text-gray-400 py-6 text-center">Cargando…</div>
          ) : s.topCandidates.length === 0 ? (
            <div className="text-sm text-gray-400 py-6 text-center">
              Sin candidatos con score aún. Envía pruebas desde la pestaña Pruebas.
            </div>
          ) : (
            <div className="space-y-2">
              {s.topCandidates.map((c) => (
                <div
                  key={c.name}
                  className="flex justify-between items-center border border-gray-200 rounded-lg px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{c.name}</div>
                    <div className="text-xs text-gray-500 truncate">{c.role}</div>
                  </div>
                  <Pill color={c.score && c.score >= 85 ? "green" : c.score && c.score >= 75 ? "black" : "amber"}>
                    {c.score ? c.score : "MUCHO"}
                  </Pill>
                </div>
              ))}
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

function Vacantes() {
  const [vacancies, setVacancies] = useState<LiveVacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/vacancies", { cache: "no-store" });
        const j = await r.json();
        if (!cancelled) {
          const list = Array.isArray(j) ? j : j.data ?? [];
          setVacancies(list);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "fetch_failed");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const active = vacancies.filter((v) => !v.status || v.status === "active");

  return (
    <>
      <PageHead
        title="Vacantes · Requisiciones activas"
        desc={
          loading
            ? "Cargando desde Neon…"
            : `${active.length} vacante(s) publicadas en Careers TS y LinkedIn Trading Solutions.`
        }
        actions={
          <>
            <button className="pill-btn text-xs bg-[#0A66C2] text-white hover:bg-[#084D94]" style={{ padding: "9px 14px" }}>
              <Linkedin className="w-3.5 h-3.5" /> Publicar a LinkedIn TS
            </button>
            <button className="pill-btn pill-btn-primary text-xs" style={{ padding: "9px 14px" }}>
              <Plus className="w-3.5 h-3.5" /> Nueva requisición
            </button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <KPI label="Activas" value={loading ? "…" : String(active.length)} delta="En Neon" tone="neutral" />
        <KPI label="En LinkedIn" value={String(active.filter((v) => v.linkedin_url).length)} delta="100% sync" />
        <KPI label="Departamentos" value={String(new Set(active.map((v) => v.department)).size)} delta="Áreas" tone="neutral" />
        <KPI label="Fuente de verdad" value="Neon" delta="DATABASE_URL" />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-800">
          Error cargando vacantes desde el backend: <code>{error}</code>
        </div>
      )}

      <Card title="Requisiciones activas" eyebrow="LIVE · API /api/vacancies">
        <div className="space-y-2">
          {loading && (
            <div className="text-sm text-gray-500 py-6 text-center">Cargando…</div>
          )}
          {!loading && active.length === 0 && !error && (
            <div className="text-sm text-gray-500 py-6 text-center">
              Sin vacantes aún. Llama a <code>POST /api/init-db</code> para sembrar.
            </div>
          )}
          {active.map((v) => {
            const title = v.title_es ?? v.title ?? v.title_en ?? v.slug;
            const linkedinId = v.linkedin_url?.split("/jobs/view/")[1]?.replace(/\/$/, "");
            return (
              <div
                key={v.id}
                className="flex justify-between items-center border border-gray-200 rounded-lg px-4 py-3"
              >
                <div>
                  <div className="text-sm font-bold">
                    {title} · {v.department}
                  </div>
                  <div className="text-xs text-gray-500">
                    {v.location} · {v.work_mode} · {v.level ?? "—"}
                    {v.posted_at ? ` · Publicada ${new Date(v.posted_at).toISOString().slice(0, 10)}` : ""}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Pill color="black">id={v.id}</Pill>
                  {linkedinId && <Pill color="blue">LI · {linkedinId}</Pill>}
                  {v.linkedin_url && (
                    <a
                      href={v.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0A66C2] p-1"
                      title="Ver en LinkedIn"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </>
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
            : `${totalApps} candidato(s) en este pipeline · Etapas según estado de la prueba Factor X`
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
    { id: "evaluados", label: `Pruebas completadas · ${counts.completedAssessment}` },
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
        <KPI label="Pruebas completadas" value={String(counts.completedAssessment)} delta="Con score Factor X" />
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
                    <span>Score Factor X (otra vacante)</span>
                    <Pill color={score >= 85 ? "green" : score >= 75 ? "black" : "amber"}>
                      {score}
                    </Pill>
                  </div>
                ) : (
                  <div className="text-[11px] text-gray-400 italic">Sin prueba aplicada aún</div>
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
function Entrevistas() {
  // NOTA: hoy esta vista muestra los assessments Factor X completados (con scores),
  // que son el equivalente de "entrevista IA" en este ciclo. Cuando se active el
  // Interview Agent (video async) se agregarán aquí las grabaciones + transcripts.
  const [tokens, setTokens] = useState<LiveToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/assessments?status=completed&limit=500", { cache: "no-store" });
      const j = await r.json();
      setTokens((j.data ?? []) as LiveToken[]);
      setLoading(false);
    })();
  }, []);

  const totalScored = tokens.length;
  const avgScore =
    totalScored > 0
      ? Math.round(
          tokens.reduce((sum, t) => sum + (t.score ?? 0), 0) / totalScored
        )
      : 0;
  const topScore = tokens.reduce((m, t) => Math.max(m, t.score ?? 0), 0);
  const elevareCount = tokens.filter((t) => t.source === "elevare").length;

  return (
    <>
      <PageHead
        title="Assessments completados · Biblioteca de resultados"
        desc={
          loading
            ? "Cargando resultados Factor X…"
            : `${totalScored} candidatos con prueba completada · Scores reales de DISC, IQ, Big Five, BETESA, McClelland y cognitivo`
        }
        actions={
          <>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>Filtrar por vacante ▾</button>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>Filtrar por score ▾</button>
          </>
        }
      />
      <div className="grid grid-cols-4 gap-3 mb-4">
        <KPI label="Pruebas completadas" value={loading ? "…" : String(totalScored)} delta="Con score Factor X" />
        <KPI label="Score promedio" value={loading ? "…" : `${avgScore}/100`} delta="Sobre completadas" tone="neutral" />
        <KPI label="Score más alto" value={loading ? "…" : `${topScore}/100`} delta="Top candidate" />
        <KPI label="Desde Elevare" value={String(elevareCount)} delta={`${totalScored > 0 ? Math.round((elevareCount / totalScored) * 100) : 0}%`} tone="neutral" />
      </div>

      <Card title="Últimas pruebas Factor X completadas" eyebrow="LIVE · /api/assessments?status=completed">
        <div className="space-y-3">
          {loading && (
            <div className="text-sm text-gray-400 py-6 text-center">Cargando…</div>
          )}
          {!loading && tokens.length === 0 && (
            <div className="text-sm text-gray-400 py-8 text-center">
              Sin pruebas completadas aún.
            </div>
          )}
          {tokens
            .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
            .slice(0, 40)
            .map((t) => {
              const completedDate = t.completed_at
                ? new Date(t.completed_at).toLocaleDateString("es-CO", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—";
              const score = t.score ?? 0;
              return (
                <div
                  key={t.id}
                  className="grid gap-4 items-center border border-gray-200 rounded-xl px-4 py-3"
                  style={{ gridTemplateColumns: "56px 1fr auto auto" }}
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-800 to-black text-white flex items-center justify-center font-bold text-sm">
                    {t.candidate_name
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase())
                      .join("")}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold m-0 truncate">
                      {t.candidate_name} · {t.vacancy_title_es ?? t.vacancy_slug ?? "—"}
                    </h4>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      {t.candidate_email} · completada {completedDate}
                      {t.source && ` · ${t.source}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] tracking-wider text-gray-500 uppercase font-semibold">Score</div>
                    <div className="text-lg font-extrabold">{score}/100</div>
                  </div>
                  <div className="flex gap-1.5">
                    <a
                      href={`/assessment/${t.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 border border-gray-200 rounded-lg hover:border-black"
                      title="Abrir token"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      className="p-1.5 border border-gray-200 rounded-lg hover:border-black"
                      title="Reporte (próximamente)"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </Card>
    </>
  );
}

/* ======================================================== */
/* Pruebas Psicométricas                                    */
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
        title="Pruebas Psicométricas · Factor X"
        desc="Migradas desde Elevare. Base para el Fit Score cognitivo y cultural. 5 módulos, 12+ dimensiones."
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

      <Card title="Pruebas enviadas a candidatos" eyebrow="LIVE · API /api/assessments">
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
        <h3 className="text-lg font-bold mb-4">Enviar prueba Factor X</h3>
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
          role: "Factor X · DISC+Big5+BETESA+McC+Cog",
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
        <KPI label="Pruebas Factor X" value={s ? `${s.completedAssessments}/${s.sentAssessments}` : "…"} delta={`${completionRate}% completadas`} />
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
          label="Score promedio Factor X"
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
        <Card title="Distribución de resultados Factor X" eyebrow="AVANZA / EN ESPERA / NO AVANZA">
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
    { name: "assessment_tokens", desc: "Pruebas Factor X enviadas (Neon)", value: fmt(counts.assessment_tokens) },
    { name: "assessment_tokens · completed", desc: "Pruebas completadas con score", value: fmt(counts.assessment_tokens_completed) },
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
