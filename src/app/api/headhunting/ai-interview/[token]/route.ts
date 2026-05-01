/**
 * GET /api/headhunting/ai-interview/[token]
 *
 * Valida el token de entrevista IA y devuelve la configuración necesaria
 * para que la página candidate-facing inicie la conversación con ElevenLabs.
 *
 * Devuelve:
 *   - candidate (nombre, email)
 *   - vacancy (título, área)
 *   - client (nombre)
 *   - agent_id (ElevenLabs)
 *   - signed_url (para iniciar la conversación con vars dinámicas pre-llenadas)
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  const { data: interview, error } = await supabaseAdmin
    .from("ht_ai_interviews")
    .select("*, ht_candidates(id, name, email, vacancy_id, ht_vacancies(title, area, model_id), ht_clients(name))")
    .eq("token", token)
    .single();

  if (error || !interview) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  if (new Date(interview.token_expires_at) < new Date()) {
    return NextResponse.json({ error: "expired_token" }, { status: 410 });
  }

  if (interview.status === "completed") {
    return NextResponse.json({ error: "already_completed" }, { status: 409 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidate = (interview as any).ht_candidates;
  const vacancy = candidate?.ht_vacancies;
  const client = candidate?.ht_clients;

  // Get a signed URL from ElevenLabs API to start the conversation
  // (this is the recommended approach — keeps API key server-side)
  let signedUrl: string | null = null;
  let dynamicVars: Record<string, string> = {};

  if (process.env.ELEVENLABS_API_KEY && interview.agent_id) {
    try {
      // Build dynamic variables for the agent prompt
      dynamicVars = {
        candidate_name: candidate?.name || "candidato",
        first_name: (candidate?.name || "").split(" ")[0] || "candidato",
        vacancy_title: vacancy?.title || "la vacante",
        vacancy_area: vacancy?.area || "—",
        client_name: client?.name || "Trading Solutions",
        recruiter_name: "Kelly Castañeda",
      };

      // Request signed URL from ElevenLabs
      const url = `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${interview.agent_id}`;
      const r = await fetch(url, {
        headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY },
      });
      if (r.ok) {
        const j = await r.json();
        signedUrl = j.signed_url;
      } else {
        console.error("ElevenLabs signed URL failed:", r.status, await r.text());
      }
    } catch (e) {
      console.error("ElevenLabs signed URL error:", e);
    }
  }

  // Mark as in_progress when first accessed
  if (interview.status === "invited") {
    await supabaseAdmin
      .from("ht_ai_interviews")
      .update({ status: "in_progress", started_at: new Date().toISOString() })
      .eq("id", interview.id);
  }

  return NextResponse.json({
    interview_id: interview.id,
    candidate: { id: candidate?.id, name: candidate?.name, email: candidate?.email },
    vacancy: vacancy ? { title: vacancy.title, area: vacancy.area } : null,
    client: client || { name: "Trading Solutions" },
    agent_id: interview.agent_id,
    signed_url: signedUrl,
    dynamic_variables: dynamicVars,
  });
}
