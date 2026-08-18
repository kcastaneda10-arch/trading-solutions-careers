/**
 * GET /api/admin/upcoming-interviews
 *
 * Devuelve las entrevistas próximas/pendientes para Kelly:
 *   - scheduled_today: candidatos con calendly_scheduled_at = hoy
 *   - pending_eval: candidatos en stage `recruiter_interview` sin ts_recruiter_assessments
 *   - cwo_pending: candidatos esperando decisión del Hiring Lead (stage `terna`).
 *                  La clave conserva el nombre viejo porque el HR Admin la lee así;
 *                  el stage `cwo_interview` se consolidó en `terna` en v4.
 *   - calendly_sent_no_book: invitación Calendly enviada pero candidato no agendó
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const TS_CLIENT_ID = "98b62872-5767-4815-9b49-1394b9527c1f";

function startOfDay(d: Date): Date {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
}
function endOfDay(d: Date): Date {
  const x = new Date(d); x.setHours(23, 59, 59, 999); return x;
}

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);

    // Pull candidatos en stages relevantes
    const { data: cands } = await supabaseAdmin
      .from("ht_candidates")
      .select("id, name, email, phone, vacancy_id, stage, status, updated_at, calendly_invitation_sent_at, calendly_scheduled_at, calendly_event_url, ht_vacancies(title), prefilter_completed_at")
      .eq("client_id", TS_CLIENT_ID)
      // Filtro a nivel BD · normalizeStage no aplica acá, tienen que ser
      // codes v4 vivos o la consulta vuelve vacía.
      .in("stage", ["recruiter_interview", "prueba_tecnica", "terna"])
      .order("updated_at", { ascending: false });

    // Pull recruiter assessments para saber cuáles ya están evaluados
    const candIds = (cands || []).map(c => c.id);
    const { data: assessments } = candIds.length > 0
      ? await supabaseAdmin
          .from("ts_recruiter_assessments")
          .select("candidate_id, verdict, interview_date")
          .in("candidate_id", candIds)
      : { data: [] };

    const evaluatedSet = new Set((assessments || []).map(a => a.candidate_id));
    const verdictByCand: Record<string, string> = {};
    (assessments || []).forEach(a => { verdictByCand[a.candidate_id] = a.verdict; });

    type CandRow = any;
    const enrich = (c: CandRow) => ({
      candidate_id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      vacancy_id: c.vacancy_id,
      vacancy_title: (c as any).ht_vacancies?.title || "—",
      stage: c.stage,
      status: c.status,
      updated_at: c.updated_at,
      days_in_stage: c.updated_at ? Math.floor((Date.now() - new Date(c.updated_at).getTime()) / 86400000) : null,
      calendly_sent_at: c.calendly_invitation_sent_at,
      calendly_scheduled_at: c.calendly_scheduled_at,
      calendly_event_url: c.calendly_event_url,
      has_assessment: evaluatedSet.has(c.id),
      assessment_verdict: verdictByCand[c.id] || null,
    });

    const all = (cands || []).map(enrich);

    // ─── Buckets ───
    const scheduledToday = all.filter(c => {
      if (!c.calendly_scheduled_at) return false;
      const d = new Date(c.calendly_scheduled_at);
      return d >= todayStart && d <= todayEnd;
    }).sort((a, b) => new Date(a.calendly_scheduled_at!).getTime() - new Date(b.calendly_scheduled_at!).getTime());

    const scheduledThisWeek = all.filter(c => {
      if (!c.calendly_scheduled_at) return false;
      const d = new Date(c.calendly_scheduled_at);
      return d > todayEnd && d <= weekEnd;
    }).sort((a, b) => new Date(a.calendly_scheduled_at!).getTime() - new Date(b.calendly_scheduled_at!).getTime());

    const pendingEval = all.filter(c =>
      c.stage === "recruiter_interview" && !c.has_assessment
    );

    const calendlyPending = all.filter(c =>
      c.calendly_sent_at && !c.calendly_scheduled_at && !c.has_assessment
    );

    // La entrevista con CWO ya no existe: quien espera decisión es el Hiring
    // Lead con la terna en la mano.
    const cwoPending = all.filter(c => c.stage === "terna");

    return NextResponse.json({
      generated_at: now.toISOString(),
      counts: {
        scheduled_today: scheduledToday.length,
        scheduled_this_week: scheduledThisWeek.length,
        pending_eval: pendingEval.length,
        calendly_pending: calendlyPending.length,
        cwo_pending: cwoPending.length,
      },
      scheduled_today: scheduledToday,
      scheduled_this_week: scheduledThisWeek,
      pending_eval: pendingEval,
      calendly_pending: calendlyPending,
      cwo_pending: cwoPending,
    });
  } catch (err: any) {
    console.error("upcoming-interviews error:", err);
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 });
  }
}
