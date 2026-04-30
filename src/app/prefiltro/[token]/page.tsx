"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const TS_BLACK = "#0A0A0A";
const TS_BLUE = "#2C64ED";
const TS_GRAY = "#6B7280";
const TS_BORDER = "#E5E7EB";

type Phase = "loading" | "habeas" | "form" | "submitting" | "done" | "error";

type CandidateData = {
  candidate: { id: string; name: string; email: string };
  vacancy: { title: string };
  client: { name: string };
};

const SALARY_RANGES = ["< 3 M", "3 – 4 M", "4 – 5 M", "5 – 6 M", "6 – 7 M", "7 – 8 M", "8 M+"];
const AVAILABILITY = ["Inmediato", "15 días", "30 días", "60+ días"];
const RELOCATE = ["Ya vivo en Barranquilla", "Sí, dispuesto a mudarme", "No me puedo mudar"];
const ENGLISH = ["A1 (básico)", "A2 (elemental)", "B1 (intermedio)", "B2 (intermedio alto)", "C1 (avanzado)", "C2 (nativo / fluido)"];
const ENG_TYPE = ["Industrial", "Sistemas / Software", "Otra ingeniería", "Otra carrera", "Estudiante últimos semestres", "Bachiller / técnico"];
const CRMS = ["Salesforce", "HubSpot", "CargoWise", "SAP", "Odoo", "Zoho", "Microsoft Dynamics", "Otro CRM", "Ninguno"];
const DOC_TYPES = [
  { label: "Cédula de Ciudadanía", value: "CC" },
  { label: "Cédula de Extranjería", value: "CE" },
  { label: "Pasaporte", value: "PP" },
  { label: "Permiso por Protección Temporal (PPT)", value: "PPT" },
];

