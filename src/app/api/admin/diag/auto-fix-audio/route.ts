/**
 * POST /api/admin/diag/auto-fix-audio
 *
 * Auto-fix masivo: recorre todas las entrevistas con audio vacío
 * (causadas por candidatos que cortaron y reanudaron, dejando varias
 * sesiones en ElevenLabs y la BD apuntando a la primera/incompleta).
 *
 * Para cada entrevista problemática:
 *   1. Lista todas las sesiones del agent en ±48h del started_at
 *   2. Identifica la sesión más larga con audio real (>1KB)
 *   3. Si es distinta a la guardada, actualiza conversation_id + audio_url
 *   4. Refresca transcript desde ElevenLabs
 *
 * Devuelve reporte detallado: cuántos reparados, cuántos OK, cuántos sin sesión válida.
 *
 * Body opcional: { dry_run: true } → solo simula, no escribe.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = !!body.dry_run;

    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: "ElevenLabs API key no configurada" }, { status: 503 });
    }

    // 1. Pull todas las entrevistas completadas con conversation_id
    const { data: interviews } = await supabaseAdmin
      .from("ht_ai_interviews")
      .select("id, candidate_id, token, conversation_id, agent_id, started_at, ai_score")
      .eq("status", "completed")
      .not("conversation_id", "is", null)
      .order("created_at", { ascending: false });

    if (!interviews || interviews.length === 0) {
      return NextResponse.json({ message: "Sin entrevistas para auditar", scanned: 0 });
    }

    // Group por agent_id para optimizar (1 list call por agent)
    const byAgent: Record<string, typeof interviews> = {};
    interviews.forEach(it => {
      if (!it.agent_id) return;
      if (!byAgent[it.agent_id]) byAgent[it.agent_id] = [];
      byAgent[it.agent_id].push(it);
    });

    const results: any[] = [];

    for (const [agentId, agentInterviews] of Object.entries(byAgent)) {
      // Pull todas las conversaciones del agent (100 = max permitido por ElevenLabs)
      const r = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${agentId}&page_size=100`,
        { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! } }
      );
      if (!r.ok) {
        results.push({ agent_id: agentId, error: `ElevenLabs list failed: ${r.status}` });
        continue;
      }
      const j = await r.json();
      const allConvos = (j.conversations || j.history || []) as any[];

      // Para cada entrevista de este agent
      for (const it of agentInterviews) {
        const startedUnix = it.started_at ? Math.floor(new Date(it.started_at).getTime() / 1000) : 0;
        if (!startedUnix) {
          results.push({ candidate_id: it.candidate_id, status: "skip", reason: "Sin started_at" });
          continue;
        }

        // Filtrar conversaciones cercanas
        const nearby = allConvos.filter((c: any) => {
          const cStart = c.start_time_unix_secs || 0;
          return Math.abs(cStart - startedUnix) < 48 * 60 * 60;
        });

        if (nearby.length === 0) {
          results.push({
            candidate_id: it.candidate_id,
            status: "no_sessions_found",
            current_cid: it.conversation_id,
          });
          continue;
        }

        // OPTIMIZACIÓN: en lugar de bajar audio de cada sesión (lento),
        // ordenamos candidatas por (duration desc, message_count desc) y
        // sólo descargamos el audio de la #1. Si vacío, probamos la #2.
        // Esto reduce las descargas de N a 1-2 por entrevista.
        const candidates = nearby
          .filter((c: any) => c.status === "done" && (c.call_duration_secs || 0) >= 30)
          .sort((a: any, b: any) => {
            const da = a.call_duration_secs || 0;
            const db = b.call_duration_secs || 0;
            if (db !== da) return db - da;
            return (b.message_count || 0) - (a.message_count || 0);
          });

        // Probar las top 3 candidatas en paralelo y elegir la primera con audio real.
        // Como ya están ordenadas por duración desc, la mejor candidata es la primera.
        const top = candidates.slice(0, 3);
        const checks = await Promise.all(
          top.map(async (c: any) => {
            try {
              const audioR = await fetch(
                `https://api.elevenlabs.io/v1/convai/conversations/${c.conversation_id}/audio`,
                { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! } }
              );
              if (audioR.ok) {
                const buf = await audioR.arrayBuffer();
                return { convo: c, size: buf.byteLength };
              }
            } catch {}
            return null;
          })
        );

        // Filtrar solo las que tienen audio real, mantener orden de candidates (duration desc)
        const valid = checks.filter(x => x && x.size > 1000) as { convo: any; size: number }[];
        const bestConvo = valid[0]?.convo || null;
        const bestSize = valid[0]?.size || 0;

        if (!bestConvo) {
          results.push({
            candidate_id: it.candidate_id,
            status: "no_audio_in_any_session",
            sessions_found: nearby.length,
            current_cid: it.conversation_id,
          });
          continue;
        }

        // ¿La BD ya apunta a la mejor?
        if (bestConvo.conversation_id === it.conversation_id) {
          results.push({
            candidate_id: it.candidate_id,
            status: "already_correct",
            audio_size_kb: Math.round(bestSize / 1024),
          });
          continue;
        }

        // ¡Necesita fix!
        if (dryRun) {
          results.push({
            candidate_id: it.candidate_id,
            status: "would_fix",
            old_cid: it.conversation_id,
            new_cid: bestConvo.conversation_id,
            new_audio_size_kb: Math.round(bestSize / 1024),
            new_duration_secs: bestConvo.call_duration_secs,
          });
        } else {
          // Refetch transcript de la sesión nueva
          let newTranscript: any = null;
          try {
            const tR = await fetch(
              `https://api.elevenlabs.io/v1/convai/conversations/${bestConvo.conversation_id}`,
              { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! } }
            );
            if (tR.ok) newTranscript = await tR.json();
          } catch {}

          // Construir audio_url proxy
          const proto = req.headers.get('x-forwarded-proto') || 'https';
          const host = req.headers.get('host') || 'trading-solutions-careers.vercel.app';
          const baseUrl = `${proto}://${host}`;
          const newAudioUrl = `${baseUrl}/api/headhunting/ai-interview/${it.token}/audio?cid=${bestConvo.conversation_id}`;

          const updates: any = {
            conversation_id: bestConvo.conversation_id,
            audio_url: newAudioUrl,
          };
          if (newTranscript) updates.transcript = newTranscript;

          const { error: upErr } = await supabaseAdmin
            .from("ht_ai_interviews")
            .update(updates)
            .eq("id", it.id);

          if (upErr) {
            results.push({
              candidate_id: it.candidate_id,
              status: "fix_failed",
              error: upErr.message,
            });
          } else {
            results.push({
              candidate_id: it.candidate_id,
              status: "fixed",
              old_cid: it.conversation_id,
              new_cid: bestConvo.conversation_id,
              new_audio_size_kb: Math.round(bestSize / 1024),
              new_duration_secs: bestConvo.call_duration_secs,
              transcript_refetched: !!newTranscript,
              had_score: it.ai_score != null,
              note: it.ai_score != null ? "Re-correr scoring porque transcript cambió" : null,
            });
          }
        }
      }
    }

    const summary = {
      scanned: interviews.length,
      fixed: results.filter(r => r.status === "fixed").length,
      already_correct: results.filter(r => r.status === "already_correct").length,
      would_fix: results.filter(r => r.status === "would_fix").length,
      no_audio: results.filter(r => r.status === "no_audio_in_any_session").length,
      no_sessions: results.filter(r => r.status === "no_sessions_found").length,
      errors: results.filter(r => r.status === "fix_failed" || r.error).length,
    };

    return NextResponse.json({
      dry_run: dryRun,
      summary,
      results,
    });
  } catch (err: any) {
    console.error("auto-fix-audio error:", err);
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 });
  }
}
