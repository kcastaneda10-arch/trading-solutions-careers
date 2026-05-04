/**
 * GET /api/admin/diag/audio?email=...
 *
 * Endpoint de diagnóstico (admin only). Devuelve info estructurada de la
 * entrevista IA del candidato — para debugear por qué el audio no carga.
 *
 * Tambien ejecuta un HEAD upstream a ElevenLabs para confirmar que el
 * conversation_id existe del lado de ellos y devuelve status code.
 *
 * NO devuelve el audio en sí, solo metadata. Seguro para diagnostico.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  const candidateId = url.searchParams.get("candidate_id");

  if (!email && !candidateId) {
    return NextResponse.json({ error: "Pasá ?email=foo@bar.com o ?candidate_id=UUID" }, { status: 400 });
  }

  // Buscar candidato
  let candQuery = supabaseAdmin
    .from("ht_candidates")
    .select("id, name, email, stage")
    .limit(1);
  if (email) candQuery = candQuery.ilike("email", email);
  if (candidateId) candQuery = candQuery.eq("id", candidateId);
  const { data: cand } = await candQuery.maybeSingle();

  if (!cand) return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });

  // Buscar última entrevista IA
  const { data: ai } = await supabaseAdmin
    .from("ht_ai_interviews")
    .select("id, token, conversation_id, audio_url, status, ai_score, completed_at, created_at")
    .eq("candidate_id", cand.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!ai) {
    return NextResponse.json({
      candidate: cand,
      interview: null,
      diagnosis: "Sin entrevistas IA registradas",
    });
  }

  // Diagnóstico estructurado
  const diagnosis: any = {
    has_conversation_id: !!ai.conversation_id,
    conversation_id_format: ai.conversation_id
      ? (ai.conversation_id.startsWith('conv_') ? 'OK_conv_prefix' : 'UNUSUAL_format')
      : null,
    has_audio_url: !!ai.audio_url,
    audio_url_kind: ai.audio_url
      ? (ai.audio_url.includes('localhost') ? 'BAD_localhost'
        : ai.audio_url.startsWith('https://api.elevenlabs') ? 'DIRECT_elevenlabs'
        : ai.audio_url.includes('/api/headhunting/ai-interview') ? 'PROXY_OK'
        : 'OTHER')
      : null,
    elevenlabs_api_key_configured: !!process.env.ELEVENLABS_API_KEY,
  };

  // Probar HEAD a ElevenLabs si hay conversation_id + API key
  let elevenlabs_check: any = null;
  if (ai.conversation_id && process.env.ELEVENLABS_API_KEY) {
    try {
      const r = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversations/${ai.conversation_id}/audio`,
        { method: "HEAD", headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY } }
      );
      elevenlabs_check = {
        status: r.status,
        ok: r.ok,
        content_type: r.headers.get('content-type'),
        content_length: r.headers.get('content-length'),
      };
    } catch (e: any) {
      elevenlabs_check = { error: e?.message || String(e) };
    }
  }

  // Recomendación de fix
  let recommendation = "OK";
  if (!ai.conversation_id) recommendation = "Falta conversation_id — refrescar entrevista o reenviar";
  else if (!ai.audio_url) recommendation = "audio_url null — regenerar desde finalize endpoint";
  else if (diagnosis.audio_url_kind === 'BAD_localhost') recommendation = "audio_url tiene localhost — regenerar con base_url correcto";
  else if (elevenlabs_check?.status === 404) recommendation = "ElevenLabs no tiene audio para este conversation_id (puede haber expirado o nunca se grabó)";
  else if (elevenlabs_check?.status === 401) recommendation = "ELEVENLABS_API_KEY inválida o expirada";
  else if (elevenlabs_check && !elevenlabs_check.ok) recommendation = `ElevenLabs devuelve ${elevenlabs_check.status}`;

  return NextResponse.json({
    candidate: cand,
    interview: {
      id: ai.id,
      token: ai.token,
      status: ai.status,
      ai_score: ai.ai_score,
      completed_at: ai.completed_at,
      conversation_id: ai.conversation_id,
      audio_url: ai.audio_url,
    },
    diagnosis,
    elevenlabs_check,
    recommendation,
  });
}
