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
  ClipboardCheck,
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
  // Corporate icon set — replace emojis
  Target,
  Trophy,
  Hand,
  AlertOctagon,
  Moon,
  AlertTriangle,
  TrendingUp,
  Users,
  Mic,
  Headphones,
  BarChart3,
  Globe,
  Award,
  Flag,
  Inbox,
  Mail,
  Send,
  Hourglass,
  XCircle,
  MessageSquare,
  Building2,
  UserCheck,
  PartyPopper,
  Eye,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { jobs } from "@/data/jobs";
import { factorXTS } from "@/data/assessments";
import PrefiltrosPanel from "@/components/PrefiltrosPanel";
import PipelineFunnel from "@/components/PipelineFunnel";

type Tab =
  | "dashboard"
  | "vacantes"
  | "funnel"
  | "onboarding"
  | "cvbank"
  | "agentes";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "vacantes", label: "Vacantes", icon: Briefcase },
  { id: "funnel", label: "Funnel", icon: Kanban },
  { id: "onboarding", label: "Onboarding", icon: ClipboardCheck },
  { id: "cvbank", label: "CV Bank", icon: Database },
  { id: "agentes", label: "Agentes IA", icon: Bot },
];

const VALID_TABS: Tab[] = ["dashboard", "vacantes", "funnel", "onboarding", "cvbank", "agentes"];

function getInitialTab(): Tab {
  if (typeof window === 'undefined') return 'dashboard';
  const hash = window.location.hash.replace('#', '') as Tab;
  return VALID_TABS.includes(hash) ? hash : 'dashboard';
}

