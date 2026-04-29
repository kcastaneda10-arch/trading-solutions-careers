/**
 * ─── PREFILTER (16 Mandamientos CEO) ─────────────────────────────────
 *
 * Score automático que se aplica a TODA aplicación, sin importar la fuente:
 *   - Formulario público (POST /api/applications)
 *   - Import CSV LinkedIn  (POST /api/candidates/import)
 *   - Email a careers@      (futuro: webhook Resend)
 *   - Carpeta CV Drive      (futuro: cron)
 *
 * Devuelve { score, passed, decision, breakdown, reasons }.
 *   - passed:   true si pasa filtros duros (salario, idioma) y score ≥ umbral mínimo
 *   - decision: 'reviewing' (top) | 'new' (medio) | 'rejected' (bajo o filtros NO)
 *
 * El llamador puede usar `decision` directamente como `status` en applications.
 */

// ─── Configuración por vacante ───────────────────────────────────────
export type VacancyConfig = {
  job_id: number;
  job_title: string;
  salary_cap_cop: number; // tope mensual en COP
  requires_english: boolean;
  role_bonus: 'sales' | 'pricing' | 'documentation' | null;
};

export const VACANCY_CONFIG: Record<number, VacancyConfig> = {
  1: { job_id: 1, job_title: 'Senior Pricing Analyst',         salary_cap_cop: 4_000_000, requires_english: true,  role_bonus: 'pricing' },
  2: { job_id: 2, job_title: 'Inside Sales Support Specialist', salary_cap_cop: 4_000_000, requires_english: true,  role_bonus: 'sales' },
  3: { job_id: 3, job_title: 'Customer Documentation Specialist', salary_cap_cop: 3_000_000, requires_english: true, role_bonus: 'documentation' },
  4: { job_id: 4, job_title: 'Junior Pricing Analyst',         salary_cap_cop: 3_500_000, requires_english: true,  role_bonus: 'pricing' },
  5: { job_id: 5, job_title: 'Lead Accounting & Finance Officer', salary_cap_cop: 6_000_000, requires_english: true, role_bonus: null },
};

// ─── Diccionario de keywords (16 Mandamientos) ───────────────────────
const KEYWORDS: Record<string, { pts: number; kw: string[] }> = {
  Ing:    { pts: 15, kw: ['industrial engineer', 'ingeniero industrial', 'ingeniero', 'ingenieria', 'ingeniería', 'engineer', 'engineering'] },
  Eng:    { pts: 8,  kw: ['bilingüe', 'bilingual', 'english', 'inglés', 'ingles', 'fluent', 'native', 'nativo', 'c1', 'c2'] },
  Mat:    { pts: 4,  kw: ['math', 'analytics', 'data analysis', 'análisis de datos', 'analítica', 'estadística'] },
  Crea:   { pts: 3,  kw: ['creative', 'creatividad', 'innovation', 'innovación', 'design'] },
  Beca:   { pts: 5,  kw: ['beca', 'scholarship', 'honor', 'cum laude', 'becario'] },
  Gest:   { pts: 3,  kw: ['team lead', 'lideró', 'lidero', 'manager', 'gerente', 'jefe', 'supervisor', 'leadership', 'coordinator', 'coordinador'] },
  Com:    { pts: 3,  kw: ['communication', 'comunicación', 'public speaking', 'storytelling'] },
  Tech:   { pts: 4,  kw: ['cargowise', 'salesforce', 'hubspot', 'sap', 'odoo', 'crm', 'tableau', 'power bi', 'looker'] },
  Multi:  { pts: 5,  kw: ['international', 'internacional', 'multinational', 'multinacional', 'remote', 'global', 'usa', 'estados unidos', 'florida', 'miami'] },
  Comp:   { pts: 3,  kw: ['compras', 'procurement', 'sourcing', 'purchasing'] },
  Vend:   { pts: 4,  kw: ['ventas', 'sales', 'commercial', 'comercial', 'b2b'] },
  Log:    { pts: 5,  kw: ['logistic', 'logística', 'logistica', 'freight', 'forwarder', 'shipping', 'cadena de suministro', 'supply chain'] },
};

const ROLE_BONUS: Record<NonNullable<VacancyConfig['role_bonus']>, { pts: number; kw: string[] }> = {
  sales:         { pts: 10, kw: ['inside sales', 'sales rep', 'business develop', 'bdr', 'sdr', 'account executive', 'sales executive'] },
  pricing:       { pts: 10, kw: ['pricing', 'rate', 'tarifas', 'cotización', 'quoting'] },
  documentation: { pts: 10, kw: ['documentation', 'documentación', 'export documentation', 'compliance', 'aduanas', 'customs'] },
};

// ─── Score helper ────────────────────────────────────────────────────
function applyKeywordSet(textLower: string, dict: Record<string, { pts: number; kw: string[] }>) {
  const matched: Record<string, number> = {};
  let score = 0;
  for (const [k, v] of Object.entries(dict)) {
    for (const kw of v.kw) {
      if (textLower.includes(kw.toLowerCase())) {
        matched[k] = v.pts;
        score += v.pts;
        break;
      }
    }
  }
  return { score, matched };
}

// ─── Salary filter ────────────────────────────────────────────────────
function extractMonthlySalaryCop(text: string): number | null {
  const m = text.match(/Salario\s+(?:LinkedIn|esperado|expected)?:?\s*\$?\s*([\d.,]+)/i);
  if (!m) return null;
  const cleaned = m[1].replace(/[.,](?=\d{3}\b)/g, ''); // remove thousand separators
  const n = parseInt(cleaned.replace(/[^\d]/g, ''), 10);
  if (!isFinite(n)) return null;
  return n >= 1_000_000 ? n : n * 1000; // sometimes given in thousands
}

