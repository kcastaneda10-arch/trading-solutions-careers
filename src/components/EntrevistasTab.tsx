"use client";

/**
 * Tab "Entrevistas" en HR Admin · vista del día y siguientes para Kelly.
 *
 * Muestra:
 *   - Agendadas hoy (Calendly scheduled today)
 *   - Pendientes de evaluar (recruiter_interview sin assessment)
 *   - Calendly enviado, sin agendar
 *   - CWO pending
 *   - Próximas esta semana
 *
 * Por cada candidato: botón "Abrir prep" que abre /hr-admin/prep/[id] en pestaña nueva.
 */
import { useEffect, useState } from "react";
import { Calendar, Clock, FileText, AlertCircle, ChevronRight, RefreshCw } from "lucide-react";

type Cand = {
  candidate_id: string;
  name: string;
  email: string;
  phone: string | null;
  vacancy_title: string;
  stage: string;
  days_in_stage: number | null;
  calendly_sent_at: string | null;
  calendly_scheduled_at: string | null;
  has_assessment: boolean;
  assessment_verdict: string | null;
};

type Data = {
  generated_at: string;
  counts: {
    scheduled_today: number;
    scheduled_this_week: number;
    pending_eval: number;
    calendly_pending: number;
    cwo_pending: number;
  };
  scheduled_today: Cand[];
  scheduled_this_week: Cand[];
  pending_eval: Cand[];
  calendly_pending: Cand[];
  cwo_pending: Cand[];
};

export default function EntrevistasTab() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/upcoming-interviews", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) setError(j.error || "Error");
      else { setData(j); setError(null); }
    } catch (e: any) {
      setError(e?.message || "Error de red");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center text-sm text-gray-500 border border-gray-200">
        Cargando entrevistas…
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm text-red-800">
        Error: {error}
        <button onClick={load} className="ml-3 font-bold underline">Reintentar</button>
      </div>
    );
  }

  if (!data) return null;

  const total = data.counts.scheduled_today + data.counts.scheduled_this_week +
                data.counts.pending_eval + data.counts.calendly_pending + data.counts.cwo_pending;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[2.5px] font-bold text-gray-500 mb-1">Entrevistas</div>
          <h1 className="text-2xl font-extrabold tracking-tight">Tu agenda de entrevistas</h1>
          <p className="text-sm text-gray-600 mt-1">
            {total === 0 ? "Sin entrevistas pendientes · día tranquilo." : `${total} candidatos en tu radar de entrevistas.`}
          </p>
        </div>
        <button
          onClick={load}
          className="text-xs font-semibold text-gray-600 hover:text-black flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-full hover:bg-gray-50"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refrescar
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-3">
        <StatCard label="Agendadas hoy" value={data.counts.scheduled_today} color="black" icon={Calendar} />
        <StatCard label="Pendientes eval" value={data.counts.pending_eval} color="amber" icon={AlertCircle} />
        <StatCard label="Calendly sin agendar" value={data.counts.calendly_pending} color="gray" icon={Clock} />
        <StatCard label="CWO pending" value={data.counts.cwo_pending} color="blue" icon={FileText} />
        <StatCard label="Esta semana" value={data.counts.scheduled_this_week} color="emerald" icon={Calendar} />
      </div>

      {/* Sections */}
      <Section
        title="📅 Agendadas hoy · prepárate"
        candidates={data.scheduled_today}
        emptyText="Sin entrevistas confirmadas para hoy."
      />

      <Section
        title="⚡ Pendientes de evaluar · post-entrevista"
        candidates={data.pending_eval}
        emptyText="Sin entrevistas pendientes de evaluar · todo al día."
        subtitle="Estos candidatos pasaron entrevista pero todavía no tienes la evaluación de los 16 mandatos cargada."
      />

      <Section
        title="📨 Calendly enviado · esperando que agenden"
        candidates={data.calendly_pending}
        emptyText="Sin invitaciones Calendly pendientes."
        subtitle="Ya les enviaste el link de Calendly · están eligiendo horario."
      />

      <Section
        title="👔 En CWO Interview · siguiente etapa"
        candidates={data.cwo_pending}
        emptyText="Nadie en CWO Interview."
      />

      <Section
        title="🗓️ Próximas esta semana"
        candidates={data.scheduled_this_week}
        emptyText="Sin entrevistas agendadas para esta semana."
      />

      {/* Helper note */}
      <div className="text-[11px] text-gray-500 italic mt-6">
        💡 Generado {new Date(data.generated_at).toLocaleString("es-CO")} · click "Abrir prep" para descargar el documento completo del candidato (16 mandatos + preguntas tailored + English test).
      </div>
    </div>
  );
}

