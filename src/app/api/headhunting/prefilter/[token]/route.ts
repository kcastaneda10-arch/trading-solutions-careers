/**
 * GET  /api/headhunting/prefilter/[token]  — valida token y devuelve datos del candidato
 * POST /api/headhunting/prefilter/[token]  — guarda respuestas + calcula decisión + crea
 *                                            draft de descarte si aplica
 *
 * Lógica de decisión salarial (regla Kelly):
 *   - salario lower bound ≤ techo            → 'pass'    (sigue en proceso)
 *   - techo < lower bound ≤ techo + 1M       → 'review'  (revisión humana)
 *   - lower bound > techo + 1M               → 'reject'  (auto-descarte + draft email)
 *
 * Ranges del form (lower bound):
 *   "< 3 M" → 0; "3 – 4 M" → 3M; "4 – 5 M" → 4M; ... "8 M+" → 8M
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createDraftViaGmail, isGmailConnected, sendViaGmail } from "@/lib/gmail";

// Techos por vacancy_id (en COP mensuales)
const SALARY_CAPS: Record<string, number> = {
  "368006e7-98da-46a2-b871-6b741290821b": 4_000_000, // Pricing Senior
  "c25ce70b-9244-4393-aea6-75372a99a6ef": 4_000_000, // Inside Sales
  "6e4838dd-8aea-4426-bd26-ea588f0f493a": 3_000_000, // Customer Documentation
  "d354c55a-eb1c-4aee-bd02-b0a20162e1f1": 3_500_000, // Pricing Junior
  "8c246bb3-8244-4755-bf92-58c0c627821c": 6_000_000, // Lead Accounting Finance
};

const SALARY_LOWER: Record<string, number> = {
  "< 3 M": 0,
  "3 – 4 M": 3_000_000,
  "4 – 5 M": 4_000_000,
  "5 – 6 M": 5_000_000,
  "6 – 7 M": 6_000_000,
  "7 – 8 M": 7_000_000,
  "8 M+": 8_000_000,
};

type Decision = "pass" | "review" | "reject";

function decideFromSalary(salaryRange: string, vacancyId: string): { decision: Decision; cap: number | null; lowerBound: number | null } {
  const cap = SALARY_CAPS[vacancyId] ?? null;
  const lower = SALARY_LOWER[salaryRange] ?? null;
  if (cap == null || lower == null) {
    // Sin cap configurado o rango desconocido → review (humano decide)
    return { decision: "review", cap, lowerBound: lower };
  }
  if (lower <= cap) return { decision: "pass", cap, lowerBound: lower };
  if (lower <= cap + 1_000_000) return { decision: "review", cap, lowerBound: lower };
  return { decision: "reject", cap, lowerBound: lower };
}

const TS_LINKEDIN_URL = "https://www.linkedin.com/company/trading-sol/";

// Auto-detección sencilla ES/EN basada en frecuencia de palabras-función.
function detectLanguage(...texts: (string | null | undefined)[]): "es" | "en" {
  const blob = texts.filter(Boolean).join(" ").toLowerCase();
  if (!blob.trim()) return "es";
  const ES = [" la ", " el ", " de ", " que ", " y ", " es ", " en ", " un ", " una ", " por ", " para ", " con ", " mi ", " soy ", "á", "é", "í", "ó", "ú", "ñ"];
  const EN = [" the ", " and ", " is ", " of ", " to ", " for ", " with ", " my ", " i ", " you ", " we ", " in ", " on ", " have ", " am "];
  let es = 0, en = 0;
  ES.forEach(w => { if (blob.includes(w)) es++; });
  EN.forEach(w => { if (blob.includes(w)) en++; });
  return en > es ? "en" : "es";
}

function buildRejectionHtmlEs(name: string, clientName: string, vacancyTitle: string): string {
  const firstName = (name || "").split(" ")[0] || "candidato";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: Inter, -apple-system, sans-serif; line-height: 1.6; color: #1a1a1a; padding: 24px; background: #f9f9f9; }
  .container { max-width: 600px; margin: 0 auto; background: white; padding: 32px; border-radius: 12px; }
  a { color: #2C64ED; }
</style></head><body>
  <div class="container">
    <p>Hola <strong>${firstName}</strong>,</p>
    <p>Gracias por tomarte el tiempo de aplicar a la posición de <strong>${vacancyTitle}</strong> en ${clientName}. Después de revisar tu aplicación, hemos decidido avanzar con otros candidatos cuyo perfil se ajusta más a la posición en este momento. Sin embargo, ${clientName} sigue creciendo y nos encantaría mantenernos en contacto.</p>
    <p>Tu información queda en nuestra base de datos para futuras oportunidades. También te invitamos a seguirnos en LinkedIn para enterarte de nuevas vacantes: <a href="${TS_LINKEDIN_URL}">${TS_LINKEDIN_URL}</a></p>
    <p>Apreciamos tu interés en ${clientName} y te deseamos mucho éxito en tus próximos pasos.</p>
    <p>Un abrazo,<br><strong>Kelly Castañeda</strong><br>Talent Acquisition and Development Lead<br>${clientName}</p>
  </div>
</body></html>`;
}

function buildRejectionHtmlEn(name: string, clientName: string, vacancyTitle: string): string {
  const firstName = (name || "").split(" ")[0] || "candidate";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: Inter, -apple-system, sans-serif; line-height: 1.6; color: #1a1a1a; padding: 24px; background: #f9f9f9; }
  .container { max-width: 600px; margin: 0 auto; background: white; padding: 32px; border-radius: 12px; }
  a { color: #2C64ED; }
</style></head><body>
  <div class="container">
    <p>Hi <strong>${firstName}</strong>,</p>
    <p>Thank you for taking the time to apply for the <strong>${vacancyTitle}</strong> position at ${clientName}. After reviewing your application, we have decided to move forward with other candidates whose profile is a closer match for the position at this time. However, ${clientName} is always growing and we'd love to keep in touch.</p>
    <p>Your information stays in our database for future opportunities. We also invite you to follow us on LinkedIn to stay updated on new openings: <a href="${TS_LINKEDIN_URL}">${TS_LINKEDIN_URL}</a></p>
    <p>We appreciate your interest in ${clientName} and thank you again. We sincerely wish you all the best in your future endeavors.</p>
    <p>Regards,<br><strong>Kelly Castañeda</strong><br>Talent Acquisition and Development Lead<br>${clientName}</p>
  </div>
</body></html>`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { data: candidate, error } = await supabaseAdmin
    .from("ht_candidates")
    .select("id, name, email, prefilter_token_expires_at, prefilter_completed_at, ht_vacancies(title), ht_clients(name)")
    .eq("prefilter_token", params.token)
    .single();

  if (error || !candidate) return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  if (candidate.prefilter_token_expires_at && new Date(candidate.prefilter_token_expires_at as string) < new Date()) {
    return NextResponse.json({ error: "expired_token" }, { status: 410 });
  }
  if (candidate.prefilter_completed_at) {
    return NextResponse.json({ error: "already_completed" }, { status: 409 });
  }

  return NextResponse.json({
    candidate: { id: candidate.id, name: candidate.name, email: candidate.email },
    // @ts-expect-error supabase relation
    vacancy: { title: candidate.ht_vacancies?.title || "la vacante" },
    // @ts-expect-error supabase relation
    client: { name: candidate.ht_clients?.name || "Trading Solutions" },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const body = await req.json();

  const { data: candidate, error } = await supabaseAdmin
    .from("ht_candidates")
    .select("id, name, email, vacancy_id, prefilter_token_expires_at, prefilter_completed_at, ht_clients(name), ht_vacancies(title)")
    .eq("prefilter_token", params.token)
    .single();

  if (error || !candidate) return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  if (candidate.prefilter_token_expires_at && new Date(candidate.prefilter_token_expires_at as string) < new Date()) {
    return NextResponse.json({ error: "expired_token" }, { status: 410 });
  }
  if (candidate.prefilter_completed_at) {
    return NextResponse.json({ error: "already_completed" }, { status: 409 });
  }

  // ─── Calcular decisión por salario ─────────────────────────────────
  const { decision, cap, lowerBound } = decideFromSalary(
    String(body.salary || ""),
    String(candidate.vacancy_id)
  );

  const updates: Record<string, unknown> = {
    prefilter_data: { ...body, _meta: { cap_used: cap, salary_lower_bound: lowerBound } },
    prefilter_decision: decision,
    prefilter_completed_at: new Date().toISOString(),
  };

  // Si decisión = reject → status='rejected' + crear draft de descarte
  if (decision === "reject") {
    updates.status = "rejected";

    // Auto-detectar idioma desde lo que el candidato escribió en el form
    const lang = detectLanguage(body.why_ts, body.next_role, body.extra, body.english_cert);
    // @ts-expect-error supabase relation
    const clientName = candidate.ht_clients?.name || "Trading Solutions";
    // @ts-expect-error supabase relation
    const vacancyTitle = candidate.ht_vacancies?.title || "the position";

    try {
      const gmail = await isGmailConnected();
      if (gmail.connected) {
        const subject = lang === "en"
          ? `Trading Solutions · About your application`
          : `Trading Solutions · Sobre tu aplicación`;
        const html = lang === "en"
          ? buildRejectionHtmlEn(candidate.name as string, clientName, vacancyTitle)
          : buildRejectionHtmlEs(candidate.name as string, clientName, vacancyTitle);
        const draftRes = await createDraftViaGmail({
          to: candidate.email as string,
          subject,
          html,
          fromName: "Kelly Castañeda",
        });
        if (draftRes.ok) {
          updates.rejection_draft_id = draftRes.draft_id;
        }
      }
    } catch (e) {
      console.error("Failed to create rejection draft:", e);
    }
  }

  // Actualizar stage según decisión
  if (decision === "pass") updates.stage = "prefiltro_pasado";
  else if (decision === "review") updates.stage = "prefiltro_revision";
  else if (decision === "reject") updates.stage = "rechazado";

  const { error: updateErr } = await supabaseAdmin
    .from("ht_candidates")
    .update(updates)
    .eq("id", candidate.id);

  if (updateErr) {
    return NextResponse.json({ error: "save_failed", detail: updateErr.message }, { status: 500 });
  }

  // ─── Notificación a Kelly (no bloqueante) ─────────────────────────
  try {
    const gmail = await isGmailConnected();
    if (gmail.connected) {
      // @ts-expect-error supabase relation
      const vacancyTitle = candidate.ht_vacancies?.title || "vacante";
      const decisionEmoji = decision === "pass" ? "✅" : decision === "review" ? "⚠️" : "❌";
      const decisionLabel = decision === "pass" ? "PASS" : decision === "review" ? "REVIEW" : "REJECT";
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://trading-solutions-careers.vercel.app";
      await sendViaGmail({
        to: "kcastaneda@tradingsolutions.com",
        subject: `[Prefiltro ${decisionLabel}] ${candidate.name} · ${vacancyTitle}`,
        html: `<!DOCTYPE html><html><body style="font-family: Inter, sans-serif; padding: 16px; color: #1a1a1a;">
          <p>Kelly, <strong>${candidate.name}</strong> acaba de completar el prefiltro.</p>
          <table style="border-collapse: collapse; margin: 12px 0;">
            <tr><td style="padding: 4px 12px 4px 0; color: #666;">Vacante:</td><td><strong>${vacancyTitle}</strong></td></tr>
            <tr><td style="padding: 4px 12px 4px 0; color: #666;">Email:</td><td>${candidate.email}</td></tr>
            <tr><td style="padding: 4px 12px 4px 0; color: #666;">Decisión:</td><td><strong>${decisionEmoji} ${decisionLabel}</strong></td></tr>
            <tr><td style="padding: 4px 12px 4px 0; color: #666;">Salario que pidió:</td><td>${body.salary || "—"}</td></tr>
            <tr><td style="padding: 4px 12px 4px 0; color: #666;">Inglés:</td><td>${body.english_level || "—"}</td></tr>
            <tr><td style="padding: 4px 12px 4px 0; color: #666;">Ciudad:</td><td>${body.city || "—"}</td></tr>
          </table>
          ${decision === "reject" ? `<p style="background: #FEF2F2; padding: 10px 14px; border-radius: 6px; color: #991B1B; font-size: 13px;">⚠️ Draft de descarte ya está en tu Gmail Drafts — revisa antes de enviar.</p>` : ""}
          <p><a href="${baseUrl}/hr-admin?tab=prefiltros" style="color: #2C64ED;">Ver en HR Admin →</a></p>
        </body></html>`,
        fromName: "Trading Solutions ATS",
      });
    }
  } catch (e) {
    console.error("Failed to send notification:", e);
  }

  // El candidato no ve la decisión — siempre recibe success.
  return NextResponse.json({ success: true });
}
