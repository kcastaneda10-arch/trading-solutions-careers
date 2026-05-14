"use client";

import { useEffect, useState, useMemo } from "react";

type Cand = {
  id: string;
  name: string;
  email: string;
  status: string;
  vacancy_id: string;
  prefilter_invited_at: string | null;
  prefilter_completed_at: string | null;
  prefilter_decision: string | null;
  prefilter_data: Record<string, unknown> | null;
  rejection_draft_id: string | null;
  ht_vacancies?: { title: string };
};

type Vacancy = { id: string; title: string };

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "no-invitado", label: "Sin contactar" },
  { id: "ya-contactado", label: "Ya en proceso (Integridad)" },
  { id: "invitado-pendiente", label: "Prefiltro enviado · esperando" },
  { id: "pass", label: "✅ Pass" },
  { id: "review", label: "⚠️ Review" },
  { id: "reject", label: "❌ Reject" },
] as const;

type FilterId = typeof FILTERS[number]["id"];

const TS_CLIENT_ID = "98b62872-5767-4815-9b49-1394b9527c1f";

// Email interno (no son candidatos reales)
function isInternal(email: string): boolean {
  return /@tradingsolutions\.com$/i.test(email || "");
}

// Candidato que NO ha tenido contacto: status pending + no prefiltro previo + no interno
function isUntouched(c: Cand): boolean {
  if (isInternal(c.email)) return false;
  if (c.prefilter_invited_at) return false;
  // status pending = nunca recibió Elevare invite
  return c.status === "pending";
}

// Candidato YA en proceso (Elevare invitado, in_progress, completed)
function isInElevareProcess(c: Cand): boolean {
  if (isInternal(c.email)) return false;
  return ["invited", "in_progress", "completed"].includes(c.status);
}

