/**
 * ================================================
 * TRADING SOLUTIONS · ASSESSMENT PSICOMÉTRICO
 * ================================================
 *
 * UNA sola prueba unificada — Factor X — migrada desde Elevare/WellnessOS.
 *
 * 120 preguntas · ~75 min · 9 secciones · 28+ dimensiones
 *
 * Salida: perfil cognitivo + conductual + motivacional, usado por el
 * Screening Agent para calcular el Fit Score.
 */

export type AssessmentId = "factor_x_ts";

export type QuestionType =
  | "matrix_reasoning"
  | "verbal_analogy"
  | "sequence_memory"
  | "forced_choice"
  | "likert_5"
  | "situational_judgment"
  | "self_assessment";

export interface AssessmentSection {
  id: string;
  name: string;
  description: string;
  questions: number;
  duration: number; // minutos
}

export interface AssessmentMeta {
  id: AssessmentId;
  title: { es: string; en: string };
  summary: { es: string; en: string };
  duration: number; // minutos totales
  questions: number; // total
  dimensions: string[];
  sections: AssessmentSection[];
  color: string;
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

/* ---------------- PRUEBA ÚNICA ---------------- */
export const factorXTS: AssessmentMeta = {
  id: "factor_x_ts",
  title: {
    es: "Factor X · Trading Solutions",
    en: "Factor X · Trading Solutions",
  },
  summary: {
    es: "Evaluación integral del candidato: razonamiento, personalidad, estilo conductual, motivación y competencias. Base del Fit Score.",
    en: "Integral candidate assessment: reasoning, personality, behavioral style, motivation and competencies. Base of the Fit Score.",
  },
  duration: 75,
  questions: 120,
  dimensions: [
    "IQ General",
    "Razonamiento lógico",
    "Comprensión verbal",
    "Memoria de trabajo",
    "Atención al detalle",
    "Velocidad perceptual",
    "DISC · Dominancia",
    "DISC · Influencia",
    "DISC · Estabilidad",
    "DISC · Cumplimiento",
    "Big Five · Apertura",
    "Big Five · Responsabilidad",
    "Big Five · Extraversión",
    "Big Five · Amabilidad",
    "Big Five · Estabilidad emocional",
    "Dominancia cerebral",
    "Motivadores intrínsecos",
    "Orientación a resultados",
    "Trabajo en equipo",
    "Adaptabilidad",
    "Liderazgo",
    "Comunicación",
    "Resolución de problemas",
    "Gestión del tiempo",
  ],
  sections: [
    {
      id: "reasoning",
      name: "Razonamiento lógico",
      description: "Secuencias numéricas y patrones visuales",
      questions: 15,
      duration: 10,
    },
    {
      id: "verbal",
      name: "Comprensión verbal",
      description: "Analogías y relaciones entre palabras",
      questions: 12,
      duration: 8,
    },
    {
      id: "attention",
      name: "Atención y memoria",
      description: "Secuencias de memoria y atención al detalle",
      questions: 10,
      duration: 6,
    },
    {
      id: "disc",
      name: "Estilo de trabajo",
      description: "Forma natural de interactuar y decidir",
      questions: 16,
      duration: 8,
    },
    {
      id: "personality",
      name: "Perfil profesional",
      description: "Rasgos de personalidad en contexto laboral",
      questions: 17,
      duration: 10,
    },
    {
      id: "brain_dominance",
      name: "Estilo de pensamiento",
      description: "Forma preferente de procesar información",
      questions: 10,
      duration: 6,
    },
    {
      id: "motivation",
      name: "Motivación y valores",
      description: "Qué te mueve y qué priorizas",
      questions: 15,
      duration: 8,
    },
    {
      id: "situational",
      name: "Juicio situacional",
      description: "Casos reales del rol",
      questions: 15,
      duration: 12,
    },
    {
      id: "self_assessment",
      name: "Autoevaluación de competencias",
      description: "Cómo te ves a ti mismo",
      questions: 10,
      duration: 7,
    },
  ],
  color: "#0A0A0A",
};

export const assessments: AssessmentMeta[] = [factorXTS];

/* Utilidades */
export const getAssessmentById = (id: AssessmentId) =>
  id === "factor_x_ts" ? factorXTS : undefined;

/* El conjunto por defecto que se asigna a cada candidato es simplemente el único test */
export const defaultAssessmentIds: AssessmentId[] = ["factor_x_ts"];
