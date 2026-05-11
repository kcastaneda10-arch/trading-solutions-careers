/**
 * GET  /api/joint-schedulings/[token]              · candidate-facing · info + slots disponibles
 * POST /api/joint-schedulings/[token]/book         · candidate-facing · agendar slot elegido (en /book)
 *
 * Este endpoint NO requiere admin auth · el candidato lo accede con su token.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { computeAvailableSlots } from "@/lib/google-calendar";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { data: session, error } = await supabaseAdmin
      .from("ts_joint_schedulings")
      .select("*")
      .eq("token", params.token)
      .maybeSingle();

    if (error || !session) {
      return NextResponse.json({ error: "invalid_token" }, { status: 404 });
    }

    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: "expired", session: { candidate_name: session.candidate_name } }, { status: 410 });
    }

    if (session.status === "scheduled") {
      return NextResponse.json({
        already_scheduled: true,
        session: {
          candidate_name: session.candidate_name,
          vacancy_title: session.vacancy_title,
          scheduled_slot_start: session.scheduled_slot_start,
          scheduled_slot_end: session.scheduled_slot_end,
          meet_url: session.meet_url,
          interviewer_names: session.interviewer_names,
        },
      });
    }

    // Calcular slots disponibles
    let slots: any[] = [];
    let errors: Record<string, string> = {};
    try {
      const result = await computeAvailableSlots({
        emails: session.interviewer_emails,
        windowStart: new Date().toISOString(),
        windowEnd: session.window_end,
        durationMinutes: session.duration_minutes,
        businessHoursStart: session.business_hours_start,
        businessHoursEnd: session.business_hours_end,
        bufferMinutes: session.buffer_minutes,
        timezone: session.timezone,
      });
      slots = result.slots;
      errors = result.errors;
    } catch (e: any) {
      return NextResponse.json({
        error: "calendar_error",
        detail: e?.message,
        session: {
          candidate_name: session.candidate_name,
          interviewer_names: session.interviewer_names,
          interviewer_emails: session.interviewer_emails,
        },
      }, { status: 500 });
    }

    return NextResponse.json({
      session: {
        candidate_name: session.candidate_name,
        vacancy_title: session.vacancy_title,
        interviewer_names: session.interviewer_names,
        interviewer_emails: session.interviewer_emails,
        duration_minutes: session.duration_minutes,
        timezone: session.timezone,
        description: session.description,
      },
      slots,
      slot_errors: errors,  // si algún calendario no se pudo leer
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 });
  }
}
