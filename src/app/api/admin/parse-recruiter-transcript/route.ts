/**
 * POST /api/admin/parse-recruiter-transcript
 *
 * Recibe un transcript de entrevista con recruiter y devuelve la evaluación
 * estructurada contra los 16 mandatos del CEO. Kelly revisa y aprueba antes
 * de que se guarde como assessment final.
 *
 * Body: { transcript: string, candidate_id?: string }
 * Response: { mandate_scores, mandate_evidence, mandate_quotes, english_*, verdict, ... }
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAnthropic } from "@/lib/anthropic";
import { CEO_MANDATES } from "@/lib/ceo-mandates";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `Eres un analista experto en talento que evalúa transcripts de entrevistas de recruiter contra los 16 mandatos del CEO de Trading Solutions. Tu trabajo es objetivo, preciso, y SIEMPRE basado en evidencia textual del transcript · NO inventas, NO asumes.

# Los 16 mandatos del CEO

${CEO_MANDATES.map(m => `${m.num}. **${m.label}** · ${m.description}${m.dataOnly ? " · NO ES CRITERIO DE SELECCIÓN, solo registrar data si surge orgánico." : ""}`).join("\n")}

# Cómo evaluar cada mandato

Para cada uno de los 16, asigna un score:
- **"pass"** · evidencia clara y reciente del transcript de que cumple.
- **"partial"** · señal pero falta profundidad o consistencia. Respuesta de manual sin ejemplo concreto cuenta como parcial.
- **"fail"** · evidencia explícita de que NO cumple, o respuesta que contradice el mandato.
- **"data"** · solo aplica al mandato 12 (Religiosa) si surge orgánico · es solo data, no criterio.
- **"not_probed"** · el tema no se tocó en el transcript · no se puede evaluar.

# Reglas críticas

1. NUNCA inventes evidencia. Si el mandato no se probó, di "not_probed".
2. Para cada mandato (excepto not_probed), incluye:
   - **evidence**: 1-2 frases con qué dijo o demostró el candidato (en tus palabras).
   - **quote**: cita literal del transcript que respalda la evaluación, máximo 200 caracteres.
3. Para el mandato 3 (English), DEBES analizar específicamente la sección donde el recruiter pidió respuestas en inglés. Si las respuestas en inglés son agramaticales o muy cortas, es "fail" aunque el candidato declarara B1+.
4. Para el mandato 12 (Religiosa) · si surge orgánico, score = "data"; si no, "not_probed". NUNCA es pass/partial/fail.
5. **Verdict global** debe ser uno de:
   - "strong_yes" · 9+ pass, 0-1 fail crítico, mandatos clave (English, No víctima, Comunicador, Agency) en pass
   - "maybe" · mezcla de pass/partial, 1-2 fails NO bloqueadores, requiere validación adicional
   - "no" · 3+ fails o un fail bloqueador (ej: English fail para rol con clientes internacionales, victimismo, comunicación deficiente)
6. **pass_reasons** y **fail_reasons** deben ser frases concretas con nombre de mandato y evidencia, no genéricas.
7. **next_filter_probes** · qué validar en la siguiente etapa (CWO interview), 2-4 puntos accionables.
8. Tu output debe ser SOLO un JSON válido, sin markdown, sin explicación adicional.

# Formato de output (JSON estricto)

{
  "mandate_scores": { "1": "pass" | "partial" | "fail" | "data" | "not_probed", ... },
  "mandate_evidence": { "1": "string corta con la evidencia", ... },
  "mandate_quotes": { "1": "cita literal", ... },
  "english_declared": "string · nivel que el candidato declaró en el cuestionario, si aparece en transcript",
  "english_real": "string · nivel real evidenciado por el test en vivo (A1/A2/B1/B2/C1/C2)",
  "english_evidence": "string · 1-2 frases describiendo el desempeño en inglés",
  "english_verdict": "pass" | "gap" | "fail",
  "verdict": "strong_yes" | "maybe" | "no",
  "verdict_summary": "frase corta de cierre · 1 línea",
  "pass_reasons": ["razón 1 con mandato", "razón 2", ...],
  "fail_reasons": ["razón 1 con mandato", "razón 2", ...],
  "next_filter_probes": ["qué validar en CWO 1", "qué validar 2", ...],
  "duration_minutes": number | null
}`;

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { transcript, candidate_id } = await req.json();

    if (!transcript || typeof transcript !== "string" || transcript.trim().length < 100) {
      return NextResponse.json(
        { error: "Transcript demasiado corto · pega el transcript completo (al menos 100 chars)" },
        { status: 400 }
      );
    }

    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analiza este transcript de entrevista con recruiter y devuélveme el JSON estructurado con la evaluación de los 16 mandatos:\n\n---TRANSCRIPT---\n${transcript}\n---END TRANSCRIPT---`,
        },
      ],
    });

    // Extraer texto de la respuesta
    const rawText = response.content
      .filter(b => b.type === "text")
      .map(b => (b as any).text)
      .join("\n")
      .trim();

    // Limpiar wraps de markdown json si los hay
    let jsonText = rawText;
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.error("LLM output no parseable:", rawText.slice(0, 500));
      return NextResponse.json(
        { error: "El LLM devolvió output mal formateado · reintenta", raw: rawText.slice(0, 500) },
        { status: 500 }
      );
    }

    // Validar estructura mínima
    if (!parsed.mandate_scores || !parsed.verdict) {
      return NextResponse.json(
        { error: "Output del LLM incompleto", parsed },
        { status: 500 }
      );
    }

    // Asegurar que todos los 16 mandatos tienen score (default not_probed)
    for (const m of CEO_MANDATES) {
      const k = String(m.num);
      if (!parsed.mandate_scores[k]) parsed.mandate_scores[k] = "not_probed";
      if (!parsed.mandate_evidence) parsed.mandate_evidence = {};
      if (!parsed.mandate_evidence[k]) parsed.mandate_evidence[k] = "";
      if (!parsed.mandate_quotes) parsed.mandate_quotes = {};
      if (!parsed.mandate_quotes[k]) parsed.mandate_quotes[k] = "";
    }

    return NextResponse.json({
      success: true,
      candidate_id: candidate_id || null,
      ai_model_version: "claude-sonnet-4-5",
      ...parsed,
    });
  } catch (err: any) {
    console.error("parse-recruiter-transcript error:", err);
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 });
  }
}
