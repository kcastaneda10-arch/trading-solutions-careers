"use client";

/**
 * RecruiterAssessmentCard · muestra la evaluación contra los 16 mandatos del CEO
 * en el panel del candidato cuando está en stage recruiter_interview o posterior.
 *
 * Si no hay evaluación, muestra botón "Iniciar evaluación con IA" que abre un modal:
 *   1. Pegar transcript
 *   2. Click "Parsear con IA" → llama /api/admin/parse-recruiter-transcript
 *   3. Revisar/editar scores y razones
 *   4. Click "Guardar" → POST /api/admin/recruiter-assessments
 *
 * Si ya hay, muestra grid 4×4 de mandatos color-coded + verdict + botones.
 */
import { useEffect, useState } from "react";
import {
  CEO_MANDATES,
  MandateScore,
  MANDATE_SCORE_LABELS,
  MANDATE_SCORE_SYMBOLS,
  MANDATE_SCORE_COLORS,
  summarizeScores,
} from "@/lib/ceo-mandates";

type Assessment = {
  id?: string;
  candidate_id: string;
  interview_date?: string;
  interviewer_email?: string;
  duration_minutes?: number | null;
  mandate_scores: Record<string, MandateScore>;
  mandate_evidence: Record<string, string>;
  mandate_quotes: Record<string, string>;
  english_declared?: string | null;
  english_real?: string | null;
  english_evidence?: string | null;
  english_verdict?: string | null;
  verdict?: "strong_yes" | "maybe" | "no" | null;
  verdict_summary?: string | null;
  pass_reasons?: string[];
  fail_reasons?: string[];
  next_filter_probes?: string[];
  parsed_by_ai?: boolean;
  human_reviewed?: boolean;
  ai_model_version?: string | null;
  transcript_text?: string | null;
};

const VERDICT_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  strong_yes: { bg: "#DEF7EC", fg: "#1A7D3E", label: "STRONG YES · Avanzar a CWO" },
  maybe: { bg: "#FEF3C7", fg: "#B45309", label: "MAYBE · Necesita más data" },
  no: { bg: "#FEE2E2", fg: "#C53030", label: "NO · Descartar con feedback" },
};

