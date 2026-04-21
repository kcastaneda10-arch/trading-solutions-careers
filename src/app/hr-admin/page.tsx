"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { jobs } from "@/data/jobs";
import {
  assessments,
  assessmentTokens,
  type AssessmentMeta,
} from "@/data/assessments";

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
function Dashboard() {
  return (
    <>
      <PageHead
        title="Dashboard · Talent Acquisition"
        desc="Vista ejecutiva del funnel, agentes de IA y salud del pipeline — últimos 30 días."
        actions={
          <>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>
              <Calendar className="w-3.5 h-3.5" /> Últimos 30 días
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
        <KPI label="Aplicaciones" value="148" delta="+42 sem" />
        <KPI label="Vacantes activas" value="3" delta="Barranquilla" tone="neutral" />
        <KPI label="Time-to-hire" value="14 d" delta="−9 días" />
        <KPI label="Quality of Hire" value="87%" delta="+4 pts" />
        <KPI label="CV Bank total" value="4,712" delta="+312 sem" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <Card title="Funnel de conversión · 30 días" eyebrow="AUTO · AGENTES IA">
          <Funnel
            rows={[
              { label: "Aplicaciones", pct: 100, value: 148 },
              { label: "Parseado CV", pct: 98, value: 145 },
              { label: "Screening IA", pct: 66, value: 98 },
              { label: "Pruebas psicométricas", pct: 42, value: 62 },
              { label: "Entrevista IA", pct: 24, value: 35 },
              { label: "Entrevista humana", pct: 12, value: 18 },
              { label: "Oferta", pct: 5, value: 7 },
              { label: "Contratado", pct: 3, value: 4 },
            ]}
          />
        </Card>
        <Card title="Source of Hire" eyebrow="ATRIBUIDO">
          <div className="space-y-3">
            <SourceBar label="LinkedIn Trading Solutions" pct={52} color="#0A66C2" value="52%" />
            <SourceBar label="Página Careers TS" pct={26} color="#111" value="26%" />
            <SourceBar label="Referidos internos" pct={14} color="#6B7280" value="14%" />
            <SourceBar label="Otros (Magneto, email)" pct={8} color="#9CA3AF" value="8%" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card title="Bases de datos activas" eyebrow="EN VIVO">
          <div className="space-y-2">
            {[
              ["candidates", "Perfiles históricos", "4,712"],
              ["applications", "Aplicaciones (3 vacantes)", "148"],
              ["assessments", "Pruebas Factor X + idioma", "62"],
              ["interviews_ai", "Videos + transcripts", "35"],
              ["offers", "Cartas generadas", "7"],
              ["hires", "Firmados & onboarded", "4"],
            ].map(([name, desc, n]) => (
              <div key={name} className="flex justify-between items-center border border-gray-200 rounded-lg px-3 py-2.5">
                <div>
                  <div className="text-sm font-semibold">{name}</div>
                  <div className="text-xs text-gray-500">{desc}</div>
                </div>
                <div className="text-xl font-extrabold">{n}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Top candidatos esta semana" eyebrow="FIT SCORE">
          <div className="space-y-2">
            {[
              ["Ana García", "Pricing Senior · Barranquilla · EN C1", 92, "green"],
              ["Javier Ramírez", "Pricing Senior · Barranquilla", 87, "green"],
              ["Daniela Ruiz", "Documentation · Barranquilla · EN C2", 83, "black"],
              ["Carlos Peña", "Inside Sales · Barranquilla", 80, "black"],
              ["Laura Martín", "Pricing Senior · Referida", 78, "amber"],
            ].map(([n, s, sc, c]) => (
              <div key={n as string} className="flex justify-between items-center border border-gray-200 rounded-lg px-3 py-2.5">
                <div>
                  <div className="text-sm font-semibold">{n as string}</div>
                  <div className="text-xs text-gray-500">{s as string}</div>
                </div>
                <Pill color={c as "green" | "black" | "amber"}>{sc}</Pill>
              </div>
            ))}
          </div>
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
            <MiniStat label="Followers" value="8,421" delta="+124" />
            <MiniStat label="Vacantes sync" value="3/3" delta="100%" />
            <MiniStat label="Aplicaciones LI" value="77" delta="52%" />
            <MiniStat label="InMail open" value="38%" delta="+6pts" />
          </div>
        </Card>
      </div>
    </>
  );
}

function Funnel({ rows }: { rows: { label: string; pct: number; value: number }[] }) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => (
        <div key={r.label} className="grid items-center gap-2.5" style={{ gridTemplateColumns: "140px 1fr 70px" }}>
          <span className="text-sm text-gray-500 font-medium">{r.label}</span>
          <div className="h-7 bg-gray-100 rounded-lg overflow-hidden">
            <div
              className="h-full bg-black rounded-l-lg flex items-center justify-end px-2.5 text-[11px] font-semibold text-white"
              style={{ width: `${Math.max(r.pct, 4)}%` }}
            >
              {r.pct}%
            </div>
          </div>
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
function Vacantes() {
  return (
    <>
      <PageHead
        title="Vacantes · Requisiciones activas"
        desc="3 vacantes publicadas · Sincronizadas con Careers TS y LinkedIn Trading Solutions."
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
        <KPI label="Activas" value="3" delta="Todas en BAQ" tone="neutral" />
        <KPI label="Publicadas en LinkedIn" value="3" delta="100% sync" />
        <KPI label="Aplicaciones (30d)" value="148" delta="+42 sem" />
        <KPI label="Avg time-to-shortlist" value="4 min" delta="vs 3 días manual" />
      </div>

      <Card title="Requisiciones activas" eyebrow="SYNC CAREERS + LINKEDIN TS">
        <div className="space-y-2">
          {jobs.map((j) => {
            const apps = j.id === 1 ? 52 : j.id === 2 ? 48 : 48;
            const li = j.id === 1 ? 28 : j.id === 2 ? 24 : 25;
            return (
              <div
                key={j.id}
                className="flex justify-between items-center border border-gray-200 rounded-lg px-4 py-3"
              >
                <div>
                  <div className="text-sm font-bold">
                    {j.title.es} · {j.dept}
                  </div>
                  <div className="text-xs text-gray-500">
                    {j.location} · {j.mode} · {j.level} · Publicada {j.postedAt}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Pill color="black">{apps} apl.</Pill>
                  <Pill color="blue">LinkedIn · {li}</Pill>
                  <a
                    href={j.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0A66C2] p-1"
                    title="Ver en LinkedIn"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
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
function Pipeline() {
  const stages = [
    { label: "APLICACIÓN", count: 52 },
    { label: "SCREENING", count: 22 },
    { label: "PRUEBAS", count: 9 },
    { label: "ENTREVISTA IA", count: 5 },
    { label: "ENTREVISTA HUMANA", count: 2 },
    { label: "OFERTA & FIRMA", count: 1 },
  ];
  const cards: Record<number, { name: string; meta: string; score: number; src: string; color: "green" | "black" | "amber" }[]> = {
    0: [
      { name: "Ana García", meta: "4.5 años · Panamá → BAQ · EN C1", score: 92, src: "LinkedIn TS", color: "green" },
      { name: "Javier Ramírez", meta: "6 años · BAQ · EN C1", score: 87, src: "LinkedIn TS", color: "green" },
      { name: "Lorena Díaz", meta: "3 años · BAQ · EN B2", score: 79, src: "Careers TS", color: "black" },
      { name: "Pedro Castillo", meta: "2 años · BAQ · EN B2", score: 64, src: "LinkedIn TS", color: "amber" },
    ],
    1: [
      { name: "María Ortiz", meta: "3 años · BAQ · EN B1", score: 74, src: "LinkedIn TS", color: "amber" },
      { name: "Daniela Ruiz", meta: "5 años · BAQ · EN C2", score: 83, src: "Careers TS", color: "black" },
      { name: "Alberto Vásquez", meta: "4 años · BAQ", score: 81, src: "LinkedIn TS", color: "black" },
    ],
    2: [
      { name: "Carolina Mena", meta: "6 años · BAQ · Factor X activo", score: 88, src: "Referida", color: "green" },
      { name: "Luis Arroyo", meta: "5 años · Cartagena · pruebas 68%", score: 80, src: "LinkedIn TS", color: "black" },
    ],
    3: [
      { name: "Ana García", meta: "Video 12 min · ▶ Grabada", score: 92, src: "LinkedIn TS", color: "green" },
      { name: "Daniela Ruiz", meta: "Video 11 min · ▶ Grabada", score: 83, src: "Careers TS", color: "black" },
    ],
    4: [
      { name: "Ana García", meta: "Agendada · Vie 10:00", score: 92, src: "Hiring Mgr", color: "green" },
    ],
    5: [
      { name: "Ana García", meta: "Firmada · Ingreso 02/05", score: 92, src: "FIRMADA", color: "green" },
    ],
  };

  return (
    <>
      <PageHead
        title="Pipeline · Pricing Senior (Barranquilla)"
        desc="148 aplicaciones activas · Drag &amp; drop habilitado · Cambia de vacante para ver su pipeline."
        actions={
          <>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>
              <Filter className="w-3.5 h-3.5" /> Filtrar
            </button>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>
              Cambiar vacante ▾
            </button>
          </>
        }
      />

      <div className="grid grid-cols-6 gap-2.5 overflow-x-auto">
        {stages.map((s, i) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-2.5 min-h-[520px] flex flex-col">
            <div className="flex justify-between items-center px-1 pb-2.5 border-b border-gray-200 mb-2">
              <h4 className="text-[12px] font-bold tracking-wide m-0">{s.label}</h4>
              <span className="text-[11px] text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded-full">
                {s.count}
              </span>
            </div>
            <div className="space-y-2 overflow-y-auto">
              {(cards[i] ?? []).map((c, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 cursor-grab hover:border-black transition-colors"
                >
                  <div className="text-[13px] font-semibold">{c.name}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{c.meta}</div>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-[10px] font-semibold ${c.src === "LinkedIn TS" ? "text-[#0A66C2]" : "text-gray-600"}`}>
                      {c.src === "LinkedIn TS" && "in · "}
                      {c.src}
                    </span>
                    <Pill color={c.color}>{c.score}</Pill>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ======================================================== */
/* CV Bank                                                  */
/* ======================================================== */
function CVBank() {
  const chips = ["Todos · 4,712", "Match > 80 · 318", "Open to Work · 942", "LinkedIn TS Followers · 1,204", "Silver medalists · 86", "Barranquilla · 1,204", "Bilingüe · 2,103"];
  const [activeChip, setActiveChip] = useState(0);
  return (
    <>
      <PageHead
        title="CV Bank · Talent Pool"
        desc="4,712 perfiles históricos + followers de LinkedIn TS. Re-matching automático cada vez que se abre una vacante."
        actions={
          <>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button className="pill-btn text-xs bg-[#0A66C2] text-white hover:bg-[#084D94]" style={{ padding: "9px 14px" }}>
              <Linkedin className="w-3.5 h-3.5" /> Importar LinkedIn TS
            </button>
            <button className="pill-btn pill-btn-primary text-xs" style={{ padding: "9px 14px" }}>
              <Search className="w-3.5 h-3.5" /> Match nueva vacante
            </button>
          </>
        }
      />

      <div className="flex gap-2 mb-3">
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-full">
          <Search className="w-3.5 h-3.5 text-gray-500" />
          <input
            className="flex-1 bg-transparent outline-none text-sm"
            placeholder="Busca por skill, empresa, años de experiencia…"
            defaultValue="freight forwarding"
          />
        </div>
        <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>
          Match contra: Pricing Senior ▾
        </button>
      </div>
      <div className="flex gap-2 flex-wrap mb-4">
        {chips.map((c, i) => (
          <button
            key={c}
            onClick={() => setActiveChip(i)}
            className={`filter-chip ${activeChip === i ? "active" : ""}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        <KPI label="Total perfiles" value="4,712" delta="+312 sem" />
        <KPI label="Fuente LinkedIn TS" value="2,184" delta="46%" tone="neutral" />
        <KPI label="Match > 80 vs activas" value="318" delta="Re-match auto" />
        <KPI label="Silver medalists" value="86" delta="Finalistas pasados" tone="neutral" />
      </div>

      <h3 className="text-sm font-bold mb-3">
        Coincidencias con vacante activa · Pricing Senior · Barranquilla
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {[
          { name: "Ana García", init: "AG", role: "Senior Logistics · Kuehne+Nagel", years: "4.5 a", en: "C1", loc: "BAQ", score: 92, src: "LinkedIn TS", second: ["Doc Spec", 78] },
          { name: "Javier Ramírez", init: "JR", role: "Ops Lead · DHL Panamá", years: "6 a", en: "C1", loc: "BAQ", score: 87, src: "LinkedIn TS", second: ["Inside Sales", 72] },
          { name: "Daniela Ruiz", init: "DR", role: "Customs Spec · FedEx", years: "5 a", en: "C2", loc: "BAQ", score: 83, src: "Careers TS", second: ["Doc Spec", 91] },
          { name: "Carolina Mena", init: "CM", role: "Ops Coord · Maersk", years: "6 a", en: "C1", loc: "BAQ", score: 88, src: "LinkedIn TS", second: ["Silver medalist", 0] },
          { name: "Luis Arroyo", init: "LA", role: "Ocean Freight · Expeditors", years: "5 a", en: "C1", loc: "BAQ", score: 80, src: "LinkedIn TS", second: ["Doc Spec", 74] },
          { name: "Laura Martín", init: "LM", role: "Freight Pricing · Hapag-Lloyd", years: "4 a", en: "C2", loc: "BAQ", score: 78, src: "Referida", second: ["Inside Sales", 68] },
        ].map((c) => (
          <div key={c.name} className="bg-white border border-gray-200 rounded-2xl p-4 relative">
            <span
              className={`absolute top-2.5 right-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                c.src === "LinkedIn TS"
                  ? "bg-[#E7F1FA] text-[#0A66C2]"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {c.src === "LinkedIn TS" && "in · "}
              {c.src}
            </span>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-[13px]">
                {c.init}
              </div>
              <div>
                <div className="text-sm font-bold">{c.name}</div>
                <div className="text-xs text-gray-500">{c.role}</div>
              </div>
            </div>
            <div className="flex gap-3 text-xs text-gray-500 mt-2">
              <div>
                <b className="block text-black text-[13px] leading-tight">{c.years}</b>Experiencia
              </div>
              <div>
                <b className="block text-black text-[13px] leading-tight">{c.en}</b>Inglés
              </div>
              <div>
                <b className="block text-black text-[13px] leading-tight">{c.loc}</b>Ubicación
              </div>
            </div>
            <div className="pt-2.5 mt-2.5 border-t border-gray-100 text-xs text-gray-500">
              <div className="flex justify-between items-center mt-1">
                <span>Match Pricing Senior</span>
                <Pill color={c.score >= 85 ? "green" : c.score >= 75 ? "black" : "amber"}>{c.score}</Pill>
              </div>
              {c.second[1] !== 0 && (
                <div className="flex justify-between items-center mt-1">
                  <span>Match {c.second[0]}</span>
                  <Pill color="gray">{c.second[1]}</Pill>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ======================================================== */
/* Entrevistas IA                                           */
/* ======================================================== */
function Entrevistas() {
  const rows = [
    { name: "Ana García", role: "Pricing Senior", lang: "ES", dur: "12:04", dateLoc: "BAQ · 21 abr 2026 10:34", tags: ["Motivación alta", "Incoterms sólidos", "Liderazgo"], score: 92 },
    { name: "Daniela Ruiz", role: "Doc. Specialist", lang: "EN", dur: "10:52", dateLoc: "BAQ · 21 abr 2026 09:12", tags: ["Compliance", "Proactiva"], score: 83 },
    { name: "Carlos Peña", role: "Inside Sales", lang: "ES", dur: "13:18", dateLoc: "BAQ · 20 abr 2026 17:40", tags: ["CRM", "Bilingüe"], score: 80 },
    { name: "María Ortiz", role: "Pricing Senior", lang: "ES", dur: "9:46", dateLoc: "BAQ · 20 abr 2026 11:05", tags: ["Analítica", "EN limitado"], score: 74 },
  ];
  return (
    <>
      <PageHead
        title="Entrevistas IA · Biblioteca"
        desc="35 entrevistas grabadas · Todas con video, transcript y score por rúbrica · Buscable por competencia."
        actions={
          <>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>Filtrar por vacante ▾</button>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>Filtrar por score ▾</button>
            <button className="pill-btn pill-btn-primary text-xs" style={{ padding: "9px 14px" }}>
              <Search className="w-3.5 h-3.5" /> Buscar transcript
            </button>
          </>
        }
      />
      <div className="grid grid-cols-4 gap-3 mb-4">
        <KPI label="Entrevistas grabadas" value="35" delta="+12 sem" />
        <KPI label="Duración promedio" value="11 min" delta="Rango 7-18 min" tone="neutral" />
        <KPI label="NPS candidato" value="4.6 / 5" delta="+0.3" />
        <KPI label="Archivo total" value="12 GB" delta="Retención 24 meses" tone="neutral" />
      </div>

      <Card title="Últimas entrevistas completadas" eyebrow="Video + transcript + rúbrica">
        <div className="space-y-3">
          {rows.map((r) => (
            <div
              key={r.name}
              className="grid gap-4 items-center border border-gray-200 rounded-xl px-4 py-3"
              style={{ gridTemplateColumns: "130px 1fr auto auto" }}
            >
              <div className="w-[130px] h-[76px] rounded-xl bg-gradient-to-br from-gray-800 to-black text-white flex items-center justify-center relative">
                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 fill-white" />
                </div>
                <span className="absolute bottom-1.5 right-1.5 text-[10px] bg-black/60 px-1.5 py-0.5 rounded font-semibold">
                  {r.dur}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold m-0">{r.name} · {r.role}</h4>
                <div className="text-xs text-gray-500 mt-0.5">
                  {r.lang} · {r.dateLoc} · Interview Agent v2.4
                </div>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {r.tags.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-800 font-semibold rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] tracking-wider text-gray-500 uppercase font-semibold">Score</div>
                <div className="text-lg font-extrabold">{r.score}/100</div>
              </div>
              <div className="flex gap-1.5">
                <button className="p-1.5 border border-gray-200 rounded-lg hover:border-black" title="Ver video">
                  <Play className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 border border-gray-200 rounded-lg hover:border-black" title="Transcript">
                  <FileText className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 border border-gray-200 rounded-lg hover:border-black" title="Compartir">
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

/* ======================================================== */
/* Pruebas Psicométricas                                    */
/* ======================================================== */
function Pruebas() {
  const stats = {
    sent: assessmentTokens.length,
    completed: assessmentTokens.filter((t) => t.status === "completed").length,
    inProgress: assessmentTokens.filter((t) => t.status === "in_progress").length,
  };
  return (
    <>
      <PageHead
        title="Pruebas Psicométricas · Factor X"
        desc="Migradas desde Elevare. Base para el Fit Score cognitivo y cultural. 5 módulos, 12+ dimensiones."
        actions={
          <>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>
              Ver librería
            </button>
            <button className="pill-btn pill-btn-primary text-xs" style={{ padding: "9px 14px" }}>
              <Plus className="w-3.5 h-3.5" /> Enviar prueba
            </button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-3 mb-5">
        <KPI label="Tokens enviados" value={String(stats.sent)} delta="Última sem" tone="neutral" />
        <KPI label="En progreso" value={String(stats.inProgress)} delta="Activos" tone="neutral" />
        <KPI label="Completadas" value={String(stats.completed)} delta="Score listo" />
        <KPI label="Tiempo prom. candidato" value="88 min" delta="5 pruebas" tone="neutral" />
      </div>

      <h3 className="text-sm font-bold mb-3">Catálogo de pruebas</h3>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {assessments.map((a: AssessmentMeta) => (
          <div key={a.id} className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                style={{ background: a.color }}
              >
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm">{a.title.es}</div>
                <div className="text-xs text-gray-500">
                  {a.required ? "Obligatoria" : "Opcional por rol"}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{a.summary.es}</p>
            <div className="flex gap-3 mt-3 text-[11px] text-gray-500 font-semibold">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.duration} min</span>
              <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{a.questions} preg.</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{a.dimensions.length} dim.</span>
            </div>
          </div>
        ))}
      </div>

      <Card title="Pruebas enviadas a candidatos" eyebrow="TOKEN-BASED · TRAZABILIDAD">
        <div className="space-y-2">
          {assessmentTokens.map((t) => {
            const job = jobs.find((j) => j.slug === t.jobSlug);
            const statusColor: "green" | "amber" | "gray" =
              t.status === "completed" ? "green" : t.status === "in_progress" ? "amber" : "gray";
            return (
              <div key={t.token} className="flex justify-between items-center border border-gray-200 rounded-lg px-4 py-3">
                <div className="flex-1">
                  <div className="text-sm font-bold">{t.candidate}</div>
                  <div className="text-xs text-gray-500">
                    {job?.title.es} · {t.assessmentIds.length} pruebas · Enviada {t.sentAt}
                    {t.completedAt && ` · Completada ${t.completedAt}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Pill color={statusColor}>{t.status.toUpperCase()}</Pill>
                  {t.score && <Pill color="black">{t.score}/100</Pill>}
                  <a
                    href={`/assessment/${t.token}`}
                    target="_blank"
                    className="p-1.5 border border-gray-200 rounded-lg hover:border-black"
                    title="Ver token del candidato"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
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
/* Agentes IA                                               */
/* ======================================================== */
function Agentes() {
  const agents: { name: string; role: string; stats: [string, string][] }[] = [
    { name: "Job Writer Agent", role: "Copywriting + Talent Marketing", stats: [["Drafts", "3"], ["Aprob. sin edit", "78%"], ["Tiempo", "30 s"]] },
    { name: "Intake Agent", role: "Recepción + validación", stats: [["Aplicaciones", "148"], ["Rechazos", "2.1%"], ["Tiempo", "4 s"]] },
    { name: "CV Parser Agent", role: "OCR + NLP", stats: [["CVs parseados", "145"], ["Campos OK", "97%"], ["Tiempo", "6 s"]] },
    { name: "Screening Agent", role: "Matching + scoring", stats: [["Scorings", "145"], ["Accuracy", "94%"], ["Tiempo", "3.2 s"]] },
    { name: "Ranker Agent", role: "Priorización + calibración", stats: [["Rankings", "52"], ["Feedback loop", "+3 pts"], ["Tiempo", "1.8 s"]] },
    { name: "Assessment Agent", role: "Factor X + BETESA", stats: [["Pruebas", "62"], ["Auto-score", "100%"], ["Dropoff", "22%"]] },
    { name: "Interview Agent", role: "Video async + transcript", stats: [["Entrevistas", "35"], ["NPS", "4.6/5"], ["Dropoff", "11%"]] },
    { name: "Report Agent", role: "Síntesis + narrativa", stats: [["One-pagers", "35"], ["Útil HM", "4.4/5"], ["Tiempo", "8 s"]] },
    { name: "Scheduler Agent", role: "Calendarios + zonas", stats: [["Meetings", "18"], ["Auto-agend.", "94%"], ["Reagend.", "7%"]] },
    { name: "Offer Agent", role: "Cartas + negociación", stats: [["Ofertas", "7"], ["Aceptación", "72%"], ["En banda", "100%"]] },
    { name: "BGC + Reference Agents", role: "Verificación + voz", stats: [["Llamadas", "21"], ["Verdes", "88%"], ["Tiempo", "< 24h"]] },
    { name: "Contract + e-Sign Agents", role: "Legal + firma", stats: [["Contratos", "4"], ["Firmas < 24h", "93%"], ["Países", "1"]] },
  ];
  return (
    <>
      <PageHead
        title="Agentes IA · Activity & performance"
        desc="12 agentes en producción · Monitor de salud, throughput, accuracy, costo y SLA."
        actions={
          <>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>Últimas 24h ▾</button>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>Ver logs</button>
          </>
        }
      />
      <div className="grid grid-cols-4 gap-3 mb-4">
        <KPI label="Acciones totales (24h)" value="3,204" delta="+12%" />
        <KPI label="Accuracy promedio" value="94%" delta="+2 pts" />
        <KPI label="Costo IA por hire" value="$12.40" delta="−28%" />
        <KPI label="SLA cumplido" value="99.2%" delta="Uptime" tone="neutral" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {agents.map((a) => (
          <div key={a.name} className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="text-sm font-bold">{a.name}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{a.role}</div>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.1em] text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" />
                ON
              </span>
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
        ))}
      </div>
    </>
  );
}

/* ======================================================== */
/* Analytics                                                */
/* ======================================================== */
function Analytics() {
  return (
    <>
      <PageHead
        title="Analytics · Indicadores para mejora continua"
        desc="Todo queda documentado para entrenar agentes, mejorar fit scores y reducir time-to-hire."
        actions={
          <>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>Último trimestre ▾</button>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>Descargar reporte</button>
          </>
        }
      />
      <div className="grid grid-cols-4 gap-3 mb-4">
        <KPI label="Quality of Hire" value="87%" delta="+4 pts" />
        <KPI label="Time-to-hire" value="14 d" delta="−9 d" />
        <KPI label="Cost-per-hire" value="$412" delta="−38%" />
        <KPI label="Early attrition 90d" value="3.6%" delta="−2.1 pts" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card title="Quality of Hire vs meta" eyebrow="POR COHORTE">
          <svg viewBox="0 0 400 200" className="w-full h-[200px]" preserveAspectRatio="none">
            <g stroke="#F3F4F6" strokeWidth="1">
              <line x1="30" y1="40" x2="390" y2="40" />
              <line x1="30" y1="80" x2="390" y2="80" />
              <line x1="30" y1="120" x2="390" y2="120" />
              <line x1="30" y1="160" x2="390" y2="160" />
            </g>
            <g fill="#000">
              <rect x="50" y="88" width="40" height="92" rx="6" />
              <rect x="110" y="76" width="40" height="104" rx="6" />
              <rect x="170" y="64" width="40" height="116" rx="6" />
              <rect x="230" y="56" width="40" height="124" rx="6" />
              <rect x="290" y="44" width="40" height="136" rx="6" />
            </g>
            <line x1="30" y1="64" x2="390" y2="64" stroke="#0A66C2" strokeWidth="2" strokeDasharray="4 4" />
            <text x="340" y="60" fontSize="10" fill="#0A66C2" fontFamily="Inter">Meta 85%</text>
            <g fontSize="10" fill="#6B7280" fontFamily="Inter">
              <text x="58" y="195">Q3'25</text>
              <text x="118" y="195">Q4'25</text>
              <text x="178" y="195">Q1'26</text>
              <text x="238" y="195">Q2'26*</text>
              <text x="298" y="195">Proy</text>
            </g>
          </svg>
        </Card>
        <Card title="Effectiveness por fuente" eyebrow="HIRE / APLICACIÓN">
          <div className="space-y-3">
            <SourceBar label="LinkedIn TS" pct={72} color="#0A66C2" value="2.6%" />
            <SourceBar label="Careers TS" pct={85} color="#111" value="3.1%" />
            <SourceBar label="Referidos" pct={100} color="#059669" value="4.4%" />
            <SourceBar label="Otros" pct={18} color="#9CA3AF" value="0.9%" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card title="Tiempo promedio por etapa (días)" eyebrow="ÚLT. 90 DÍAS">
          <Funnel
            rows={[
              { label: "Aplicación → Screen", pct: 6, value: 0.1 },
              { label: "Screen → Pruebas", pct: 14, value: 0.3 },
              { label: "Pruebas → Entrevista IA", pct: 22, value: 1 },
              { label: "Entrevista IA → Humana", pct: 62, value: 3 },
              { label: "Humana → Oferta", pct: 82, value: 4 },
              { label: "Oferta → Firma", pct: 100, value: 5.6 },
            ]}
          />
        </Card>
        <Card title="Feedback loop · Agente ↔ Reclutador" eyebrow="ENTRENAMIENTO">
          <div className="space-y-2">
            {[
              ["Override de ranking", "Reclutador movió candidato del #12 al #3", "+18 muestras", "gray"],
              ["Descarte manual", "Rechazo después de Entrevista IA", "+42 muestras", "gray"],
              ["Ajuste de weight", "\"Inglés\" +15% para Pricing Senior", "Activo", "green"],
              ["Red flag entrenada", "Incoherencia de fechas en CV", "+3% accuracy", "green"],
            ].map(([n, d, s, c]) => (
              <div key={n as string} className="flex justify-between items-center border border-gray-200 rounded-lg px-3 py-2.5">
                <div>
                  <div className="text-sm font-semibold">{n}</div>
                  <div className="text-xs text-gray-500">{d}</div>
                </div>
                <Pill color={c as "gray" | "green"}>{s}</Pill>
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
  return (
    <>
      <PageHead
        title="LinkedIn · Trading Solutions (página de compañía)"
        desc="Integración oficial con la cuenta corporativa. Publicación, branding, talent pool y LinkedIn Recruiter."
        actions={
          <>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>Configurar</button>
            <button className="pill-btn text-xs bg-[#0A66C2] text-white hover:bg-[#084D94]" style={{ padding: "9px 14px" }}>
              Abrir LinkedIn Recruiter
            </button>
          </>
        }
      />

      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4 grid gap-5 items-center" style={{ gridTemplateColumns: "64px 1fr auto" }}>
        <div className="w-16 h-16 rounded-xl bg-[#0A66C2] text-white flex items-center justify-center font-extrabold text-2xl">in</div>
        <div>
          <h3 className="text-lg font-bold m-0">Trading Solutions</h3>
          <div className="text-[13px] text-gray-500 mt-1">
            linkedin.com/company/trading-solutions · Logistics &amp; Supply Chain · 201–500 empleados
          </div>
          <div className="inline-flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Conectado como admin corporativo · OAuth válido
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-gray-500">Última sync</div>
          <div className="text-sm font-bold">hace 2 minutos</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <MiniStat label="Followers" value="8,421" delta="+124 sem" />
        <MiniStat label="Empleados en LI" value="163" delta="93% del roster" />
        <MiniStat label="Vacantes publicadas" value="3 / 3" delta="100% sync auto" />
        <MiniStat label="Aplicaciones LI 30d" value="77" delta="52% del total" />
        <MiniStat label="InMails enviados" value="32" delta="38% open rate" />
        <MiniStat label="Open-to-Work en pool" value="942" delta="en base TS" />
        <MiniStat label="Recruiter credits" value="320" delta="de 500 mes" />
        <MiniStat label="Alumni network" value="41" delta="ex-TS" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card title="Vacantes sincronizadas con LinkedIn TS" eyebrow="BIDIRECCIONAL">
          <div className="space-y-2">
            {jobs.map((j) => (
              <div key={j.id} className="flex justify-between items-center border border-gray-200 rounded-lg px-3 py-2.5">
                <div>
                  <div className="text-sm font-bold">{j.title.es}</div>
                  <div className="text-xs text-gray-500">
                    Publicada {j.postedAt} · LinkedIn job ID {j.linkedinUrl.split("/jobs/view/")[1].replace("/", "")}
                  </div>
                </div>
                <a href={j.linkedinUrl} target="_blank" rel="noopener noreferrer">
                  <Pill color="blue">ACTIVA</Pill>
                </a>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Qué hace la integración" eyebrow="CAPACIDADES">
          <div className="space-y-2">
            {[
              ["Publicación automática", "Crear vacante → aparece en LinkedIn TS en segundos"],
              ["Easy Apply al pipeline", "Las aplicaciones LI entran al mismo ATS"],
              ["Enrich de perfiles", "Recomendaciones, skills, certificados, alumni"],
              ["Filtro Open-to-Work", "Ranker Agent prioriza candidatos disponibles"],
              ["InMail desde el ATS", "Sourcing con templates y tracking"],
              ["Followers → CV Bank", "8,421 followers con consentimiento"],
              ["Advocacy de empleados", "163 empleados re-comparten vacantes"],
            ].map(([n, d]) => (
              <div key={n as string} className="flex justify-between items-center border border-gray-200 rounded-lg px-3 py-2.5">
                <div>
                  <div className="text-sm font-semibold">{n}</div>
                  <div className="text-xs text-gray-500">{d}</div>
                </div>
                <Pill color="green">ON</Pill>
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
  const tables: [string, string, string][] = [
    ["candidates", "CV bank · perfiles", "4,712"],
    ["applications", "Aplicaciones a vacantes", "148"],
    ["requisitions", "Vacantes activas + cerradas", "12"],
    ["cv_embeddings", "Vectores para matching", "4,712"],
    ["scorings", "Fit scores históricos", "1,204"],
    ["assessments", "Pruebas Factor X + idioma", "62"],
    ["assessment_answers", "Respuestas individuales", "4,872"],
    ["interviews_ai", "Video + transcript", "35"],
    ["interview_scores", "Rúbricas + dimensiones", "35"],
    ["offers", "Cartas generadas", "7"],
    ["contracts", "Legal laboral + anexos", "4"],
    ["signatures", "Logs e-Sign", "4"],
    ["hires", "Nuevos empleados", "4"],
    ["agent_logs", "Acciones de agentes IA", "3,204"],
    ["recruiter_overrides", "Decisiones humanas", "60"],
    ["linkedin_sync", "Eventos LI TS", "2,184"],
    ["audit_trail", "Cambios inmutables", "9,812"],
  ];
  return (
    <>
      <PageHead
        title="Bases de datos · Schema del ATS"
        desc="Todo lo que se guarda, se documenta y se usa como fuente de verdad para indicadores y mejora continua."
        actions={
          <>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>Export schema</button>
            <button className="pill-btn pill-btn-outline text-xs" style={{ padding: "9px 14px" }}>Ver API docs</button>
          </>
        }
      />
      <div className="grid grid-cols-4 gap-3 mb-4">
        {tables.map(([n, d, c]) => (
          <div key={n} className="bg-white border border-gray-200 rounded-2xl p-4 flex justify-between items-center">
            <div>
              <div className="text-sm font-bold">{n}</div>
              <div className="text-xs text-gray-500 mt-0.5">{d}</div>
            </div>
            <div className="text-xl font-extrabold">{c}</div>
          </div>
        ))}
      </div>
      <Card title="Relaciones principales" eyebrow="ER SIMPLIFICADO">
        <pre className="bg-black text-gray-200 p-4 rounded-lg text-xs font-mono leading-relaxed overflow-x-auto m-0">
{`candidates  ──1:N──▶  applications  ──N:1──▶  requisitions
    │                       │
    │                       ├──▶ scorings
    │                       ├──▶ assessments ──▶ assessment_answers
    │                       ├──▶ interviews_ai ──▶ interview_scores
    │                       └──▶ offers ──▶ contracts ──▶ signatures ──▶ hires
    │
    ├──▶ cv_embeddings       (vectores para re-matching)
    ├──▶ linkedin_sync       (LinkedIn TS followers + Easy Apply)
    └──▶ recruiter_overrides (feedback loop de Kelly → agentes)

agent_logs  ◄── registra todo lo que hacen los 12 agentes
audit_trail ◄── inmutable, todo cambio queda documentado`}
        </pre>
      </Card>
    </>
  );
}
