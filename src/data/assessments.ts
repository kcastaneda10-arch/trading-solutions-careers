/**
 * ================================================
 * TRADING SOLUTIONS · ASSESSMENTS PSICOMÉTRICOS
 * ================================================
 *
 * Framework Factor X migrado desde Elevare/WellnessOS.
 * Dos pruebas obligatorias + módulos opcionales por rol.
 *
 * Output: 12+ dimensiones usadas por el Screening Agent
 * para calcular el Fit Score y el perfil del candidato.
 */

export type AssessmentId =
  | "factor_x_cognitivo"
  | "factor_x_actitudinal"
  | "betesa_leadership"
  | "english_proficiency"
  | "role_simulation";

export type QuestionType =
  | "matrix_reasoning"
  | "verbal_analogy"
  | "sequence_memory"
  | "forced_choice"
  | "likert_5"
  | "situational_judgment"
  | "listening"
  | "writing";

export interface AssessmentMeta {
  id: AssessmentId;
  title: { es: string; en: string };
  summary: { es: string; en: string };
  duration: number;            // minutos
  questions: number;
  dimensions: string[];
  required: boolean;           // obligatoria en todos los roles
  appliesTo?: string[];        // slugs de roles (si es opcional)
  color: string;               // hex para badges
}

export interface QuestionOption {
  id: string;
  text: string;
  value?: number;
  isCorrect?: boolean;
}

export interface Question {
  id: string;
  section: string;
  type: QuestionType;
  prompt: string;
  options: QuestionOption[];
  timeLimit?: number;
}

/* ---------------- CATÁLOGO ---------------- */
export const assessments: AssessmentMeta[] = [
  {
    id: "factor_x_cognitivo",
    title: {
      es: "Factor X · Cognitivo & Perfil",
      en: "Factor X · Cognitive & Profile",
    },
    summary: {
      es: "Evalúa razonamiento, memoria, comprensión verbal y atención al detalle. Base del Fit Score técnico.",
      en: "Measures reasoning, memory, verbal comprehension and attention to detail. Base of the technical Fit Score.",
    },
    duration: 45,
    questions: 70,
    dimensions: [
      "IQ General",
      "Razonamiento lógico",
      "Comprensión verbal",
      "Memoria de trabajo",
      "Velocidad perceptual",
      "Atención al detalle",
    ],
    required: true,
    color: "#0A0A0A",
  },
  {
    id: "factor_x_actitudinal",
    title: {
      es: "Factor X · Actitudinal & Competencias",
      en: "Factor X · Behavioral & Competencies",
    },
    summary: {
      es: "Mide rasgos de personalidad (Big Five), estilo DISC y competencias 3D. Base del Fit cultural.",
      en: "Measures personality traits (Big Five), DISC style and 3D competencies. Base of cultural Fit.",
    },
    duration: 30,
    questions: 50,
    dimensions: [
      "Big Five (OCEAN)",
      "DISC profile",
      "Motivadores",
      "Orientación a resultados",
      "Trabajo en equipo",
      "Adaptabilidad",
    ],
    required: true,
    color: "#1F2937",
  },
  {
    id: "betesa_leadership",
    title: {
      es: "BETESA · Liderazgo & Multiplicadores",
      en: "BETESA · Leadership & Multipliers",
    },
    summary: {
      es: "Para roles senior: evalúa cerebro/comportamiento bajo framework BETESA y Multipliers vs Diminishers.",
      en: "For senior roles: brain/behavior under BETESA framework plus Multipliers vs Diminishers.",
    },
    duration: 25,
    questions: 40,
    dimensions: [
      "Cuadrante cerebral",
      "Amplifier index",
      "Diminisher index",
      "Gestión de equipo",
    ],
    required: false,
    appliesTo: ["senior-pricing-analyst"],
    color: "#0A66C2",
  },
  {
    id: "english_proficiency",
    title: {
      es: "Inglés · CEFR adaptativo",
      en: "English · Adaptive CEFR",
    },
    summary: {
      es: "Test adaptativo de inglés (listening, reading, writing). Escala CEFR A1–C2.",
      en: "Adaptive English test (listening, reading, writing). CEFR scale A1–C2.",
    },
    duration: 20,
    questions: 30,
    dimensions: ["CEFR level", "Listening", "Reading", "Writing"],
    required: true,
    color: "#B45309",
  },
  {
    id: "role_simulation",
    title: {
      es: "Simulación del rol",
      en: "Role simulation",
    },
    summary: {
      es: "Caso real del rol: Pricing tiene un RFQ, Documentation tiene un BL con error, Inside Sales un cliente enojado.",
      en: "Real case per role: Pricing gets an RFQ, Documentation a BL with errors, Inside Sales an angry client.",
    },
    duration: 30,
    questions: 6,
    dimensions: ["Criterio técnico", "Comunicación", "Priorización"],
    required: true,
    color: "#065F46",
  },
];