export default function PrefiltroForm() {
  const params = useParams();
  const token = params.token as string;
  const [phase, setPhase] = useState<Phase>("loading");
  const [data, setData] = useState<CandidateData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Habeas data acceptance
  const [habeasAccepted, setHabeasAccepted] = useState(false);

  // Personal info (sección 1)
  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  // Form state (existing)
  const [salary, setSalary] = useState("");
  const [availability, setAvailability] = useState("");
  const [relocate, setRelocate] = useState("");
  const [englishLevel, setEnglishLevel] = useState("");
  const [englishCert, setEnglishCert] = useState("");
  const [eduType, setEduType] = useState("");
  const [yearsLogistics, setYearsLogistics] = useState("");
  const [intlClients, setIntlClients] = useState<string>("");
  const [excelLevel, setExcelLevel] = useState("");
  const [crms, setCrms] = useState<string[]>([]);
  const [yearsSales, setYearsSales] = useState("");
  const [pricingExp, setPricingExp] = useState("");
  const [leadership, setLeadership] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [whyTs, setWhyTs] = useState("");
  const [nextRole, setNextRole] = useState("");
  const [extra, setExtra] = useState("");

  useEffect(() => {
    fetch(`/api/headhunting/prefilter/${token}`)
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json();
          setErrorMsg(
            j.error === "expired_token"
              ? "Este enlace ya expiró. Por favor escríbele a Kelly para que te genere uno nuevo."
              : j.error === "already_completed"
              ? "Ya completaste este cuestionario. Si necesitas modificar algo, escríbele a Kelly."
              : "Este enlace no es válido. Verifica que copiaste el enlace completo."
          );
          setPhase("error");
          return;
        }
        const j = (await r.json()) as CandidateData;
        setData(j);
        setPhase("habeas");
      })
      .catch(() => {
        setErrorMsg("Error de conexión. Intenta de nuevo en un momento.");
        setPhase("error");
      });
  }, [token]);

  function toggleCrm(c: string) {
    setCrms((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  function isFormValid() {
    return (
      docType && docNumber.trim().length >= 6 && phone.trim().length >= 7 && city.trim().length >= 3 &&
      salary && availability && relocate && englishLevel && eduType &&
      yearsLogistics !== "" && intlClients && excelLevel && yearsSales !== "" &&
      pricingExp && leadership && whyTs.trim().length >= 20
    );
  }

  async function handleSubmit() {
    if (!isFormValid()) {
      alert("Por favor completa todos los campos antes de enviar.");
      return;
    }
    setPhase("submitting");
    const payload = {
      // Personal
      doc_type: docType,
      doc_number: docNumber.trim(),
      phone: phone.trim(),
      city: city.trim(),
      habeas_accepted: true,
      habeas_accepted_at: new Date().toISOString(),
      // Form
      salary, availability, relocate,
      english_level: englishLevel, english_cert: englishCert,
      edu_type: eduType,
      years_logistics: parseInt(yearsLogistics) || 0,
      intl_clients: intlClients === "si",
      excel_level: parseInt(excelLevel) || 0,
      crms,
      years_sales: parseInt(yearsSales) || 0,
      pricing_exp: pricingExp === "si",
      leadership: leadership === "si",
      team_size: leadership === "si" ? (parseInt(teamSize) || 0) : 0,
      why_ts: whyTs.trim(),
      next_role: nextRole.trim(),
      extra: extra.trim(),
      submitted_at: new Date().toISOString(),
    };
    try {
      const res = await fetch(`/api/headhunting/prefilter/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json();
        setErrorMsg(j.error || "Error al enviar.");
        setPhase("error");
        return;
      }
      setPhase("done");
    } catch {
      setErrorMsg("Error de conexión.");
      setPhase("error");
    }
  }

  if (phase === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa", fontFamily: "Inter, -apple-system, sans-serif" }}>
        <p style={{ color: TS_GRAY }}>Cargando…</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa", padding: 24, fontFamily: "Inter, -apple-system, sans-serif" }}>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <h2 style={{ color: TS_BLACK }}>No pudimos abrir tu cuestionario</h2>
          <p style={{ color: TS_GRAY }}>{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa", padding: 24, fontFamily: "Inter, -apple-system, sans-serif" }}>
        <div style={{ maxWidth: 480, textAlign: "center", background: "white", padding: 48, borderRadius: 16, border: `1px solid ${TS_BORDER}` }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: "#DCFCE7", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h1 style={{ color: TS_BLACK, fontSize: 28, fontWeight: 700, margin: "0 0 12px" }}>¡Listo!</h1>
          <p style={{ color: TS_GRAY, fontSize: 16, margin: "0 0 8px" }}>Recibimos tus respuestas correctamente.</p>
          <p style={{ color: TS_GRAY, fontSize: 14 }}>Te contactaremos pronto con los próximos pasos.</p>
        </div>
      </div>
    );
  }

  // ─── Habeas Data phase ────────────────────────────────────────────
  if (phase === "habeas") {
    return (
      <div style={{ minHeight: "100vh", background: "#fafafa", padding: "32px 16px", fontFamily: "Inter, -apple-system, sans-serif", color: TS_BLACK }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {/* Hero cálido */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ color: TS_GRAY, fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 8 }}>
              🌎 Trading Solutions · Cuestionario inicial
            </p>
            <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 12px", lineHeight: 1.2 }}>
              Hola, {data?.candidate.name.split(" ")[0]} — queremos conocerte mejor 👋
            </h1>
            <p style={{ color: TS_GRAY, fontSize: 16, lineHeight: 1.6 }}>
              Antes de avanzar al proceso de evaluación para <strong>{data?.vacancy.title}</strong>, te pedimos completar este cuestionario corto. Toma 7-10 minutos. No hay respuestas correctas o incorrectas — solo queremos entender tu perfil y lo que buscas.
            </p>
          </div>

          {/* Habeas Data card */}
          <div style={{ background: "white", borderRadius: 16, padding: 32, border: `1px solid ${TS_BORDER}`, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#EBF0FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TS_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l8 4v6c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V6l8-4z" />
                </svg>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Autorización tratamiento de datos</h2>
            </div>
            <p style={{ color: TS_GRAY, fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
              En cumplimiento de la <strong>Ley 1581 de 2012</strong> (Habeas Data) y demás normativa colombiana de protección de datos personales, te informamos que la información que compartas en este formulario será tratada por <strong>Trading Solutions Company S.A.S.</strong> con la finalidad exclusiva de adelantar el proceso de selección al que estás aplicando.
            </p>
            <ul style={{ color: TS_GRAY, fontSize: 14, lineHeight: 1.7, paddingLeft: 20, marginBottom: 16 }}>
              <li>Tus datos serán almacenados de forma segura en nuestra base de candidatos.</li>
              <li>No serán compartidos con terceros sin tu autorización expresa.</li>
              <li>Tienes derecho a conocer, actualizar, rectificar y solicitar la supresión de tus datos en cualquier momento.</li>
              <li>Para ejercer tus derechos puedes escribirnos a <strong>kcastaneda@tradingsolutions.com</strong>.</li>
            </ul>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 16, border: `2px solid ${habeasAccepted ? TS_BLACK : TS_BORDER}`, borderRadius: 12, cursor: "pointer", background: habeasAccepted ? "#F9FAFB" : "white" }}>
              <input
                type="checkbox"
                checked={habeasAccepted}
                onChange={(e) => setHabeasAccepted(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 2, accentColor: TS_BLACK, cursor: "pointer" }}
              />
              <span style={{ fontSize: 14, fontWeight: 500 }}>
                Acepto que Trading Solutions trate mis datos personales con la finalidad de adelantar el proceso de selección, conforme a su política de privacidad y la Ley 1581 de 2012.
              </span>
            </label>
          </div>

          <button
            onClick={() => habeasAccepted && setPhase("form")}
            disabled={!habeasAccepted}
            style={{
              width: "100%", padding: "16px 32px",
              background: habeasAccepted ? TS_BLACK : "#999",
              color: "white", border: "none", borderRadius: 999,
              fontSize: 16, fontWeight: 700,
              cursor: habeasAccepted ? "pointer" : "not-allowed",
            }}
          >
            Continuar al cuestionario →
          </button>
          {!habeasAccepted && (
            <p style={{ color: TS_GRAY, fontSize: 13, textAlign: "center", marginTop: 12 }}>
              Marca la casilla de autorización para continuar.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── Form phase ───────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", padding: "32px 16px", fontFamily: "Inter, -apple-system, sans-serif", color: TS_BLACK }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <p style={{ color: TS_GRAY, fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 8 }}>
            🌎 Trading Solutions · {data?.vacancy.title}
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 12px" }}>Cuéntanos sobre ti, {data?.candidate.name.split(" ")[0]}</h1>
          <p style={{ color: TS_GRAY, fontSize: 15, lineHeight: 1.6 }}>
            Responde con tranquilidad y honestidad. No hay respuestas correctas o incorrectas.
          </p>
        </div>

        <Section title="1 · Información personal">
          <Q label="Tipo de documento">
            <SelectChips value={docType} onChange={setDocType} options={DOC_TYPES} />
          </Q>
          <Q label="Número de documento">
            <input value={docNumber} onChange={(e) => setDocNumber(e.target.value.replace(/\D/g, ""))} style={inputStyle} placeholder="Solo números" inputMode="numeric" />
          </Q>
          <Q label="Celular">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} placeholder="+57 300 123 4567" inputMode="tel" />
          </Q>
          <Q label="Ciudad de residencia">
            <input value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} placeholder="Ej. Barranquilla, Bogotá, Medellín…" />
          </Q>
        </Section>

        <Section title="2 · Disponibilidad y modalidad">
          <Q label="Expectativa salarial mensual (COP)">
            <SelectChips value={salary} onChange={setSalary} options={SALARY_RANGES} />
          </Q>
          <Q label="Disponibilidad para iniciar">
            <SelectChips value={availability} onChange={setAvailability} options={AVAILABILITY} />
          </Q>
          <Q label="¿Vives en Barranquilla o estás dispuesto(a) a mudarte? (la posición es presencial)">
            <SelectChips value={relocate} onChange={setRelocate} options={RELOCATE} />
          </Q>
        </Section>

        <Section title="3 · Idioma">
          <Q label="Nivel de inglés autoreportado">
            <SelectChips value={englishLevel} onChange={setEnglishLevel} options={ENGLISH} />
          </Q>
          <Q label="¿Cómo lo certificas? (opcional — ej. certificación, años trabajando en inglés, intercambio…)">
            <textarea value={englishCert} onChange={(e) => setEnglishCert(e.target.value)} rows={2} style={inputStyle} />
          </Q>
        </Section>

        <Section title="4 · Formación y experiencia">
          <Q label="Tu formación principal">
            <SelectChips value={eduType} onChange={setEduType} options={ENG_TYPE} />
          </Q>
          <Q label="Años de experiencia en logística o comercio exterior">
            <input type="number" min={0} max={50} value={yearsLogistics} onChange={(e) => setYearsLogistics(e.target.value)} style={inputStyle} placeholder="0" />
          </Q>
          <Q label="¿Has manejado clientes internacionales (USA, Europa, Asia)?">
            <SelectChips value={intlClients} onChange={setIntlClients} options={[{label:"Sí",value:"si"},{label:"No",value:"no"}]} />
          </Q>
          <Q label="Tu nivel de Excel (1 = básico, 5 = experto con macros/PowerQuery)">
            <SelectChips value={excelLevel} onChange={setExcelLevel} options={["1","2","3","4","5"]} />
          </Q>
          <Q label="¿Cuáles CRMs / plataformas has usado? (selecciona todos los que apliquen)">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CRMS.map((c) => (
                <button key={c} type="button" onClick={() => toggleCrm(c)} style={chipStyle(crms.includes(c))}>{c}</button>
              ))}
            </div>
          </Q>
        </Section>

        <Section title="5 · Ventas, pricing, liderazgo">
          <Q label="Años de experiencia en ventas / B2B / atención comercial">
            <input type="number" min={0} max={50} value={yearsSales} onChange={(e) => setYearsSales(e.target.value)} style={inputStyle} placeholder="0" />
          </Q>
          <Q label="¿Has trabajado en pricing, cotización, análisis tarifario o procurement?">
            <SelectChips value={pricingExp} onChange={setPricingExp} options={[{label:"Sí",value:"si"},{label:"No",value:"no"}]} />
          </Q>
          <Q label="¿Has liderado equipos directamente?">
            <SelectChips value={leadership} onChange={setLeadership} options={[{label:"Sí",value:"si"},{label:"No",value:"no"}]} />
          </Q>
          {leadership === "si" && (
            <Q label="¿Cuántas personas tenías a cargo?">
              <input type="number" min={1} max={500} value={teamSize} onChange={(e) => setTeamSize(e.target.value)} style={inputStyle} placeholder="0" />
            </Q>
          )}
        </Section>

        <Section title="6 · Sobre ti">
          <Q label={`¿Por qué Trading Solutions específicamente? (mín. 20 caracteres) — ${whyTs.length}/500`}>
            <textarea value={whyTs} onChange={(e) => setWhyTs(e.target.value.slice(0, 500))} rows={4} style={inputStyle} placeholder="Cuéntanos qué te llamó la atención de la empresa, no de la vacante…" />
          </Q>
          <Q label="¿Qué buscas en tu próximo rol? (opcional)">
            <textarea value={nextRole} onChange={(e) => setNextRole(e.target.value.slice(0, 500))} rows={3} style={inputStyle} />
          </Q>
          <Q label="¿Algo más que quieras que sepamos? (opcional)">
            <textarea value={extra} onChange={(e) => setExtra(e.target.value.slice(0, 500))} rows={3} style={inputStyle} />
          </Q>
        </Section>

        <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${TS_BORDER}` }}>
          <button
            onClick={handleSubmit}
            disabled={(phase as Phase) === "submitting" || !isFormValid()}
            style={{
              width: "100%", padding: "16px 32px",
              background: isFormValid() ? TS_BLACK : "#999",
              color: "white", border: "none", borderRadius: 999,
              fontSize: 16, fontWeight: 700,
              cursor: isFormValid() ? "pointer" : "not-allowed",
              transition: "background 0.2s",
            }}
          >
            {(phase as Phase) === "submitting" ? "Enviando…" : "Enviar respuestas"}
          </button>
          {!isFormValid() && (
            <p style={{ color: TS_GRAY, fontSize: 13, textAlign: "center", marginTop: 12 }}>
              Por favor completa todas las preguntas obligatorias antes de enviar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Components ──────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32, padding: 24, background: "white", borderRadius: 12, border: `1px solid ${TS_BORDER}` }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: TS_BLUE, textTransform: "uppercase", letterSpacing: 1, marginTop: 0, marginBottom: 16 }}>{title}</h2>
      {children}
    </div>
  );
}

function Q({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{label}</label>
      {children}
    </div>
  );
}

type ChipOption = string | { label: string; value: string };

function SelectChips({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: ChipOption[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt) => {
        const v = typeof opt === "string" ? opt : opt.value;
        const l = typeof opt === "string" ? opt : opt.label;
        return (
          <button key={v} type="button" onClick={() => onChange(v)} style={chipStyle(value === v)}>
            {l}
          </button>
        );
      })}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: `1px solid ${TS_BORDER}`,
  borderRadius: 8,
  fontSize: 14,
  fontFamily: "inherit",
  resize: "vertical",
  outline: "none",
};

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: "8px 16px",
    border: `1.5px solid ${active ? TS_BLACK : TS_BORDER}`,
    background: active ? TS_BLACK : "white",
    color: active ? "white" : TS_BLACK,
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "inherit",
  };
}
