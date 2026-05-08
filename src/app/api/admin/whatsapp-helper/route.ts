/**
 * GET /api/admin/whatsapp-helper?candidate_id=UUID&scenario=prefilter_pending&iteration=1
 *
 * Devuelve el mensaje WhatsApp listo para click-to-send con:
 *   - phone formateado (+57)
 *   - text rendereado con variables del candidato
 *   - wa_link directo (https://wa.me/...)  ← abre WhatsApp Web/app con todo pre-cargado
 *
 * También permite scenario=auto · detecta automáticamente la regla aplicable
 * según el stage actual del candidato.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import {
  getActiveReminderRules,
  renderTemplate,
  getIterationForDays,
  getLanguage,
  buildWhatsAppLink,
} from "@/lib/reminder-templates";
import crypto from "crypto";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://trading-solutions-careers.vercel.app";

// Refresca el token según stage · garantiza que el WhatsApp manda un enlace de 7 días.
async function refreshTokenIfNeeded(cand: any): Promise<{ prefilterToken: string | null; assessmentToken: string | null }> {
  const stage = cand.stage || "";
  let prefilterToken = cand.prefilter_token;
  let assessmentToken = cand.assessment_token;
  const updates: Record<string, unknown> = {};

  if (stage.startsWith("prefiltro_")) {
    prefilterToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    updates.prefilter_token = prefilterToken;
    updates.prefilter_token_expires_at = expiresAt.toISOString();
  }
  if (stage.startsWith("assessment_")) {
    assessmentToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    updates.assessment_token = assessmentToken;
    updates.token_expires_at = expiresAt.toISOString();
  }
  if (Object.keys(updates).length > 0) {
    await supabaseAdmin.from("ht_candidates").update(updates).eq("id", cand.id);
  }
  return { prefilterToken, assessmentToken };
}

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const url = new URL(req.url);
  const candidateId = url.searchParams.get("candidate_id");
  const scenario = url.searchParams.get("scenario") || "auto";
  const iterationParam = url.searchParams.get("iteration");

  if (!candidateId) {
    return NextResponse.json({ error: "Falta ?candidate_id=" }, { status: 400 });
  }

  const { data: cand } = await supabaseAdmin
    .from("ht_candidates")
    .select("id, name, email, phone, stage, updated_at, vacancy_id, preferred_language, ht_vacancies(title), prefilter_token, assessment_token")
    .eq("id", candidateId)
    .maybeSingle();

  if (!cand) return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });

  const rules = await getActiveReminderRules();
  let rule = scenario === "auto"
    ? rules.find(r => r.stage_codes.includes(cand.stage || ""))
    : rules.find(r => r.scenario_key === scenario);

  if (!rule) {
    return NextResponse.json({
      error: "Sin regla aplicable",
      stage: cand.stage,
      available_scenarios: rules.map(r => r.scenario_key),
    }, { status: 404 });
  }

  // Determinar iteración
  const daysInStage = cand.updated_at
    ? Math.floor((Date.now() - new Date(cand.updated_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  let iteration = iterationParam ? parseInt(iterationParam, 10) : getIterationForDays(daysInStage, rule.reminder_days);
  if (iteration === null || iteration < 1) iteration = 1; // si todavía no debería mandar, ofrecer la 1ra
  if (iteration > rule.max_iterations) iteration = rule.max_iterations;

  const lang = getLanguage(cand);
  const tpl = rule.templates?.[String(iteration)]?.[lang];
  if (!tpl?.whatsapp) {
    return NextResponse.json({ error: "Sin template WhatsApp para esta combinación", iteration, lang }, { status: 404 });
  }

  const firstName = (cand.name || "").split(" ")[0] || "candidato";
  // @ts-expect-error supabase relation
  const vacancyTitle = cand.ht_vacancies?.title || "la vacante";

  // Refrescar token · cada vez que generes un link de WhatsApp, queda válido 7 días desde hoy
  const { prefilterToken, assessmentToken } = await refreshTokenIfNeeded(cand);
  const prefilterUrl = prefilterToken ? `${APP_URL}/prefiltro/${prefilterToken}` : "";
  const assessmentUrl = assessmentToken ? `${APP_URL}/assessment/ht/${assessmentToken}` : "";

  const rendered = renderTemplate(tpl, {
    firstName,
    vacancy: vacancyTitle,
    prefilter_url: prefilterUrl,
    assessment_url: assessmentUrl,
  });

  const waLink = buildWhatsAppLink(cand.phone, rendered.whatsapp || "");

  return NextResponse.json({
    candidate: { id: cand.id, name: cand.name, phone: cand.phone, language: lang },
    scenario: rule.scenario_key,
    iteration,
    days_in_stage: daysInStage,
    text: rendered.whatsapp,
    wa_link: waLink,
    note: waLink ? null : "Sin teléfono válido · agregalo al perfil del candidato para usar este flujo",
  });
}