/* ---------------- PREGUNTAS (muestra para demo) ---------------- */
export const sampleQuestions: Record<AssessmentId, Question[]> = {
  factor_x_cognitivo: [
    {
      id: "cog-1",
      section: "Razonamiento lógico",
      type: "matrix_reasoning",
      prompt: "¿Qué número continúa la secuencia: 2, 6, 12, 20, 30, __?",
      options: [
        { id: "a", text: "36", isCorrect: false },
        { id: "b", text: "40", isCorrect: false },
        { id: "c", text: "42", isCorrect: true },
        { id: "d", text: "44", isCorrect: false },
      ],
      timeLimit: 60,
    },
    {
      id: "cog-2",
      section: "Comprensión verbal",
      type: "verbal_analogy",
      prompt: "Puerto es a Barco como Aeropuerto es a:",
      options: [
        { id: "a", text: "Piloto", isCorrect: false },
        { id: "b", text: "Avión", isCorrect: true },
        { id: "c", text: "Pista", isCorrect: false },
        { id: "d", text: "Pasajero", isCorrect: false },
      ],
      timeLimit: 30,
    },
    {
      id: "cog-3",
      section: "Atención al detalle",
      type: "sequence_memory",
      prompt: "Observa la secuencia: B/L · AWB · HS · EXW. ¿Cuál fue la tercera?",
      options: [
        { id: "a", text: "B/L" },
        { id: "b", text: "AWB" },
        { id: "c", text: "HS", isCorrect: true },
        { id: "d", text: "EXW" },
      ],
      timeLimit: 45,
    },
  ],
  factor_x_actitudinal: [
    {
      id: "act-1",
      section: "Big Five · Apertura",
      type: "likert_5",
      prompt: "Disfruto explorar nuevas ideas incluso cuando no son prácticas.",
      options: [
        { id: "1", text: "Muy en desacuerdo", value: 1 },
        { id: "2", text: "En desacuerdo", value: 2 },
        { id: "3", text: "Neutral", value: 3 },
        { id: "4", text: "De acuerdo", value: 4 },
        { id: "5", text: "Muy de acuerdo", value: 5 },
      ],
    },
    {
      id: "act-2",
      section: "DISC",
      type: "forced_choice",
      prompt: "En un equipo nuevo, tiendo a ser:",
      options: [
        { id: "d", text: "Directo y decidido — propongo metas claras" },
        { id: "i", text: "Social e influyente — levanto la energía" },
        { id: "s", text: "Paciente y leal — escucho y estabilizo" },
        { id: "c", text: "Analítico y riguroso — cuestiono los datos" },
      ],
    },
    {
      id: "act-3",
      section: "Orientación a resultados",
      type: "situational_judgment",
      prompt:
        "Un cliente solicita una cotización urgente pero el carrier no ha enviado sus tarifas. ¿Qué haces primero?",
      options: [
        { id: "a", text: "Cotizo con la tarifa del mes anterior y avisaré si cambia" },
        { id: "b", text: "Llamo al carrier y simultáneamente le escribo al cliente con ETA" },
        { id: "c", text: "Espero la tarifa oficial; evitamos errores" },
        { id: "d", text: "Escalo a mi líder de inmediato" },
      ],
    },
  ],
  betesa_leadership: [
    {
      id: "bt-1",
      section: "Multipliers",
      type: "likert_5",
      prompt: "Suelo generar espacios para que mi equipo tome decisiones sin pedir mi aprobación.",
      options: [
        { id: "1", text: "Muy en desacuerdo", value: 1 },
        { id: "2", text: "En desacuerdo", value: 2 },
        { id: "3", text: "Neutral", value: 3 },
        { id: "4", text: "De acuerdo", value: 4 },
        { id: "5", text: "Muy de acuerdo", value: 5 },
      ],
    },
    {
      id: "bt-2",
      section: "Cuadrante cerebral",
      type: "forced_choice",
      prompt: "Cuando hay ambigüedad, yo:",
      options: [
        { id: "a", text: "Busco datos y procesos claros" },
        { id: "b", text: "Imagino escenarios y prototipos" },
        { id: "c", text: "Pregunto al equipo cómo se siente" },
        { id: "d", text: "Avanzo rápido con la mejor hipótesis" },
      ],
    },
  ],
  english_proficiency: [
    {
      id: "en-1",
      section: "Reading",
      type: "verbal_analogy",
      prompt:
        "In a freight context, an 'origin terminal handling charge' is a cost related to:",
      options: [
        { id: "a", text: "Insurance at destination" },
        { id: "b", text: "Handling at the port of origin", isCorrect: true },
        { id: "c", text: "Customs at destination" },
        { id: "d", text: "Fuel surcharges" },
      ],
    },
    {
      id: "en-2",
      section: "Writing",
      type: "writing",
      prompt:
        "Write 2–3 sentences to a client explaining a 2-day delay due to vessel weather routing.",
      options: [],
    },
  ],
  role_simulation: [
    {
      id: "sim-1",
      section: "Case · Pricing",
      type: "situational_judgment",
      prompt:
        "Recibes un RFQ de una cuenta Top-10 para 20 FCL mensuales Barranquilla → Miami. Tu tarifa es 8% más cara que la competencia. ¿Cuál es tu primer movimiento?",
      options: [
        { id: "a", text: "Ajusto al precio de la competencia para no perder el RFQ" },
        { id: "b", text: "Propongo un paquete con SLA diferenciado y free-time ampliado" },
        { id: "c", text: "Pido volumen garantizado para negociar mejor con el carrier" },
        { id: "d", text: "Escalo la decisión al Head of Commercial" },
      ],
    },
  ],
};