// ─── Public API ──────────────────────────────────────────────────────
export type PrefilterInput = {
  full_name: string;
  email: string;
  phone?: string | null;
  linkedin?: string | null;
  why_ts?: string | null;       // notes / motivation / parsed CV summary
  cv_data?: string | null;      // base64 or text
  job_id?: number | null;
};

export type PrefilterResult = {
  score: number;
  passed: boolean;
  decision: 'reviewing' | 'new' | 'rejected';
  category: 'TOP' | 'MEDIO' | 'BAJO' | 'FILTRO_DURO';
  breakdown: Record<string, number>;
  reasons: string[];
  vacancy_used: VacancyConfig | null;
  computed_at: string;
};

/**
 * Aplica el prefiltro 16 Mandamientos y devuelve la decisión.
 * Es síncrono y puro: no toca DB, no llama APIs externas.
 */
export function prefilter(input: PrefilterInput): PrefilterResult {
  const vacancy = input.job_id ? (VACANCY_CONFIG[input.job_id] ?? null) : null;

  // Quitar líneas que son anotaciones administrativas (líneas que empiezan
  // con "[" tipo "[Aplicó por correo a Pricing Junior - 29-Abr-2026]") y
  // quitar el job_title de la vacante para que la mención del rol en notas
  // no infle artificialmente el role_bonus.
  const adminLineStrip = (s: string) =>
    s.split('\n').filter(line => !line.trim().startsWith('[')).join(' ');
  const titleStrip = (s: string) =>
    vacancy ? s.replace(new RegExp(vacancy.job_title, 'gi'), '') : s;

  const cleanWhy = titleStrip(adminLineStrip(input.why_ts ?? ''));
  const cleanCv = titleStrip(typeof input.cv_data === 'string' ? input.cv_data.slice(0, 4000) : '');

  const text = [
    input.full_name ?? '',
    input.email ?? '',
    input.linkedin ?? '',
    cleanWhy,
    cleanCv,
  ].join(' ').toLowerCase();

  // 1) Score base 16 Mandamientos
  const base = applyKeywordSet(text, KEYWORDS);
  const breakdown = { ...base.matched };
  let score = base.score;

  // 2) Bonus de rol — se calcula sobre el mismo texto limpio (sin
  // mención del título del rol ni anotaciones admin)
  if (vacancy?.role_bonus) {
    const roleSet = { [vacancy.role_bonus]: ROLE_BONUS[vacancy.role_bonus] };
    const bonus = applyKeywordSet(text, roleSet);
    score += bonus.score;
    Object.assign(breakdown, bonus.matched);
  }

  // 3) Filtros duros
  const reasons: string[] = [];
  if (vacancy) {
    const sal = extractMonthlySalaryCop(input.why_ts ?? '');
    if (sal !== null && sal > vacancy.salary_cap_cop) {
      reasons.push(`salario_excede_tope (${sal.toLocaleString('es-CO')} > ${vacancy.salary_cap_cop.toLocaleString('es-CO')})`);
    }
    if (vacancy.requires_english) {
      const hasEnglish = breakdown['Eng'] !== undefined;
      // Si no hay señales de inglés en el texto, no marcamos rechazo automático todavía
      // porque el formulario público no siempre incluye idioma. Solo si el texto dice
      // explícitamente "no habla inglés" o "no english" rechazamos.
      const explicitNoEnglish = /no\s+(habla|tiene|maneja)\s+ingl[eé]s|no\s+english|sin\s+ingl[eé]s/i.test(input.why_ts ?? '');
      if (explicitNoEnglish && !hasEnglish) {
        reasons.push('no_habla_ingles_explicito');
      }
    }
  }

  // 4) Decisión
  // ────────────────────────────────────────────────────────────────────
  // POLÍTICA: el prefilter NUNCA auto-rechaza. La decisión final de
  // rechazo siempre la toma un humano (Kelly). Esto es deliberado:
  // - Score y reasons se guardan en prefilter_data para que el humano
  //   los vea y decida.
  // - Solo la ruta TOP avanza automáticamente a 'reviewing' (invitar
  //   a la prueba). Todo lo demás se queda en 'new' esperando revisión
  //   manual.
  // ────────────────────────────────────────────────────────────────────
  let decision: PrefilterResult['decision'];
  let category: PrefilterResult['category'];

  if (reasons.length > 0) {
    decision = 'new'; // pre antes era 'rejected' — ahora humano decide
    category = 'FILTRO_DURO';
  } else if (score >= 35) {
    decision = 'reviewing';
    category = 'TOP';
  } else if (score >= 20) {
    decision = 'new';
    category = 'MEDIO';
  } else {
    decision = 'new'; // antes era 'rejected' — ahora humano decide
    category = 'BAJO';
  }

  return {
    score,
    passed: decision !== 'rejected',
    decision,
    category,
    breakdown,
    reasons,
    vacancy_used: vacancy,
    computed_at: new Date().toISOString(),
  };
}

// ─── Helper: build prefilter_data JSON for storage ───────────────────
export function toPrefilterData(r: PrefilterResult) {
  return {
    score: r.score,
    passed: r.passed,
    category: r.category,
    breakdown: r.breakdown,
    reasons: r.reasons,
    vacancy: r.vacancy_used?.job_title ?? null,
    computed_at: r.computed_at,
    version: '1.0.0',
  };
}
