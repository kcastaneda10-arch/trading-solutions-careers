/**
 * Prefilter form templates por tipo de vacante.
 *
 * Cada template define qué secciones mostrar y qué preguntas adicionales
 * pedir. Las secciones comunes (info personal, disponibilidad, inglés,
 * sobre ti) van en todos. Las específicas (comex/sales · HR · finance)
 * varían.
 *
 * El backend (`/api/headhunting/prefilter/[token]/route.ts`) usa el mismo
 * archivo para validar qué campos son obligatorios según template.
 */

export type TemplateKey = "comex" | "hr_lead" | "finance" | "tech" | "china";

export type SectionKey =
  | "personal"           // todos
  | "availability"       // todos
  | "english"            // todos
  | "education"          // varía por template
  | "comex_experience"   // solo comex
  | "sales_pricing"      // solo comex
  | "hr_experience"      // solo hr_lead
  | "finance_experience" // solo finance
  | "china_core"         // solo china · form en inglés, innegociables
  | "about_you";         // todos

export type PrefilterTemplate = {
  key: TemplateKey;
  label: string;
  description: string;
  sections: SectionKey[];
};

export const PREFILTER_TEMPLATES: Record<TemplateKey, PrefilterTemplate> = {
  comex: {
    key: "comex",
    label: "Comercio exterior · ventas · pricing",
    description: "Para Pricing Junior, Pricing Senior, Inside Sales, Customer Documentation",
    sections: ["personal", "availability", "english", "education", "comex_experience", "sales_pricing", "about_you"],
  },
  hr_lead: {
    key: "hr_lead",
    label: "Liderazgo HR · talent acquisition · learning",
    description: "Para Talent Acquisition Lead, T&D Lead, HR Manager",
    sections: ["personal", "availability", "english", "education", "hr_experience", "about_you"],
  },
  finance: {
    key: "finance",
    label: "Finanzas · contabilidad · accounting",
    description: "Para Lead Accounting Finance Officer, Controller, FP&A",
    sections: ["personal", "availability", "english", "education", "finance_experience", "about_you"],
  },
  tech: {
    key: "tech",
    label: "Tecnología · ingeniería · data",
    description: "Para roles técnicos · default si no hay otro template",
    sections: ["personal", "availability", "english", "education", "about_you"],
  },
  china: {
    key: "china",
    label: "China Builder Team (EN · knock-outs only)",
    description: "Para vacantes de China · formulario en inglés, corto, solo innegociables. Salario en USD es dato, no descarta. Consentimiento PIPL en vez de habeas data colombiano.",
    sections: ["china_core", "about_you"],
  },
};

export function getTemplate(key: string | null | undefined): PrefilterTemplate {
  if (!key) return PREFILTER_TEMPLATES.comex;
  return PREFILTER_TEMPLATES[key as TemplateKey] || PREFILTER_TEMPLATES.comex;
}

/**
 * Campos obligatorios por template · usado en el backend para validar
 * que el payload tiene lo mínimo según el tipo de rol.
 */
export const TEMPLATE_REQUIRED_FIELDS: Record<TemplateKey, string[]> = {
  comex: [
    "doc_type", "doc_number", "phone", "city",
    "salary", "availability", "relocate",
    "english_level", "edu_type",
    "years_logistics", "intl_clients", "excel_level",
    "years_sales", "pricing_exp", "leadership",
    "why_ts",
  ],
  hr_lead: [
    "doc_type", "doc_number", "phone", "city",
    "salary", "availability", "relocate",
    "english_level", "edu_type",
    "years_hr", "ats_tools_used", "team_size_led",
    "why_ts",
  ],
  finance: [
    "doc_type", "doc_number", "phone", "city",
    "salary", "availability", "relocate",
    "english_level", "edu_type",
    "years_finance", "accounting_systems", "ifrs_familiar",
    "why_ts",
  ],
  tech: [
    "doc_type", "doc_number", "phone", "city",
    "salary", "availability", "relocate",
    "english_level", "edu_type",
    "why_ts",
  ],
  // China · form en inglés. NO pide doc_type/doc_number/nacionalidad. Salario
  // (salary_usd) es dato, no descarta. Knock-outs: work_authorized, english_level
  // (>=B2), onsite_available. Consentimiento PIPL obligatorio.
  china: [
    "full_name", "email", "phone_wechat", "current_city",
    "work_authorized", "english_level", "english_cert",
    "years_experience", "onsite_available", "salary_usd",
    "tariff_choice", "pipl_consent",
  ],
};
