/**
 * GET /api/headhunting/ai-interview/[token]/audio
 *
 * Proxy del audio completo de la conversación de ElevenLabs.
 * Acepta conversation_id por query param (?cid=conv_xxx) como fallback
 * para casos donde la lectura de DB falla, y para mantener el endpoint
 * stateless cuando el audio_url ya viene precomputado en /finalize.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  const url = new URL(req.url);
  let conversationId: string | null = url.searchParams.get("cid");

  // Si no viene por query, lookup en DB
  if (!conversationId) {
    const { data, error } = await supabaseAdmin
      .from("ht_ai_interviews")
      .select("conversation_id")
      .eq("token", token)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "db_error", detail: error.message },
        { status: 500 }
      );
    }
    if (!data?.conversation_id) {
      return NextResponse.json(
        { error: "no_conversation_id", token_received: token, has_data: !!data },
        { status: 404 }
      );
    }
    conversationId = data.conversation_id;
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json(
      { error: "elevenlabs_not_configured" },
      { status: 503 }
    );
  }

  try {
    const r = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`,
      { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY } }
    );

    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      return NextResponse.json(
        { error: "elevenlabs_fetch_failed", status: r.status, detail: detail.slice(0, 200) },
        { status: 502 }
      );
    }

    const buffer = await r.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": r.headers.get("Content-Type") || "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": `inline; filename="entrevista-${conversationId}.mp3"`,
      },
    });
  } catch (err) {
    console.error("audio proxy error:", err);
    return NextResponse.json(
      { error: "internal_error", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
