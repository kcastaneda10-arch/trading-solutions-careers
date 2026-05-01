/**
 * GET /api/headhunting/ai-interview/[token]/audio
 *
 * Proxy del audio completo de la conversación de ElevenLabs. Permite
 * embeber un <audio> tag en el panel de admin sin exponer el API key.
 *
 * Internamente: fetch a /v1/convai/conversations/{id}/audio con xi-api-key,
 * stream del binario de vuelta al navegador.
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
    .select("conversation_id")
    .eq("token", token)
    .single();

  if (error || !interview?.conversation_id) {
    return NextResponse.json({ error: "no_audio" }, { status: 404 });
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: "elevenlabs_not_configured" }, { status: 503 });
  }

  try {
    const r = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${interview.conversation_id}/audio`,
      { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY } }
    );

    if (!r.ok) {
      return NextResponse.json(
        { error: "fetch_failed", status: r.status },
        { status: 502 }
      );
    }

    const buffer = await r.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": r.headers.get("Content-Type") || "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": `inline; filename="entrevista-${interview.conversation_id}.mp3"`,
      },
    });
  } catch (err) {
    console.error("audio proxy error:", err);
    return NextResponse.json(
      { error: "Error interno", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