function Section({ title, candidates, emptyText, subtitle }: { title: string; candidates: Cand[]; emptyText: string; subtitle?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-extrabold tracking-tight">{title}</h2>
        <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {candidates.length}
        </span>
      </div>
      {subtitle && <p className="text-[11px] text-gray-500 mb-3 italic">{subtitle}</p>}

      {candidates.length === 0 ? (
        <div className="text-xs text-gray-400 italic py-4">{emptyText}</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {candidates.map(c => <CandidateRow key={c.candidate_id} c={c} />)}
        </div>
      )}
    </div>
  );
}

function CandidateRow({ c }: { c: Cand }) {
  const scheduledTime = c.calendly_scheduled_at ? new Date(c.calendly_scheduled_at) : null;
  const stageLabel: Record<string, string> = {
    recruiter_interview: "Recruiter Interview",
    cwo_interview: "CWO Interview",
  };

  return (
    <div className="flex items-center justify-between gap-3 py-3 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold truncate">{c.name}</span>
          <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
            {c.vacancy_title}
          </span>
          {c.has_assessment && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              c.assessment_verdict === "strong_yes" ? "bg-emerald-100 text-emerald-800" :
              c.assessment_verdict === "no" ? "bg-red-100 text-red-800" :
              "bg-amber-100 text-amber-800"
            }`}>
              ✓ Evaluado · {c.assessment_verdict || "—"}
            </span>
          )}
        </div>
        <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-3">
          {scheduledTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {scheduledTime.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
            </span>
          )}
          <span>{stageLabel[c.stage] || c.stage}</span>
          {c.days_in_stage != null && c.days_in_stage > 0 && (
            <span className={c.days_in_stage > 5 ? "text-amber-700 font-semibold" : ""}>
              {c.days_in_stage}d en stage
            </span>
          )}
          <span className="truncate">{c.email}</span>
        </div>
      </div>

      <a
        href={`/hr-admin/prep/${c.candidate_id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] font-bold px-3 py-1.5 bg-black text-white rounded-full hover:bg-gray-800 inline-flex items-center gap-1 whitespace-nowrap"
      >
        Abrir prep <ChevronRight className="w-3 h-3" />
      </a>
    </div>
  );
}

function StatCard({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: any }) {
  const styles: Record<string, { bg: string; fg: string; border: string }> = {
    black: { bg: "bg-gray-900", fg: "text-white", border: "border-gray-900" },
    amber: { bg: "bg-amber-50", fg: "text-amber-900", border: "border-amber-200" },
    gray: { bg: "bg-gray-50", fg: "text-gray-700", border: "border-gray-200" },
    blue: { bg: "bg-blue-50", fg: "text-blue-900", border: "border-blue-200" },
    emerald: { bg: "bg-emerald-50", fg: "text-emerald-900", border: "border-emerald-200" },
  };
  const s = styles[color] || styles.gray;
  return (
    <div className={`${s.bg} border ${s.border} rounded-xl px-4 py-3`}>
      <div className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider ${s.fg} opacity-70`}>
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className={`text-2xl font-extrabold ${s.fg} mt-1 tabular-nums`}>{value}</div>
    </div>
  );
}
