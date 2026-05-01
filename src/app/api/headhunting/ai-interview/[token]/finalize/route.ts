/**
 * POST /api/headhunting/ai-interview/[token]/finalize
 *
 * Llamado por el frontend cuando la entrevista termina (o por webhook de
 * ElevenLabs cuando el conversation_id queda fijo). Recibe transcript,
 * lo analiza con Claude, y guarda el score + recomendación en la DB.
 *
 * Body: { conversation_id?: string, transcript?: any, audio_url?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (_anthropic) return _anthropic;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY no configurado");
  _anthropic = new Anthropic({ apiKey: key });
  return _anthropic;
}

const MODEL = "claude-sonnet-4-20250514";

const SCORING_PROMPT = `Eres un analista experto en entrevistas de selección. Acabas de revisar una entrevista por voz que un candidato tuvo con una recruiter virtual de Trading Solutions.

CANDIDATO: {candidate_name}
POSICIÓN: {vacancy_title}
ÁREA: {vacancy_area}

TRANSCRIPCIÓN COMPLETA:
{transcript}

Tu tarea: analizar la entrevista y devolver un JSON estricto con:

{
  "score": <number 0-100>,
  "recommendation": "AVANZA" | "EN ESPERA" | "NO AVANZA",
  "summary": "<resumen ejecutivo en 2-3 oraciones de quién es el candidato y cómo se desempeñó>",
  "strengths": [
    { "area": "<área evaluada>", "evidence": "<cita o paráfrasis del candidato>" }
  ],
  "gaps": [
    { "area": "<área con debilidad>", "evidence": "<cita o paráfrasis>", "severity": "low|medium|high" }
  ],
  "red_flags": [
    "<señal de alerta concreta — solo si aplica>"
  ],
  "english_level": "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "no_evaluated",
  "english_evidence": "<cita en inglés del candidato + análisis breve>",
  "specific_examples_score": <0-10 — qué tan concreto y específico fue (STAR completo vs vaguedades)>,
  "communication_score": <0-10 — claridad, estructura, fluidez>,
  "role_fit_score": <0-10 — qué tan bien encaja con el rol específico>,
  "interview_questions_for_human_recruiter": [
    "<pregunta sugerida para que Kelly profundice en entrevista CWO>"
  ]
}

CRITERIOS DE EVALUACIÓN:
- Score 80+: AVANZA. Respuestas con ejemplos específicos, situaciones reales, resultados medibles. Inglés B1+ si aplica.
- Score 60-79: EN ESPERA. Algunas respuestas sólidas pero gaps notables. Necesita revisión humana.
- Score <60: NO AVANZA. Respuestas vagas, sin ejemplos, evita preguntas, o evidencia clara de no-match con el rol.

REGLAS:
- Sé EVIDENCIAL. Cada strength/gap debe tener cita textual o paráfrasis exacta del candidato.
- NO inventes evidencia. Si la entrevista fue corta o incompleta, di "INSUFICIENTE DATA" y baja el score.
- Para Inside Sales/Sales: prioriza fluidez verbal, energía, capacidad de improvisar, ejemplos de ventas reales.
- Para Pricing/Doc: prioriza precisión, capacidad analítica, atención al detalle.
- Para inglés: si NO se evaluó (no se llegó a la sección), pon "no_evaluated".
- Output: SOLO el JSON, sin texto adicional.`;

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  try {
    const body = await req.json().catch(() => ({}));
    const conversationId = body.conversation_id || null;
    let transcript = body.transcript || null;
    const audioUrl = body.audio_url || null;

    const { data: interview, error } = await supabaseAdmin
      .from("ht_ai_interviews")
      .select("*, ht_candidates(id, name, vacancy_id, ht_vacancies(title, area))")
      .eq("token", token)
      .single();

    if (error || !interview) {
      return NextResponse.json({ error: "invalid_token" }, { status: 401 });
    }

    // If we got a conversation_id but no transcript, fetch from ElevenLabs
    if (!transcript && conversationId && process.env.ELEVENLABS_API_KEY) {
      try {
        const r = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
          { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY } }
        );
        if (r.ok) {
          const j = await r.json();
          transcript = j;
        } else {
          console.error("ElevenLabs fetch transcript failed:", r.status);
        }
      } catch (e) {
        console.error("ElevenLabs transcript fetch error:", e);
      }
    }

    if (!transcript) {
      // Save what we have, mark for manual review
      await supabaseAdmin
        .from("ht_ai_interviews")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          conversation_id: conversationId,
          audio_url: audioUrl,
          ai_recommendation: "PENDIENTE",
          ai_summary: "Transcripción no disponible. Revisar manualmente.",
        })
        .eq("id", interview.id);
      return NextResponse.json({ success: true, scored: false, note: "No transcript available" });
    }

    // Build readable transcript text for Claude
    let transcriptText = "";
    if (Array.isArray(transcript)) {
      transcriptText = transcript
        .map((t: { role?: string; speaker?: string; content?: string; text?: string; message?: string }) =>
          `${t.role || t.speaker || "?"}: ${t.content || t.text || t.message || ""}`
        )
        .join("\n");
    } else if (transcript?.transcript) {
      // ElevenLabs format
      const segs = Array.isArray(transcript.transcript) ? transcript.transcript : [];
      transcriptText = segs
        .map((s: { role?: string; message?: string }) => `${s.role || "?"}: ${s.message || ""}`)
        .join("\n");
    } else if (typeof transcript === "string") {
      transcriptText = transcript;
    } else {
      transcriptText = JSON.stringify(transcript).slice(0, 8000);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const candidate = (interview as any).ht_candidates;
    const vacancy = candidate?.ht_vacancies;

    const prompt = SCORING_PROMPT
      .replace("{candidate_name}", candidate?.name || "—")
      .replace("{vacancy_title}", vacancy?.title || "—")
      .replace("{vacancy_area}", vacancy?.area || "—")
      .replace("{transcript}", transcriptText.slice(0, 12000));

    const aiResult = await getAnthropic().messages.create({
      model: MODEL,
      max_tokens: 3000,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    });

    const text = aiResult.content[0].type === "text" ? aiResult.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "AI no devolvió JSON válido", raw: text.slice(0, 500) },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    await supabaseAdmin
      .from("ht_ai_interviews")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        conversation_id: conversationId,
        transcript: transcript,
        audio_url: audioUrl,
        ai_score: parsed.score,
        ai_recommendation: parsed.recommendation,
        ai_summary: parsed.summary,
        ai_strengths: parsed.strengths,
        ai_gaps: parsed.gaps,
        ai_red_flags: parsed.red_flags || [],
        english_level: parsed.english_level,
      })
      .eq("id", interview.id);

    return NextResponse.json({
      success: true,
      scored: true,
      score: parsed.score,
      recommendation: parsed.recommendation,
      summary: parsed.summary,
    });
  } catch (err) {
    console.error("ai-interview finalize error:", err);
    return NextResponse.json(
      { error: "Error interno", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
