"use client";

/**
 * Página de Interview Prep · printable, on-demand, para Kelly antes de cada
 * entrevista con recruiter. Pull de TODA la data del candidato + 16 mandatos +
 * English fluency test scenarios + tailored questions.
 *
 * URL: /hr-admin/prep/[candidateId]
 * Imprimir: Cmd+P · estilos optimizados con @media print.
 */
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CEO_MANDATES } from "@/lib/ceo-mandates";

const ENGLISH_SCENARIOS = [
  {
    minute: "0:00–0:30",
    prompt: "Tell me a bit about yourself in English · just three or four sentences. Take your time.",
    look: "Estructura básica · vocabulario sales/logistics · pronunciación inteligible",
  },
  {
    minute: "0:30–1:30",
    prompt: "Imagine I'm a US-based importer asking for a quote on a 40' container Shanghai → Miami. Walk me through what info you'd ask me.",
    look: "Léxico técnico (origin, destination, freight, transit time, INCOTERMS, weight) · capacidad de hacer preguntas",
  },
  {
    minute: "1:30–2:30",
    prompt: "A client emails you complaining their cargo is delayed by 5 days. How do you respond?",
    look: "Manejo de conflicto en EN · empatía + assertiveness · voz comercial",
  },
  {
    minute: "2:30–3:00",
    prompt: "Switch back to Spanish. ¿Qué tan cómodo te sentiste? ¿Dónde sientes que necesitas más práctica?",
    look: "Autoconciencia · honestidad · willingness to grow",
  },
];

