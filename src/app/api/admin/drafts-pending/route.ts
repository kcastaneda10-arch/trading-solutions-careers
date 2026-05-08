/**
 * GET /api/admin/drafts-pending
 *
 * Devuelve un contador agregado de drafts de Gmail que están listos para
 * que Kelly revise y envíe (todavía no enviados). Para alimentar el bell
 * badge del header.
 *
 * Sources:
 *   - ts_reminders_sent (recordatorios automáticos)
 *   - ts_interview_decisions sent_via_draft_id sin responded_at
 *   - ht_candidates rejection_draft_id de las últimas 48h
 *   - ht_candidates con stage assessment_invitado last 48h con draft_id
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const TS_CLIENT_ID = "98b62872-5767-4815-9b49-1394b9527c1f";

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  // 1. Recordatorios automáticos creados en últimas 48h
  const { count: remindersCount } = await supabaseAdmin
    .from("ts_reminders_sent")
    .select("*", { count: "exact", head: true })
    .gte("sent_at", since48h)
    .eq("channel", "email");

  // 2. Decision nudges con draft pero sin respuesta
  const { count: decisionsCount } = await supabaseAdmin
    .from("ts_interview_decisions")
    .select("*", { count: "exact", head: true })
    .is("responded_at", null)
    .gte("sent_at", since48h);

  // 3. Candidatos con rejection_draft_id reciente
  const { count: rejectionsCount } = await supabaseAdmin
    .from("ht_candidates")
    .select("*", { count: "exact", head: true })
    .eq("client_id", TS_CLIENT_ID)
    .not("rejection_draft_id", "is", null)
    .gte("rejected_at", since48h);

  const total = (remindersCount || 0) + (decisionsCount || 0) + (rejectionsCount || 0);

  return NextResponse.json({
    total,
    breakdown: {
      reminders: remindersCount || 0,
      decisions: decisionsCount || 0,
      rejections: rejectionsCount || 0,
    },
    since: since48h,
  });
}
