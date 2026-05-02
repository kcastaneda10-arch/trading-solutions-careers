/**
 * GET /api/onboarding
 *
 * Lista de onboardings con cálculos de progreso, días desde start, milestone actual, riesgo.
 * Usado por la tab Onboarding del HR Admin.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { computeProgress, daysSinceStart, currentMilestone, OnboardingTask } from "@/lib/onboarding-tasks";

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const url = new URL(req.url);
  const status = url.searchParams.get("status"); // 'active' = excluding completed

  let q = supabaseAdmin
    .from("ts_onboarding")
    .select("*, person:ts_people(id, name, email, role, area, role_level, start_date, status, manager_email, buddy_email, location)")
    .order("start_date", { ascending: false });

  if (status === "active") {
    q = q.neq("status", "completed");
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = (data || []).map((o: any) => {
    const tasks = (o.tasks || []) as OnboardingTask[];
    const prog = computeProgress(tasks);
    const days = o.start_date ? daysSinceStart(o.start_date) : 0;
    const milestone = currentMilestone(days);

    // Health: at_risk si en milestone day30+ y progress < 50%, o si day1 incomplete después de 3 días
    let health: 'on_track' | 'behind' | 'at_risk' = 'on_track';
    if (milestone === 'day1' && days > 3 && prog.byMilestone.day1.pct < 100) health = 'at_risk';
    else if (milestone === 'week1' && days > 10 && prog.byMilestone.week1.pct < 80) health = 'behind';
    else if (milestone === 'day30' && prog.byMilestone.day30.pct < 50) health = 'behind';
    else if (days > 90 && o.status !== 'completed') health = 'at_risk';

    // Next pending task in current milestone or earlier
    const allMs = ['day1','week1','day30','day60','day90'];
    const currentMsIdx = allMs.indexOf(milestone);
    const nextTask = tasks
      .filter(t => !t.done)
      .filter(t => allMs.indexOf(t.milestone) <= currentMsIdx)
      .sort((a, b) => allMs.indexOf(a.milestone) - allMs.indexOf(b.milestone))[0];

    return {
      id: o.id,
      person: o.person,
      start_date: o.start_date,
      status: o.status,
      days_since_start: days,
      current_milestone: milestone,
      progress: prog,
      health,
      next_task: nextTask ? {
        id: nextTask.id,
        label: nextTask.label,
        owner: nextTask.owner,
        milestone: nextTask.milestone,
      } : null,
      ramp_up_score: o.ramp_up_score,
    };
  });

  return NextResponse.json({ onboardings: enriched, total: enriched.length });
}