export default function HRAdminPage() {
  const [tab, setTabState] = useState<Tab>(getInitialTab);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // setTab que persiste en URL hash — sobrevive refresh y permite share-link
  const setTab = useCallback((next: Tab) => {
    setTabState(next);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${next}`);
    }
  }, []);

  // Sync con cambios externos del hash (back/forward del browser, etc.)
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace('#', '') as Tab;
      if (VALID_TABS.includes(h) && h !== tab) setTabState(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [tab]);

  // Global Cmd+K / Ctrl+K shortcut to open search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  return (
    <div className="min-h-screen font-sans" style={{ background: "#EBEBEB" }}>
      {/* Top bar — estilo TS minimalista negro */}
      <header className="sticky top-0 z-50 bg-black border-b border-white/5">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            {/* Logo TS oficial */}
            <img
              src="https://cdn.prod.website-files.com/68fb7b9474bf8f90808cd50f/6913594489519813fe9e620e_logo%20web-03.png"
              alt="Trading Solutions"
              className="h-8 w-auto"
            />
            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-white/15">
              <span className="text-[11px] font-medium text-white/60 tracking-[0.04em] uppercase">HR Admin</span>
              <span className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/50 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-sm">
                Enabler
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Buscador global */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-white text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors"
              title="Buscar candidatos (Cmd+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Buscar</span>
              <kbd className="text-[9px] font-mono bg-white/10 border border-white/15 rounded px-1 py-0.5 ml-1">⌘K</kbd>
            </button>
            {/* Importar */}
            <button
              onClick={() => setImportOpen(true)}
              className="flex items-center gap-1.5 text-white/70 hover:text-white text-[12px] font-medium px-3 py-1.5 rounded-full hover:bg-white/[0.06] transition-colors"
              title="Importar candidatos desde Excel"
            >
              <Download className="w-3.5 h-3.5" style={{ transform: 'rotate(180deg)' }} />
              <span>Importar</span>
            </button>
            {/* Agendar entrevista — pill negra estilo TS con borde blanco */}
            <button
              onClick={() => setScheduleOpen(true)}
              className="flex items-center gap-1.5 bg-white text-black hover:bg-white/90 text-[12px] font-semibold px-3.5 py-1.5 rounded-full transition-colors"
              title="Agendar entrevista"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Agendar</span>
            </button>
            <button className="text-white/60 hover:text-white relative p-1.5">
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
            </button>
            <div className="flex items-center gap-2 pl-2 ml-1 border-l border-white/10">
              <Avatar name="Kelly Castañeda" size={28} />
              <span className="text-white text-[12px] font-medium hidden sm:inline">Kelly Castañeda</span>
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
              className="flex items-center gap-1.5 text-white/60 hover:text-white text-[12px] font-medium px-2.5 py-1.5 rounded-full hover:bg-white/[0.06] transition-colors"
            >
              <LogOut className="w-[14px] h-[14px]" />
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
        {tab === "dashboard" && <Dashboard setTab={setTab} />}
        {tab === "vacantes" && <Vacantes />}
        {tab === "funnel" && <PipelineFunnel />}
        {tab === "onboarding" && <OnboardingTab />}
        {tab === "cvbank" && <CVBank />}
        {tab === "agentes" && <Agentes />}
      </main>

      {searchOpen && <CandidateSearchModal onClose={() => setSearchOpen(false)} onJumpFunnel={() => { setTab('funnel'); setSearchOpen(false); }} />}
      {scheduleOpen && <ScheduleInterviewModal onClose={() => setScheduleOpen(false)} />}
      {importOpen && <CandidatesImportModal onClose={() => setImportOpen(false)} onDone={() => { setImportOpen(false); setTab('funnel'); }} />}
    </div>
  );
}

/* ======================================================== */
/* TS Brand Photography · imágenes oficiales del sitio       */
/* ======================================================== */
const TS_CDN = "https://cdn.prod.website-files.com/68fb7b9474bf8f90808cd50f";
const TS_IMG = {
  hero:     `${TS_CDN}/691645b652c1e9091b25f59c_FotosWeb_TradingSolutions-14_4_11zon.webp`,
  maritime: `${TS_CDN}/691645abb6a2f3012e0b0519_FotosWeb_TradingSolutions-03_3_11zon.webp`,
  ground:   `${TS_CDN}/691645c4a1db281b44d16870_FotosWeb_TradingSolutions-21_1_11zon.webp`,
  air:      `${TS_CDN}/691645c3a704c8e66d7ea58d_FotosWeb_TradingSolutions-22_2_11zon.webp`,
  customs:  `${TS_CDN}/69320da1e28142ec4e691a93_fotos%20web-02_2_11zon.jpg`,
  contact:  `${TS_CDN}/691645c4966a94469071afe6_FotosWeb_TradingSolutions-26_6_11zon.webp`,
  logistics:`${TS_CDN}/69320dac9e1712e14ed79713_fotos%20web-03_1_11zon.jpg`,
};

// Mapeo área → imagen TS
function tsImageForArea(area?: string | null): string {
  const a = (area || '').toLowerCase();
  if (a.includes('maritim') || a.includes('mar')) return TS_IMG.maritime;
  if (a.includes('air') || a.includes('aereo') || a.includes('aéreo')) return TS_IMG.air;
  if (a.includes('ground') || a.includes('terrestre')) return TS_IMG.ground;
  if (a.includes('customs') || a.includes('aduana')) return TS_IMG.customs;
  if (a.includes('pricing') || a.includes('finance') || a.includes('account')) return TS_IMG.logistics;
  if (a.includes('sales') || a.includes('comercial')) return TS_IMG.contact;
  return TS_IMG.hero;
}

/**
 * Hero banner estilo página oficial TS.
 * Imagen full-width con overlay negro y typography display estilo "Boutique freight forwarder."
 */
function TSHeroBanner({ image = TS_IMG.hero, title = "Talent that moves the world", subtitle = "Where vision meets execution." }: { image?: string; title?: string; subtitle?: string }) {
  return (
    <div className="relative -mx-6 -mt-5 mb-5 overflow-hidden" style={{ height: 200 }}>
      {/* Imagen de fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${image})`,
          transform: 'scale(1.05)',
        }}
      />
      {/* Overlay degradado negro */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.65) 100%)',
        }}
      />
      {/* Línea horizontal estilo TS site */}
      <div className="absolute inset-0 flex items-center px-8">
        <div className="max-w-[1440px] w-full mx-auto">
          <div className="flex items-baseline gap-3">
            <h1 className="text-white font-display font-bold text-4xl md:text-5xl tracking-[-0.03em] leading-[0.95]">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="h-[1px] w-10 bg-white/40" />
            <p className="text-white/80 text-sm font-medium tracking-tight">{subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Section banner compacto — imagen TS de 100px con título superpuesto, para encabezar tabs/secciones.
 */
function TSSectionBanner({ image, title, subtitle, icon }: { image: string; title: string; subtitle?: string; icon?: string }) {
  return (
    <div className="relative -mx-6 mb-4 overflow-hidden" style={{ height: 120 }}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 100%)' }} />
      <div className="absolute inset-0 flex items-center px-8">
        <div className="max-w-[1440px] w-full mx-auto">
          <div className="flex items-center gap-3">
            {icon && <span className="text-3xl">{icon}</span>}
            <div>
              <h2 className="text-white font-display font-bold text-2xl tracking-[-0.02em] leading-tight">{title}</h2>
              {subtitle && <p className="text-white/70 text-xs font-medium mt-0.5">{subtitle}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================================================== */
/* Avatar · iniciales con paleta TS-aligned                 */
/* ======================================================== */
const AVATAR_PALETTE: Array<[string, string]> = [
  ['#0A0A0A', '#FFFFFF'], // negro · texto blanco
  ['#1F2937', '#FFFFFF'], // slate
  ['#374151', '#FFFFFF'],
  ['#4B5563', '#FFFFFF'],
  ['#6B7280', '#FFFFFF'],
  ['#111827', '#FFFFFF'],
  ['#18181B', '#FFFFFF'],
  ['#27272A', '#FFFFFF'],
];

function initialsFor(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorForName(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function Avatar({ name, size = 32, className = '' }: { name: string; size?: number; className?: string }) {
  const initials = initialsFor(name);
  const [bg, fg] = colorForName(name);
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold flex-shrink-0 select-none ${className}`}
      style={{
        width: size,
        height: size,
        background: bg,
        color: fg,
        fontSize: Math.max(10, Math.round(size * 0.38)),
        letterSpacing: '-0.02em',
      }}
      title={name}
    >
      {initials}
    </span>
  );
}

/* ======================================================== */
/* Candidates Import Modal · LinkedIn Recruiter / Excel     */
/* ======================================================== */
type LinkedInImportRow = {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  current_role?: string;
  current_company?: string;
  role_start?: string;
  education?: string;
  institution?: string;
  linkedin_url?: string;
  applied_at?: string;
  job_title?: string;
  salary_question?: string;
};

type ImportRowResult = {
  index: number;
  name: string;
  email: string;
  action: 'inserted' | 'existing' | 'error';
  reason?: string;
  vacancy_title?: string;
  existing_stage?: string;
  existing_vacancy_title?: string;
  new_vacancy_title?: string;
  same_vacancy?: boolean;
};

function CandidatesImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState<'upload'|'preview'|'submitting'|'done'>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [parsed, setParsed] = useState<LinkedInImportRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<{ to_insert: number; existing: number; errors: number; results: ImportRowResult[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [finalResult, setFinalResult] = useState<{ inserted: number; existing: number; errors: number } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Quick import: detecta si el seed pre-cargado tiene apps pendientes ──
  const [quickPreview, setQuickPreview] = useState<{ will_insert: number; already_existing: number; total: number; breakdown: Array<{ vacancy: string; new: number; existed: number }> } | null>(null);
  const [quickRunning, setQuickRunning] = useState(false);
  const [quickResult, setQuickResult] = useState<{ inserted: number; already_existing: number; breakdown: any[]; error_count?: number; first_errors?: any[]; attempted?: number } | null>(null);

  useEffect(() => {
    fetch('/api/admin/seed-linkedin-apps', { cache: 'no-store' })
      .then(r => r.json())
      .then(j => { if (j.total) setQuickPreview(j); })
      .catch(() => {});
  }, []);

  const runQuickImport = async () => {
    setQuickRunning(true);
    try {
      const r = await fetch('/api/admin/seed-linkedin-apps', { method: 'POST' });
      const j = await r.json();
      setQuickResult({
        inserted: j.inserted ?? 0,
        already_existing: j.already_existing ?? 0,
        breakdown: j.breakdown ?? [],
        error_count: j.error_count ?? 0,
        first_errors: j.first_errors ?? [],
        attempted: j.attempted ?? 0,
      });
    } finally {
      setQuickRunning(false);
    }
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setParsing(true);
    setParseError(null);
    setFiles(Array.from(fileList));

    try {
      // Cargar SheetJS dinámicamente (bundleado vía package.json)
      const XLSX = await import('xlsx');
      const all: LinkedInImportRow[] = [];

      for (const file of Array.from(fileList)) {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const sheet = wb.Sheets['Solicitudes de empleo'] || wb.Sheets[wb.SheetNames[0]];
        if (!sheet) continue;
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });
        rows.forEach(r => {
          const name = `${(r['Nombre'] || '').toString().trim()} ${(r['Apellidos'] || '').toString().trim()}`.trim();
          const email = (r['Dirección de email'] || '').toString().toLowerCase().trim();
          if (!name && !email) return;
          all.push({
            name,
            email,
            phone: r['Teléfono'] || undefined,
            location: r['Ubicación general'] || undefined,
            headline: r['Titular'] || undefined,
            current_role: r['Cargo actual'] || undefined,
            current_company: r['Empresa actual'] || undefined,
            role_start: r['Fecha de inicio en el puesto actual'] ? String(r['Fecha de inicio en el puesto actual']) : undefined,
            education: r['Titulación'] || undefined,
            institution: r['Institución educativa'] || undefined,
            linkedin_url: r['URL del perfil'] || undefined,
            applied_at: r['Fecha de la solicitud'] ? String(r['Fecha de la solicitud']) : undefined,
            job_title: r['Cargo laboral'] || undefined,
            salary_question: r['Preguntas de preselección'] || undefined,
          });
        });
      }

      // Dedupe by email keeping latest applied_at
      const byEmail: Record<string, LinkedInImportRow> = {};
      all.forEach(r => {
        if (!r.email) return;
        const prev = byEmail[r.email];
        if (!prev || (r.applied_at || '') > (prev.applied_at || '')) byEmail[r.email] = r;
      });
      setParsed(Object.values(byEmail));
    } catch (e: any) {
      setParseError(e?.message || 'Error parseando Excel');
    } finally {
      setParsing(false);
    }
  };

  const runDryRun = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const r = await fetch('/api/headhunting/candidates/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates: parsed, dry_run: true }),
      });
      const j = await r.json();
      if (!r.ok) {
        setSubmitError(j.error || 'Error en validación');
      } else {
        setDryRunResult(j);
        setStep('preview');
      }
    } catch (e: any) {
      setSubmitError(e?.message || 'Error de red');
    } finally {
      setSubmitting(false);
    }
  };

  const runImport = async () => {
    setSubmitting(true);
    setSubmitError(null);
    setStep('submitting');
    try {
      const r = await fetch('/api/headhunting/candidates/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates: parsed, dry_run: false }),
      });
      const j = await r.json();
      if (!r.ok) {
        setSubmitError(j.error || 'Error en import');
        setStep('preview');
      } else {
        setFinalResult({ inserted: j.inserted, existing: j.existing, errors: j.errors });
        setStep('done');
      }
    } catch (e: any) {
      setSubmitError(e?.message || 'Error de red');
      setStep('preview');
    } finally {
      setSubmitting(false);
    }
  };

  // Group preview by action
  const grouped = useMemo(() => {
    if (!dryRunResult) return null;
    return {
      inserted: dryRunResult.results.filter(r => r.action === 'inserted'),
      existing: dryRunResult.results.filter(r => r.action === 'existing'),
      errors: dryRunResult.results.filter(r => r.action === 'error'),
    };
  }, [dryRunResult]);

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[5vh] px-4 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-4 overflow-hidden font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* Header TS-style: minimal black */}
        <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[2px] font-medium opacity-60">Importar candidatos</div>
            <div className="text-lg font-bold tracking-[-0.01em] leading-tight">
              {step === 'upload' && 'Subí los Excel de LinkedIn Recruiter'}
              {step === 'preview' && 'Revisá el cruce antes de importar'}
              {step === 'submitting' && 'Importando…'}
              {step === 'done' && 'Listo'}
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl leading-none px-2">×</button>
        </div>

        {step === 'upload' && (
          <div className="p-6">
            {/* QUICK IMPORT · seed pre-cargado de los Excel del 2026-05-03 */}
            {quickResult ? (
              <div className={`${quickResult.error_count && quickResult.error_count > 0 ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-300'} border rounded-xl p-4 mb-4`}>
                <div className="mb-2">
                  {quickResult.error_count && quickResult.error_count > 0
                    ? <AlertTriangle className="w-5 h-5 text-amber-600" />
                    : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                </div>
                <div className={`text-sm font-bold ${quickResult.error_count && quickResult.error_count > 0 ? 'text-amber-900' : 'text-emerald-900'}`}>
                  {quickResult.error_count && quickResult.error_count > 0 ? 'Quick import con errores' : 'Quick import completado'}
                </div>
                <div className={`text-xs mt-1 ${quickResult.error_count && quickResult.error_count > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
                  <strong>{quickResult.inserted}</strong> insertados · <strong>{quickResult.already_existing}</strong> ya existían
                  {quickResult.error_count && quickResult.error_count > 0 ? <> · <strong className="text-red-700">{quickResult.error_count} errores</strong></> : null}
                </div>
                {quickResult.first_errors && quickResult.first_errors.length > 0 && (
                  <div className="mt-2 bg-red-50 border border-red-200 rounded p-2 text-[11px] text-red-800 font-mono space-y-1">
                    <div className="font-bold">Primeros errores:</div>
                    {quickResult.first_errors.map((e: any, i: number) => (
                      <div key={i}>· {e.email || `row ${e.row}`}: {e.message}</div>
                    ))}
                  </div>
                )}
                {quickResult.breakdown && quickResult.breakdown.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {quickResult.breakdown.map((b: any, i: number) => (
                      <div key={i} className="text-[11px]">
                        · <strong>{b.vacancy}</strong>: {b.new} nuevos {b.existed > 0 ? `(${b.existed} ya estaban)` : ''}
                      </div>
                    ))}
                  </div>
                )}
                {quickResult.inserted > 0 && (
                  <button onClick={onDone} className="mt-3 bg-black hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2 rounded-full">
                    Ver Funnel →
                  </button>
                )}
              </div>
            ) : quickPreview && quickPreview.will_insert > 0 ? (
              <div className="bg-black text-white rounded-xl p-4 mb-4 relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-15 bg-cover bg-center"
                  style={{ backgroundImage: `url(${TS_IMG.hero})` }}
                />
                <div className="relative">
                  <div className="text-[10px] uppercase tracking-[2px] font-semibold opacity-70 mb-1">Quick import</div>
                  <div className="text-base font-bold tracking-tight mb-1 flex items-center gap-2">
                    <Linkedin className="w-4 h-4" />
                    <span>{quickPreview.will_insert} aplicaciones de LinkedIn pendientes</span>
                  </div>
                  <div className="text-[11px] opacity-80 mb-2">
                    Pre-cargadas del bulk del 2026-05-03 · {quickPreview.already_existing} ya estaban en el ATS
                  </div>
                  {quickPreview.breakdown && quickPreview.breakdown.length > 0 && (
                    <div className="mb-3 space-y-0.5">
                      {quickPreview.breakdown.map((b: any, i: number) => (
                        <div key={i} className="text-[11px] opacity-90">
                          · <strong>{b.vacancy}</strong>: {b.new} nuevos {b.existed > 0 ? `(${b.existed} skip)` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={runQuickImport}
                    disabled={quickRunning}
                    className="bg-white text-black hover:bg-white/90 disabled:opacity-50 text-xs font-bold px-4 py-2 rounded-full inline-flex items-center gap-1.5"
                  >
                    {quickRunning ? '⏳ Importando…' : `🌱 Importar ${quickPreview.will_insert} con un click`}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 text-sm">
              <div className="font-bold text-gray-900 mb-1">…o subí un Excel nuevo</div>
              <p className="text-gray-700 leading-relaxed text-xs">
                Excel exportados desde <strong>LinkedIn Recruiter → Reportes de candidatos</strong>. Hoja "Solicitudes de empleo".
                Podés cargar varios archivos al mismo tiempo. Se hace cruce automático por email contra los candidatos que ya tenés en el ATS.
              </p>
            </div>

            <label className="block">
              <input
                type="file"
                accept=".xlsx,.xls"
                multiple
                onChange={e => handleFiles(e.target.files)}
                className="hidden"
                id="xlsx-input"
              />
              <div
                onClick={() => document.getElementById('xlsx-input')?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-black rounded-xl p-10 text-center cursor-pointer transition-colors"
              >
                <div className="text-4xl mb-2">📊</div>
                <div className="text-sm font-bold text-gray-900">Click para elegir Excel(s)</div>
                <div className="text-[11px] text-gray-500 mt-1">.xlsx · multi-archivo · sin límite de filas</div>
              </div>
            </label>

            {parsing && <div className="mt-3 text-xs text-gray-500">Parseando…</div>}
            {parseError && <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 mt-3">{parseError}</div>}

            {files.length > 0 && (
              <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">Archivos cargados</div>
                {files.map((f, i) => (
                  <div key={i} className="text-xs text-gray-800 flex justify-between">
                    <span>📎 {f.name}</span>
                    <span className="text-gray-500">{(f.size / 1024).toFixed(0)} KB</span>
                  </div>
                ))}
              </div>
            )}

            {parsed.length > 0 && (
              <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs">
                <div className="font-bold text-emerald-800">✓ {parsed.length} candidatos únicos parseados (deduplicados por email)</div>
                <div className="text-emerald-700 mt-1">
                  {Array.from(new Set(parsed.map(p => p.job_title).filter(Boolean))).join(' · ')}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
              <button onClick={onClose} className="text-xs font-bold text-gray-500 px-4 py-2.5">Cancelar</button>
              <button
                onClick={runDryRun}
                disabled={parsed.length === 0 || submitting}
                className="bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white text-xs font-bold px-5 py-2.5 rounded-full"
              >
                {submitting ? 'Validando…' : `Cruzar ${parsed.length} con el ATS →`}
              </button>
            </div>
            {submitError && <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 mt-3">{submitError}</div>}
          </div>
        )}

        {step === 'preview' && grouped && dryRunResult && (
          <div className="p-6">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">Nuevos a insertar</div>
                <div className="text-3xl font-extrabold text-emerald-900 mt-1">{grouped.inserted.length}</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                <div className="text-[10px] uppercase tracking-wider font-bold text-amber-700">Ya estaban (skip)</div>
                <div className="text-3xl font-extrabold text-amber-900 mt-1">{grouped.existing.length}</div>
              </div>
              <div className={`${grouped.errors.length > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'} border rounded-xl p-3 text-center`}>
                <div className={`text-[10px] uppercase tracking-wider font-bold ${grouped.errors.length > 0 ? 'text-red-700' : 'text-gray-500'}`}>Errores</div>
                <div className={`text-3xl font-extrabold mt-1 ${grouped.errors.length > 0 ? 'text-red-900' : 'text-gray-400'}`}>{grouped.errors.length}</div>
              </div>
            </div>

            {/* Inserted preview */}
            {grouped.inserted.length > 0 && (
              <div className="border border-emerald-200 rounded-xl overflow-hidden mb-3">
                <div className="bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">✓ Se insertarán ({grouped.inserted.length})</div>
                <div className="max-h-[20vh] overflow-y-auto divide-y divide-gray-100">
                  {grouped.inserted.slice(0, 50).map(r => (
                    <div key={r.index} className="px-3 py-2 flex items-center gap-3 text-xs">
                      <Avatar name={r.name} size={26} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{r.name}</div>
                        <div className="text-gray-500 truncate">{r.email}</div>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-bold">{r.vacancy_title}</span>
                    </div>
                  ))}
                  {grouped.inserted.length > 50 && (
                    <div className="px-3 py-2 text-[11px] text-gray-500 text-center">+{grouped.inserted.length - 50} más…</div>
                  )}
                </div>
              </div>
            )}

            {/* Existing preview */}
            {grouped.existing.length > 0 && (
              <div className="border border-amber-200 rounded-xl overflow-hidden mb-3">
                <div className="bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">⚠ Ya estaban en el ATS, no se tocan ({grouped.existing.length})</div>
                <div className="max-h-[20vh] overflow-y-auto divide-y divide-gray-100">
                  {grouped.existing.slice(0, 30).map(r => (
                    <div key={r.index} className="px-3 py-2 flex items-center gap-3 text-xs">
                      <Avatar name={r.name} size={26} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{r.name}</div>
                        <div className="text-gray-500 truncate">{r.email} · stage: <strong>{r.existing_stage}</strong></div>
                      </div>
                      {r.same_vacancy ? (
                        <span className="bg-gray-100 text-gray-700 text-[10px] px-1.5 py-0.5 rounded font-bold">Misma vacante</span>
                      ) : (
                        <span className="bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded font-bold" title={`En ATS: ${r.existing_vacancy_title}, Nueva: ${r.new_vacancy_title}`}>
                          Otra vacante
                        </span>
                      )}
                    </div>
                  ))}
                  {grouped.existing.length > 30 && (
                    <div className="px-3 py-2 text-[11px] text-gray-500 text-center">+{grouped.existing.length - 30} más…</div>
                  )}
                </div>
              </div>
            )}

            {/* Errors preview */}
            {grouped.errors.length > 0 && (
              <div className="border border-red-200 rounded-xl overflow-hidden mb-3">
                <div className="bg-red-50 px-3 py-2 text-xs font-bold text-red-800">✗ Errores ({grouped.errors.length})</div>
                <div className="max-h-[15vh] overflow-y-auto divide-y divide-gray-100">
                  {grouped.errors.map(r => (
                    <div key={r.index} className="px-3 py-2 text-xs">
                      <div className="font-bold">{r.name || '—'} · {r.email || '(sin email)'}</div>
                      <div className="text-red-700 text-[11px]">{r.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
              <button onClick={() => setStep('upload')} className="text-xs font-bold text-gray-500 px-4 py-2.5">← Volver</button>
              <button
                onClick={runImport}
                disabled={submitting || grouped.inserted.length === 0}
                className="bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white text-xs font-bold px-5 py-2.5 rounded-full"
              >
                Importar {grouped.inserted.length} nuevos →
              </button>
            </div>
            {submitError && <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 mt-3">{submitError}</div>}
          </div>
        )}

        {step === 'submitting' && (
          <div className="p-12 text-center">
            <div className="text-5xl mb-3 animate-pulse">📥</div>
            <div className="text-base font-bold">Importando {parsed.length} candidatos…</div>
            <div className="text-xs text-gray-500 mt-1">No cierres esta ventana</div>
          </div>
        )}

        {step === 'done' && finalResult && (
          <div className="p-8 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-2xl font-bold tracking-tight mb-2">Cruce completo</h3>
            <div className="grid grid-cols-3 gap-2 max-w-md mx-auto mb-4">
              <div className="bg-emerald-50 rounded-xl p-3">
                <div className="text-3xl font-extrabold text-emerald-700">{finalResult.inserted}</div>
                <div className="text-[10px] uppercase font-bold text-emerald-600">Nuevos</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-3">
                <div className="text-3xl font-extrabold text-amber-700">{finalResult.existing}</div>
                <div className="text-[10px] uppercase font-bold text-amber-600">Ya estaban</div>
              </div>
              <div className={`${finalResult.errors > 0 ? 'bg-red-50' : 'bg-gray-50'} rounded-xl p-3`}>
                <div className={`text-3xl font-extrabold ${finalResult.errors > 0 ? 'text-red-700' : 'text-gray-400'}`}>{finalResult.errors}</div>
                <div className="text-[10px] uppercase font-bold text-gray-500">Errores</div>
              </div>
            </div>
            <button
              onClick={onDone}
              className="bg-black hover:bg-gray-800 text-white font-semibold px-6 py-3 rounded-full text-sm"
            >
              Ver Funnel →
            </button>
          </div>
        )}
      </div>
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
  // ─── Headhunting / ATS real (Supabase ht_candidates) ───────────
  htTotal: number;
  htByStage: Record<string, number>;
  htPrefilterDecision: Record<string, number>;
  htPrefilterCompleted: number;
  htPrefilterInvited: number;
  htInElevareProcess: number;
  htCompletedElevare: number;
  htHires: number;
  htRejected: number;
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

function Dashboard({ setTab }: { setTab: (t: Tab) => void }) {
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
        const [vacR, appR, appAllR, tpR, asR, htR] = await Promise.all([
          fetch('/api/vacancies', { cache: 'no-store' }).then((r) => r.json()),
          fetch(appsUrl, { cache: 'no-store' }).then((r) => r.json()),
          fetch('/api/applications?limit=500', { cache: 'no-store' }).then((r) => r.json()),
          fetch('/api/talent-pool?limit=1000', { cache: 'no-store' }).then((r) => r.json()),
          fetch('/api/assessments?limit=500', { cache: 'no-store' }).then((r) => r.json()),
          fetch('/api/headhunting/dashboard-stats', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
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
          // Headhunting / ATS real (Supabase)
          htTotal: htR?.total ?? 0,
          htByStage: htR?.byStage ?? {},
          htPrefilterDecision: htR?.prefilterDecision ?? {},
          htPrefilterCompleted: htR?.prefilterCompleted ?? 0,
          htPrefilterInvited: htR?.prefilterInvited ?? 0,
          htInElevareProcess: htR?.inElevareProcess ?? 0,
          htCompletedElevare: htR?.completedElevare ?? 0,
          htHires: htR?.hires ?? 0,
          htRejected: htR?.rejected ?? 0,
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

  // Funnel: usa los datos REALES del ATS (ht_candidates / Supabase) cuando están
  // disponibles. Esto refleja exactamente lo que muestra el tab Funnel.
  const htBy = s?.htByStage ?? {};
  const totalApplied = s?.htTotal ?? 0;
  const rawRows = s
    ? [
        { label: 'Aplicó', value: totalApplied, kind: 'apply' as const },
        { label: 'Prefiltro enviado', value: (htBy['prefiltro_enviado'] ?? 0) + (htBy['prefiltro_pasado'] ?? 0) + (htBy['prefiltro_revision'] ?? 0) + (htBy['assessment_invitado'] ?? 0) + (htBy['assessment_en_progreso'] ?? 0) + (htBy['assessment_completado'] ?? 0) + (htBy['entrevista_ia'] ?? 0) + (htBy['recruiter_interview'] ?? 0) + (htBy['cwo_interview'] ?? 0) + (htBy['touring'] ?? 0) + (htBy['contratado'] ?? 0), kind: 'sent' as const },
        { label: 'Prefiltro pasado', value: (htBy['prefiltro_pasado'] ?? 0) + (htBy['assessment_invitado'] ?? 0) + (htBy['assessment_en_progreso'] ?? 0) + (htBy['assessment_completado'] ?? 0) + (htBy['entrevista_ia'] ?? 0) + (htBy['recruiter_interview'] ?? 0) + (htBy['cwo_interview'] ?? 0) + (htBy['touring'] ?? 0) + (htBy['contratado'] ?? 0), kind: 'parse' as const },
        { label: 'Assessment invitado', value: (htBy['assessment_invitado'] ?? 0) + (htBy['assessment_en_progreso'] ?? 0) + (htBy['assessment_completado'] ?? 0) + (htBy['entrevista_ia'] ?? 0) + (htBy['recruiter_interview'] ?? 0) + (htBy['cwo_interview'] ?? 0) + (htBy['touring'] ?? 0) + (htBy['contratado'] ?? 0), kind: 'sent' as const },
        { label: 'Assessment completado', value: (htBy['assessment_completado'] ?? 0) + (htBy['entrevista_ia'] ?? 0) + (htBy['recruiter_interview'] ?? 0) + (htBy['cwo_interview'] ?? 0) + (htBy['touring'] ?? 0) + (htBy['contratado'] ?? 0), kind: 'done' as const },
        { label: 'Entrevista recruiter', value: (htBy['recruiter_interview'] ?? 0) + (htBy['cwo_interview'] ?? 0) + (htBy['touring'] ?? 0) + (htBy['contratado'] ?? 0), kind: 'interview' as const },
        { label: 'Entrevista CWO', value: (htBy['cwo_interview'] ?? 0) + (htBy['touring'] ?? 0) + (htBy['contratado'] ?? 0), kind: 'offer' as const },
        { label: 'Contratado', value: htBy['contratado'] ?? 0, kind: 'hire' as const },
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
      {/* TS Hero Banner — fotografía corporativa estilo página oficial */}
      <TSHeroBanner />

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

      {/* ═════ TODAY'S FOCUS · qué requiere acción HOY ═════ */}
      <TodayFocus onJumpToVacancy={() => setTab("vacantes")} onJumpToFunnel={() => setTab("funnel")} />

      {/* ═════ OVERVIEW · Big Picture · Hero KPIs vs Targets ═════ */}
      <DashboardHero />

      <div className="grid grid-cols-5 gap-3 mb-4">
        <KPI
          label="Total ATS"
          value={loading ? '…' : String(s?.htTotal ?? 0)}
          delta={loading ? 'Cargando' : 'Candidatos en pipeline real'}
          tone="neutral"
        />
        <KPI
          label="Prefiltros enviados"
          value={loading ? '…' : String(s?.htPrefilterInvited ?? 0)}
          delta={s ? `${s.htPrefilterCompleted} respondieron` : ''}
          tone="neutral"
        />
        <KPI
          label="Prefiltro · Pass"
          value={loading ? '…' : String(s?.htPrefilterDecision?.pass ?? 0)}
          delta={s ? `${s.htPrefilterDecision?.review ?? 0} review · ${s.htPrefilterDecision?.reject ?? 0} reject` : ''}
          tone="neutral"
        />
        <KPI
          label="En Elevare"
          value={loading ? '…' : String(s?.htInElevareProcess ?? 0)}
          delta={s ? `${s.htCompletedElevare} completaron` : ''}
          tone="neutral"
        />
        <KPI
          label="Hires (ATS)"
          value={loading ? '…' : String(s?.htHires ?? 0)}
          delta={s ? `${s.htRejected} rechazados` : ''}
          tone="neutral"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <Card title="Funnel de conversión · pipeline real" eyebrow="LIVE · ht_candidates (Supabase)">
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

      {/* Vacancies overview — abiertas vs cerradas */}
      <VacanciesOverview />

      {/* Funnel por vacante — drop-off por fase, dónde se quedan */}
      <FunnelByVacancy />

      {/* Analytics deep — funnel conversion + sources + time per stage */}
      <AnalyticsDeep />
    </>
  );
}

// ─── Dashboard Hero · Big Picture KPIs vs Targets ─────────────────
type HeroData = {
  hires: { quarter: number; month: number; all_time: number; by_level: Record<string, number> };
  time_to_fill: Record<string, { target: number; avg: number; on_track: boolean; values: number[] }>;
  vacancies: { open: number; avg_days_open: number; closed_count: number };
  pipeline: { active: number; aging: number; in_late_stages: number; forecast_hires_30d: number };
  nps: number | null;
};

// ─── Today's Focus · qué requiere acción HOY ────────────────────────
type TodayFocusData = {
  generated_at: string;
  counts: {
    aging: number;
    pending_decisions: number;
    urgent_vacancies: number;
    stale_vacancies: number;
    quick_wins: number;
    todays_interviews?: number;
  };
  aging: { candidate_id: string; name: string; email: string; stage: string; days_since_update: number; vacancy_id: string; vacancy_title: string; severity: 'high'|'medium' }[];
  pending_decisions: { candidate_id: string; name: string; stage: string; days_in_stage: number; vacancy_id: string; vacancy_title: string; action: string }[];
  urgent_vacancies: { vacancy_id: string; title: string; area: string; role_level: string; days_active: number; target_days: number; days_over: number }[];
  stale_vacancies: { vacancy_id: string; title: string; area: string; candidates_count: number }[];
  quick_wins: { candidate_id: string; name: string; stage: string; days_in_stage: number; vacancy_id: string; vacancy_title: string }[];
  todays_interviews?: { id: string; candidate_id: string; candidate_name: string; vacancy_id: string; vacancy_title: string; interview_type: string; scheduled_at: string; duration_min: number; meeting_url: string | null; location: string | null; status: string }[];
};

function TodayFocus({ onJumpToVacancy, onJumpToFunnel }: { onJumpToVacancy: () => void; onJumpToFunnel: () => void }) {
  const [data, setData] = useState<TodayFocusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let alive = true;
    const fetchData = () => fetch('/api/dashboard/today', { cache: 'no-store' })
      .then(r => r.json())
      .then(j => { if (alive) { setData(j); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    fetchData();
    // Auto-refresh cada 30s — solo cuando la pestaña está activa
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchData();
    }, 30000);
    return () => { alive = false; clearInterval(interval); };
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-4 mb-4 text-white text-sm">Cargando focus de hoy…</div>
    );
  }

  if (!data) return null;

  const totalAlerts = data.counts.aging + data.counts.pending_decisions + data.counts.urgent_vacancies + data.counts.stale_vacancies;
  const interviewsCount = data.counts.todays_interviews || 0;
  const noActionNeeded = totalAlerts === 0 && data.counts.quick_wins === 0 && interviewsCount === 0;

  if (noActionNeeded) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" strokeWidth={2} />
        </div>
        <div>
          <div className="text-sm font-bold text-emerald-900 tracking-tight">Today's Focus · Todo bajo control</div>
          <div className="text-xs text-emerald-700/90">Sin alertas críticas, candidatos avanzando, vacantes en ritmo. Buen día para sourcing.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 mb-4 text-white relative overflow-hidden shadow-sm" style={{ background: '#0A0A0A' }}>
      {/* Foto TS de fondo sutil */}
      <div
        className="absolute inset-0 opacity-[0.18] bg-cover bg-center"
        style={{ backgroundImage: `url(${TS_IMG.hero})` }}
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 100%)' }} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
              <Target className="w-4 h-4 text-white/90" strokeWidth={2} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[2.5px] font-semibold text-white/55">Today's Focus</div>
              <div className="text-lg font-bold tracking-[-0.01em] leading-tight font-display">
                {totalAlerts} acci{totalAlerts !== 1 ? 'ones' : 'ón'} pendiente{totalAlerts !== 1 ? 's' : ''}
                {data.counts.quick_wins > 0 && (
                  <span className="ml-2 text-emerald-300 font-semibold inline-flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" strokeWidth={2} />
                    {data.counts.quick_wins} quick win{data.counts.quick_wins !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setCollapsed(c => !c)}
            className="text-white/60 hover:text-white text-xs font-medium"
          >
            {collapsed ? 'Expandir ↓' : 'Colapsar ↑'}
          </button>
        </div>

        {/* Counter pills */}
        <div className="flex flex-wrap gap-2 mb-3">
          <CountPill Icon={Calendar}     label="Entrevistas hoy"  count={interviewsCount}              color="blue"    active={interviewsCount > 0} />
          <CountPill Icon={Clock}        label="Aging"             count={data.counts.aging}            color="amber"   active={data.counts.aging > 0} />
          <CountPill Icon={Hand}         label="Decisiones"        count={data.counts.pending_decisions} color="blue"   active={data.counts.pending_decisions > 0} />
          <CountPill Icon={AlertOctagon} label="Vacantes urgentes" count={data.counts.urgent_vacancies} color="red"     active={data.counts.urgent_vacancies > 0} />
          <CountPill Icon={Moon}         label="Sin movimiento"    count={data.counts.stale_vacancies}  color="gray"    active={data.counts.stale_vacancies > 0} />
          <CountPill Icon={Trophy}       label="Quick wins"        count={data.counts.quick_wins}       color="emerald" active={data.counts.quick_wins > 0} />
        </div>

        {!collapsed && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Today's interviews primero — agenda del día */}
            {data.todays_interviews && data.todays_interviews.length > 0 && (
              <div className="rounded-lg border border-blue-400/25 bg-blue-500/[0.04] p-3 lg:col-span-2">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[1.5px] font-semibold text-white/80 mb-2.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-300" />
                  <span>Agenda de hoy · entrevistas programadas</span>
                  <span className="text-white/30 ml-auto font-mono tabular-nums">{data.todays_interviews.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
                  {data.todays_interviews.map(it => {
                    const time = new Date(it.scheduled_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' });
                    const typeLabel = it.interview_type.replace('_',' ');
                    return (
                      <div key={it.id} className="bg-white/[0.04] hover:bg-white/[0.08] rounded px-2.5 py-1.5 text-xs transition-colors">
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-blue-200 font-bold text-sm tabular-nums">{time}</span>
                          <span className="text-[9px] text-white/50">{it.duration_min}min</span>
                        </div>
                        <div className="font-bold text-white truncate">{it.candidate_name}</div>
                        <div className="text-[10px] text-white/60 truncate capitalize">{typeLabel} · {it.vacancy_title}</div>
                        {it.meeting_url && (
                          <a href={it.meeting_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-300 hover:text-blue-200 truncate flex items-center gap-1 mt-0.5">
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span>Abrir reunión</span>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick wins primero — mood positivo */}
            {data.quick_wins.length > 0 && (
              <FocusList
                title="Quick wins · cierres inminentes"
                Icon={Trophy}
                tone="emerald"
                items={data.quick_wins.slice(0, 5).map(c => ({
                  primary: c.name,
                  secondary: `${stageLabelShort(c.stage)} · ${c.vacancy_title}`,
                  meta: `${c.days_in_stage}d en stage`,
                  onClick: onJumpToFunnel,
                }))}
              />
            )}

            {/* Pending decisions */}
            {data.pending_decisions.length > 0 && (
              <FocusList
                title="Decisiones pendientes"
                Icon={Hand}
                tone="blue"
                items={data.pending_decisions.slice(0, 5).map(c => ({
                  primary: c.name,
                  secondary: c.action,
                  meta: `${stageLabelShort(c.stage)} · ${c.days_in_stage}d`,
                  onClick: onJumpToFunnel,
                }))}
              />
            )}

            {/* Aging candidates */}
            {data.aging.length > 0 && (
              <FocusList
                title="Candidatos aging (>5d sin avance)"
                Icon={Clock}
                tone="amber"
                items={data.aging.slice(0, 5).map(c => ({
                  primary: c.name,
                  secondary: `${stageLabelShort(c.stage)} · ${c.vacancy_title}`,
                  meta: `${c.days_since_update}d sin moverse`,
                  severity: c.severity === 'high' ? 'high' : undefined,
                  onClick: onJumpToFunnel,
                }))}
              />
            )}

            {/* Urgent vacancies */}
            {data.urgent_vacancies.length > 0 && (
              <FocusList
                title="Vacantes pasadas del target"
                Icon={AlertOctagon}
                tone="red"
                items={data.urgent_vacancies.slice(0, 5).map(v => ({
                  primary: v.title,
                  secondary: `${v.area} · ${v.role_level === 'c_suite' ? 'C-Suite' : v.role_level}`,
                  meta: `${v.days_active}d / ${v.target_days}d (+${v.days_over}d)`,
                  onClick: onJumpToVacancy,
                }))}
              />
            )}

            {/* Stale vacancies */}
            {data.stale_vacancies.length > 0 && (
              <FocusList
                title="Sin movimiento >7 días"
                Icon={Moon}
                tone="gray"
                items={data.stale_vacancies.slice(0, 5).map(v => ({
                  primary: v.title,
                  secondary: `${v.area} · ${v.candidates_count} candidato${v.candidates_count !== 1 ? 's' : ''} activos`,
                  meta: 'Revisar pipeline',
                  onClick: onJumpToVacancy,
                }))}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CountPill({ Icon, label, count, color, active }: { Icon: React.ComponentType<{ className?: string }>; label: string; count: number; color: string; active: boolean }) {
  const colorMap: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
    amber:   { bg: 'bg-amber-500/15',   text: 'text-amber-200',   ring: 'ring-amber-400/30',   dot: 'bg-amber-400' },
    blue:    { bg: 'bg-blue-500/15',    text: 'text-blue-200',    ring: 'ring-blue-400/30',    dot: 'bg-blue-400' },
    red:     { bg: 'bg-red-500/15',     text: 'text-red-200',     ring: 'ring-red-400/30',     dot: 'bg-red-400' },
    gray:    { bg: 'bg-white/[0.06]',   text: 'text-white/60',    ring: 'ring-white/15',       dot: 'bg-white/40' },
    emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-200', ring: 'ring-emerald-400/30', dot: 'bg-emerald-400' },
  };
  const c = colorMap[color] || colorMap.gray;
  return (
    <div className={`${active ? c.bg : 'bg-white/[0.03]'} ${active ? c.text : 'text-white/30'} ${active ? `ring-1 ${c.ring}` : 'ring-1 ring-white/5'} rounded-full pl-2 pr-3 py-1 text-[11px] font-medium flex items-center gap-2 transition-colors`}>
      <span className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        <span className="hidden md:inline">{label}</span>
      </span>
      <span className={`${active ? c.dot : 'bg-white/10'} h-1 w-1 rounded-full`} />
      <span className="text-[13px] font-bold tabular-nums">{count}</span>
    </div>
  );
}

function FocusList({
  title,
  Icon,
  tone,
  items,
}: {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone: 'amber' | 'blue' | 'red' | 'gray' | 'emerald';
  items: { primary: string; secondary: string; meta: string; severity?: 'high'; onClick?: () => void }[];
}) {
  const toneMap: Record<string, { border: string; iconColor: string }> = {
    amber:   { border: 'border-amber-400/25 bg-amber-500/[0.04]',   iconColor: 'text-amber-300' },
    blue:    { border: 'border-blue-400/25 bg-blue-500/[0.04]',     iconColor: 'text-blue-300' },
    red:     { border: 'border-red-400/25 bg-red-500/[0.04]',       iconColor: 'text-red-300' },
    gray:    { border: 'border-white/10 bg-white/[0.04]',           iconColor: 'text-white/50' },
    emerald: { border: 'border-emerald-400/25 bg-emerald-500/[0.04]', iconColor: 'text-emerald-300' },
  };
  const t = toneMap[tone];
  return (
    <div className={`rounded-lg border ${t.border} p-3`}>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[1.5px] font-semibold text-white/80 mb-2.5">
        <Icon className={`w-3.5 h-3.5 ${t.iconColor}`} />
        <span>{title}</span>
        <span className="text-white/30 ml-auto font-mono tabular-nums">{items.length}</span>
      </div>
      <div className="space-y-1.5">
        {items.map((it, i) => (
          <button
            key={i}
            onClick={it.onClick}
            className="w-full text-left bg-white/[0.04] hover:bg-white/[0.08] rounded px-2.5 py-1.5 text-xs transition-colors group"
          >
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate flex items-center gap-1.5">
                  {it.severity === 'high' && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" title="Alta severidad" />
                  )}
                  {it.primary}
                </div>
                <div className="text-[10px] text-white/55 truncate">{it.secondary}</div>
              </div>
              <div className="text-[10px] text-white/45 flex-shrink-0 group-hover:text-white/80 inline-flex items-center gap-1">
                {it.meta}
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function DashboardHero() {
  const [data, setData] = useState<HeroData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const fetchData = () => fetch('/api/dashboard/overview', { cache: 'no-store' })
      .then(r => r.json())
      .then(j => { if (alive) { setData(j); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    fetchData();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchData();
    }, 30000);
    return () => { alive = false; clearInterval(interval); };
  }, []);

  if (loading) return (
    <div className="mb-5 h-[180px] rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 flex items-center justify-center text-sm text-gray-400">
      Cargando overview…
    </div>
  );
  if (!data) return null;

  const TARGET_HIRES_QUARTER = 5; // Editable target Q
  const hiresProgress = Math.min(100, Math.round((data.hires.quarter / TARGET_HIRES_QUARTER) * 100));

  const allTtfOk = Object.values(data.time_to_fill).every(t => t.values.length === 0 || t.on_track);

  return (
    <div className="mb-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* CARD 1: Hires Q · Progress vs target */}
      <HeroCard
        title="Hires este Q"
        accent="#10B981"
        Icon={Target}
      >
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-extrabold tracking-tight">{data.hires.quarter}</span>
          <span className="text-sm text-gray-400 mb-1">/ {TARGET_HIRES_QUARTER}</span>
        </div>
        <ProgressBar pct={hiresProgress} color={hiresProgress >= 100 ? '#10B981' : hiresProgress >= 60 ? '#F59E0B' : '#3B82F6'} />
        <div className="flex justify-between text-[10px] mt-2 text-gray-500">
          <span>{hiresProgress}% del target</span>
          <span className="font-semibold">{data.hires.month} este mes</span>
        </div>
        <div className="flex gap-1.5 mt-2 pt-2 border-t border-gray-100 text-[10px]">
          {Object.entries(data.hires.by_level).filter(([, n]) => n > 0).map(([level, count]) => (
            <span key={level} className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
              {count} {level === 'c_suite' ? 'C-Suite' : level}
            </span>
          ))}
        </div>
      </HeroCard>

      {/* CARD 2: Time-to-fill por level vs target */}
      <HeroCard
        title="Time-to-fill"
        accent={allTtfOk ? "#10B981" : "#F59E0B"}
        Icon={Clock}
      >
        <div className="space-y-1.5 mt-1">
          {Object.entries(data.time_to_fill).map(([level, t]) => {
            const hasData = t.values.length > 0;
            const pct = hasData ? Math.min(100, Math.round((t.avg / t.target) * 100)) : 0;
            const color = !hasData ? '#9CA3AF' : t.on_track ? '#10B981' : '#EF4444';
            return (
              <div key={level} className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-semibold text-gray-500 w-16">
                  {level === 'c_suite' ? 'C-Suite' : level === 'lead' ? 'Lead' : 'Entry'}
                </span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div style={{ width: `${pct}%`, background: color }} className="h-full transition-all" />
                </div>
                <span className="text-[11px] font-bold w-14 text-right" style={{ color }}>
                  {hasData ? `${t.avg}d` : '—'}<span className="text-gray-400 font-normal">/{t.target}</span>
                </span>
              </div>
            );
          })}
        </div>
        <div className="text-[10px] text-gray-500 mt-2 pt-2 border-t border-gray-100 flex items-center gap-1.5">
          {allTtfOk ? (
            <><CheckCircle2 className="w-3 h-3 text-emerald-600" /><span>Dentro de targets</span></>
          ) : (
            <><AlertTriangle className="w-3 h-3 text-amber-600" /><span>Algún nivel sobre target</span></>
          )}
        </div>
      </HeroCard>

      {/* CARD 3: Vacancies · open & health */}
      <HeroCard
        title="Vacantes activas"
        accent="#F59E0B"
        Icon={Briefcase}
      >
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-extrabold tracking-tight">{data.vacancies.open}</span>
          <span className="text-sm text-gray-400 mb-1">abiertas</span>
        </div>
        <div className="text-xs text-gray-700">
          Promedio <strong className="text-gray-900">{data.vacancies.avg_days_open} días</strong> abiertas
        </div>
        <div className="text-[10px] text-gray-500 mt-2 pt-2 border-t border-gray-100 flex items-center gap-1.5">
          <Trophy className="w-3 h-3" />
          <span>{data.vacancies.closed_count} cerradas en historial</span>
        </div>
      </HeroCard>

      {/* CARD 4: Pipeline · activos + forecast + aging */}
      <HeroCard
        title="Pipeline"
        accent="#2C64ED"
        Icon={BarChart3}
      >
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-extrabold tracking-tight">{data.pipeline.active}</span>
          <span className="text-sm text-gray-400 mb-1">activos</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
          <div className="bg-blue-50 rounded-md px-2 py-1.5">
            <div className="text-gray-500 uppercase font-bold text-[9px]">Forecast 30d</div>
            <div className="text-base font-extrabold text-blue-700">+{data.pipeline.forecast_hires_30d}</div>
          </div>
          <div className={`${data.pipeline.aging > 0 ? 'bg-amber-50' : 'bg-emerald-50'} rounded-md px-2 py-1.5`}>
            <div className="text-gray-500 uppercase font-bold text-[9px]">Aging &gt;5d</div>
            <div className={`text-base font-extrabold ${data.pipeline.aging > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {data.pipeline.aging}
            </div>
          </div>
        </div>
        <div className="text-[10px] text-gray-500 pt-1 border-t border-gray-100">
          {data.pipeline.in_late_stages} en etapas finales (CWO/Touring/Terna/Oferta)
        </div>
      </HeroCard>

      {/* NPS strip — full width below cards, solo si hay surveys */}
      {data.nps != null && (
        <div className="md:col-span-2 lg:col-span-4 bg-white border border-gray-200 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                background: data.nps >= 50 ? 'rgba(16,185,129,0.10)' : data.nps >= 0 ? 'rgba(245,158,11,0.10)' : 'rgba(239,68,68,0.10)',
                color: data.nps >= 50 ? '#10B981' : data.nps >= 0 ? '#F59E0B' : '#EF4444',
              }}
            >
              {data.nps >= 50 ? <Award className="w-4 h-4" /> : data.nps >= 0 ? <TrendingUp className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[1.5px] font-semibold text-gray-500">NPS · Experiencia del candidato</div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold tracking-tight ${data.nps >= 50 ? 'text-emerald-600' : data.nps >= 0 ? 'text-amber-600' : 'text-red-600'}`}>{data.nps}</span>
                <span className="text-[10px] text-gray-500">
                  {data.nps >= 70 ? 'Excelente' : data.nps >= 50 ? 'Muy bueno' : data.nps >= 30 ? 'Bueno' : data.nps >= 0 ? 'Aceptable' : 'A mejorar'}
                </span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 italic">Encuestas enviadas a rechazados/contratados</div>
        </div>
      )}
    </div>
  );
}

function HeroCard({ title, accent, Icon, children }: {
  title: string;
  accent: string;
  Icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-shadow relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${accent} 0%, ${accent}33 100%)` }}
      />
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] uppercase tracking-[1.5px] font-semibold text-gray-500">{title}</span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${accent}14`, color: accent }}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      {children}
    </div>
  );
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }}
      />
    </div>
  );
}

// ─── Vacancies Overview · abiertas y cerradas con métricas ──────────
type VacancyOverview = {
  vacancy_id: string;
  title: string;
  area: string;
  role_level: string;
  vacancy_type: 'reemplazo' | 'incremental';
  status: "abierta" | "cerrada";
  milestones: {
    hr_request_date: string | null;
    organic_traction_date: string | null;
    linkedin_active_date: string | null;
    vacancy_started_date: string | null;
    hire_date: string | null;
    notes: string | null;
  };
  metrics: {
    days_active: number | null;
    target_days: number;
    time_to_fill: number | null;
    days_since_linkedin: number | null;
    days_vacant: number | null;
    candidates_total: number;
    activos: number;
    rechazados: number;
    contratados: number;
    by_stage: Record<string, number>;
    velocity_7d: number;
    in_late_stages: number;
    forecast_close_in_days: number | null;
  };
  health: { score: 'green'|'yellow'|'red'|'closed'; reason: string };
  aging_candidates: { id: string; name: string; stage: string; days_since_update: number }[];
  hired: { id: string; name: string; email: string } | null;
};

function VacanciesOverview() {
  const [vacs, setVacs] = useState<VacancyOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [researchVac, setResearchVac] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    let alive = true;
    const fetchData = () => fetch('/api/headhunting/vacancies-overview', { cache: 'no-store' })
      .then(r => r.json())
      .then(j => { if (alive) { setVacs(j.vacancies || []); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    fetchData();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchData();
    }, 30000);
    return () => { alive = false; clearInterval(interval); };
  }, []);

  if (loading) return <div className="mt-5 text-sm text-gray-400">Cargando vacantes…</div>;

  const abiertas = vacs.filter(v => v.status === 'abierta');
  const cerradas = vacs.filter(v => v.status === 'cerrada');
  const avgTtfRecruitment = cerradas.length > 0
    ? Math.round(cerradas.reduce((sum, v) => sum + (v.metrics.time_to_fill || 0), 0) / cerradas.length)
    : 0;
  const avgTtfLinkedin = cerradas.filter(v => v.metrics.days_since_linkedin != null).length > 0
    ? Math.round(cerradas.filter(v => v.metrics.days_since_linkedin != null).reduce((sum, v) => sum + (v.metrics.days_since_linkedin || 0), 0) / cerradas.filter(v => v.metrics.days_since_linkedin != null).length)
    : 0;

  return (
    <div className="mt-5">
      {/* Header con KPIs agregados */}
      <div className="flex items-end justify-between mb-3 flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight">Vacantes</h2>
          <p className="text-xs text-gray-500">{abiertas.length} abierta{abiertas.length !== 1 ? 's' : ''} · {cerradas.length} cerrada{cerradas.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2 text-[11px]">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
            <div className="text-[9px] uppercase font-bold text-emerald-700">Avg time-to-fill</div>
            <div className="text-base font-extrabold text-emerald-900">{avgTtfRecruitment}<span className="text-[10px] font-medium ml-1">días</span></div>
            <div className="text-[9px] text-emerald-600">desde solicitud HR</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
            <div className="text-[9px] uppercase font-bold text-blue-700">Avg desde LinkedIn</div>
            <div className="text-base font-extrabold text-blue-900">{avgTtfLinkedin}<span className="text-[10px] font-medium ml-1">días</span></div>
            <div className="text-[9px] text-blue-600">canal pago activo</div>
          </div>
        </div>
      </div>

      {/* Abiertas — cards grandes */}
      {abiertas.length > 0 && (
        <div>
          <h3 className="text-[11px] uppercase font-bold text-gray-500 tracking-wider mb-2">🟡 Abiertas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {abiertas.map(v => (
              <OpenVacancyCard
                key={v.vacancy_id}
                v={v}
                onResearch={() => setResearchVac({ id: v.vacancy_id, title: v.title })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Cerradas — tabla compacta */}
      {cerradas.length > 0 && (
        <div className="mt-5">
          <h3 className="text-[11px] uppercase font-bold text-gray-500 tracking-wider mb-2">✅ Cerradas</h3>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-[10px] uppercase text-gray-500">
                  <th className="text-left px-3 py-2 font-bold">Vacante</th>
                  <th className="text-left px-3 py-2 font-bold">Contratado</th>
                  <th className="text-left px-3 py-2 font-bold">Solicitud</th>
                  <th className="text-left px-3 py-2 font-bold">LinkedIn</th>
                  <th className="text-left px-3 py-2 font-bold">Hire</th>
                  <th className="text-right px-3 py-2 font-bold">TTF total</th>
                  <th className="text-right px-3 py-2 font-bold">TTF LinkedIn</th>
                  <th className="text-right px-3 py-2 font-bold">Días sin titular</th>
                  <th className="text-right px-3 py-2 font-bold">Estudio</th>
                </tr>
              </thead>
              <tbody>
                {cerradas.map(v => (
                  <tr key={v.vacancy_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2 font-semibold">{v.title}</td>
                    <td className="px-3 py-2 text-gray-700">{v.hired?.name || '—'}</td>
                    <td className="px-3 py-2 text-gray-500">{fmtDate(v.milestones.hr_request_date)}</td>
                    <td className="px-3 py-2 text-gray-500">{fmtDate(v.milestones.linkedin_active_date)}</td>
                    <td className="px-3 py-2 text-gray-500">{fmtDate(v.milestones.hire_date)}</td>
                    <td className="px-3 py-2 text-right font-bold">{v.metrics.time_to_fill ?? '—'}d</td>
                    <td className="px-3 py-2 text-right text-blue-700 font-bold">{v.metrics.days_since_linkedin ?? '—'}{v.metrics.days_since_linkedin != null ? 'd' : ''}</td>
                    <td className="px-3 py-2 text-right text-amber-700 font-bold">{v.metrics.days_vacant != null ? v.metrics.days_vacant + 'd' : '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => setResearchVac({ id: v.vacancy_id, title: v.title })}
                        className="text-[10px] font-semibold text-black hover:underline inline-flex items-center gap-1"
                        title="Estudio de mercado IA"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Ver</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 italic">
            TTF total = días desde Solicitud HR · TTF LinkedIn = días desde activación canal pago · Días sin titular = desde salida real → contratación
          </p>
        </div>
      )}

      {researchVac && (
        <VacancyMarketResearchModal
          vacancyId={researchVac.id}
          vacancyTitle={researchVac.title}
          onClose={() => setResearchVac(null)}
        />
      )}
    </div>
  );
}

function OpenVacancyCard({ v, onResearch }: { v: VacancyOverview; onResearch: () => void }) {
  const m = v.milestones;
  const hasLinkedIn = !!m.linkedin_active_date;
  const healthColor = v.health.score === 'green' ? '#10B981' : v.health.score === 'yellow' ? '#F59E0B' : '#EF4444';
  const healthBg = v.health.score === 'green' ? '#ECFDF5' : v.health.score === 'yellow' ? '#FFFBEB' : '#FEF2F2';
  const targetPct = v.metrics.target_days > 0
    ? Math.min(100, Math.round(((v.metrics.days_active || 0) / v.metrics.target_days) * 100))
    : 0;

  // Mini funnel data — solo etapas que tienen >0 candidatos
  const funnelStages = ['aplico','prefiltro_enviado','assessment_invitado','assessment_completado','entrevista_ia','bateria_psicometrica','recruiter_interview','cwo_interview','touring','terna','oferta'];
  const totalActivos = v.metrics.activos || 1;

  return (
    <div className="bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-shadow relative overflow-hidden">
      {/* Photo strip TS · 50px de altura, área-themed */}
      <div className="relative h-[60px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${tsImageForArea(v.area)})`, transform: 'scale(1.05)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 100%)` }}
        />
        {/* Top accent bar - color del health */}
        <div className="absolute top-0 left-0 right-0 h-[4px]" style={{ background: healthColor }} />
        {/* Area name superpuesta */}
        <div className="absolute bottom-1.5 left-3 right-3 flex items-end justify-between text-white">
          <span className="text-[10px] uppercase tracking-[1.5px] font-semibold opacity-85">{v.area || '—'}</span>
          <span
            className="flex-shrink-0 inline-flex items-center gap-1 bg-black/40 backdrop-blur px-1.5 py-0.5 rounded-full"
            title={v.health.reason}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: healthColor }} />
            <span className="text-[9px] font-bold uppercase tracking-wider">
              {v.health.score === 'green' ? 'On track' : v.health.score === 'yellow' ? 'Atención' : 'Crítico'}
            </span>
          </span>
        </div>
      </div>

      <div className="p-4 pt-3">

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-gray-900 leading-tight truncate tracking-tight">{v.title}</div>
          <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1 flex-wrap">
            <span className="uppercase font-semibold">{v.role_level === 'c_suite' ? 'C-Suite' : v.role_level}</span>
            <span className="text-gray-300">·</span>
            <span
              className={`uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded ${
                v.vacancy_type === 'reemplazo'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
              title="RYS Corporate Standard"
            >
              {v.vacancy_type === 'reemplazo' ? 'Reempl.' : 'Increm.'}
            </span>
          </div>
        </div>
      </div>

      {/* Days vs target progress */}
      <div className="mb-3 p-2 rounded-lg" style={{ background: healthBg }}>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[10px] uppercase font-bold" style={{ color: healthColor }}>Health</span>
          <span className="text-[10px] font-bold" style={{ color: healthColor }}>
            {v.metrics.days_active}d / {v.metrics.target_days}d target
          </span>
        </div>
        <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${targetPct}%`, background: healthColor }} />
        </div>
        <div className="text-[9px] mt-1 leading-tight" style={{ color: healthColor }}>
          {v.health.reason}
        </div>
      </div>

      {/* Mini funnel horizontal */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase font-bold text-gray-500">Pipeline</span>
          <span className="text-[10px] text-gray-700 font-bold">{v.metrics.activos} activos</span>
        </div>
        <div className="flex gap-0.5 h-5">
          {funnelStages.map(stage => {
            const count = v.metrics.by_stage[stage] || 0;
            if (count === 0) return null;
            const pct = (count / totalActivos) * 100;
            const isLate = ['cwo_interview','touring','terna','oferta'].includes(stage);
            return (
              <div
                key={stage}
                className={`relative group ${isLate ? 'bg-emerald-500' : 'bg-gray-700'} hover:opacity-80 cursor-help transition-opacity`}
                style={{ width: `${pct}%`, minWidth: '12px' }}
                title={`${stageLabelShort(stage)}: ${count}`}
              >
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">{count}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[9px] text-gray-500 mt-1">
          <span>← Aplicó</span>
          <span>Late stages →</span>
        </div>
      </div>

      {/* Velocity + Forecast */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-[10px]">
        <div className="bg-blue-50 border border-blue-100 rounded px-2 py-1.5">
          <div className="text-[9px] uppercase font-bold text-blue-700">Velocity 7d</div>
          <div className="text-base font-extrabold text-blue-900">{v.metrics.velocity_7d}</div>
          <div className="text-[9px] text-blue-600">avanzaron etapa</div>
        </div>
        {v.metrics.forecast_close_in_days != null ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded px-2 py-1.5">
            <div className="text-[9px] uppercase font-bold text-emerald-700">Forecast</div>
            <div className="text-base font-extrabold text-emerald-900">~{v.metrics.forecast_close_in_days}d</div>
            <div className="text-[9px] text-emerald-600">para cierre</div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-100 rounded px-2 py-1.5">
            <div className="text-[9px] uppercase font-bold text-gray-500">Forecast</div>
            <div className="text-base font-extrabold text-gray-400">—</div>
            <div className="text-[9px] text-gray-400">sin etapas finales</div>
          </div>
        )}
      </div>

      {/* Aging alert */}
      {v.aging_candidates.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mb-3 text-[10px]">
          <div className="font-bold text-amber-800 mb-0.5 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>{v.aging_candidates.length} candidato{v.aging_candidates.length > 1 ? 's' : ''} aging (&gt;5d sin moverse)</span>
          </div>
          <div className="text-amber-700 truncate">
            {v.aging_candidates.slice(0, 2).map(a => `${a.name.split(' ')[0]} (${a.days_since_update}d)`).join(', ')}
            {v.aging_candidates.length > 2 && ` +${v.aging_candidates.length - 2} más`}
          </div>
        </div>
      )}

      {/* LinkedIn warning */}
      {!hasLinkedIn && (
        <div className="bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-2 text-[10px] text-amber-800 flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3" />
          <span>LinkedIn aún no activado</span>
        </div>
      )}

      {/* Footer counts */}
      <div className="flex justify-between text-[10px] pt-2 border-t border-gray-100">
        <span className="text-gray-500">Total: <strong className="text-gray-800">{v.metrics.candidates_total}</strong></span>
        <span className="text-red-600">Rechazados: <strong>{v.metrics.rechazados}</strong></span>
      </div>

      {/* Market Research CTA — estilo TS minimal black */}
      <button
        onClick={onResearch}
        className="mt-2 w-full bg-black hover:bg-gray-800 text-white text-[11px] font-semibold py-2 rounded-full flex items-center justify-center gap-1.5 transition-colors"
        title="Generar/ver estudio de mercado por IA"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Estudio de mercado IA
      </button>
      </div>
    </div>
  );
}

// ─── Market Research Modal · Agente IA por vacante ──────────────────
type MarketResearchReport = {
  exec_summary?: string;
  compensation?: {
    currency?: string;
    base_monthly_min?: number;
    base_monthly_median?: number;
    base_monthly_max?: number;
    total_annual_min?: number;
    total_annual_median?: number;
    total_annual_max?: number;
    typical_bonuses?: string[];
    benefits_market_standard?: string[];
    latam_remote_comparison?: string;
    sources_referenced?: string[];
    notes?: string;
  };
  recruiting_timeline?: {
    industry_avg_ttf_days_min?: number;
    industry_avg_ttf_days_max?: number;
    ts_target_days?: number;
    comparison?: string;
    candidate_in_market_days_typical?: number;
    factors_speeding_up?: string[];
    factors_slowing_down?: string[];
  };
  talent_landscape?: {
    pool_size_estimate?: string;
    pool_size_explanation?: string;
    demand_level?: string;
    supply_demand_balance?: string;
    main_competing_companies?: string[];
    active_passive_ratio?: string;
    geographic_hotspots?: string[];
  };
  in_demand_skills_2026?: {
    must_have_technical?: string[];
    must_have_soft?: string[];
    nice_to_have?: string[];
    emerging_trends?: string[];
  };
  sourcing_strategy?: {
    linkedin_search_strings?: string[];
    universities_to_target?: string[];
    industry_associations?: string[];
    communities_groups?: string[];
    alternative_channels?: string[];
    outreach_message_template?: string;
  };
  process_risks?: {
    counter_offer_likelihood?: string;
    counter_offer_explanation?: string;
    common_dropout_reasons?: string[];
    red_flags_in_candidates?: string[];
    negotiation_pain_points?: string[];
  };
  tactical_recommendations?: {
    ts_value_props_to_highlight?: string[];
    what_to_avoid_saying?: string[];
    interview_focus_areas?: string[];
    decision_speed_recommended_days?: number;
    salary_negotiation_strategy?: string;
  };
  competitive_intelligence?: {
    typical_offer_packages?: string;
    ts_advantages?: string[];
    ts_disadvantages?: string[];
    differentiators_to_communicate?: string[];
  };
};

function VacancyMarketResearchModal({
  vacancyId,
  vacancyTitle,
  onClose,
}: {
  vacancyId: string;
  vacancyTitle: string;
  onClose: () => void;
}) {
  const [report, setReport] = useState<MarketResearchReport | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carga cache
  useEffect(() => {
    fetch(`/api/headhunting/vacancies/${vacancyId}/market-research`, { cache: 'no-store' })
      .then(r => r.json())
      .then(j => {
        if (j.research) {
          setReport(j.research.report || null);
          setGeneratedAt(j.research.generated_at || null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [vacancyId]);

  const generate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const r = await fetch(`/api/headhunting/vacancies/${vacancyId}/market-research`, { method: 'POST' });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error || 'Error generando estudio');
      } else {
        setReport(j.research?.report || null);
        setGeneratedAt(j.research?.generated_at || new Date().toISOString());
      }
    } catch (e: any) {
      setError(e?.message || 'Error de red');
    } finally {
      setGenerating(false);
    }
  }, [vacancyId]);

  const fmtCOP = (n?: number) => {
    if (n == null) return '—';
    return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-black text-white px-5 py-3 rounded-t-xl flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold opacity-80">Estudio de mercado IA</div>
              <div className="text-base font-extrabold leading-tight">{vacancyTitle}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={generate}
              disabled={generating}
              className="bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {generating ? (
                <><Hourglass className="w-3 h-3" /> Generando…</>
              ) : report ? (
                <><RefreshCw className="w-3 h-3" /> Regenerar</>
              ) : (
                <><Sparkles className="w-3 h-3" /> Generar</>
              )}
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-xl leading-none px-2"
              title="Cerrar"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          {loading && <div className="text-sm text-gray-400 py-8 text-center">Cargando…</div>}

          {!loading && !report && !generating && (
            <div className="text-center py-10">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <Bot className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Aún no hay estudio</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Generaremos un análisis completo: compensación COP, tiempos de reclutamiento,<br />
                talent pool, sourcing strategy y recomendaciones tácticas.
              </p>
              <button
                onClick={generate}
                disabled={generating}
                className="bg-black hover:bg-gray-800 text-white font-semibold px-5 py-2.5 rounded-full inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generar estudio de mercado
              </button>
            </div>
          )}

          {generating && (
            <div className="text-center py-12">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center animate-pulse">
                <Brain className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Claude está investigando…</h3>
              <p className="text-xs text-gray-500 mt-1">Analizando mercado de logística internacional Colombia 2026 · ~30s</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-xs text-red-800">
              <strong>Error:</strong> {error}
            </div>
          )}

          {!loading && !generating && report && (
            <div className="space-y-5">
              {generatedAt && (
                <div className="text-[10px] text-gray-400 italic">
                  Generado: {new Date(generatedAt).toLocaleString('es-CO')} · Cache servido si no se regenera
                </div>
              )}

              {/* Exec summary */}
              {report.exec_summary && (
                <Section title="Resumen ejecutivo" Icon={FileText} color="purple">
                  <p className="text-sm text-gray-700 leading-relaxed">{report.exec_summary}</p>
                </Section>
              )}

              {/* Compensación */}
              {report.compensation && (
                <Section title="Compensación · Mercado Colombia 2026" Icon={Trophy} color="emerald">
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <SalaryBox label="MIN" amount={fmtCOP(report.compensation.base_monthly_min)} bg="#FEF3C7" />
                    <SalaryBox label="MEDIANA" amount={fmtCOP(report.compensation.base_monthly_median)} bg="#D1FAE5" highlight />
                    <SalaryBox label="MAX" amount={fmtCOP(report.compensation.base_monthly_max)} bg="#DBEAFE" />
                  </div>
                  {report.compensation.total_annual_median != null && (
                    <div className="text-[11px] text-gray-600 mb-2">
                      Total anual mediana: <strong>{fmtCOP(report.compensation.total_annual_median)}</strong>
                    </div>
                  )}
                  {report.compensation.typical_bonuses && report.compensation.typical_bonuses.length > 0 && (
                    <PillRow label="Bonos típicos" items={report.compensation.typical_bonuses} color="amber" />
                  )}
                  {report.compensation.benefits_market_standard && report.compensation.benefits_market_standard.length > 0 && (
                    <PillRow label="Beneficios estándar" items={report.compensation.benefits_market_standard} color="emerald" />
                  )}
                  {report.compensation.latam_remote_comparison && (
                    <p className="text-xs text-gray-700 mt-2"><strong>LATAM remoto:</strong> {report.compensation.latam_remote_comparison}</p>
                  )}
                  {report.compensation.notes && (
                    <p className="text-[11px] text-gray-500 italic mt-2">{report.compensation.notes}</p>
                  )}
                </Section>
              )}

              {/* Timeline reclutamiento */}
              {report.recruiting_timeline && (
                <Section title="Tiempos de reclutamiento" Icon={Clock} color="blue">
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-2">
                      <div className="text-[10px] uppercase font-bold text-blue-700">Industria</div>
                      <div className="text-base font-extrabold text-blue-900">
                        {report.recruiting_timeline.industry_avg_ttf_days_min}-{report.recruiting_timeline.industry_avg_ttf_days_max} días
                      </div>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-2">
                      <div className="text-[10px] uppercase font-bold text-purple-700">Target TS</div>
                      <div className="text-base font-extrabold text-purple-900">{report.recruiting_timeline.ts_target_days} días</div>
                    </div>
                  </div>
                  {report.recruiting_timeline.comparison && (
                    <p className="text-xs text-gray-700 mb-2">{report.recruiting_timeline.comparison}</p>
                  )}
                  {report.recruiting_timeline.factors_speeding_up && report.recruiting_timeline.factors_speeding_up.length > 0 && (
                    <PillRow label="Aceleran" items={report.recruiting_timeline.factors_speeding_up} color="emerald" />
                  )}
                  {report.recruiting_timeline.factors_slowing_down && report.recruiting_timeline.factors_slowing_down.length > 0 && (
                    <PillRow label="Frenan" items={report.recruiting_timeline.factors_slowing_down} color="red" />
                  )}
                </Section>
              )}

              {/* Talent landscape */}
              {report.talent_landscape && (
                <Section title="Talent landscape" Icon={Globe} color="indigo">
                  <div className="grid grid-cols-3 gap-2 mb-2 text-[11px]">
                    <KV k="Pool" v={report.talent_landscape.pool_size_estimate} />
                    <KV k="Demanda" v={report.talent_landscape.demand_level} />
                    <KV k="Balance" v={report.talent_landscape.supply_demand_balance} />
                  </div>
                  {report.talent_landscape.pool_size_explanation && (
                    <p className="text-xs text-gray-700 mb-2">{report.talent_landscape.pool_size_explanation}</p>
                  )}
                  {report.talent_landscape.main_competing_companies && (
                    <PillRow label="Empresas que compiten por el talento" items={report.talent_landscape.main_competing_companies} color="indigo" />
                  )}
                  {report.talent_landscape.geographic_hotspots && (
                    <PillRow label="Hotspots geográficos" items={report.talent_landscape.geographic_hotspots} color="blue" />
                  )}
                </Section>
              )}

              {/* Skills 2026 */}
              {report.in_demand_skills_2026 && (
                <Section title="Skills más demandadas 2026" Icon={Target} color="orange">
                  {report.in_demand_skills_2026.must_have_technical && (
                    <PillRow label="Técnicas (must-have)" items={report.in_demand_skills_2026.must_have_technical} color="purple" />
                  )}
                  {report.in_demand_skills_2026.must_have_soft && (
                    <PillRow label="Soft (must-have)" items={report.in_demand_skills_2026.must_have_soft} color="emerald" />
                  )}
                  {report.in_demand_skills_2026.nice_to_have && (
                    <PillRow label="Nice-to-have" items={report.in_demand_skills_2026.nice_to_have} color="gray" />
                  )}
                  {report.in_demand_skills_2026.emerging_trends && (
                    <PillRow label="Tendencias emergentes" items={report.in_demand_skills_2026.emerging_trends} color="amber" />
                  )}
                </Section>
              )}

              {/* Sourcing */}
              {report.sourcing_strategy && (
                <Section title="Sourcing strategy" Icon={Search} color="cyan">
                  {report.sourcing_strategy.linkedin_search_strings && report.sourcing_strategy.linkedin_search_strings.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">LinkedIn Recruiter · Search strings</div>
                      <div className="space-y-1">
                        {report.sourcing_strategy.linkedin_search_strings.map((q, i) => (
                          <div key={i} className="bg-gray-900 text-emerald-300 px-2 py-1.5 rounded font-mono text-[11px] flex justify-between items-center gap-2 group">
                            <code className="flex-1 break-all">{q}</code>
                            <button
                              onClick={() => navigator.clipboard.writeText(q)}
                              className="opacity-0 group-hover:opacity-100 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded flex-shrink-0"
                              title="Copiar"
                            >Copy</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {report.sourcing_strategy.universities_to_target && (
                    <PillRow label="Universidades objetivo" items={report.sourcing_strategy.universities_to_target} color="indigo" />
                  )}
                  {report.sourcing_strategy.industry_associations && (
                    <PillRow label="Asociaciones gremiales" items={report.sourcing_strategy.industry_associations} color="purple" />
                  )}
                  {report.sourcing_strategy.communities_groups && (
                    <PillRow label="Comunidades / grupos" items={report.sourcing_strategy.communities_groups} color="cyan" />
                  )}
                  {report.sourcing_strategy.alternative_channels && (
                    <PillRow label="Canales alternativos" items={report.sourcing_strategy.alternative_channels} color="gray" />
                  )}
                  {report.sourcing_strategy.outreach_message_template && (
                    <div className="mt-2 bg-cyan-50 border-l-4 border-cyan-400 p-3 rounded">
                      <div className="text-[10px] uppercase font-bold text-cyan-700 mb-1">Outreach template</div>
                      <p className="text-xs text-gray-800 italic whitespace-pre-line">{report.sourcing_strategy.outreach_message_template}</p>
                    </div>
                  )}
                </Section>
              )}

              {/* Riesgos del proceso */}
              {report.process_risks && (
                <Section title="Riesgos del proceso" Icon={AlertTriangle} color="red">
                  <div className="mb-2">
                    <span className="text-[10px] uppercase font-bold text-gray-500">Counter-offer:</span>
                    <span className="ml-2 text-xs font-bold uppercase text-red-700">{report.process_risks.counter_offer_likelihood}</span>
                    {report.process_risks.counter_offer_explanation && (
                      <p className="text-xs text-gray-700 mt-1">{report.process_risks.counter_offer_explanation}</p>
                    )}
                  </div>
                  {report.process_risks.common_dropout_reasons && (
                    <PillRow label="Razones comunes de drop-off" items={report.process_risks.common_dropout_reasons} color="red" />
                  )}
                  {report.process_risks.red_flags_in_candidates && (
                    <PillRow label="Red flags" items={report.process_risks.red_flags_in_candidates} color="red" />
                  )}
                  {report.process_risks.negotiation_pain_points && (
                    <PillRow label="Puntos de fricción en negociación" items={report.process_risks.negotiation_pain_points} color="amber" />
                  )}
                </Section>
              )}

              {/* Recomendaciones tácticas */}
              {report.tactical_recommendations && (
                <Section title="Recomendaciones tácticas" Icon={Award} color="emerald">
                  {report.tactical_recommendations.ts_value_props_to_highlight && (
                    <PillRow label="Diferenciales TS a destacar" items={report.tactical_recommendations.ts_value_props_to_highlight} color="emerald" />
                  )}
                  {report.tactical_recommendations.what_to_avoid_saying && (
                    <PillRow label="Evitar decir" items={report.tactical_recommendations.what_to_avoid_saying} color="red" />
                  )}
                  {report.tactical_recommendations.interview_focus_areas && (
                    <PillRow label="Áreas a profundizar en entrevista" items={report.tactical_recommendations.interview_focus_areas} color="purple" />
                  )}
                  {report.tactical_recommendations.decision_speed_recommended_days != null && (
                    <p className="text-xs text-gray-700 mt-2">
                      <strong>Velocidad de decisión recomendada:</strong> {report.tactical_recommendations.decision_speed_recommended_days} días
                    </p>
                  )}
                  {report.tactical_recommendations.salary_negotiation_strategy && (
                    <div className="mt-2 bg-emerald-50 border-l-4 border-emerald-400 p-3 rounded">
                      <div className="text-[10px] uppercase font-bold text-emerald-700 mb-1">Estrategia de negociación salarial</div>
                      <p className="text-xs text-gray-800">{report.tactical_recommendations.salary_negotiation_strategy}</p>
                    </div>
                  )}
                </Section>
              )}

              {/* Competitive intel */}
              {report.competitive_intelligence && (
                <Section title="Competitive intelligence" Icon={BarChart3} color="purple">
                  {report.competitive_intelligence.typical_offer_packages && (
                    <p className="text-xs text-gray-700 mb-2"><strong>Paquetes típicos competencia:</strong> {report.competitive_intelligence.typical_offer_packages}</p>
                  )}
                  {report.competitive_intelligence.ts_advantages && (
                    <PillRow label="Ventajas TS" items={report.competitive_intelligence.ts_advantages} color="emerald" />
                  )}
                  {report.competitive_intelligence.ts_disadvantages && (
                    <PillRow label="Desventajas TS" items={report.competitive_intelligence.ts_disadvantages} color="amber" />
                  )}
                  {report.competitive_intelligence.differentiators_to_communicate && (
                    <PillRow label="Diferenciadores a comunicar" items={report.competitive_intelligence.differentiators_to_communicate} color="purple" />
                  )}
                </Section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, Icon, color, children }: { title: string; Icon: React.ComponentType<{ className?: string }>; color: string; children: React.ReactNode }) {
  const colorMap: Record<string, { bg: string; iconColor: string }> = {
    purple:  { bg: 'border-purple-200 bg-purple-50/30',   iconColor: 'text-purple-600' },
    emerald: { bg: 'border-emerald-200 bg-emerald-50/30', iconColor: 'text-emerald-600' },
    blue:    { bg: 'border-blue-200 bg-blue-50/30',       iconColor: 'text-blue-600' },
    indigo:  { bg: 'border-indigo-200 bg-indigo-50/30',   iconColor: 'text-indigo-600' },
    orange:  { bg: 'border-orange-200 bg-orange-50/30',   iconColor: 'text-orange-600' },
    cyan:    { bg: 'border-cyan-200 bg-cyan-50/30',       iconColor: 'text-cyan-600' },
    red:     { bg: 'border-red-200 bg-red-50/30',         iconColor: 'text-red-600' },
  };
  const c = colorMap[color] || { bg: 'border-gray-200 bg-gray-50/30', iconColor: 'text-gray-600' };
  return (
    <div className={`border rounded-lg p-3 ${c.bg}`}>
      <h4 className="text-[11px] uppercase tracking-[1.5px] font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
        <Icon className={`w-3.5 h-3.5 ${c.iconColor}`} />
        <span>{title}</span>
      </h4>
      {children}
    </div>
  );
}

function SalaryBox({ label, amount, bg, highlight }: { label: string; amount: string; bg: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-lg p-2 text-center ${highlight ? 'ring-2 ring-emerald-400' : ''}`}
      style={{ background: bg }}
    >
      <div className="text-[9px] uppercase font-bold text-gray-600">{label}</div>
      <div className="text-sm font-extrabold text-gray-900 mt-0.5 leading-tight">{amount}</div>
      <div className="text-[9px] text-gray-500">/ mes</div>
    </div>
  );
}

function PillRow({ label, items, color }: { label: string; items: string[]; color: string }) {
  if (!items || items.length === 0) return null;
  const colorMap: Record<string, string> = {
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return (
    <div className="mb-2">
      <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">{label}</div>
      <div className="flex flex-wrap gap-1">
        {items.map((it, i) => (
          <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border ${colorMap[color] || colorMap.gray}`}>{it}</span>
        ))}
      </div>
    </div>
  );
}

function KV({ k, v }: { k: string; v?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded p-1.5">
      <div className="text-[9px] uppercase font-bold text-gray-500">{k}</div>
      <div className="text-xs font-bold text-gray-900 capitalize">{v || '—'}</div>
    </div>
  );
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

function stageLabelShort(s: string): string {
  const map: Record<string, string> = {
    aplico: 'Aplicó', prefiltro_enviado: 'Pref. enviado', prefiltro_pasado: 'Pref. ✓',
    prefiltro_revision: 'Pref. (rev)', assessment_invitado: 'Elev. inv', assessment_en_progreso: 'Elev. prog',
    assessment_completado: 'Elev. ✓', entrevista_ia: 'IA', bateria_psicometrica: 'Batería',
    recruiter_interview: 'Recr.', cwo_interview: 'CWO', touring: 'Touring', terna: 'Terna', oferta: 'Oferta',
    contratado: 'Contratado', rechazado: 'Rechazado',
  };
  return map[s] || s;
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
/* Candidate Search Modal · global Cmd+K                    */
/* ======================================================== */
type CandidateSearchResult = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  current_role: string | null;
  vacancy_id: string;
  vacancy_title: string | null;
  vacancy_area: string | null;
  stage: string;
  status: string;
  overall_score: number | null;
  created_at: string;
  updated_at: string;
};

const STAGE_CHIP_COLOR: Record<string, string> = {
  aplico: 'bg-gray-100 text-gray-700',
  prefiltro_enviado: 'bg-blue-100 text-blue-700',
  prefiltro_pasado: 'bg-blue-100 text-blue-700',
  prefiltro_revision: 'bg-amber-100 text-amber-800',
  assessment_invitado: 'bg-indigo-100 text-indigo-700',
  assessment_en_progreso: 'bg-indigo-100 text-indigo-700',
  assessment_completado: 'bg-purple-100 text-purple-700',
  entrevista_ia: 'bg-purple-100 text-purple-700',
  bateria_psicometrica: 'bg-purple-100 text-purple-700',
  recruiter_interview: 'bg-cyan-100 text-cyan-800',
  cwo_interview: 'bg-emerald-100 text-emerald-800',
  touring: 'bg-emerald-100 text-emerald-800',
  terna: 'bg-emerald-100 text-emerald-800',
  oferta: 'bg-emerald-100 text-emerald-800',
  contratado: 'bg-emerald-200 text-emerald-900',
  rechazado: 'bg-red-100 text-red-700',
};

function CandidateSearchModal({ onClose, onJumpFunnel }: { onClose: () => void; onJumpFunnel: () => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<CandidateSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStage, setFilterStage] = useState<string>('');
  const [filterMinScore, setFilterMinScore] = useState<string>('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Reset selection when results change
  useEffect(() => { setSelectedIdx(0); }, [results]);

  // Scroll selected into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelectorAll<HTMLElement>('[data-search-item]')[selectedIdx];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  // Run search
  useEffect(() => {
    if (!debouncedQ && !filterStage && !filterMinScore) {
      // Mostrar últimos 25 actualizados como exploración
      runSearch();
      return;
    }
    runSearch();
  }, [debouncedQ, filterStage, filterMinScore]);

  const runSearch = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedQ) params.set('q', debouncedQ);
    if (filterStage) params.set('stage', filterStage);
    if (filterMinScore) params.set('min_score', filterMinScore);
    params.set('limit', '25');
    try {
      const r = await fetch(`/api/headhunting/candidates/search?${params.toString()}`, { cache: 'no-store' });
      const j = await r.json();
      setResults(j.results || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, [debouncedQ, filterStage, filterMinScore]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      e.preventDefault();
      onJumpFunnel();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[8vh] px-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        {/* Search bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar por nombre, email, rol actual…"
            className="flex-1 text-base font-medium focus:outline-none placeholder-gray-400"
          />
          {q && (
            <button onClick={() => setQ('')} className="text-gray-400 hover:text-gray-700 text-xs font-bold px-2">×</button>
          )}
          <kbd className="text-[9px] font-mono bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-gray-500">ESC</kbd>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50">
          <span className="text-[10px] uppercase font-bold text-gray-500">Filtros:</span>
          <select
            value={filterStage}
            onChange={e => setFilterStage(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-black"
          >
            <option value="">Todos los stages</option>
            <optgroup label="Activos">
              {['aplico','prefiltro_enviado','prefiltro_pasado','prefiltro_revision','assessment_invitado','assessment_en_progreso','assessment_completado','entrevista_ia','bateria_psicometrica','recruiter_interview','cwo_interview','touring','terna','oferta'].map(s => (
                <option key={s} value={s}>{stageLabelShort(s)}</option>
              ))}
            </optgroup>
            <optgroup label="Cerrados">
              <option value="contratado">Contratados</option>
              <option value="rechazado">Rechazados</option>
            </optgroup>
          </select>
          <select
            value={filterMinScore}
            onChange={e => setFilterMinScore(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-black"
          >
            <option value="">Score mínimo</option>
            <option value="50">≥ 50</option>
            <option value="70">≥ 70</option>
            <option value="80">≥ 80</option>
            <option value="90">≥ 90</option>
          </select>
          {(filterStage || filterMinScore) && (
            <button
              onClick={() => { setFilterStage(''); setFilterMinScore(''); }}
              className="text-[10px] text-red-600 font-bold hover:underline"
            >
              Limpiar filtros
            </button>
          )}
          <span className="ml-auto text-[10px] text-gray-500">
            {loading ? 'Buscando…' : `${results.length} resultado${results.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
          {!loading && results.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-sm font-bold text-gray-700">Sin resultados</div>
              <div className="text-xs text-gray-500 mt-1">
                {debouncedQ ? `No encontramos candidatos para "${debouncedQ}"` : 'Empezá a escribir para buscar'}
              </div>
            </div>
          )}

          {results.map((c, i) => (
            <button
              key={c.id}
              data-search-item
              onMouseEnter={() => setSelectedIdx(i)}
              onClick={() => { onJumpFunnel(); }}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
                i === selectedIdx ? 'bg-gray-50 border-l-2 border-l-black' : 'hover:bg-gray-50 border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <Avatar name={c.name} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-gray-900">{c.name}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STAGE_CHIP_COLOR[c.stage] || 'bg-gray-100 text-gray-700'}`}>
                      {stageLabelShort(c.stage)}
                    </span>
                    {c.overall_score != null && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        c.overall_score >= 80 ? 'bg-emerald-100 text-emerald-800' :
                        c.overall_score >= 60 ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        Score {c.overall_score}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 truncate">{c.email}{c.phone ? ` · ${c.phone}` : ''}</div>
                  <div className="text-[11px] text-gray-700 mt-0.5 truncate">
                    {c.current_role && <span>{c.current_role}</span>}
                    {c.vacancy_title && <span className="text-gray-400"> → </span>}
                    {c.vacancy_title && <span className="font-semibold">{c.vacancy_title}</span>}
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 flex-shrink-0 text-right">
                  <div>{fmtDate(c.created_at)}</div>
                  <div className="text-gray-300">creado</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer hints */}
        <div className="border-t border-gray-100 px-4 py-2 bg-gray-50 flex items-center justify-between text-[10px] text-gray-500">
          <div className="flex gap-3">
            <span><kbd className="bg-white border border-gray-200 rounded px-1 py-0.5 text-[9px] font-mono">↑↓</kbd> navegar</span>
            <span><kbd className="bg-white border border-gray-200 rounded px-1 py-0.5 text-[9px] font-mono">↵</kbd> abrir</span>
            <span><kbd className="bg-white border border-gray-200 rounded px-1 py-0.5 text-[9px] font-mono">ESC</kbd> cerrar</span>
          </div>
          <span>Click en candidato → Funnel</span>
        </div>
      </div>
    </div>
  );
}

/* ======================================================== */
/* Schedule Interview Modal — Google Calendar integration    */
/* ======================================================== */
function ScheduleInterviewModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'pick'|'form'|'success'>('pick');
  const [q, setQ] = useState('');
  const [results, setResults] = useState<CandidateSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQ, setDebouncedQ] = useState('');
  const [picked, setPicked] = useState<CandidateSearchResult | null>(null);

  const [interviewType, setInterviewType] = useState<'recruiter'|'cwo'|'technical'|'area_lead'|'wellness'|'final'>('recruiter');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(45);
  const [location, setLocation] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [interviewerEmails, setInterviewerEmails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ google_calendar_url: string; email_sent: boolean } | null>(null);

  // Default date: tomorrow
  useEffect(() => {
    const t = new Date(); t.setDate(t.getDate() + 1);
    setDate(t.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (step !== 'pick') return;
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedQ) params.set('q', debouncedQ);
    params.set('limit', '15');
    fetch(`/api/headhunting/candidates/search?${params.toString()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(j => { setResults(j.results || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [debouncedQ, step]);

  const submit = async () => {
    if (!picked || !date || !time) {
      setError('Faltan campos requeridos');
      return;
    }
    setSubmitting(true);
    setError(null);

    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
    const interviewers = interviewerEmails.split(',').map(s => s.trim()).filter(Boolean);

    try {
      const r = await fetch(`/api/headhunting/candidates/${picked.id}/schedule-interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interview_type: interviewType,
          scheduled_at: scheduledAt,
          duration_min: duration,
          location: location || null,
          meeting_url: meetingUrl || null,
          interviewer_emails: interviewers,
          send_email: true,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.success) {
        setError(j.error || 'Error al agendar');
      } else {
        setResult({
          google_calendar_url: j.google_calendar_url,
          email_sent: j.email?.sent === true,
        });
        setStep('success');
      }
    } catch (e: any) {
      setError(e?.message || 'Error de red');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[6vh] px-4 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold opacity-80">Agendar entrevista</div>
              <div className="text-base font-extrabold leading-tight">
                {step === 'pick' ? '1 · Elegí candidato' : step === 'form' ? '2 · Configurá la entrevista' : '✓ Listo'}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl px-2">×</button>
        </div>

        {/* Step 1: pick candidate */}
        {step === 'pick' && (
          <div className="p-4">
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg mb-3">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Buscar candidato por nombre o email…"
                className="flex-1 text-sm focus:outline-none"
                autoFocus
              />
            </div>
            <div className="max-h-[40vh] overflow-y-auto -mx-4">
              {loading && <div className="px-4 py-3 text-xs text-gray-400">Cargando…</div>}
              {!loading && results.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-gray-500">Sin resultados</div>
              )}
              {results.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setPicked(c); setStep('form'); }}
                  className="w-full text-left px-4 py-2.5 border-b border-gray-100 hover:bg-blue-50"
                >
                  <div className="flex justify-between items-baseline gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold">{c.name}</div>
                      <div className="text-[10px] text-gray-500 truncate">{c.email} · {c.vacancy_title}</div>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STAGE_CHIP_COLOR[c.stage] || 'bg-gray-100 text-gray-700'}`}>
                      {stageLabelShort(c.stage)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: form */}
        {step === 'form' && picked && (
          <div className="p-5">
            {/* Picked candidate summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex justify-between items-center">
              <div>
                <div className="text-[10px] uppercase font-bold text-blue-700">Candidato</div>
                <div className="text-sm font-bold">{picked.name}</div>
                <div className="text-[11px] text-blue-700">{picked.email} · {picked.vacancy_title}</div>
              </div>
              <button onClick={() => setStep('pick')} className="text-[11px] font-bold text-blue-700 hover:underline">Cambiar</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Tipo de entrevista">
                <select
                  value={interviewType}
                  onChange={e => setInterviewType(e.target.value as any)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                >
                  <option value="recruiter">Recruiter</option>
                  <option value="cwo">CWO</option>
                  <option value="wellness">Wellness / Fit cultural</option>
                  <option value="area_lead">Líder del área</option>
                  <option value="technical">Técnica</option>
                  <option value="final">Final</option>
                </select>
              </FormField>
              <FormField label="Duración (min)">
                <select
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                >
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                  <option value={90}>90 min</option>
                </select>
              </FormField>
              <FormField label="Fecha">
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
              </FormField>
              <FormField label="Hora">
                <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
              </FormField>
              <FormField label="Link de la reunión (opcional)" full>
                <input
                  type="url"
                  value={meetingUrl}
                  onChange={e => setMeetingUrl(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </FormField>
              <FormField label="Ubicación física (si presencial)" full>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Ej: Oficinas TS Barranquilla, Sala 2"
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </FormField>
              <FormField label="Emails de entrevistadores (separados por coma)" full>
                <input
                  type="text"
                  value={interviewerEmails}
                  onChange={e => setInterviewerEmails(e.target.value)}
                  placeholder="cwo@tradingsolutions.com, lead@..."
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </FormField>
            </div>

            {error && <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 mt-3">{error}</div>}

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <button onClick={onClose} className="text-xs font-bold text-gray-500 px-4 py-2">Cancelar</button>
              <button
                onClick={submit}
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-xs font-bold px-5 py-2 rounded-lg"
              >
                {submitting ? 'Agendando…' : '📅 Agendar y enviar invite'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: success */}
        {step === 'success' && result && (
          <div className="p-6 text-center">
            <div className="text-5xl mb-3">✅</div>
            <h3 className="text-xl font-extrabold mb-2">Entrevista agendada</h3>
            <p className="text-sm text-gray-600 mb-4">
              {result.email_sent ? 'Invitación enviada al candidato con el .ics adjunto.' : 'Entrevista guardada. Email no enviado (revisá Resend).'}
            </p>
            <a
              href={result.google_calendar_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm mb-2"
            >
              📆 Agregar a tu Google Calendar
            </a>
            <div className="text-[11px] text-gray-500 mt-3">Ya aparece en "Today's Focus" del Dashboard si es para hoy.</div>
            <button onClick={onClose} className="mt-4 text-xs font-bold text-gray-500">Cerrar</button>
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

/* ======================================================== */
/* Funnel por vacante · drop-off por fase                    */
/* ======================================================== */
type FunnelByVacancyData = {
  vacancies: {
    vacancy_id: string;
    title: string;
    area: string;
    role_level: string;
    status: 'abierta' | 'cerrada';
    totals: { total: number; active: number; rejected: number; hired: number };
    funnel: { stage: string; label: string; count: number; conv_pct: number | null; lost_from_prev: number }[];
    top_dropoffs: { from: string; to: string; lost: number; lost_pct: number; conv_pct: number }[];
  }[];
};

function FunnelByVacancy() {
  const [data, setData] = useState<FunnelByVacancyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'open' | 'all'>('open');

  useEffect(() => {
    let alive = true;
    const fetchData = () => fetch('/api/dashboard/funnel-by-vacancy', { cache: 'no-store' })
      .then(r => r.json())
      .then(j => { if (alive) { setData(j); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    fetchData();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchData();
    }, 30000);
    return () => { alive = false; clearInterval(interval); };
  }, []);

  if (loading) return <div className="mt-6 text-sm text-gray-400">Cargando funnel por vacante…</div>;
  if (!data || !data.vacancies.length) return null;

  const visible = filter === 'open'
    ? data.vacancies.filter(v => v.status === 'abierta')
    : data.vacancies;

  return (
    <div className="mt-6">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Funnel por vacante</h2>
          <p className="text-xs text-gray-500">Dónde se están quedando los candidatos en cada vacante · drop-off por fase</p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setFilter('open')}
            className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-colors ${
              filter === 'open' ? 'bg-black text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
            }`}
          >
            Abiertas ({data.vacancies.filter(v => v.status === 'abierta').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-colors ${
              filter === 'all' ? 'bg-black text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
            }`}
          >
            Todas ({data.vacancies.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {visible.map(v => (
          <FunnelVacancyCard
            key={v.vacancy_id}
            vacancy={v}
            expanded={expandedId === v.vacancy_id}
            onToggle={() => setExpandedId(expandedId === v.vacancy_id ? null : v.vacancy_id)}
          />
        ))}
      </div>
    </div>
  );
}

function FunnelVacancyCard({
  vacancy,
  expanded,
  onToggle,
}: {
  vacancy: FunnelByVacancyData['vacancies'][0];
  expanded: boolean;
  onToggle: () => void;
}) {
  const maxCount = Math.max(...vacancy.funnel.map(s => s.count), 1);
  const visibleStages = expanded ? vacancy.funnel : vacancy.funnel.slice(0, 5);
  const conversionTotal = vacancy.totals.total > 0
    ? Math.round((vacancy.totals.hired / vacancy.totals.total) * 100 * 10) / 10
    : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-900 truncate">{vacancy.title}</span>
            <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
              vacancy.status === 'abierta' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {vacancy.status}
            </span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            {vacancy.area || '—'} · {vacancy.role_level === 'c_suite' ? 'C-Suite' : vacancy.role_level}
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-4 gap-1.5 mb-3 text-[10px]">
        <div className="bg-gray-50 rounded px-2 py-1.5 text-center">
          <div className="text-gray-500 uppercase font-bold text-[9px]">Total</div>
          <div className="text-base font-extrabold text-gray-900 tabular-nums">{vacancy.totals.total}</div>
        </div>
        <div className="bg-blue-50 rounded px-2 py-1.5 text-center">
          <div className="text-blue-700 uppercase font-bold text-[9px]">Activos</div>
          <div className="text-base font-extrabold text-blue-900 tabular-nums">{vacancy.totals.active}</div>
        </div>
        <div className="bg-emerald-50 rounded px-2 py-1.5 text-center">
          <div className="text-emerald-700 uppercase font-bold text-[9px]">Hired</div>
          <div className="text-base font-extrabold text-emerald-900 tabular-nums">{vacancy.totals.hired}</div>
        </div>
        <div className="bg-red-50 rounded px-2 py-1.5 text-center">
          <div className="text-red-700 uppercase font-bold text-[9px]">Rechazados</div>
          <div className="text-base font-extrabold text-red-900 tabular-nums">{vacancy.totals.rejected}</div>
        </div>
      </div>

      {/* Funnel bars */}
      <div className="space-y-1 mb-3">
        {visibleStages.map((s, i) => {
          const pct = (s.count / maxCount) * 100;
          const convColor =
            s.conv_pct === null ? 'text-gray-300'
            : s.conv_pct >= 80 ? 'text-emerald-600'
            : s.conv_pct >= 50 ? 'text-amber-600'
            : s.conv_pct >= 25 ? 'text-orange-600'
            : 'text-red-500';
          return (
            <div key={s.stage} className="grid items-center gap-2" style={{ gridTemplateColumns: '110px 1fr 38px 32px' }}>
              <span className="text-[10px] text-gray-700 truncate">{s.label}</span>
              <div className="h-4 bg-gray-100 rounded overflow-hidden relative">
                <div
                  className="h-full bg-gray-800 rounded"
                  style={{ width: `${Math.max(pct, s.count > 0 ? 4 : 0)}%` }}
                />
                {s.lost_from_prev > 0 && i > 0 && (
                  <span className="absolute right-1 top-0 bottom-0 flex items-center text-[9px] text-red-600 font-semibold">
                    -{s.lost_from_prev}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold text-right tabular-nums ${convColor}`}>
                {s.conv_pct !== null ? `${s.conv_pct}%` : '—'}
              </span>
              <span className="text-[10px] font-bold text-gray-900 text-right tabular-nums">{s.count}</span>
            </div>
          );
        })}
      </div>

      {!expanded && vacancy.funnel.length > 5 && (
        <button onClick={onToggle} className="text-[10px] font-semibold text-gray-600 hover:text-black mb-2">
          Ver +{vacancy.funnel.length - 5} stages → {vacancy.funnel.slice(5).map(s => s.label).join(' · ')}
        </button>
      )}
      {expanded && (
        <button onClick={onToggle} className="text-[10px] font-semibold text-gray-600 hover:text-black mb-2">
          Ver menos ↑
        </button>
      )}

      {/* Drop-offs críticos */}
      {vacancy.top_dropoffs.length > 0 && (
        <div className="border-t border-gray-100 pt-2 mt-2">
          <div className="text-[9px] uppercase tracking-wider font-bold text-red-700 mb-1.5 flex items-center gap-1">
            <AlertOctagon className="w-3 h-3" />
            <span>Donde más se quedan</span>
          </div>
          <div className="space-y-1">
            {vacancy.top_dropoffs.map((d, i) => (
              <div key={i} className="text-[10px] bg-red-50 rounded px-2 py-1 flex items-center gap-2">
                <span className="text-red-700 font-mono font-bold tabular-nums">-{d.lost_pct}%</span>
                <span className="text-gray-700 truncate flex-1">
                  <strong>{d.from}</strong> → {d.to}
                </span>
                <span className="text-red-600 font-semibold">({d.lost})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversión total */}
      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px]">
        <span className="text-gray-500">Conversión total → contratado</span>
        <span className={`font-bold tabular-nums ${conversionTotal >= 5 ? 'text-emerald-600' : conversionTotal >= 2 ? 'text-amber-600' : 'text-gray-400'}`}>
          {conversionTotal}%
        </span>
      </div>
    </div>
  );
}

/* ======================================================== */
/* Analytics Deep · funnel + sources + time + comparison    */
/* ======================================================== */
type AnalyticsData = {
  generated_at: string;
  funnel_conversion: { stage: string; label: string; reached: number; conv_from_prev: number | null }[];
  top_dropoffs: { from: string; to: string; lost: number; lost_pct: number; conv_pct: number }[];
  sources: { linkedin: { count: number; pct: number }; organic: { count: number; pct: number }; unknown: { count: number; pct: number } };
  sources_quality: { linkedin_hire_rate: number; organic_hire_rate: number; linkedin_hires: number; organic_hires: number };
  vacancy_comparison: { vacancy_id: string; title: string; role_level: string; ttf: number | null; ttf_linkedin: number | null; candidates_total: number; hire_rate: number }[];
  time_per_stage: { stage: string; label: string; count: number; avg_days: number }[];
  avg_elevare_score: number | null;
};

function AnalyticsDeep() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard/analytics', { cache: 'no-store' })
      .then(r => r.json())
      .then(j => { setData(j); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="mt-6 text-sm text-gray-400">Cargando analytics…</div>;
  if (!data) return null;

  const maxFunnelReached = Math.max(...data.funnel_conversion.map(f => f.reached), 1);

  return (
    <div className="mt-6">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight">Analytics</h2>
          <p className="text-xs text-gray-500">Conversion · Sources · Tiempos · Comparación de vacantes</p>
        </div>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="text-xs font-bold text-gray-500 hover:text-gray-900 px-2 py-1"
        >
          {collapsed ? 'Expandir ↓' : 'Colapsar ↑'}
        </button>
      </div>

      {!collapsed && (
        <div className="space-y-3">
          {/* Funnel + Drop-offs row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Funnel */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-xs uppercase tracking-wider font-extrabold text-gray-700 mb-3">Funnel completo · Conversión por stage</h3>
              <div className="space-y-1.5">
                {data.funnel_conversion.filter(f => f.reached > 0).map((f, i) => {
                  const pct = (f.reached / maxFunnelReached) * 100;
                  return (
                    <div
                      key={f.stage}
                      className="grid items-center gap-2"
                      style={{ gridTemplateColumns: '160px 1fr 50px 60px' }}
                    >
                      <span className="text-xs text-gray-700 font-medium truncate">{f.label}</span>
                      <div className="h-6 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-black rounded-l flex items-center justify-end pr-2 text-[10px] font-bold text-white transition-all"
                          style={{ width: `${Math.max(pct, f.reached > 0 ? 4 : 0)}%` }}
                        >
                          {f.reached > 0 ? f.reached : ''}
                        </div>
                      </div>
                      <span
                        className={`text-right text-[11px] font-bold ${
                          f.conv_from_prev === null ? 'text-gray-300' :
                          f.conv_from_prev >= 80 ? 'text-emerald-600' :
                          f.conv_from_prev >= 50 ? 'text-amber-600' :
                          'text-red-500'
                        }`}
                        title="Conversión desde el stage anterior"
                      >
                        {f.conv_from_prev !== null ? `${f.conv_from_prev}%` : '—'}
                      </span>
                      <span className="text-right font-bold text-sm">{f.reached}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 italic mt-2">% en columna 3 = conversión desde el stage anterior</p>
            </div>

            {/* Top drop-offs */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-xs uppercase tracking-wider font-extrabold text-gray-700 mb-3">Top drop-offs 🚨</h3>
              {data.top_dropoffs.length === 0 ? (
                <p className="text-xs text-gray-400">Sin data suficiente aún.</p>
              ) : (
                <div className="space-y-2">
                  {data.top_dropoffs.map((d, i) => (
                    <div key={i} className="bg-red-50 border border-red-200 rounded p-2">
                      <div className="text-[10px] uppercase font-bold text-red-700 mb-0.5">#{i + 1} · -{d.lost_pct}%</div>
                      <div className="text-xs font-bold text-gray-900 leading-tight">
                        {d.from} → {d.to}
                      </div>
                      <div className="text-[10px] text-red-700 mt-1">
                        {d.lost} candidatos perdidos · solo {d.conv_pct}% pasaron
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sources + Time per stage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Sources */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-xs uppercase tracking-wider font-extrabold text-gray-700 mb-3">Sources · LinkedIn vs Orgánica</h3>
              <div className="space-y-3">
                <SourceBarRow
                  label="LinkedIn (canal pago activo)"
                  count={data.sources.linkedin.count}
                  pct={data.sources.linkedin.pct}
                  hire_rate={data.sources_quality.linkedin_hire_rate}
                  hires={data.sources_quality.linkedin_hires}
                  color="#0A66C2"
                />
                <SourceBarRow
                  label="Orgánica (referrals, careers, etc.)"
                  count={data.sources.organic.count}
                  pct={data.sources.organic.pct}
                  hire_rate={data.sources_quality.organic_hire_rate}
                  hires={data.sources_quality.organic_hires}
                  color="#10B981"
                />
                {data.sources.unknown.count > 0 && (
                  <SourceBarRow
                    label="Sin fuente identificada"
                    count={data.sources.unknown.count}
                    pct={data.sources.unknown.pct}
                    hire_rate={0}
                    hires={0}
                    color="#9CA3AF"
                  />
                )}
              </div>
              <p className="text-[10px] text-gray-400 italic mt-3">Hire rate compara cuántos terminaron contratados vs total que entró por ese canal</p>
            </div>

            {/* Time per stage */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-xs uppercase tracking-wider font-extrabold text-gray-700 mb-3">Tiempo promedio por stage</h3>
              {data.time_per_stage.length === 0 ? (
                <p className="text-xs text-gray-400">Sin data suficiente.</p>
              ) : (
                <div className="space-y-1.5">
                  {data.time_per_stage.slice(0, 8).map((t, i) => {
                    const maxDays = Math.max(...data.time_per_stage.map(s => s.avg_days), 1);
                    const pct = (t.avg_days / maxDays) * 100;
                    const colorClass = t.avg_days > 14 ? 'bg-red-500' : t.avg_days > 7 ? 'bg-amber-500' : 'bg-emerald-500';
                    return (
                      <div key={t.stage} className="grid items-center gap-2" style={{ gridTemplateColumns: '140px 1fr 60px' }}>
                        <span className="text-xs text-gray-700 truncate">{t.label}</span>
                        <div className="h-4 bg-gray-100 rounded overflow-hidden">
                          <div className={`h-full ${colorClass} rounded transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-right text-[11px] font-bold">{t.avg_days}d <span className="text-gray-400 font-normal">({t.count})</span></span>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-[10px] text-gray-400 italic mt-2">Estimado desde delta created_at → updated_at · n entre paréntesis</p>
            </div>
          </div>

          {/* Vacancy comparison table */}
          {data.vacancy_comparison.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-xs uppercase tracking-wider font-extrabold text-gray-700">Comparación de vacantes cerradas</h3>
                <p className="text-[10px] text-gray-500">Ordenadas por TTF total ascendente · best performers primero</p>
              </div>
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr className="text-[10px] uppercase text-gray-500">
                    <th className="text-left px-3 py-2 font-bold">Vacante</th>
                    <th className="text-left px-3 py-2 font-bold">Nivel</th>
                    <th className="text-right px-3 py-2 font-bold">TTF total</th>
                    <th className="text-right px-3 py-2 font-bold">TTF LinkedIn</th>
                    <th className="text-right px-3 py-2 font-bold">Candidatos</th>
                    <th className="text-right px-3 py-2 font-bold">Hire rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.vacancy_comparison.map((v) => (
                    <tr key={v.vacancy_id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 font-semibold">{v.title}</td>
                      <td className="px-3 py-2 text-gray-600 uppercase text-[10px] font-bold">{v.role_level === 'c_suite' ? 'C-Suite' : v.role_level}</td>
                      <td className="px-3 py-2 text-right font-bold">{v.ttf ?? '—'}{v.ttf != null ? 'd' : ''}</td>
                      <td className="px-3 py-2 text-right text-blue-700 font-bold">{v.ttf_linkedin ?? '—'}{v.ttf_linkedin != null ? 'd' : ''}</td>
                      <td className="px-3 py-2 text-right">{v.candidates_total}</td>
                      <td className="px-3 py-2 text-right">
                        <span className={`font-bold ${v.hire_rate >= 5 ? 'text-emerald-600' : v.hire_rate >= 2 ? 'text-amber-600' : 'text-red-500'}`}>
                          {v.hire_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer micro-stats */}
          <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-3 flex flex-wrap items-center gap-4 text-xs">
            {data.avg_elevare_score != null && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-gray-500">Elevare avg score</span>
                <span className={`text-base font-extrabold ${data.avg_elevare_score >= 70 ? 'text-emerald-600' : data.avg_elevare_score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{data.avg_elevare_score}</span>
              </div>
            )}
            <div className="flex items-center gap-2 ml-auto text-[10px] text-gray-400">
              <span>Generado: {new Date(data.generated_at).toLocaleTimeString('es-CO')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SourceBarRow({ label, count, pct, hire_rate, hires, color }: { label: string; count: number; pct: number; hire_rate: number; hires: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className="text-[11px] font-bold" style={{ color }}>{count} · {pct}%</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="flex justify-between text-[10px] text-gray-500 mt-1">
        <span>Hire rate: <strong className="text-gray-800">{hire_rate}%</strong></span>
        <span>{hires} hire{hires !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}

/* ======================================================== */
/* People Import Modal · CSV bulk import de TPs              */
/* ======================================================== */
type ParsedRow = Record<string, string>;
type ImportResult = {
  index: number;
  email: string | null;
  action: 'inserted' | 'updated' | 'skipped' | 'error';
  reason?: string;
  person_id?: string;
};

function PeopleImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState<'upload'|'preview'|'submitting'|'done'>('upload');
  const [rawCsv, setRawCsv] = useState('');
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [defaultIsTp, setDefaultIsTp] = useState(true);
  const [dryRunResult, setDryRunResult] = useState<{ to_insert: number; to_update: number; errors: number; results: ImportResult[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [finalResult, setFinalResult] = useState<{ inserted: number; updated: number; errors: number } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // CSV parser simple — soporta comas dentro de comillas
  const parseCsv = (text: string): ParsedRow[] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) throw new Error('El CSV necesita al menos un header y una fila');
    const parseLine = (line: string): string[] => {
      const out: string[] = [];
      let cur = '';
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQ && line[i+1] === '"') { cur += '"'; i++; }
          else inQ = !inQ;
        } else if (ch === ',' && !inQ) {
          out.push(cur); cur = '';
        } else { cur += ch; }
      }
      out.push(cur);
      return out.map(s => s.trim());
    };
    const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
    return lines.slice(1).map(line => {
      const vals = parseLine(line);
      const row: ParsedRow = {};
      headers.forEach((h, i) => { if (vals[i] !== undefined) row[h] = vals[i]; });
      return row;
    });
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || '');
      setRawCsv(text);
      try {
        const rows = parseCsv(text);
        if (rows.length === 0) throw new Error('CSV vacío');
        if (!rows[0].name && !rows[0].nombre) {
          setParseError('El CSV debe tener una columna "name" o "nombre"');
          return;
        }
        // Normalize "nombre" → "name", "rol" → "role" si vienen en español
        const normalized = rows.map(r => {
          const n: ParsedRow = { ...r };
          if (r.nombre && !r.name) n.name = r.nombre;
          if (r.rol && !r.role) n.role = r.rol;
          if (r.area && !r.area) n.area = r.area;
          if (r.nivel && !r.role_level) n.role_level = r.nivel;
          if (r.fecha_ingreso && !r.start_date) n.start_date = r.fecha_ingreso;
          return n;
        });
        setParsed(normalized);
        setParseError(null);
      } catch (e: any) {
        setParseError(e?.message || 'Error parseando CSV');
        setParsed([]);
      }
    };
    reader.readAsText(file);
  };

  const runDryRun = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const r = await fetch('/api/people/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ people: parsed, default_is_tp: defaultIsTp, dry_run: true }),
      });
      const j = await r.json();
      if (!r.ok) {
        setSubmitError(j.error || 'Error en validación');
      } else {
        setDryRunResult(j);
        setStep('preview');
      }
    } catch (e: any) {
      setSubmitError(e?.message || 'Error de red');
    } finally {
      setSubmitting(false);
    }
  };

  const runImport = async () => {
    setSubmitting(true);
    setSubmitError(null);
    setStep('submitting');
    try {
      const r = await fetch('/api/people/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ people: parsed, default_is_tp: defaultIsTp, dry_run: false }),
      });
      const j = await r.json();
      if (!r.ok) {
        setSubmitError(j.error || 'Error en import');
        setStep('preview');
      } else {
        setFinalResult({ inserted: j.inserted, updated: j.updated, errors: j.errors });
        setStep('done');
      }
    } catch (e: any) {
      setSubmitError(e?.message || 'Error de red');
      setStep('preview');
    } finally {
      setSubmitting(false);
    }
  };

  const sampleCsv = `name,email,role,area,role_level,start_date,manager_email,iq,conscientiousness,neuroticism,english_level
Juan Pérez,juan.perez@tradingsolutions.com,Pricing Senior,Pricing,lead,2022-03-15,boss@tradingsolutions.com,118,80,28,B2
María Rodríguez,maria.rod@tradingsolutions.com,Customer Documentation,CD,entry,2023-01-10,boss@tradingsolutions.com,115,76,32,B2`;

  const downloadSample = () => {
    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'tps-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[6vh] px-4 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-black text-white px-5 py-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold opacity-80">Importar TPs · People file</div>
            <div className="text-base font-extrabold leading-tight">
              {step === 'upload' && '1 · Subí el CSV'}
              {step === 'preview' && '2 · Revisá antes de importar'}
              {step === 'submitting' && 'Importando…'}
              {step === 'done' && '✓ Listo'}
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl px-2">×</button>
        </div>

        {step === 'upload' && (
          <div className="p-5">
            {/* Format info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-xs">
              <div className="font-bold text-gray-900 mb-1">Formato esperado</div>
              <p className="text-gray-700 leading-relaxed">
                CSV con header. Columnas requeridas: <strong>name</strong> · <strong>email</strong>. Recomendadas: <strong>role</strong>, <strong>area</strong>, <strong>role_level</strong> (entry/lead/c_suite), <strong>start_date</strong>, <strong>manager_email</strong>.
                Cualquier columna extra (iq, conscientiousness, neuroticism, english_level, etc.) va automáticamente al campo psychometric_profile.
              </p>
              <button onClick={downloadSample} className="mt-2 text-xs font-bold text-blue-700 hover:underline">📥 Descargar template</button>
            </div>

            {/* Drag/drop file input */}
            <label className="block">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
                id="csv-input"
              />
              <div className="border-2 border-dashed border-gray-300 hover:border-black rounded-lg p-8 text-center cursor-pointer transition-colors">
                <div className="text-3xl mb-2">📥</div>
                <div className="text-sm font-bold text-gray-900">Click para elegir CSV</div>
                <div className="text-[11px] text-gray-500 mt-1">o arrastrá el archivo aquí</div>
              </div>
              <button
                type="button"
                onClick={() => document.getElementById('csv-input')?.click()}
                className="hidden"
              >Pick file</button>
            </label>

            {/* Or paste text */}
            <div className="mt-3">
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">…o pegá el contenido CSV directamente</label>
              <textarea
                value={rawCsv}
                onChange={e => {
                  setRawCsv(e.target.value);
                  if (e.target.value.trim()) {
                    try {
                      const rows = parseCsv(e.target.value);
                      setParsed(rows);
                      setParseError(null);
                    } catch (er: any) {
                      setParseError(er.message);
                      setParsed([]);
                    }
                  } else {
                    setParsed([]);
                    setParseError(null);
                  }
                }}
                rows={5}
                placeholder="name,email,role,area,role_level,start_date..."
                className="w-full border border-gray-300 rounded p-2 text-xs font-mono focus:outline-none focus:border-black"
              />
            </div>

            {parseError && <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 mt-3">{parseError}</div>}

            {parsed.length > 0 && (
              <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded p-3 text-xs">
                <div className="font-bold text-emerald-800">✓ {parsed.length} fila{parsed.length !== 1 ? 's' : ''} parseada{parsed.length !== 1 ? 's' : ''}</div>
                <div className="text-emerald-700 mt-0.5">Columnas detectadas: {Object.keys(parsed[0]).join(', ')}</div>
              </div>
            )}

            {/* TP toggle */}
            <label className="flex items-center gap-2 mt-4 text-sm">
              <input
                type="checkbox"
                checked={defaultIsTp}
                onChange={e => setDefaultIsTp(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Marcar a todos como <strong>Top Performers</strong> (recomendado para import inicial)</span>
            </label>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-gray-100">
              <button onClick={onClose} className="text-xs font-bold text-gray-500 px-4 py-2">Cancelar</button>
              <button
                onClick={runDryRun}
                disabled={parsed.length === 0 || submitting}
                className="bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white text-xs font-bold px-5 py-2 rounded-lg"
              >
                {submitting ? 'Validando…' : `Validar ${parsed.length} ${parsed.length === 1 ? 'persona' : 'personas'} →`}
              </button>
            </div>
            {submitError && <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 mt-3">{submitError}</div>}
          </div>
        )}

        {step === 'preview' && dryRunResult && (
          <div className="p-5">
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-2 text-center">
                <div className="text-[10px] uppercase font-bold text-blue-700">Nuevas</div>
                <div className="text-2xl font-extrabold text-blue-900">{dryRunResult.to_insert}</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded p-2 text-center">
                <div className="text-[10px] uppercase font-bold text-amber-700">Actualizar (email existe)</div>
                <div className="text-2xl font-extrabold text-amber-900">{dryRunResult.to_update}</div>
              </div>
              <div className={`${dryRunResult.errors > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'} border rounded p-2 text-center`}>
                <div className={`text-[10px] uppercase font-bold ${dryRunResult.errors > 0 ? 'text-red-700' : 'text-gray-500'}`}>Errores</div>
                <div className={`text-2xl font-extrabold ${dryRunResult.errors > 0 ? 'text-red-900' : 'text-gray-400'}`}>{dryRunResult.errors}</div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[40vh] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-2 py-1.5 font-bold text-[10px] uppercase">#</th>
                    <th className="text-left px-2 py-1.5 font-bold text-[10px] uppercase">Email</th>
                    <th className="text-left px-2 py-1.5 font-bold text-[10px] uppercase">Acción</th>
                    <th className="text-left px-2 py-1.5 font-bold text-[10px] uppercase">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {dryRunResult.results.map(r => (
                    <tr key={r.index} className="border-t border-gray-100">
                      <td className="px-2 py-1 text-gray-500">{r.index + 1}</td>
                      <td className="px-2 py-1 truncate max-w-[200px]">{r.email || '—'}</td>
                      <td className="px-2 py-1">
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          r.action === 'inserted' ? 'bg-blue-100 text-blue-800' :
                          r.action === 'updated' ? 'bg-amber-100 text-amber-800' :
                          r.action === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
                        }`}>{r.action}</span>
                      </td>
                      <td className="px-2 py-1 text-gray-600 text-[11px]">{r.reason || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <button onClick={() => setStep('upload')} className="text-xs font-bold text-gray-500 px-4 py-2">← Volver</button>
              <button
                onClick={runImport}
                disabled={submitting || (dryRunResult.to_insert === 0 && dryRunResult.to_update === 0)}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xs font-bold px-5 py-2 rounded-lg"
              >
                Confirmar e importar {dryRunResult.to_insert + dryRunResult.to_update} personas
              </button>
            </div>
            {submitError && <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 mt-3">{submitError}</div>}
          </div>
        )}

        {step === 'submitting' && (
          <div className="p-10 text-center">
            <div className="text-5xl mb-3 animate-pulse">📥</div>
            <div className="text-base font-bold">Importando {parsed.length} personas…</div>
            <div className="text-xs text-gray-500 mt-1">No cierres esta ventana</div>
          </div>
        )}

        {step === 'done' && finalResult && (
          <div className="p-8 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-2xl font-extrabold mb-2">Import completo</h3>
            <div className="grid grid-cols-3 gap-2 max-w-md mx-auto mb-4">
              <div className="bg-emerald-50 rounded p-2">
                <div className="text-3xl font-extrabold text-emerald-700">{finalResult.inserted}</div>
                <div className="text-[10px] uppercase font-bold text-emerald-600">Insertadas</div>
              </div>
              <div className="bg-amber-50 rounded p-2">
                <div className="text-3xl font-extrabold text-amber-700">{finalResult.updated}</div>
                <div className="text-[10px] uppercase font-bold text-amber-600">Actualizadas</div>
              </div>
              <div className={`${finalResult.errors > 0 ? 'bg-red-50' : 'bg-gray-50'} rounded p-2`}>
                <div className={`text-3xl font-extrabold ${finalResult.errors > 0 ? 'text-red-700' : 'text-gray-400'}`}>{finalResult.errors}</div>
                <div className="text-[10px] uppercase font-bold text-gray-500">Errores</div>
              </div>
            </div>
            <button
              onClick={onDone}
              className="bg-black hover:bg-gray-800 text-white font-bold px-5 py-2.5 rounded-lg text-sm"
            >
              Ver People file →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ======================================================== */
/* Onboarding · People file + 30/60/90                      */
/* ======================================================== */
type OnboardingItem = {
  id: string;
  person: { id: string; name: string; email: string; role: string; area: string; role_level: string; start_date: string; status: string; manager_email?: string; buddy_email?: string; location?: string };
  start_date: string;
  status: 'not_started'|'in_progress'|'completed'|'at_risk';
  days_since_start: number;
  current_milestone: 'day1'|'week1'|'day30'|'day60'|'day90';
  progress: { total: number; done: number; pct: number; byMilestone: Record<string, { total: number; done: number; pct: number }> };
  health: 'on_track'|'behind'|'at_risk';
  next_task: { id: string; label: string; owner: string; milestone: string } | null;
  ramp_up_score: number | null;
};

type OnboardingTaskUI = {
  id: string;
  milestone: 'day1'|'week1'|'day30'|'day60'|'day90';
  label: string;
  owner: 'hr'|'manager'|'buddy'|'it'|'employee';
  done: boolean;
  done_at: string | null;
};

const MS_LABEL: Record<string, string> = { day1: 'Día 1', week1: 'Semana 1', day30: 'Día 30', day60: 'Día 60', day90: 'Día 90' };
const MS_COLOR: Record<string, string> = { day1: '#8B5CF6', week1: '#3B82F6', day30: '#10B981', day60: '#F59E0B', day90: '#EF4444' };
const OWNER_LABEL: Record<string, string> = { hr: 'HR', manager: 'Manager', buddy: 'Buddy', it: 'IT', employee: 'Empleado' };

function OnboardingTab() {
  const [items, setItems] = useState<OnboardingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active'|'completed'|'all'>('active');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [peopleStats, setPeopleStats] = useState<{ total: number; tps: number } | null>(null);

  const load = useCallback(() => {
    const qs = filter === 'active' ? '?status=active' : '';
    fetch(`/api/onboarding${qs}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(j => { setItems(j.onboardings || []); setLoading(false); })
      .catch(() => setLoading(false));
    // People directory stats
    fetch('/api/people', { cache: 'no-store' })
      .then(r => r.json())
      .then(j => {
        const all = j.people || [];
        setPeopleStats({ total: all.length, tps: all.filter((p: any) => p.is_top_performer).length });
      });
  }, [filter]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const counts = useMemo(() => {
    const all = items;
    return {
      total: all.length,
      day1: all.filter(i => i.current_milestone === 'day1').length,
      week1: all.filter(i => i.current_milestone === 'week1').length,
      day30: all.filter(i => i.current_milestone === 'day30').length,
      day60: all.filter(i => i.current_milestone === 'day60').length,
      day90: all.filter(i => i.current_milestone === 'day90').length,
      at_risk: all.filter(i => i.health === 'at_risk').length,
    };
  }, [items]);

  return (
    <div>
      <TSSectionBanner
        image={TS_IMG.contact}
        title="Onboarding"
        subtitle="Plan 30/60/90 para nuevos hires · integrado con People file"
        icon="🎉"
      />

      <div className="mb-4 flex items-end justify-end gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {peopleStats && (
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[11px]">
              <span className="text-gray-500">People file: </span>
              <strong className="text-gray-900">{peopleStats.total}</strong>
              <span className="text-gray-400 mx-1">·</span>
              <span className="text-black font-bold">{peopleStats.tps} TPs</span>
            </div>
          )}
          <button
            onClick={() => setImportOpen(true)}
            className="bg-black hover:bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
          >
            📥 Importar TPs (CSV)
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-2 mb-4">
        <KpiTile label="Total activos" value={counts.total} accent="#111" />
        <KpiTile label="Día 1" value={counts.day1} accent={MS_COLOR.day1} />
        <KpiTile label="Semana 1" value={counts.week1} accent={MS_COLOR.week1} />
        <KpiTile label="Día 30" value={counts.day30} accent={MS_COLOR.day30} />
        <KpiTile label="Día 60" value={counts.day60} accent={MS_COLOR.day60} />
        <KpiTile label="Día 90" value={counts.day90} accent={MS_COLOR.day90} />
        <KpiTile label="At risk" value={counts.at_risk} accent="#EF4444" />
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 mb-4">
        {(['active','completed','all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${
              filter === f ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
            }`}
          >
            {f === 'active' ? 'Activos' : f === 'completed' ? 'Completados' : 'Todos'}
          </button>
        ))}
      </div>

      {loading && <div className="text-sm text-gray-400">Cargando…</div>}

      {!loading && items.length === 0 && (
        <div className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div
            className="absolute inset-0 opacity-15 bg-cover bg-center"
            style={{ backgroundImage: `url(${TS_IMG.contact})` }}
          />
          <div className="relative p-12 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <div className="text-lg font-bold tracking-tight text-gray-900">Sin onboardings activos</div>
            <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
              Cuando un candidato pase a "contratado" en el funnel, aparecerá aquí automáticamente con su plan 30/60/90.
            </p>
          </div>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(it => (
            <OnboardingCard key={it.id} item={it} onClick={() => setActiveId(it.id)} />
          ))}
        </div>
      )}

      {activeId && (
        <OnboardingDetailDrawer
          id={activeId}
          onClose={() => setActiveId(null)}
          onChange={load}
        />
      )}
      {importOpen && (
        <PeopleImportModal
          onClose={() => setImportOpen(false)}
          onDone={() => { setImportOpen(false); load(); }}
        />
      )}
    </div>
  );
}

function KpiTile({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: accent }} />
      <div className="text-[9px] uppercase tracking-wider font-bold text-gray-500">{label}</div>
      <div className="text-2xl font-extrabold mt-0.5">{value}</div>
    </div>
  );
}

function OnboardingCard({ item, onClick }: { item: OnboardingItem; onClick: () => void }) {
  const healthColor = item.health === 'at_risk' ? '#EF4444' : item.health === 'behind' ? '#F59E0B' : '#10B981';
  const healthLabel = item.health === 'at_risk' ? 'At risk' : item.health === 'behind' ? 'Atrasado' : 'On track';
  const mColor = MS_COLOR[item.current_milestone];

  return (
    <button
      onClick={onClick}
      className="text-left bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-[4px]" style={{ background: healthColor }} />

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-gray-900 truncate">{item.person.name}</div>
          <div className="text-[10px] text-gray-500 truncate">{item.person.role} · {item.person.area || '—'}</div>
        </div>
        <span
          className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase"
          style={{ background: `${healthColor}1A`, color: healthColor }}
        >
          {healthLabel}
        </span>
      </div>

      {/* Days + milestone */}
      <div className="mb-3 p-2 rounded-lg" style={{ background: `${mColor}10` }}>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[10px] uppercase font-bold" style={{ color: mColor }}>Milestone actual</span>
          <span className="text-[10px] font-bold" style={{ color: mColor }}>{item.days_since_start}d desde inicio</span>
        </div>
        <div className="text-base font-extrabold" style={{ color: mColor }}>{MS_LABEL[item.current_milestone]}</div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="uppercase font-bold text-gray-500">Progreso total</span>
          <span className="font-bold text-gray-700">{item.progress.done}/{item.progress.total} · {item.progress.pct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${item.progress.pct}%`, background: healthColor }} />
        </div>
      </div>

      {/* Milestones strip */}
      <div className="flex gap-1 mb-3">
        {(['day1','week1','day30','day60','day90'] as const).map(m => {
          const ms = item.progress.byMilestone[m] || { total: 0, done: 0, pct: 0 };
          const isComplete = ms.pct === 100;
          return (
            <div key={m} className="flex-1">
              <div className={`h-1.5 rounded ${isComplete ? '' : 'bg-gray-100'}`} style={isComplete ? { background: MS_COLOR[m] } : {}} />
              <div className="text-[8px] text-center text-gray-500 font-bold mt-0.5">{ms.done}/{ms.total}</div>
            </div>
          );
        })}
      </div>

      {/* Next task */}
      {item.next_task && (
        <div className="bg-gray-50 border border-gray-100 rounded p-2 text-[10px]">
          <div className="text-[9px] uppercase font-bold text-gray-500 mb-0.5">Próximo</div>
          <div className="font-semibold text-gray-900 truncate">{item.next_task.label}</div>
          <div className="text-gray-500 mt-0.5">{OWNER_LABEL[item.next_task.owner] || item.next_task.owner} · {MS_LABEL[item.next_task.milestone]}</div>
        </div>
      )}
    </button>
  );
}

function OnboardingDetailDrawer({
  id,
  onClose,
  onChange,
}: {
  id: string;
  onClose: () => void;
  onChange: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/onboarding/${id}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(j => { setData(j.onboarding); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const toggleTask = async (taskId: string) => {
    setSaving(true);
    const r = await fetch(`/api/onboarding/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toggle_task_id: taskId }),
    });
    const j = await r.json();
    if (j.success) {
      setData(j.onboarding);
      onChange();
    }
    setSaving(false);
  };

  const updateField = async (field: string, value: any) => {
    setSaving(true);
    const r = await fetch(`/api/onboarding/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    const j = await r.json();
    if (j.success) {
      setData(j.onboarding);
      onChange();
    }
    setSaving(false);
  };

  if (loading || !data) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
        <div className="bg-white p-6 rounded-xl">Cargando…</div>
      </div>
    );
  }

  const tasks: OnboardingTaskUI[] = (data.tasks || []) as OnboardingTaskUI[];
  const tasksByMs: Record<string, OnboardingTaskUI[]> = {};
  (['day1','week1','day30','day60','day90'] as const).forEach(m => {
    tasksByMs[m] = tasks.filter(t => t.milestone === m);
  });

  const totalDone = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const pct = total ? Math.round((totalDone / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <div
        className="bg-gray-50 w-full max-w-2xl h-full overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-black text-white px-5 py-4 z-10 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider opacity-80 font-bold">Onboarding</div>
            <div className="text-lg font-extrabold leading-tight">{data.person?.name}</div>
            <div className="text-[11px] opacity-70">{data.person?.role} · {data.person?.area || '—'}</div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl px-2">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Progress overview */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-xs uppercase font-bold text-gray-500">Progreso</span>
              <span className="text-2xl font-extrabold">{pct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-gray-700 to-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-[11px] text-gray-500 mt-1">{totalDone}/{total} tareas completadas · started {data.start_date}</div>
          </div>

          {/* Person info */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-2 gap-3 text-xs">
            <Info k="Email" v={data.person?.email} />
            <Info k="Nivel" v={data.person?.role_level === 'c_suite' ? 'C-Suite' : data.person?.role_level} />
            <Info k="Manager" v={data.person?.manager_email || '—'} />
            <Info k="Buddy" v={data.person?.buddy_email || '—'} />
            <Info k="Ubicación" v={data.person?.location || '—'} />
            <Info k="Status" v={data.status} />
          </div>

          {/* Tasks by milestone */}
          {(['day1','week1','day30','day60','day90'] as const).map(m => {
            const list = tasksByMs[m] || [];
            if (list.length === 0) return null;
            const done = list.filter(t => t.done).length;
            const msColor = MS_COLOR[m];
            return (
              <div key={m} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 flex justify-between items-center" style={{ background: `${msColor}15` }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: msColor }} />
                    <span className="text-sm font-extrabold" style={{ color: msColor }}>{MS_LABEL[m]}</span>
                  </div>
                  <span className="text-[11px] font-bold" style={{ color: msColor }}>{done}/{list.length}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {list.map(t => (
                    <div key={t.id} className="px-4 py-2.5 flex items-start gap-3 hover:bg-gray-50">
                      <button
                        onClick={() => !saving && toggleTask(t.id)}
                        disabled={saving}
                        className={`w-5 h-5 mt-0.5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                          t.done ? 'bg-emerald-500 border-emerald-600' : 'border-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {t.done && <span className="text-white text-xs font-bold">✓</span>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm ${t.done ? 'line-through text-gray-400' : 'text-gray-900 font-medium'}`}>{t.label}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded font-bold">{OWNER_LABEL[t.owner] || t.owner}</span>
                          {t.done && t.done_at && <span>· {new Date(t.done_at).toLocaleDateString('es-CO')}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Manager check-ins */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <h4 className="text-xs uppercase font-extrabold text-gray-700">Check-ins de manager</h4>
            <CheckInRow label="30 días" value={data.manager_30d_check_in} onSave={v => updateField('manager_30d_check_in', v)} />
            <CheckInRow label="60 días" value={data.manager_60d_check_in} onSave={v => updateField('manager_60d_check_in', v)} />
            <CheckInRow label="90 días · review final" value={data.manager_90d_review} onSave={v => updateField('manager_90d_review', v)} />
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase font-bold text-gray-500">Ramp-up score (1-5):</span>
              <select
                value={data.ramp_up_score || ''}
                onChange={e => updateField('ramp_up_score', e.target.value ? Number(e.target.value) : null)}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="">—</option>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ k, v }: { k: string; v?: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider font-bold text-gray-500">{k}</div>
      <div className="text-sm font-semibold text-gray-900">{v || '—'}</div>
    </div>
  );
}

function CheckInRow({ label, value, onSave }: { label: string; value: string | null; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');
  return (
    <div>
      <div className="text-[11px] uppercase font-bold text-gray-500 mb-1">{label}</div>
      {editing ? (
        <div>
          <textarea
            value={val}
            onChange={e => setVal(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-black"
            autoFocus
          />
          <div className="flex gap-1.5 mt-1">
            <button onClick={() => { onSave(val); setEditing(false); }} className="text-[11px] font-bold bg-black text-white px-3 py-1 rounded">Guardar</button>
            <button onClick={() => { setVal(value || ''); setEditing(false); }} className="text-[11px] text-gray-500 px-2">Cancelar</button>
          </div>
        </div>
      ) : (
        <div onClick={() => setEditing(true)} className="text-xs text-gray-700 hover:bg-gray-50 px-2 py-1.5 rounded cursor-text border border-transparent hover:border-gray-200 min-h-[32px]">
          {value || <span className="text-gray-400 italic">Click para escribir…</span>}
        </div>
      )}
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
