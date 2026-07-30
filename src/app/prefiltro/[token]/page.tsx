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
  vacancy: { title: string; form_template_key?: string };
  client: { name: string };
};

const SALARY_RANGES = ["< 3 M", "3 – 4 M", "4 – 5 M", "5 – 6 M", "6 – 7 M", "7 – 8 M", "8 M+"];
const AVAILABILITY = ["Inmediato", "15 días", "30 días", "60+ días"];
const RELOCATE = ["Ya vivo en Barranquilla", "Sí, dispuesto a mudarme", "No me puedo mudar"];
const ENGLISH = ["A1 (básico)", "A2 (elemental)", "B1 (intermedio)", "B2 (intermedio alto)", "C1 (avanzado)", "C2 (nativo / fluido)"];
// Education options · varían según template
const EDU_COMEX = ["Industrial", "Sistemas / Software", "Otra ingeniería", "Otra carrera", "Estudiante últimos semestres", "Bachiller / técnico"];
const EDU_HR = ["Psicología", "Administración / Negocios", "Recursos Humanos", "Comunicación / Mercadeo", "Otra carrera", "Estudiante últimos semestres"];
const EDU_FINANCE = ["Contaduría Pública", "Administración Financiera", "Economía", "Ingeniería Industrial", "Otra carrera", "Estudiante últimos semestres"];
const CRMS = ["Salesforce", "HubSpot", "CargoWise", "SAP", "Odoo", "Zoho", "Microsoft Dynamics", "Otro CRM", "Ninguno"];
const ATS_TOOLS = ["LinkedIn Recruiter", "Greenhouse", "Lever", "Workday", "BambooHR", "HiBob", "Otro ATS", "Ninguno"];
const ACCOUNTING_SYSTEMS = ["SAP", "Oracle NetSuite", "QuickBooks", "Microsoft Dynamics", "Siigo", "World Office", "Otro", "Ninguno"];
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

  // Form state · comunes
  const [salary, setSalary] = useState("");
  const [availability, setAvailability] = useState("");
  const [relocate, setRelocate] = useState("");
  const [englishLevel, setEnglishLevel] = useState("");
  const [englishCert, setEnglishCert] = useState("");
  const [eduType, setEduType] = useState("");
  // Comex
  const [yearsLogistics, setYearsLogistics] = useState("");
  const [intlClients, setIntlClients] = useState<string>("");
  const [excelLevel, setExcelLevel] = useState("");
  const [crms, setCrms] = useState<string[]>([]);
  const [yearsSales, setYearsSales] = useState("");
  const [pricingExp, setPricingExp] = useState("");
  const [leadership, setLeadership] = useState("");
  const [teamSize, setTeamSize] = useState("");
  // HR Lead
  const [yearsHR, setYearsHR] = useState("");
  const [atsTools, setAtsTools] = useState<string[]>([]);
  const [pipelineFromScratch, setPipelineFromScratch] = useState("");
  const [teamSizeLed, setTeamSizeLed] = useState("");
  const [hrFocus, setHrFocus] = useState("");
  // Finance
  const [yearsFinance, setYearsFinance] = useState("");
  const [accountingSystems, setAccountingSystems] = useState<string[]>([]);
  const [ifrsFamiliar, setIfrsFamiliar] = useState("");
  const [auditExp, setAuditExp] = useState("");
  // Comunes
  const [whyTs, setWhyTs] = useState("");
  const [nextRole, setNextRole] = useState("");
  const [extra, setExtra] = useState("");

  // ─── China (form en inglés · knock-outs only) ─────────────────────
  const [cnFullName, setCnFullName] = useState("");
  const [cnEmail, setCnEmail] = useState("");
  const [cnPhone, setCnPhone] = useState("");
  const [cnCity, setCnCity] = useState("");
  const [cnWorkAuth, setCnWorkAuth] = useState("");        // "yes" | "no"
  const [cnEnglish, setCnEnglish] = useState("");          // B1/B2/C1/C2
  const [cnEnglishCert, setCnEnglishCert] = useState("");
  const [cnYearsExp, setCnYearsExp] = useState("");
  const [cnOnsite, setCnOnsite] = useState("");            // "yes" | "no"
  const [cnSalaryUsd, setCnSalaryUsd] = useState("");
  const [cnTariff, setCnTariff] = useState("");            // A/B/C
  const [cnTariffWhy, setCnTariffWhy] = useState("");

  // Template seleccionado (default comex si no hay info)
  const templateKey = data?.vacancy?.form_template_key || "comex";
  const isComex = templateKey === "comex";
  const isHR = templateKey === "hr_lead";
  const isFinance = templateKey === "finance";
  const isChina = templateKey === "china";

  // Prefill de nombre/email del candidato cuando cargan los datos (China)
  useEffect(() => {
    if (data) {
      if (!cnFullName) setCnFullName(data.candidate.name || "");
      if (!cnEmail) setCnEmail(data.candidate.email || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

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
  function toggleAts(t: string) {
    setAtsTools((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }
  function toggleAcct(s: string) {
    setAccountingSystems((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function isFormValid() {
    // China · validación propia (inglés, knock-outs, PIPL)
    if (isChina) {
      return !!(
        cnFullName.trim().length >= 3 &&
        /\S+@\S+\.\S+/.test(cnEmail.trim()) &&
        cnPhone.trim().length >= 5 &&
        cnCity.trim().length >= 2 &&
        cnWorkAuth &&
        cnEnglish &&
        cnEnglishCert.trim().length >= 3 &&
        cnYearsExp !== "" &&
        cnOnsite &&
        cnSalaryUsd.trim() !== "" &&
        cnTariff &&
        habeasAccepted // en China este check = consentimiento PIPL
      );
    }
    // Comunes a todos los templates
    const commonOk = !!(
      docType && docNumber.trim().length >= 6 && phone.trim().length >= 7 && city.trim().length >= 3 &&
      salary && availability && relocate && englishLevel && eduType && whyTs.trim().length >= 20
    );
    if (!commonOk) return false;
    if (isHR) {
      return !!(yearsHR !== "" && atsTools.length > 0 && pipelineFromScratch);
    }
    if (isFinance) {
      return !!(yearsFinance !== "" && accountingSystems.length > 0 && ifrsFamiliar);
    }
    // Comex (default)
    return !!(
      yearsLogistics !== "" && intlClients && excelLevel &&
      yearsSales !== "" && pricingExp && leadership
    );
  }

  async function handleSubmit() {
    if (!isFormValid()) {
      alert(isChina ? "Please complete all required fields before submitting." : "Por favor completa todos los campos antes de enviar.");
      return;
    }
    setPhase("submitting");

    // ─── China · payload en inglés, keys que espera el backend ───────
    if (isChina) {
      const chinaPayload = {
        template_key: "china",
        full_name: cnFullName.trim(),
        email: cnEmail.trim(),
        phone_wechat: cnPhone.trim(),
        current_city: cnCity.trim(),
        work_authorized: cnWorkAuth === "yes",
        english_level: cnEnglish, // B1/B2/C1/C2
        english_cert: cnEnglishCert.trim(),
        years_experience: parseInt(cnYearsExp) || 0,
        onsite_available: cnOnsite === "yes",
        salary_usd: cnSalaryUsd.trim(), // dato · no descarta
        tariff_choice: cnTariff, // A/B/C
        tariff_reasoning: cnTariffWhy.trim(),
        extra: extra.trim(),
        pipl_consent: true,
        pipl_consent_at: new Date().toISOString(),
        submitted_at: new Date().toISOString(),
      };
      try {
        const res = await fetch(`/api/headhunting/prefilter/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(chinaPayload),
        });
        if (!res.ok) {
          const j = await res.json();
          setErrorMsg(j.error || "Submission error.");
          setPhase("error");
          return;
        }
        setPhase("done");
      } catch {
        setErrorMsg("Connection error.");
        setPhase("error");
      }
      return;
    }

    const basePayload = {
      // Personal
      doc_type: docType,
      doc_number: docNumber.trim(),
      phone: phone.trim(),
      city: city.trim(),
      habeas_accepted: true,
      habeas_accepted_at: new Date().toISOString(),
      // Comunes
      salary, availability, relocate,
      english_level: englishLevel, english_cert: englishCert,
      edu_type: eduType,
      why_ts: whyTs.trim(),
      next_role: nextRole.trim(),
      extra: extra.trim(),
      template_key: templateKey,
      submitted_at: new Date().toISOString(),
    };
    let payload: Record<string, unknown> = { ...basePayload };
    if (isHR) {
      payload = {
        ...payload,
        years_hr: parseInt(yearsHR) || 0,
        ats_tools_used: atsTools,
        pipeline_from_scratch: pipelineFromScratch === "si",
        team_size_led: parseInt(teamSizeLed) || 0,
        hr_focus: hrFocus.trim(),
      };
    } else if (isFinance) {
      payload = {
        ...payload,
        years_finance: parseInt(yearsFinance) || 0,
        accounting_systems: accountingSystems,
        ifrs_familiar: ifrsFamiliar === "si",
        audit_exp: auditExp.trim(),
      };
    } else {
      // Comex default
      payload = {
        ...payload,
        years_logistics: parseInt(yearsLogistics) || 0,
        intl_clients: intlClients === "si",
        excel_level: parseInt(excelLevel) || 0,
        crms,
        years_sales: parseInt(yearsSales) || 0,
        pricing_exp: pricingExp === "si",
        leadership: leadership === "si",
        team_size: leadership === "si" ? (parseInt(teamSize) || 0) : 0,
      };
    }
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
          <h1 style={{ color: TS_BLACK, fontSize: 28, fontWeight: 700, margin: "0 0 12px" }}>{isChina ? "All set!" : "¡Listo!"}</h1>
          <p style={{ color: TS_GRAY, fontSize: 16, margin: "0 0 8px" }}>{isChina ? "We received your answers successfully." : "Recibimos tus respuestas correctamente."}</p>
          <p style={{ color: TS_GRAY, fontSize: 14 }}>{isChina ? "We'll be in touch soon with next steps." : "Te contactaremos pronto con los próximos pasos."}</p>
        </div>
      </div>
    );
  }

  // ─── China · PIPL consent phase (English) ─────────────────────────
  if (phase === "habeas" && isChina) {
    return (
      <div style={{ minHeight: "100vh", background: "#fafafa", padding: "32px 16px", fontFamily: "Inter, -apple-system, sans-serif", color: TS_BLACK }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ marginBottom: 32 }}>
            <p style={{ color: TS_GRAY, fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 8 }}>
              🌏 Trading Solutions · Initial questionnaire
            </p>
            <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 12px", lineHeight: 1.2 }}>
              Hi {data?.candidate.name.split(" ")[0]} — let's get to know you 👋
            </h1>
            <p style={{ color: TS_GRAY, fontSize: 16, lineHeight: 1.6 }}>
              Before moving forward with the <strong>{data?.vacancy.title}</strong> process, please complete this short questionnaire. It only covers the essentials and takes about 5 minutes.
            </p>
          </div>

          <div style={{ background: "white", borderRadius: 16, padding: 32, border: `1px solid ${TS_BORDER}`, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#EBF0FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TS_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l8 4v6c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V6l8-4z" />
                </svg>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Personal information consent (PIPL)</h2>
            </div>
            <p style={{ color: TS_GRAY, fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
              In accordance with China's <strong>Personal Information Protection Law (PIPL)</strong>, the information you share in this form will be processed by <strong>Trading Solutions</strong> for the sole purpose of managing the recruitment process for the position you are applying to.
            </p>
            <ul style={{ color: TS_GRAY, fontSize: 14, lineHeight: 1.7, paddingLeft: 20, marginBottom: 16 }}>
              <li>Your data will be stored securely in our candidate database.</li>
              <li>It will not be shared with third parties without your explicit authorization.</li>
              <li>You may access, update, correct or request deletion of your data at any time.</li>
              <li>To exercise your rights, write to <strong>jointheteam@tradingsolutions.com</strong>.</li>
            </ul>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 16, border: `2px solid ${habeasAccepted ? TS_BLACK : TS_BORDER}`, borderRadius: 12, cursor: "pointer", background: habeasAccepted ? "#F9FAFB" : "white" }}>
              <input
                type="checkbox"
                checked={habeasAccepted}
                onChange={(e) => setHabeasAccepted(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 2, accentColor: TS_BLACK, cursor: "pointer" }}
              />
              <span style={{ fontSize: 14, fontWeight: 500 }}>
                I consent to Trading Solutions processing my personal information for the purpose of this recruitment process, in accordance with the PIPL.
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
            Continue to the questionnaire →
          </button>
          {!habeasAccepted && (
            <p style={{ color: TS_GRAY, fontSize: 13, textAlign: "center", marginTop: 12 }}>
              Check the consent box to continue.
            </p>
          )}
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
              <li>Para ejercer tus derechos puedes escribirnos a <strong>jointheteam@tradingsolutions.com</strong>.</li>
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

  // ─── China · Form phase (English, essentials only) ────────────────
  if (isChina) {
    const YESNO_EN = [{ label: "Yes", value: "yes" }, { label: "No", value: "no" }];
    return (
      <div style={{ minHeight: "100vh", background: "#fafafa", padding: "32px 16px", fontFamily: "Inter, -apple-system, sans-serif", color: TS_BLACK }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ marginBottom: 32 }}>
            <p style={{ color: TS_GRAY, fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 8 }}>
              🌏 Trading Solutions · {data?.vacancy.title}
            </p>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 12px" }}>Tell us about yourself, {data?.candidate.name.split(" ")[0]}</h1>
            <p style={{ color: TS_GRAY, fontSize: 15, lineHeight: 1.6 }}>
              Just the essentials. Please answer honestly — there are no right or wrong answers.
            </p>
          </div>

          <Section title="1 · Your details">
            <Q label="Full name">
              <input value={cnFullName} onChange={(e) => setCnFullName(e.target.value)} style={inputStyle} placeholder="Your full name" />
            </Q>
            <Q label="Email">
              <input value={cnEmail} onChange={(e) => setCnEmail(e.target.value)} style={inputStyle} placeholder="you@email.com" inputMode="email" />
            </Q>
            <Q label="Phone / WeChat">
              <input value={cnPhone} onChange={(e) => setCnPhone(e.target.value)} style={inputStyle} placeholder="Phone number or WeChat ID" />
            </Q>
            <Q label="Current city (China)">
              <input value={cnCity} onChange={(e) => setCnCity(e.target.value)} style={inputStyle} placeholder="e.g. Shanghai, Shenzhen, Guangzhou" />
            </Q>
          </Section>

          <Section title="2 · Eligibility">
            <Q label="Are you legally authorized to work in China?">
              <SelectChips value={cnWorkAuth} onChange={setCnWorkAuth} options={YESNO_EN} />
            </Q>
            <Q label="On-site availability in Shanghai / Shenzhen / Guangzhou?">
              <SelectChips value={cnOnsite} onChange={setCnOnsite} options={YESNO_EN} />
            </Q>
          </Section>

          <Section title="3 · English">
            <Q label="English level">
              <SelectChips value={cnEnglish} onChange={setCnEnglish} options={["B1", "B2", "C1", "C2"]} />
            </Q>
            <Q label="How do you certify it? (e.g. certification, years working in English, studies abroad)">
              <textarea value={cnEnglishCert} onChange={(e) => setCnEnglishCert(e.target.value.slice(0, 300))} rows={2} style={inputStyle} />
            </Q>
          </Section>

          <Section title="4 · Experience">
            <Q label="Years of relevant experience in freight forwarding / the role area">
              <input type="number" min={0} max={50} value={cnYearsExp} onChange={(e) => setCnYearsExp(e.target.value)} style={inputStyle} placeholder="0" />
            </Q>
            <Q label="Salary expectation in USD (monthly)">
              <input value={cnSalaryUsd} onChange={(e) => setCnSalaryUsd(e.target.value)} style={inputStyle} placeholder="e.g. 2000" inputMode="numeric" />
            </Q>
          </Section>

          <Section title="5 · Tariff analysis">
            <Q label="A client wants a competitive but reliable option. Which do you choose and why? — A: Freight 1200 + Local 300 (25 days) · B: Freight 1350 + Local 250 (20 days) · C: Freight 1100 + Local 400 (30 days)">
              <SelectChips value={cnTariff} onChange={setCnTariff} options={["A", "B", "C"]} />
            </Q>
            <Q label="Briefly, why? (optional)">
              <textarea value={cnTariffWhy} onChange={(e) => setCnTariffWhy(e.target.value.slice(0, 500))} rows={3} style={inputStyle} placeholder="Your reasoning…" />
            </Q>
          </Section>

          <Section title="6 · Anything else">
            <Q label="Anything else we should know? (optional)">
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
              {(phase as Phase) === "submitting" ? "Submitting…" : "Submit answers"}
            </button>
            {!isFormValid() && (
              <p style={{ color: TS_GRAY, fontSize: 13, textAlign: "center", marginTop: 12 }}>
                Please complete all required questions before submitting.
              </p>
            )}
          </div>
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

        {/* Sección 4 · Formación · varía según template */}
        <Section title="4 · Formación">
          <Q label="Tu formación principal">
            <SelectChips
              value={eduType}
              onChange={setEduType}
              options={isHR ? EDU_HR : isFinance ? EDU_FINANCE : EDU_COMEX}
            />
          </Q>
        </Section>

        {/* Sección 5 · Experiencia específica por template */}
        {isHR ? (
          <Section title="5 · Experiencia en HR · Talent Acquisition">
            <Q label="Años de experiencia en HR / Talent Acquisition / Learning & Development">
              <input type="number" min={0} max={50} value={yearsHR} onChange={(e) => setYearsHR(e.target.value)} style={inputStyle} placeholder="0" />
            </Q>
            <Q label="¿Qué herramientas de ATS / sourcing has usado? (selecciona todas las que apliquen)">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ATS_TOOLS.map((t) => (
                  <button key={t} type="button" onClick={() => toggleAts(t)} style={chipStyle(atsTools.includes(t))}>{t}</button>
                ))}
              </div>
            </Q>
            <Q label="¿Has construido pipelines de reclutamiento desde cero o liderado búsquedas estratégicas?">
              <SelectChips value={pipelineFromScratch} onChange={setPipelineFromScratch} options={[{label:"Sí",value:"si"},{label:"No",value:"no"}]} />
            </Q>
            <Q label="¿Cuántas personas has liderado directamente? (escribe 0 si nunca)">
              <input type="number" min={0} max={500} value={teamSizeLed} onChange={(e) => setTeamSizeLed(e.target.value)} style={inputStyle} placeholder="0" />
            </Q>
            <Q label="¿Cuál es tu foco preferido: atracción · desarrollo · cultura · todos? (opcional)">
              <input value={hrFocus} onChange={(e) => setHrFocus(e.target.value)} style={inputStyle} placeholder="Ej. atracción senior + desarrollo de líderes" />
            </Q>
          </Section>
        ) : isFinance ? (
          <Section title="5 · Experiencia en finanzas · contabilidad">
            <Q label="Años de experiencia en finanzas / contabilidad / FP&A">
              <input type="number" min={0} max={50} value={yearsFinance} onChange={(e) => setYearsFinance(e.target.value)} style={inputStyle} placeholder="0" />
            </Q>
            <Q label="¿Qué sistemas contables has usado? (selecciona todos los que apliquen)">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ACCOUNTING_SYSTEMS.map((s) => (
                  <button key={s} type="button" onClick={() => toggleAcct(s)} style={chipStyle(accountingSystems.includes(s))}>{s}</button>
                ))}
              </div>
            </Q>
            <Q label="¿Tienes familiaridad con NIIF / IFRS y cierres mensuales?">
              <SelectChips value={ifrsFamiliar} onChange={setIfrsFamiliar} options={[{label:"Sí",value:"si"},{label:"No",value:"no"}]} />
            </Q>
            <Q label="¿Has manejado auditorías externas? (opcional, breve)">
              <textarea value={auditExp} onChange={(e) => setAuditExp(e.target.value.slice(0, 300))} rows={2} style={inputStyle} placeholder="Ej. 3 ciclos con KPMG en cliente multinacional" />
            </Q>
          </Section>
        ) : (
          <>
            <Section title="5 · Experiencia en comex · operaciones">
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

            <Section title="6 · Ventas, pricing, liderazgo">
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
          </>
        )}

        <Section title={`${isComex ? "7" : "6"} · Sobre ti`}>
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