export default function PrefiltrosPanel() {
  const [candidates, setCandidates] = useState<Cand[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [filter, setFilter] = useState<FilterId>("no-invitado");
  const [vacFilter, setVacFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Record<string, string>>({});

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [cRes, vRes] = await Promise.all([
        fetch(`/api/headhunting/candidates?clientId=${TS_CLIENT_ID}`),
        fetch(`/api/headhunting/vacancies?clientId=${TS_CLIENT_ID}`),
      ]);
      const cJ = await cRes.json();
      const vJ = await vRes.json();
      setCandidates(cJ.candidates || []);
      setVacancies(vJ.vacancies || []);
    } catch (e) {
      console.error("Error loading:", e);
    } finally {
      setLoading(false);
    }
  }

  // Excluir internos siempre (Yohanna y otros @tradingsolutions.com)
  const realCandidates = useMemo(
    () => candidates.filter((c) => !isInternal(c.email)),
    [candidates]
  );

  const filtered = useMemo(() => {
    return realCandidates.filter((c) => {
      if (vacFilter !== "all" && c.vacancy_id !== vacFilter) return false;
      switch (filter) {
        case "all": return true;
        case "no-invitado": return isUntouched(c);
        case "ya-contactado": return isInElevareProcess(c);
        case "invitado-pendiente": return !!c.prefilter_invited_at && !c.prefilter_completed_at;
        case "pass": return c.prefilter_decision === "pass";
        case "review": return c.prefilter_decision === "review";
        case "reject": return c.prefilter_decision === "reject";
      }
    });
  }, [realCandidates, filter, vacFilter]);

  const counts = useMemo(() => {
    const base = vacFilter === "all" ? realCandidates : realCandidates.filter(c => c.vacancy_id === vacFilter);
    return {
      all: base.length,
      "no-invitado": base.filter(isUntouched).length,
      "ya-contactado": base.filter(isInElevareProcess).length,
      "invitado-pendiente": base.filter(c => c.prefilter_invited_at && !c.prefilter_completed_at).length,
      pass: base.filter(c => c.prefilter_decision === "pass").length,
      review: base.filter(c => c.prefilter_decision === "review").length,
      reject: base.filter(c => c.prefilter_decision === "reject").length,
    };
  }, [realCandidates, vacFilter]);

  async function sendOne(c: Cand) {
    if (busy.has(c.id)) return;
    setBusy(prev => new Set([...prev, c.id]));
    try {
      const res = await fetch(`/api/headhunting/candidates/${c.id}/send-prefilter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = await res.json();
      if (j.success) {
        setResults(prev => ({ ...prev, [c.id]: j.channel === "gmail-draft" ? "✅ Draft creado" : `⚠️ ${j.note || j.channel}` }));
        await loadData();
      } else {
        setResults(prev => ({ ...prev, [c.id]: `❌ ${j.error || "error"}` }));
      }
    } catch (e) {
      setResults(prev => ({ ...prev, [c.id]: `❌ ${(e as Error).message}` }));
    } finally {
      setBusy(prev => { const n = new Set(prev); n.delete(c.id); return n; });
    }
  }

  async function sendBatch() {
    const targets = filtered.filter(c => selected.has(c.id));
    if (!targets.length) {
      alert("Selecciona al menos un candidato.");
      return;
    }
    if (!confirm(`Crear ${targets.length} drafts de prefiltro en tu Gmail?`)) return;
    for (const c of targets) {
      await sendOne(c);
    }
    setSelected(new Set());
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function selectAll() {
    setSelected(new Set(filtered.map(c => c.id)));
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-[28px] font-extrabold tracking-tight m-0">Prefiltros</h1>
        <p className="text-sm text-gray-500 mt-1">
          Cuestionario inicial · 16 preguntas · Decide pass / review / reject según salario y perfil.
          Los drafts se crean automáticos en tu Gmail.
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-500">Vacante:</span>
          <select
            value={vacFilter}
            onChange={(e) => setVacFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 font-medium"
          >
            <option value="all">Todas</option>
            {vacancies.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => { setFilter(f.id); setSelected(new Set()); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filter === f.id ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-300 hover:border-black"
              }`}
            >
              {f.label} <span className="opacity-60">({counts[f.id]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Acciones bulk */}
      {filter === "no-invitado" && filtered.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm text-gray-700">
            {selected.size > 0 ? <strong>{selected.size}</strong> : "Ninguno"} seleccionado · {filtered.length} candidatos en este filtro
          </span>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-300 hover:border-black">
              Seleccionar todos ({filtered.length})
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-300 hover:border-black"
            >
              Limpiar
            </button>
            <button
              onClick={sendBatch}
              disabled={selected.size === 0 || busy.size > 0}
              className="text-xs font-bold px-4 py-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Crear {selected.size} drafts
            </button>
          </div>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white border border-gray-200 rounded-2xl">
          No hay candidatos en este filtro.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-[11px] uppercase tracking-wider">
              <tr>
                {filter === "no-invitado" && <th className="px-3 py-3 w-8"></th>}
                <th className="px-3 py-3 text-left font-semibold">Candidato</th>
                <th className="px-3 py-3 text-left font-semibold">Vacante</th>
                <th className="px-3 py-3 text-left font-semibold">Prefiltro</th>
                <th className="px-3 py-3 text-right font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => {
                const decision = c.prefilter_decision;
                const decisionLabel = decision === "pass" ? "✅ Pass" : decision === "review" ? "⚠️ Review" : decision === "reject" ? "❌ Reject" : "—";
                const inElevare = isInElevareProcess(c);
                const elevareLabel = c.status === "completed" ? "Integridad completada" : c.status === "in_progress" ? "Integridad en progreso" : "Integridad invitada";
                const statusText = c.prefilter_completed_at ? decisionLabel
                  : c.prefilter_invited_at ? "Esperando respuesta"
                  : inElevare ? `🟡 ${elevareLabel}`
                  : "Sin contactar";
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    {filter === "no-invitado" && (
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          className="w-4 h-4 accent-black"
                        />
                      </td>
                    )}
                    <td className="px-3 py-3">
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.email}</div>
                    </td>
                    <td className="px-3 py-3 text-gray-700">{c.ht_vacancies?.title || "—"}</td>
                    <td className="px-3 py-3">
                      <span className={
                        decision === "pass" ? "text-green-700 font-semibold" :
                        decision === "review" ? "text-amber-700 font-semibold" :
                        decision === "reject" ? "text-red-700 font-semibold" :
                        inElevare ? "text-amber-700 font-medium" :
                        c.prefilter_invited_at ? "text-blue-700" : "text-gray-500"
                      }>
                        {statusText}
                      </span>
                      {results[c.id] && <div className="text-xs text-gray-600 mt-0.5">{results[c.id]}</div>}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {inElevare ? (
                        <span className="text-xs text-gray-500 italic">Ya en proceso — no aplica prefiltro</span>
                      ) : !c.prefilter_invited_at ? (
                        <button
                          onClick={() => sendOne(c)}
                          disabled={busy.has(c.id)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-300"
                        >
                          {busy.has(c.id) ? "Enviando…" : "Enviar prefiltro"}
                        </button>
                      ) : c.prefilter_completed_at ? (
                        <span className="text-xs text-gray-500">{new Date(c.prefilter_completed_at).toLocaleDateString()}</span>
                      ) : (
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-xs text-gray-500">Esperando respuesta</span>
                          <button
                            onClick={() => sendOne(c)}
                            disabled={busy.has(c.id)}
                            className="text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
                            title="Regenerar token y crear nuevo draft de Gmail"
                          >
                            {busy.has(c.id) ? "…" : "🔄 Reenviar"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