/* ---------------- ASSESSMENT TOKENS (demo) ---------------- */
export interface AssessmentToken {
  token: string;
  candidate: string;
  email: string;
  jobSlug: string;
  assessmentIds: AssessmentId[];
  status: "sent" | "in_progress" | "completed" | "expired";
  sentAt: string;
  completedAt?: string;
  score?: number;
  language: "es" | "en";
}

export const assessmentTokens: AssessmentToken[] = [
  {
    token: "ats-ana-garcia-2026-pricing",
    candidate: "Ana García",
    email: "ana.garcia@mail.com",
    jobSlug: "senior-pricing-analyst",
    assessmentIds: [
      "factor_x_cognitivo",
      "factor_x_actitudinal",
      "betesa_leadership",
      "english_proficiency",
      "role_simulation",
    ],
    status: "completed",
    sentAt: "2026-04-17",
    completedAt: "2026-04-18",
    score: 92,
    language: "es",
  },
  {
    token: "ats-javier-ramirez-2026-pricing",
    candidate: "Javier Ramírez",
    email: "javier.r@mail.com",
    jobSlug: "senior-pricing-analyst",
    assessmentIds: [
      "factor_x_cognitivo",
      "factor_x_actitudinal",
      "english_proficiency",
      "role_simulation",
    ],
    status: "completed",
    sentAt: "2026-04-17",
    completedAt: "2026-04-19",
    score: 87,
    language: "es",
  },
  {
    token: "ats-daniela-ruiz-2026-docs",
    candidate: "Daniela Ruiz",
    email: "daniela.r@mail.com",
    jobSlug: "customer-documentation-specialist",
    assessmentIds: [
      "factor_x_cognitivo",
      "factor_x_actitudinal",
      "english_proficiency",
      "role_simulation",
    ],
    status: "in_progress",
    sentAt: "2026-04-20",
    language: "en",
  },
  {
    token: "ats-carlos-pena-2026-sales",
    candidate: "Carlos Peña",
    email: "carlos.p@mail.com",
    jobSlug: "inside-sales-support",
    assessmentIds: [
      "factor_x_cognitivo",
      "factor_x_actitudinal",
      "english_proficiency",
      "role_simulation",
    ],
    status: "sent",
    sentAt: "2026-04-21",
    language: "es",
  },
];

/* Utilidades */
export const getAssessmentById = (id: AssessmentId) =>
  assessments.find((a) => a.id === id);

export const getTokenByValue = (value: string) =>
  assessmentTokens.find((t) => t.token === value);

export const requiredFor = (jobSlug: string): AssessmentMeta[] =>
  assessments.filter(
    (a) => a.required || (a.appliesTo && a.appliesTo.includes(jobSlug))
  );
