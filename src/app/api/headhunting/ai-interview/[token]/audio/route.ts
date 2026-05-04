/**
 * GET /api/headhunting/ai-interview/[token]/audio
 *
 * Streams el audio de la conversación de ElevenLabs sin buffearlo en memoria.
 * Soporta Range requests para que el <audio> pueda hacer seek y empezar a
 * reproducir antes de descargar el archivo completo.
 *
 * Acepta conversation_id por query param (?cid=conv_xxx) para mantener el
 * endpoint stateless cuando el audio_url viene precomputado en /finalize.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Forzar runtime Node.js para soportar streaming de body grande
export const runtime = "nodejs";
// Permitir respuestas largas (Vercel free: 30s; pro: 60s+)
export const maxDuration = 60;

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
      return NextResponse.json({ error: "db_error", detail: error.message }, { status: 500 });
    }
    if (!data?.conversation_id) {
      return NextResponse.json({ error: "no_conversation_id" }, { status: 404 });
    }
    conversationId = data.conversation_id;
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: "elevenlabs_not_configured" }, { status: 503 });
  }

  try {
    // Forward Range header desde el cliente para soporte de seek nativo
    const rangeHeader = req.headers.get("range");
    const upstreamHeaders: Record<string, string> = {
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
    };
    if (rangeHeader) {
      upstreamHeaders["Range"] = rangeHeader;
    }

    const r = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`,
      { headers: upstreamHeaders }
    );

    if (!r.ok && r.status !== 206) {
      const detail = await r.text().catch(() => "");
      return NextResponse.json(
        { error: "elevenlabs_fetch_failed", status: r.status, detail: detail.slice(0, 200) },
        { status: 502 }
      );
    }

    // Construir headers de respuesta — propagamos los relevantes para streaming
    const responseHeaders = new Headers({
      "Content-Type": r.headers.get("Content-Type") || "audio/mpeg",
      "Accept-Ranges": "bytes",
      // Cache 1h client + 5min CDN
      "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
      "Content-Disposition": `inline; filename="entrevista-${conversationId}.mp3"`,
    });

    // Propagar Content-Length / Content-Range si vienen
    const cl = r.headers.get("Content-Length");
    if (cl) responseHeaders.set("Content-Length", cl);
    const cr = r.headers.get("Content-Range");
    if (cr) responseHeaders.set("Content-Range", cr);

    // ✨ Stream directo del body de ElevenLabs al cliente — NO buffearlo
    return new NextResponse(r.body, {
      status: r.status === 206 ? 206 : 200,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("audio proxy error:", err);
    return NextResponse.json(
      { error: "internal_error", detail: (err as Error).message },
      { status: 500 }
    );
  }
}

// HEAD para que el <audio> pueda hacer pre-flight check rápido
export async function HEAD(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  const url = new URL(req.url);
  let conversationId: string | null = url.searchParams.get("cid");

  if (!conversationId) {
    const { data } = await supabaseAdmin
      .from("ht_ai_interviews")
      .select("conversation_id")
      .eq("token", token)
      .maybeSingle();
    conversationId = data?.conversation_id || null;
  }

  if (!conversationId || !process.env.ELEVENLABS_API_KEY) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const r = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`,
      { method: "HEAD", headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY } }
    );
    return new NextResponse(null, {
      status: r.ok ? 200 : r.status,
      headers: {
        "Content-Type": r.headers.get("Content-Type") || "audio/mpeg",
        "Content-Length": r.headers.get("Content-Length") || "0",
        "Accept-Ranges": "bytes",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
