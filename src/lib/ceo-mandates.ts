/**
 * Los 16 mandatos del CEO de Trading Solutions · framework para evaluar
 * candidatos en la entrevista con recruiter. Mismo orden y criterios
 * en todo el sistema (UI + endpoint LLM + docx).
 */

export type MandateScore = "pass" | "partial" | "fail" | "data" | "not_probed";

export const MANDATE_SCORE_LABELS: Record<MandateScore, string> = {
  pass: "Cumple",
  partial: "Parcial",
  fail: "No cumple",
  data: "Solo data",
  not_probed: "No probado",
};

export const MANDATE_SCORE_SYMBOLS: Record<MandateScore, string> = {
  pass: "✅",
  partial: "◐",
  fail: "❌",
  data: "ℹ",
  not_probed: "?",
};

export const MANDATE_SCORE_COLORS: Record<MandateScore, { bg: string; fg: string; ring: string }> = {
  pass: { bg: "#DEF7EC", fg: "#1A7D3E", ring: "#A3DDC5" },
  partial: { bg: "#FEF3C7", fg: "#B45309", ring: "#FCD34D" },
  fail: { bg: "#FEE2E2", fg: "#C53030", ring: "#FCA5A5" },
  data: { bg: "#F3F4F6", fg: "#6B7280", ring: "#D1D5DB" },
  not_probed: { bg: "#F9FAFB", fg: "#9CA3AF", ring: "#E5E7EB" },
};

export type Mandate = {
  num: number;
  key: string;
  label: string;
  description: string;
  // Pregunta sugerida para el recruiter probar este mandato
  probe: string;
  // Cuando es "data only" (no es criterio de selección, solo info)
  dataOnly?: boolean;
};

export const CEO_MANDATES: Mandate[] = [
  {
    num: 1,
    key: "workaholic",
    label: "Workaholic",
    description: "Horario extendido como hábito · trabaja por elección, no solo por crisis.",
    probe: "Cuéntame de la última semana donde trabajaste fuera de horario por elección, no por crisis. ¿Qué te llevó a quedarte?",
  },
  {
    num: 2,
    key: "math",
    label: "Math",
    description: "Cómodo con números · KPIs · modelos · pricing · análisis cuantitativo.",
    probe: "Si tienes 100 cotizaciones al mes, conviertes 15%, ticket promedio USD 800, ¿cuánto facturas? Hazlo en voz alta.",
  },
  {
    num: 3,
    key: "english",
    label: "English",
    description: "Fluidez funcional para clientes internacionales · al menos B2.",
    probe: "Switch a inglés · sección English Validation con escenarios reales del rol.",
  },
  {
    num: 4,
    key: "no_victim",
    label: "No Víctima",
    description: "Cuando algo sale mal, asume responsabilidad · no culpa al jefe / cliente / sistema.",
    probe: "Cuéntame de un proyecto que no salió. ¿Qué hiciste tú diferente la próxima vez?",
  },
  {
    num: 5,
    key: "creative",
    label: "Creativa",
    description: "Ante restricción, propone caminos alternos · pensamiento lateral.",
    probe: "Cliente dice no por precio. ¿Cuáles son 3 movimientos posibles antes de bajar?",
  },
  {
    num: 6,
    key: "academic_excellence",
    label: "Becas / Honores / Promedio",
    description: "Track record académico de excelencia · indicador de disciplina y capacidad.",
    probe: "¿Promedio de la carrera? ¿Reconocimientos, becas, distinciones? ¿Por qué los obtuviste?",
  },
  {
    num: 7,
    key: "need",
    label: "Necesidad",
    description: "Hambre · razón económica/personal de querer crecer fuerte · motor interno.",
    probe: "Cuéntame qué te mueve en este momento de tu vida. ¿Qué cambiaría con este rol?",
  },
  {
    num: 8,
    key: "agency",
    label: "Gestión / Agency",
    description: "Toma decisiones sin esperar permiso · ownership · proactividad.",
    probe: "Última vez que tomaste una decisión sin pedir permiso. ¿Qué pasó?",
  },
  {
    num: 9,
    key: "communicator",
    label: "Comunicador",
    description: "Articula claro · escucha activo · lee al otro · estructura sus respuestas.",
    probe: "Observar durante toda la entrevista · claridad, escucha, preguntas que devuelve.",
  },
  {
    num: 10,
    key: "mental_health",
    label: "Salud Mental",
    description: "Maneja presión sin colapsar · autoconciencia · regulación emocional.",
    probe: "Cuando te sientes pasado de carga, ¿qué señales notas en ti? ¿Qué haces?",
  },
  {
    num: 11,
    key: "wellness",
    label: "Wellness",
    description: "Cuida cuerpo · ejercicio · sueño · nutrición · energía sostenible.",
    probe: "Cuéntame tu rutina típica de un día · cómo entran ejercicio y comidas.",
  },
  {
    num: 12,
    key: "religious_affiliation",
    label: "Afiliación Religiosa",
    description: "Solo data · NO criterio de selección. Contexto cultural únicamente.",
    probe: "Si surge orgánico, anotar. NO preguntar directo.",
    dataOnly: true,
  },
  {
    num: 13,
    key: "technological",
    label: "Tecnológico",
    description: "Cómodo aprendiendo herramientas nuevas · sin miedo al software.",
    probe: "¿Última herramienta nueva que aprendiste? ¿Cuánto tardaste en sacarle valor?",
  },
  {
    num: 14,
    key: "multinational",
    label: "Multinacional / Formación",
    description: "Exposición a empresas multinacionales o formación de élite.",
    probe: "¿Has trabajado para multinacionales? ¿Qué aprendiste de su forma de operar?",
  },
  {
    num: 15,
    key: "competitive",
    label: "Competitivo",
    description: "Le importa ganar · disfruta el ranking · tracker mental de logros.",
    probe: "Cuéntame de la última vez que competiste por algo y te importó.",
  },
  {
    num: 16,
    key: "sold_things",
    label: "Vendían cosas",
    description: "Hizo ventas desde joven · indicio de hambre comercial temprano.",
    probe: "De adolescente / universidad, ¿alguna vez vendiste algo? Galletas, servicios, lo que sea.",
  },
];

/**
 * Devuelve el mandato por número. Útil para UI/endpoints.
 */
export function getMandate(num: number): Mandate | undefined {
  return CEO_MANDATES.find(m => m.num === num);
}

/**
 * Resumen de scores · cuántos pass/partial/fail/data/not_probed.
 */
export function summarizeScores(scores: Record<string, MandateScore>): Record<MandateScore, number> {
  const summary: Record<MandateScore, number> = {
    pass: 0, partial: 0, fail: 0, data: 0, not_probed: 0,
  };
  for (const num of Object.keys(scores)) {
    const s = scores[num];
    if (s in summary) summary[s]++;
  }
  return summary;
}