export default function RecruiterAssessmentCard({ candidateId, candidateName }: { candidateId: string; candidateName: string }) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/recruiter-assessments?candidate_id=${candidateId}`, { cache: "no-store" });
      const j = await r.json();
      setAssessment(j.assessment || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [candidateId]);

  if (loading) {
    return (
      <div className="px-6 py-4 bg-white border-t border-gray-200">
        <div className="text-xs text-gray-500">Cargando evaluación de recruiter…</div>
      </div>
    );
  }

  return (
    <div className="px-6 py-5 bg-white border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] uppercase tracking-[2px] font-bold text-gray-500">
          Recruiter Assessment · 16 Mandatos del CEO
        </div>
        {assessment && (
          <div className="flex items-center gap-3">
            <a
              href={`/hr-admin/prep/${candidateId}?mode=cwo`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline inline-flex items-center gap-1"
            >
              👔 CWO Handoff →
            </a>
            <button
              onClick={() => setShowModal(true)}
              className="text-[11px] font-semibold text-gray-600 hover:text-black underline"
            >
              Editar
            </button>
          </div>
        )}
      </div>

      {!assessment ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="text-sm text-gray-500 mb-3">Sin evaluación registrada para esta entrevista</div>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-bold px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800"
          >
            Iniciar evaluación con IA
          </button>
          <div className="text-[10px] text-gray-400 mt-2">
            Pegas el transcript · IA parsea contra 16 mandatos · revisas y guardas
          </div>
        </div>
      ) : (
        <AssessmentDisplay assessment={assessment} />
      )}

      {showModal && (
        <AssessmentModal
          candidateId={candidateId}
          candidateName={candidateName}
          existing={assessment}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}

function AssessmentDisplay({ assessment }: { assessment: Assessment }) {
  const summary = summarizeScores(assessment.mandate_scores || {});
  const verdictStyle = assessment.verdict ? VERDICT_STYLES[assessment.verdict] : null;

  return (
    <div className="space-y-4">
      {/* Verdict box */}
      {verdictStyle && (
        <div
          className="rounded-lg p-4 text-center border"
          style={{ background: verdictStyle.bg, borderColor: verdictStyle.fg + "40" }}
        >
          <div className="text-lg font-extrabold" style={{ color: verdictStyle.fg }}>
            {verdictStyle.label}
          </div>
          {assessment.verdict_summary && (
            <div className="text-xs mt-1 italic" style={{ color: verdictStyle.fg + "CC" }}>
              {assessment.verdict_summary}
            </div>
          )}
        </div>
      )}

      {/* Score summary stats */}
      <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
        <SummaryStat n={summary.pass} label="Cumple" color="#1A7D3E" bg="#DEF7EC" />
        <SummaryStat n={summary.partial} label="Parcial" color="#B45309" bg="#FEF3C7" />
        <SummaryStat n={summary.fail} label="No cumple" color="#C53030" bg="#FEE2E2" />
        <SummaryStat n={summary.data} label="Solo data" color="#6B7280" bg="#F3F4F6" />
        <SummaryStat n={summary.not_probed} label="No probado" color="#9CA3AF" bg="#F9FAFB" />
      </div>

      {/* 16 mandates grid · 4 columns */}
      <div className="grid grid-cols-4 gap-1.5">
        {CEO_MANDATES.map(m => {
          const score = (assessment.mandate_scores?.[String(m.num)] || "not_probed") as MandateScore;
          const colors = MANDATE_SCORE_COLORS[score];
          const evidence = assessment.mandate_evidence?.[String(m.num)] || "";
          const quote = assessment.mandate_quotes?.[String(m.num)] || "";
          const tooltip = evidence + (quote ? `\n\n"${quote}"` : "");
          return (
            <div
              key={m.num}
              className="rounded-md border px-2 py-2 cursor-help"
              style={{ background: colors.bg, borderColor: colors.ring }}
              title={tooltip || `${m.label}: ${MANDATE_SCORE_LABELS[score]}`}
            >
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold opacity-50">{m.num}</span>
                <span className="text-[14px]">{MANDATE_SCORE_SYMBOLS[score]}</span>
              </div>
              <div className="text-[10px] font-semibold leading-tight mt-0.5 line-clamp-2" style={{ color: colors.fg }}>
                {m.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* English mini-summary */}
      {assessment.english_real && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
          <div className="text-[10px] uppercase tracking-wide font-bold text-gray-500 mb-1">English assessment</div>
          <div className="text-xs">
            <span className="font-semibold">Declarado:</span> {assessment.english_declared || "—"} ·{" "}
            <span className="font-semibold">Real:</span> {assessment.english_real} ·{" "}
            <span className={`font-semibold ${assessment.english_verdict === "fail" ? "text-red-600" : assessment.english_verdict === "gap" ? "text-amber-600" : "text-emerald-600"}`}>
              {assessment.english_verdict === "fail" ? "Hard fail" : assessment.english_verdict === "gap" ? "Gap" : "OK"}
            </span>
          </div>
          {assessment.english_evidence && <div className="text-[11px] text-gray-600 mt-1 italic">{assessment.english_evidence}</div>}
        </div>
      )}

      {/* Pass / fail reasons */}
      {(assessment.pass_reasons?.length || 0) > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wide font-bold text-emerald-700 mb-1">✅ Pasa por</div>
          <ul className="text-xs text-gray-800 space-y-1 pl-4">
            {assessment.pass_reasons!.map((r, i) => <li key={i} className="list-disc">{r}</li>)}
          </ul>
        </div>
      )}
      {(assessment.fail_reasons?.length || 0) > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wide font-bold text-red-700 mb-1">❌ Bloqueadores</div>
          <ul className="text-xs text-gray-800 space-y-1 pl-4">
            {assessment.fail_reasons!.map((r, i) => <li key={i} className="list-disc">{r}</li>)}
          </ul>
        </div>
      )}
      {(assessment.next_filter_probes?.length || 0) > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wide font-bold text-blue-700 mb-1">→ Probar en CWO</div>
          <ul className="text-xs text-gray-800 space-y-1 pl-4">
            {assessment.next_filter_probes!.map((r, i) => <li key={i} className="list-disc">{r}</li>)}
          </ul>
        </div>
      )}

      <div className="text-[10px] text-gray-400 mt-2">
        {assessment.parsed_by_ai ? "Parseado con IA · " : ""}
        {assessment.human_reviewed ? "Revisado humano · " : ""}
        {assessment.interview_date ? new Date(assessment.interview_date).toLocaleDateString("es-CO") : ""}
      </div>
    </div>
  );
}

function SummaryStat({ n, label, color, bg }: { n: number; label: string; color: string; bg: string }) {
  return (
    <div className="rounded p-1.5" style={{ background: bg }}>
      <div className="text-base font-extrabold tabular-nums" style={{ color }}>{n}</div>
      <div className="text-[9px] font-semibold" style={{ color }}>{label}</div>
    </div>
  );
}

/* ─────────── Modal de creación / edición ─────────── */

function AssessmentModal({
  candidateId, candidateName, existing, onClose, onSaved,
}: {
  candidateId: string; candidateName: string;
  existing: Assessment | null;
  onClose: () => void; onSaved: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(existing ? 2 : 1);
  const [transcript, setTranscript] = useState(existing?.transcript_text || "");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Assessment>(
    existing || {
      candidate_id: candidateId,
      mandate_scores: {},
      mandate_evidence: {},
      mandate_quotes: {},
    }
  );

  async function parseWithAI() {
    if (transcript.trim().length < 100) {
      setError("Pega un transcript de al menos 100 caracteres");
      return;
    }
    setError(null);
    setParsing(true);
    try {
      const r = await fetch("/api/admin/parse-recruiter-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, candidate_id: candidateId }),
      });
      // Si la respuesta no es JSON válido (HTML de timeout, error de Vercel) parseamos el texto
      const rawText = await r.text();
      let j: any;
      try {
        j = JSON.parse(rawText);
      } catch {
        if (r.status === 504 || rawText.includes("timeout") || rawText.includes("FUNCTION_INVOCATION_TIMEOUT")) {
          setError("⏱️ El transcript es muy largo · timeout en Vercel. Intenta con un transcript más corto o llama de nuevo.");
        } else {
          setError(`Error inesperado del servidor (${r.status}) · respuesta no es JSON. Mira la consola del browser.`);
          console.error("Server returned non-JSON:", rawText.slice(0, 500));
        }
        return;
      }
      if (!r.ok) {
        setError(j.error || `Error ${r.status}`);
        return;
      }
      setDraft({
        ...draft,
        candidate_id: candidateId,
        mandate_scores: j.mandate_scores || {},
        mandate_evidence: j.mandate_evidence || {},
        mandate_quotes: j.mandate_quotes || {},
        english_declared: j.english_declared,
        english_real: j.english_real,
        english_evidence: j.english_evidence,
        english_verdict: j.english_verdict,
        verdict: j.verdict,
        verdict_summary: j.verdict_summary,
        pass_reasons: j.pass_reasons || [],
        fail_reasons: j.fail_reasons || [],
        next_filter_probes: j.next_filter_probes || [],
        duration_minutes: j.duration_minutes,
        parsed_by_ai: true,
        ai_model_version: j.ai_model_version,
        transcript_text: transcript,
      });
      setStep(2);
    } catch (e: any) {
      setError(e?.message || "Error de red");
    } finally {
      setParsing(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/recruiter-assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, human_reviewed: true }),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error || "Error guardando");
        return;
      }
      onSaved();
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setSaving(false);
    }
  }

  function setMandateScore(num: number, score: MandateScore) {
    setDraft({
      ...draft,
      mandate_scores: { ...draft.mandate_scores, [String(num)]: score },
    });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="bg-white w-[760px] max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <div className="text-[10px] uppercase tracking-wide font-bold text-gray-500">Recruiter Assessment</div>
            <h2 className="text-xl font-bold mt-0.5">{candidateName}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">×</button>
        </div>

        {/* Step indicator */}
        <div className="px-6 py-2 border-b border-gray-100 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
          <span className={step >= 1 ? "text-black" : ""}>1 · Pegar transcript</span>
          <span>›</span>
          <span className={step >= 2 ? "text-black" : ""}>2 · Revisar y guardar</span>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {step === 1 && (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Pega el transcript de la entrevista. La IA va a evaluar cada uno de los 16 mandatos
                contra evidencia textual del transcript · tú revisas y ajustas antes de guardar.
              </p>
              <textarea
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                rows={14}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-black"
                placeholder="[00:00] Kelly: Hola Mayra, gracias por aceptar este espacio..."
              />
              <div className="mt-2 text-[11px] text-gray-500">{transcript.length.toLocaleString()} caracteres · mínimo 100</div>
              {error && <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={onClose} className="text-xs font-semibold text-gray-600 hover:text-black px-3 py-2">Cancelar</button>
                <button
                  onClick={parseWithAI}
                  disabled={parsing || transcript.length < 100}
                  className="text-xs font-bold px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {parsing ? "Parseando con IA…" : "Parsear con IA →"}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              {/* Verdict editor */}
              <div>
                <label className="text-[10px] uppercase tracking-wide font-bold text-gray-500 mb-1 block">Verdict</label>
                <div className="flex gap-2">
                  {(["strong_yes", "maybe", "no"] as const).map(v => {
                    const s = VERDICT_STYLES[v];
                    const sel = draft.verdict === v;
                    return (
                      <button
                        key={v}
                        onClick={() => setDraft({ ...draft, verdict: v })}
                        className="flex-1 text-xs font-bold rounded-lg px-3 py-2 border-2 transition-all"
                        style={{
                          borderColor: sel ? s.fg : "#E5E7EB",
                          background: sel ? s.bg : "white",
                          color: sel ? s.fg : "#9CA3AF",
                        }}
                      >
                        {s.label.split(" · ")[0]}
                      </button>
                    );
                  })}
                </div>
                <input
                  value={draft.verdict_summary || ""}
                  onChange={e => setDraft({ ...draft, verdict_summary: e.target.value })}
                  placeholder="Frase corta de cierre · ej: 'Cultural fit fuerte · inglés bloqueador'"
                  className="mt-2 w-full border border-gray-300 rounded px-3 py-1.5 text-xs"
                />
              </div>

              {/* Mandates · grid editable */}
              <div>
                <label className="text-[10px] uppercase tracking-wide font-bold text-gray-500 mb-2 block">16 Mandatos · ajustar score si IA falló</label>
                <div className="grid grid-cols-2 gap-2">
                  {CEO_MANDATES.map(m => {
                    const score = (draft.mandate_scores[String(m.num)] || "not_probed") as MandateScore;
                    const colors = MANDATE_SCORE_COLORS[score];
                    return (
                      <div key={m.num} className="border rounded-md p-2" style={{ borderColor: colors.ring, background: colors.bg }}>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="text-[11px] font-bold" style={{ color: colors.fg }}>
                            <span className="opacity-50">{m.num}.</span> {m.label}
                          </div>
                          <select
                            value={score}
                            onChange={e => setMandateScore(m.num, e.target.value as MandateScore)}
                            className="text-[10px] font-semibold rounded border border-gray-300 px-1 py-0.5 bg-white"
                          >
                            <option value="pass">✅ Cumple</option>
                            <option value="partial">◐ Parcial</option>
                            <option value="fail">❌ No cumple</option>
                            <option value="data">ℹ Solo data</option>
                            <option value="not_probed">? No probado</option>
                          </select>
                        </div>
                        <div className="text-[10px] text-gray-700 leading-tight">
                          {draft.mandate_evidence[String(m.num)] || <span className="italic text-gray-400">Sin evidencia</span>}
                        </div>
                        {draft.mandate_quotes[String(m.num)] && (
                          <div className="text-[9px] italic text-gray-500 mt-1 border-l-2 border-gray-300 pl-1.5">
                            "{draft.mandate_quotes[String(m.num)]}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Razones · pass / fail / probes (text areas) */}
              <ReasonList
                label="✅ Pasa por"
                color="#1A7D3E"
                items={draft.pass_reasons || []}
                onChange={items => setDraft({ ...draft, pass_reasons: items })}
              />
              <ReasonList
                label="❌ Bloqueadores"
                color="#C53030"
                items={draft.fail_reasons || []}
                onChange={items => setDraft({ ...draft, fail_reasons: items })}
              />
              <ReasonList
                label="→ Probar en CWO"
                color="#1D4ED8"
                items={draft.next_filter_probes || []}
                onChange={items => setDraft({ ...draft, next_filter_probes: items })}
              />

              {error && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button onClick={onClose} className="text-xs font-semibold text-gray-600 hover:text-black px-3 py-2">Cancelar</button>
                {!existing && (
                  <button onClick={() => setStep(1)} className="text-xs font-semibold text-gray-600 hover:text-black px-3 py-2">← Cambiar transcript</button>
                )}
                <button
                  onClick={save}
                  disabled={saving || !draft.verdict}
                  className="text-xs font-bold px-5 py-2 bg-black text-white rounded-full hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {saving ? "Guardando…" : "Guardar evaluación"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReasonList({ label, color, items, onChange }: { label: string; color: string; items: string[]; onChange: (items: string[]) => void }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wide font-bold mb-1 block" style={{ color }}>{label}</label>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={item}
              onChange={e => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
            />
            <button
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="text-gray-400 hover:text-red-600 text-sm"
              type="button"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange([...items, ""])}
          className="text-[11px] font-semibold text-gray-500 hover:text-black"
          type="button"
        >
          + Agregar
        </button>
      </div>
    </div>
  );
}
