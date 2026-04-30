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
import { createDraftViaGmail, isGmailConnected } from "@/lib/gmail";

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

function buildRejectionHtml(name: string, clientName: string): string {
  const firstName = (name || "").split(" ")[0] || "candidato";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: Inter, -apple-system, sans-serif; line-height: 1.6; color: #1a1a1a; padding: 24px; background: #f9f9f9; }
  .container { max-width: 600px; margin: 0 auto; background: white; padding: 32px; border-radius: 12px; }
</style></head><body>
  <div class="container">
    <p>Hola <strong>${firstName}</strong>,</p>
    <p>Gracias por tu interés en formar parte de <strong>${clientName}</strong> y por dedicarle tiempo a nuestro proceso de selección.</p>
    <p>Después de revisar tu perfil, en este momento no continuaremos avanzando contigo en el proceso. Tu información queda en nuestra base de datos para futuras oportunidades que se ajusten mejor a tu experiencia.</p>
    <p>Te deseamos mucho éxito en tus próximos pasos profesionales.</p>
    <p>Un abrazo,<br><strong>Kelly Castañeda</strong><br>Talent Acquisition and Development Lead<br>${clientName}</p>
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
    .select("id, name, email, vacancy_id, prefilter_token_expires_at, prefilter_completed_at, ht_clients(name)")
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

    // Solo intentar crear draft si Gmail conectado; no bloquear si falla.
    try {
      const gmail = await isGmailConnected();
      if (gmail.connected) {
        // @ts-expect-error supabase relation
        const clientName = candidate.ht_clients?.name || "Trading Solutions";
        const draftRes = await createDraftViaGmail({
          to: candidate.email as string,
          subject: `Trading Solutions · Sobre tu aplicación`,
          html: buildRejectionHtml(candidate.name as string, clientName),
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

  const { error: updateErr } = await supabaseAdmin
    .from("ht_candidates")
    .update(updates)
    .eq("id", candidate.id);

  if (updateErr) {
    return NextResponse.json({ error: "save_failed", detail: updateErr.message }, { status: 500 });
  }

  // El candidato no ve la decisión — siempre recibe success.
  return NextResponse.json({ success: true });
}
