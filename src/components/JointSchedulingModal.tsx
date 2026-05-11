"use client";

/**
 * Modal para crear una sesión de agendamiento conjunta.
 *
 * Kelly elige · interviewers (emails) · duración · ventana de días · descripción.
 * Crea la sesión + opcionalmente crea draft de Gmail con el link.
 */
import { useState } from "react";
import { X, Calendar } from "lucide-react";

type Props = {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  vacancyTitle: string;
  onClose: () => void;
  onCreated?: (link: string) => void;
};

const COMMON_INTERVIEWERS = [
  { email: "cwo@tradingsolutions.com", name: "Yohanna Franco" },
  { email: "coo@tradingsolutions.com", name: "COO" },
  { email: "kcastaneda@tradingsolutions.com", name: "Kelly Castañeda" },
];

export default function JointSchedulingModal({ candidateId, candidateName, candidateEmail, vacancyTitle, onClose, onCreated }: Props) {
  const [interviewersText, setInterviewersText] = useState("cwo@tradingsolutions.com : Yohanna Franco");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [windowDays, setWindowDays] = useState(7);
  const [bhStart, setBhStart] = useState(8);
  const [bhEnd, setBhEnd] = useState(18);
  const [description, setDescription] = useState("");
  const [createGmailDraft, setCreateGmailDraft] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ link: string; expires_at: string; draft_id?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function parseInterviewers(): { emails: string[]; names: string[] } {
    // Formato esperado por línea: "email : Nombre" o solo "email"
    const lines = interviewersText.split(/[\n,]+/).map(l => l.trim()).filter(Boolean);
    const emails: string[] = [];
    const names: string[] = [];
    for (const line of lines) {
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0) {
        emails.push(line.slice(0, colonIdx).trim());
        names.push(line.slice(colonIdx + 1).trim());
      } else {
        emails.push(line);
        names.push("");
      }
    }
    return { emails, names };
  }

  async function create() {
    const { emails, names } = parseInterviewers();
    if (emails.length === 0) {
      setError("Agrega al menos un entrevistador");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/joint-schedulings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: candidateId,
          interviewer_emails: emails,
          interviewer_names: names,
          duration_minutes: durationMinutes,
          window_days: windowDays,
          business_hours_start: bhStart,
          business_hours_end: bhEnd,
          description: description || null,
        }),
      });
      const j = await r.json();
      if (!j.success) {
        setError(j.error || "Error creando sesión");
        return;
      }

      let draftId: string | undefined;
      if (createGmailDraft) {
        // Crear draft de Gmail con el link
        const draftRes = await fetch(`/api/admin/candidates/${candidateId}/send-joint-scheduling`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            joint_link: j.link,
            interviewer_names: names.filter(Boolean),
            duration_minutes: durationMinutes,
          }),
        }).catch(() => null);
        if (draftRes?.ok) {
          const dj = await draftRes.json();
          draftId = dj.draft_id;
        }
      }

      setResult({ link: j.link, expires_at: j.expires_at, draft_id: draftId });
      onCreated?.(j.link);
    } catch (e: any) {
      setError(e?.message || "Error de red");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="bg-white w-[640px] max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <div className="text-[10px] uppercase tracking-wide font-bold text-gray-500 flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />Agendamiento conjunto
            </div>
            <h2 className="text-xl font-bold mt-0.5">{candidateName}</h2>
            <div className="text-[11px] text-gray-500 mt-0.5">{vacancyTitle}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {result ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="text-sm font-bold text-emerald-800 mb-2">✅ Sesión creada</div>
              <p className="text-xs text-gray-700 mb-3">Link para el candidato (válido 7 días):</p>
              <div className="bg-white border border-gray-200 rounded px-3 py-2 text-xs font-mono break-all mb-3">{result.link}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(result.link); }}
                  className="text-xs font-bold px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800"
                >
                  Copiar link
                </button>
                {result.draft_id && (
                  <a
                    href="https://mail.google.com/mail/u/0/#drafts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50"
                  >
                    Abrir Gmail Drafts →
                  </a>
                )}
              </div>
              {result.draft_id && (
                <p className="text-[11px] text-gray-600 mt-3 italic">
                  Draft de Gmail listo para revisar y enviar a {candidateEmail}
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Entrevistadores */}
              <div>
                <label className="text-[10px] uppercase tracking-wide font-bold text-gray-500">Entrevistadores</label>
                <textarea
                  value={interviewersText}
                  onChange={e => setInterviewersText(e.target.value)}
                  rows={3}
                  placeholder="cwo@tradingsolutions.com : Yohanna Franco
sales-lead@tradingsolutions.com : Jhonny Farah"
                  className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-black"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Formato: <code>email : Nombre</code> (uno por línea). Sus calendarios deben estar compartidos con kcastaneda@tradingsolutions.com (mínimo "free/busy access").
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {COMMON_INTERVIEWERS.map(i => (
                    <button
                      key={i.email}
                      onClick={() => {
                        const line = `${i.email} : ${i.name}`;
                        if (!interviewersText.includes(i.email)) {
                          setInterviewersText(interviewersText ? interviewersText + "\n" + line : line);
                        }
                      }}
                      type="button"
                      className="text-[10px] font-semibold px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      + {i.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wide font-bold text-gray-500">Duración</label>
                  <select value={durationMinutes} onChange={e => setDurationMinutes(parseInt(e.target.value))} className="mt-1 w-full border border-gray-300 rounded px-2 py-1.5 text-xs">
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wide font-bold text-gray-500">Ventana</label>
                  <select value={windowDays} onChange={e => setWindowDays(parseInt(e.target.value))} className="mt-1 w-full border border-gray-300 rounded px-2 py-1.5 text-xs">
                    <option value={3}>Próximos 3 días</option>
                    <option value={7}>Próximos 7 días</option>
                    <option value={14}>Próximos 14 días</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wide font-bold text-gray-500">Horario</label>
                  <div className="flex items-center gap-1 mt-1">
                    <input type="number" min={0} max={23} value={bhStart} onChange={e => setBhStart(parseInt(e.target.value))} className="w-12 border border-gray-300 rounded px-1 py-1.5 text-xs text-center" />
                    <span className="text-xs text-gray-500">-</span>
                    <input type="number" min={0} max={23} value={bhEnd} onChange={e => setBhEnd(parseInt(e.target.value))} className="w-12 border border-gray-300 rounded px-1 py-1.5 text-xs text-center" />
                    <span className="text-[10px] text-gray-500 ml-1">hrs COT</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wide font-bold text-gray-500">Nota interna · opcional · va en el evento</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-black"
                  placeholder="Ej: Entrevista con CWO + Hiring Manager · revisar perfil técnico y fit cultural"
                />
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={createGmailDraft} onChange={e => setCreateGmailDraft(e.target.checked)} className="mt-0.5" />
                <div>
                  <div className="text-xs font-semibold">Crear draft de Gmail al candidato con el link</div>
                  <div className="text-[10px] text-gray-500">Te queda en Drafts para que revises y envíes</div>
                </div>
              </label>

              {error && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>}

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button onClick={onClose} className="text-xs font-semibold text-gray-600 hover:text-black px-4 py-2">Cancelar</button>
                <button onClick={create} disabled={busy} className="text-xs font-bold px-5 py-2 bg-black text-white rounded-full hover:bg-gray-800 disabled:bg-gray-300">
                  {busy ? "Creando…" : "Crear y enviar"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