export default function InterviewPrepPage() {
  const params = useParams();
  const candidateId = params?.candidateId as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) return;
    fetch(`/api/admin/candidates/${candidateId}/interview-prep`, { cache: "no-store" })
      .then(r => r.json())
      .then(j => {
        if (j.error) setError(j.error);
        else setData(j);
        setLoading(false);
      })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, [candidateId]);

  if (loading) return <CenteredMessage>Cargando prep…</CenteredMessage>;
  if (error) return <CenteredMessage>Error: {error}</CenteredMessage>;
  if (!data) return null;

  const c = data.candidate;
  const pf = c.prefilter_data || {};
  const firstName = (c.name || "").split(" ")[0];

  return (
    <div className="prep-page bg-white text-gray-900 min-h-screen">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break { page-break-after: always; }
        }
        @page { size: letter; margin: 0.5in; }
        .prep-page { font-family: 'Helvetica', 'Arial', sans-serif; }
      `}</style>

      {/* Toolbar (no print) */}
      <div className="no-print sticky top-0 z-10 bg-black text-white px-6 py-3 flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[2.5px] font-bold opacity-80">
          Interview Prep · {c.name}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="text-xs font-bold px-4 py-1.5 bg-white text-black rounded hover:bg-gray-200"
          >
            🖨️ Imprimir / Guardar PDF
          </button>
          <button
            onClick={() => window.close()}
            className="text-xs font-medium px-4 py-1.5 border border-white/40 rounded hover:bg-white/10"
          >
            Cerrar
          </button>
        </div>
      </div>

      <div className="max-w-[8.5in] mx-auto px-8 py-8 space-y-6">
        {/* Header */}
        <header className="border-b-2 border-black pb-4">
          <div className="text-[10px] uppercase tracking-[2.5px] font-bold text-gray-500 mb-1">
            Trading Solutions · Recruiter Interview Prep
          </div>
          <h1 className="text-3xl font-extrabold leading-tight">{c.name}</h1>
          <div className="text-sm text-gray-700 mt-1">
            {c.vacancy_title} · {pf.city || "—"}
            {pf.availability && <> · Disponibilidad: <strong>{pf.availability}</strong></>}
          </div>
        </header>

        {/* Quick header stats */}
        <section className="grid grid-cols-4 gap-3 text-xs">
          <Stat label="Inglés decl." value={pf.english_level || "—"} highlight={pf.english_level?.startsWith("C") ? "good" : pf.english_level?.startsWith("B2") ? "ok" : "warn"} />
          <Stat label="Salario solic." value={pf.salary || "—"} />
          <Stat label="Promedio · GPA" value={pf.gpa || pf.avg || "preg en vivo"} />
          <Stat label="Stage actual" value={c.stage} />
        </section>

        {/* Strengths + Red Flags */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="text-[10px] uppercase tracking-wide font-bold text-emerald-800 mb-2">
              ✅ Strengths · qué celebrar
            </div>
            <ul className="text-xs space-y-1.5 list-disc pl-4">
              {data.strengths.length > 0
                ? data.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)
                : <li className="italic text-gray-500">Sin strengths automáticos · explorar en vivo</li>}
            </ul>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-[10px] uppercase tracking-wide font-bold text-red-800 mb-2">
              ⚠️ Red flags · qué probar
            </div>
            <ul className="text-xs space-y-1.5 list-disc pl-4">
              {data.red_flags.length > 0
                ? data.red_flags.map((s: string, i: number) => <li key={i}>{s}</li>)
                : <li className="italic text-gray-500">Sin flags automáticos · probar en vivo</li>}
            </ul>
          </div>
        </section>

        {/* Profile snapshot */}
        <section>
          <SectionTitle>Perfil del candidato</SectionTitle>
          <table className="w-full text-xs border-collapse">
            <tbody>
              <Row k="Email" v={c.email} />
              <Row k="Teléfono" v={c.phone} />
              <Row k="LinkedIn" v={c.linkedin_url || "—"} />
              <Row k="Educación" v={pf.edu_type || "—"} />
              <Row k="Años logística" v={pf.years_logistics ?? "—"} />
              <Row k="Años ventas" v={pf.years_sales ?? "—"} />
              <Row k="Liderazgo" v={pf.leadership ? `Sí · ${pf.team_size || 0} personas` : "No"} />
              <Row k="Pricing exp" v={pf.pricing_exp ? "Sí" : "No"} />
              <Row k="Clientes intl" v={pf.intl_clients ? "Sí" : "No"} />
              <Row k="CRMs" v={pf.crms?.join(", ") || "—"} />
              <Row k="Excel (1-5)" v={pf.excel_level ? `${pf.excel_level}/5` : "—"} />
              <Row k="Reubicación" v={pf.relocate || "—"} />
              <Row k="Cert/contexto inglés" v={pf.english_cert || "—"} />
            </tbody>
          </table>
        </section>

        {/* Sus respuestas a probar */}
        {(pf.why_ts || pf.next_role || pf.extra) && (
          <section>
            <SectionTitle>Sus respuestas (verbatim) · a profundizar</SectionTitle>
            <div className="space-y-2 text-xs">
              {pf.why_ts && (
                <div className="bg-blue-50 border-l-4 border-blue-300 p-3">
                  <div className="font-bold text-[10px] uppercase tracking-wide text-blue-800 mb-1">Why TS</div>
                  <div className="italic text-gray-800">"{pf.why_ts}"</div>
                </div>
              )}
              {pf.next_role && (
                <div className="bg-gray-50 border-l-4 border-gray-300 p-3">
                  <div className="font-bold text-[10px] uppercase tracking-wide text-gray-700 mb-1">Next role</div>
                  <div className="italic text-gray-800">"{pf.next_role}"</div>
                </div>
              )}
              {pf.extra && (
                <div className="bg-amber-50 border-l-4 border-amber-300 p-3">
                  <div className="font-bold text-[10px] uppercase tracking-wide text-amber-800 mb-1">Self-pitch / extra</div>
                  <div className="italic text-gray-800">"{pf.extra}"</div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Tailored questions */}
        <section className="page-break">
          <SectionTitle>Preguntas tailored para {firstName}</SectionTitle>
          <p className="text-xs text-gray-600 mb-3 italic">
            Empezar con estas. Si responde superficial, presionar con "dame un ejemplo concreto · cuándo, cuánto, qué hiciste".
          </p>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-black text-white">
                <th className="border border-gray-300 px-2 py-1.5 text-left w-1/4">Tema</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left w-1/2">Pregunta</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left w-1/4">Por qué importa</th>
              </tr>
            </thead>
            <tbody>
              {data.tailored_questions.map((q: any, i: number) => (
                <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                  <td className="border border-gray-300 px-2 py-2 align-top font-bold">{q.topic}</td>
                  <td className="border border-gray-300 px-2 py-2 align-top italic">{q.q}</td>
                  <td className="border border-gray-300 px-2 py-2 align-top text-gray-600">{q.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* English Fluency Test */}
        <section>
          <SectionTitle>English Fluency Test · 3 minutos</SectionTitle>
          <p className="text-xs text-gray-600 mb-2">
            Switch limpio: <em>"Now let's switch to English for a few minutes — I want to hear how you handle our international context. Take your time."</em>
          </p>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-black text-white">
                <th className="border border-gray-300 px-2 py-1.5 text-left w-[15%]">Tiempo</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left w-[55%]">Lo que dices · IN ENGLISH</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left w-[20%]">Qué evaluar</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left w-[10%]">Score</th>
              </tr>
            </thead>
            <tbody>
              {ENGLISH_SCENARIOS.map((s, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-blue-50" : ""}>
                  <td className="border border-gray-300 px-2 py-2 align-top font-bold">{s.minute}</td>
                  <td className="border border-gray-300 px-2 py-2 align-top italic">{s.prompt}</td>
                  <td className="border border-gray-300 px-2 py-2 align-top text-xs text-gray-600">{s.look}</td>
                  <td className="border border-gray-300 px-2 py-2 align-top h-10"></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[10px] mt-2 text-gray-600">
            <strong>Rúbrica express:</strong> ✅ B2+ vocabulario técnico, errores menores · ◐ B1 comunica básico falta técnico · ❌ A2 no sostiene business
          </div>
        </section>

        {/* 16 Mandatos */}
        <section className="page-break">
          <SectionTitle>Rúbrica · 16 Mandatos del CEO</SectionTitle>
          <p className="text-xs text-gray-600 mb-3 italic">
            Marca durante o justo después de la entrevista. Si no se probó, marca "?" y agenda follow-up.
          </p>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-black text-white">
                <th className="border border-gray-300 px-1.5 py-1.5 text-center w-[5%]">#</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left w-[20%]">Mandato</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left w-[45%]">Pregunta sugerida</th>
                <th className="border border-gray-300 px-2 py-1.5 text-center w-[10%]">✅◐❌?</th>
                <th className="border border-gray-300 px-2 py-1.5 text-left w-[20%]">Evidencia</th>
              </tr>
            </thead>
            <tbody>
              {CEO_MANDATES.map((m, i) => (
                <tr key={m.num} className={i % 2 === 0 ? "bg-gray-50" : ""}>
                  <td className="border border-gray-300 px-1.5 py-1.5 text-center font-bold">{m.num}</td>
                  <td className="border border-gray-300 px-2 py-1.5 align-top">
                    <div className="font-bold">{m.label}</div>
                    <div className="text-[10px] text-gray-600 italic">{m.description}</div>
                  </td>
                  <td className="border border-gray-300 px-2 py-1.5 align-top italic text-gray-800">{m.probe}</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-center"></td>
                  <td className="border border-gray-300 px-2 py-1.5"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Decisión final */}
        <section>
          <SectionTitle>Decisión final</SectionTitle>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="border-2 border-emerald-500 bg-emerald-50 px-3 py-3 rounded text-center font-bold text-emerald-800">
              ☐ STRONG YES · avanzar a CWO
            </div>
            <div className="border-2 border-amber-500 bg-amber-50 px-3 py-3 rounded text-center font-bold text-amber-800">
              ☐ MAYBE · más data
            </div>
            <div className="border-2 border-red-500 bg-red-50 px-3 py-3 rounded text-center font-bold text-red-800">
              ☐ NO · descartar
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-wide font-bold text-gray-700 mb-1">Razón principal</div>
            <div className="border border-gray-300 rounded p-2 min-h-[80px] text-xs"></div>
          </div>
          <div className="mt-3">
            <div className="text-[10px] uppercase tracking-wide font-bold text-gray-700 mb-1">Si avanza · qué probar en CWO</div>
            <div className="border border-gray-300 rounded p-2 min-h-[60px] text-xs"></div>
          </div>
        </section>

        {/* Eval previa si existe */}
        {data.previous_assessment && (
          <section className="page-break">
            <SectionTitle>⚠️ Evaluación previa · ya entrevistada antes</SectionTitle>
            <div className="bg-amber-50 border border-amber-300 rounded p-3 text-xs">
              <div><strong>Fecha:</strong> {new Date(data.previous_assessment.interview_date).toLocaleDateString("es-CO")}</div>
              <div><strong>Verdict previo:</strong> {data.previous_assessment.verdict}</div>
              <div><strong>Resumen:</strong> {data.previous_assessment.verdict_summary}</div>
            </div>
          </section>
        )}

        {/* Resultados Elevare / AI interview si existen */}
        {data.results && data.results.length > 0 && (
          <section>
            <SectionTitle>Resultados Elevare / AI Interview</SectionTitle>
            <div className="bg-gray-50 border border-gray-300 rounded p-3 text-xs">
              {data.results.map((r: any, i: number) => (
                <div key={i} className="mb-2">
                  {r.match_percentage != null && <div><strong>Match %:</strong> {r.match_percentage}%</div>}
                  {r.recommendation && <div><strong>Recomendación:</strong> {r.recommendation}</div>}
                  {r.ai_score && <div><strong>AI Score:</strong> {r.ai_score}/100</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="border-t border-gray-300 pt-4 mt-8 text-[10px] text-gray-500 text-center">
          Trading Solutions · Recruiter Interview Prep · Generado {new Date().toLocaleString("es-CO")}
        </footer>
      </div>
    </div>
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">{children}</div>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-extrabold border-b border-gray-300 pb-1 mb-3">{children}</h2>
  );
}

function Row({ k, v }: { k: string; v: any }) {
  return (
    <tr>
      <td className="border border-gray-200 px-2 py-1 bg-gray-50 font-semibold w-1/3">{k}</td>
      <td className="border border-gray-200 px-2 py-1">{v == null || v === "" ? "—" : String(v)}</td>
    </tr>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: "good" | "ok" | "warn" }) {
  const bg = highlight === "good" ? "bg-emerald-50 border-emerald-200" :
             highlight === "warn" ? "bg-red-50 border-red-200" :
             highlight === "ok" ? "bg-amber-50 border-amber-200" :
             "bg-gray-50 border-gray-200";
  return (
    <div className={`${bg} border rounded-lg px-3 py-2`}>
      <div className="text-[9px] uppercase font-bold tracking-wider text-gray-600">{label}</div>
      <div className="text-sm font-bold text-gray-900 mt-0.5 truncate">{value}</div>
    </div>
  );
}
