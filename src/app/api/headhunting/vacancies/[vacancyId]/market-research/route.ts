/**
 * POST /api/headhunting/vacancies/[vacancyId]/market-research
 * GET  /api/headhunting/vacancies/[vacancyId]/market-research → último cacheado
 *
 * Genera un estudio de mercado completo para la vacante usando Claude:
 *   - Compensación COP (min/median/max) en mercado Colombia + LATAM remoto
 *   - Tiempos de reclutamiento típicos industria
 *   - Talent pool & demanda
 *   - Skills más demandadas 2026
 *   - Sourcing recommendations (LinkedIn search strings, universidades)
 *   - Riesgos del proceso (counter-offers, drop-off típicos)
 *   - Recomendaciones tácticas (outreach, beneficios a destacar)
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (_anthropic) return _anthropic;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY no configurado");
  _anthropic = new Anthropic({ apiKey: key });
  return _anthropic;
}

const MODEL = "claude-sonnet-4-20250514";

const MARKET_RESEARCH_PROMPT = `Eres un consultor experto en mercado laboral de logística internacional / freight forwarding en Colombia y LATAM. Conoces a fondo: compensación, tiempos de reclutamiento, talent pool, sourcing, beneficios típicos.

VACANTE:
- Título: {vacancy_title}
- Área: {vacancy_area}
- Nivel: {role_level}
- Empresa: Trading Solutions (logística internacional, base Barranquilla Colombia, ~70 colaboradores)
- Industria: Freight forwarding, comex, logística internacional

TARGETS DE LA EMPRESA:
- Time-to-fill target: {target_days} días
- Top performers internos perfil promedio: alto IQ (117), alta Conscientiousness (78), bajo Neuroticism (30), inglés B2+

Genera un estudio de mercado COMPLETO. Devuelve SOLO un JSON estricto sin texto extra:

{
  "exec_summary": "<3-4 oraciones · qué tan competitivo es buscar este perfil HOY en Colombia, key challenges>",

  "compensation": {
    "currency": "COP",
    "base_monthly_min": <number>,
    "base_monthly_median": <number>,
    "base_monthly_max": <number>,
    "total_annual_min": <number>,
    "total_annual_median": <number>,
    "total_annual_max": <number>,
    "typical_bonuses": ["<tipo de bono>", "..."],
    "benefits_market_standard": ["<beneficio>", "..."],
    "latam_remote_comparison": "<comparación con LATAM remoto si aplica>",
    "sources_referenced": ["<Computrabajo/LinkedIn Salary/Glassdoor/...>"],
    "notes": "<cualquier nota importante de contexto>"
  },

  "recruiting_timeline": {
    "industry_avg_ttf_days_min": <number>,
    "industry_avg_ttf_days_max": <number>,
    "ts_target_days": <number>,
    "comparison": "<está TS por encima/abajo del benchmark, comentario>",
    "candidate_in_market_days_typical": <number>,
    "factors_speeding_up": ["<factor>", "..."],
    "factors_slowing_down": ["<factor>", "..."]
  },

  "talent_landscape": {
    "pool_size_estimate": "<grande/medio/pequeño>",
    "pool_size_explanation": "<por qué>",
    "demand_level": "<alta/media/baja>",
    "supply_demand_balance": "<favorable a empleador / equilibrado / favorable a candidato>",
    "main_competing_companies": ["<empresa>", "..."],
    "active_passive_ratio": "<estimación %active vs %passive talent>",
    "geographic_hotspots": ["<ciudad>", "..."]
  },

  "in_demand_skills_2026": {
    "must_have_technical": ["<skill>", "..."],
    "must_have_soft": ["<skill>", "..."],
    "nice_to_have": ["<skill>", "..."],
    "emerging_trends": ["<tendencia>", "..."]
  },

  "sourcing_strategy": {
    "linkedin_search_strings": [
      "<query LinkedIn Recruiter usable>",
      "<...>"
    ],
    "universities_to_target": ["<universidad>", "..."],
    "industry_associations": ["<asociación>", "..."],
    "communities_groups": ["<grupo/community>", "..."],
    "alternative_channels": ["<canal>", "..."],
    "outreach_message_template": "<mensaje sugerido de 3-4 oraciones para LinkedIn InMail o email frío>"
  },

  "process_risks": {
    "counter_offer_likelihood": "<alta/media/baja>",
    "counter_offer_explanation": "<por qué>",
    "common_dropout_reasons": ["<razón>", "..."],
    "red_flags_in_candidates": ["<red flag>", "..."],
    "negotiation_pain_points": ["<punto de fricción típico>", "..."]
  },

  "tactical_recommendations": {
    "ts_value_props_to_highlight": ["<diferencial TS>", "..."],
    "what_to_avoid_saying": ["<frase/promesa a evitar>", "..."],
    "interview_focus_areas": ["<área a profundizar>", "..."],
    "decision_speed_recommended_days": <number>,
    "salary_negotiation_strategy": "<estrategia recomendada>"
  },

  "competitive_intelligence": {
    "typical_offer_packages": "<descripción del paquete típico de competidores>",
    "ts_advantages": ["<ventaja>", "..."],
    "ts_disadvantages": ["<desventaja>", "..."],
    "differentiators_to_communicate": ["<diferenciador>", "..."]
  }
}

REGLAS:
- Sé ESPECÍFICO con números (rango salarial real Colombia 2026, no genérico)
- Para Pricing Junior entry: rango típico Barranquilla 2.5-4.5M COP base
- Para Pricing Senior / Lead: 5-9M COP
- Para C-Suite / Director: 12-25M+ COP
- Inglés B2+ premium 15-25% sobre base
- Industria logística freight forwarding tiene oferta limitada vs demanda → favorable al candidato
- Universidades clave Barranquilla: Universidad del Norte, Universidad del Atlántico, Universidad Tecnológica de Bolívar (Cartagena)
- LinkedIn search strings deben ser usables literalmente en LinkedIn Recruiter
- NO inventes data falsa: si no estás seguro, dilo en notes
- Output: SOLO el JSON, sin texto adicional ni markdown`;

export async function GET(
  req: NextRequest,
  { params }: { params: { vacancyId: string } }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { vacancyId } = params;
  const { data, error } = await supabaseAdmin
    .from("ts_market_research")
    .select("*")
    .eq("vacancy_id", vacancyId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ research: data });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { vacancyId: string } }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { vacancyId } = params;

    const { data: vacancy, error: vErr } = await supabaseAdmin
      .from("ht_vacancies")
      .select("id, title, area, role_level, vacancy_type")
      .eq("id", vacancyId)
      .single();

    if (vErr || !vacancy) {
      return NextResponse.json({ error: "Vacante no encontrada" }, { status: 404 });
    }

    // Target RYS-híbrido por (role_level, vacancy_type)
    const { data: targetRow } = await supabaseAdmin
      .from("ts_targets")
      .select("target_days_to_fill")
      .eq("role_level", vacancy.role_level || "entry")
      .eq("vacancy_type", vacancy.vacancy_type || "incremental")
      .maybeSingle();
    const fallback = vacancy.role_level === 'c_suite'
      ? (vacancy.vacancy_type === 'reemplazo' ? 60 : 80)
      : (vacancy.vacancy_type === 'reemplazo' ? 35 : 50);
    const targetDays = targetRow?.target_days_to_fill || fallback;

    const prompt = MARKET_RESEARCH_PROMPT
      .replace("{vacancy_title}", vacancy.title)
      .replace("{vacancy_area}", vacancy.area || "—")
      .replace("{role_level}", vacancy.role_level || "entry")
      .replace("{target_days}", String(targetDays))
      .replace("{target_days}", String(targetDays));

    const aiResult = await getAnthropic().messages.create({
      model: MODEL,
      max_tokens: 4500,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    });

    const text = aiResult.content[0].type === "text" ? aiResult.content[0].text : "";
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) {
      return NextResponse.json(
        { error: "AI no devolvió JSON válido", raw: text.slice(0, 400) },
        { status: 502 }
      );
    }

    const report = JSON.parse(m[0]);

    // Save to cache
    const { data: saved, error: insErr } = await supabaseAdmin
      .from("ts_market_research")
      .insert({
        vacancy_id: vacancyId,
        model: MODEL,
        report: report,
        exec_summary: report.exec_summary,
        comp_min: report.compensation?.base_monthly_min || null,
        comp_median: report.compensation?.base_monthly_median || null,
        comp_max: report.compensation?.base_monthly_max || null,
        ttf_industry_min: report.recruiting_timeline?.industry_avg_ttf_days_min || null,
        ttf_industry_max: report.recruiting_timeline?.industry_avg_ttf_days_max || null,
        talent_pool_size: report.talent_landscape?.pool_size_estimate || null,
      })
      .select()
      .single();

    if (insErr) {
      console.error("save research error:", insErr);
    }

    return NextResponse.json({ success: true, research: saved || { report } });
  } catch (err: any) {
    console.error("market research error:", err);
    return NextResponse.json(
      { error: "Error interno", detail: err?.message || String(err) },
      { status: 500 }
    );
  }
}
