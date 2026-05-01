/**
 * POST /api/headhunting/results/[candidateId]/audit
 *
 * Auditoría anti-cheat impulsada por Claude. Analiza:
 *   - Datos de proctoring: cámara, cambios de pestaña, snapshots
 *   - Patrones temporales: respuestas <10s o muy uniformes (random/coached)
 *   - Consistencia entre escenarios "Control de consistencia"
 *   - Patrones de selección (siempre opción 1, etc.)
 *
 * Retorna integrity_score 0-100, lista de red_flags y verdict.
 * Guarda el resultado en ht_results.benchmark_comparison.proctoring
 * (preserva los counts originales y agrega el análisis IA).
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
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

const AUDIT_PROMPT = `Eres un auditor experto de evaluaciones psicométricas online. Tu tarea es detectar comportamiento sospechoso o trampas durante un assessment SJT (Situational Judgment Test).

DATOS DEL CANDIDATO:
{candidate_summary}

DATOS DE PROCTORING:
{proctoring_data}

PATRONES DE RESPUESTA (cada escenario · tiempo gastado en segundos · opción seleccionada · longitud respuesta):
{response_patterns}

ESCENARIOS DE CONTROL DE CONSISTENCIA (deben tener respuestas coherentes entre sí):
{control_scenarios}

INSTRUCCIONES:
Analiza los datos buscando estos indicadores de trampa o baja confiabilidad:

1. **Cámara desactivada**: SOLO si proctoring_data.camera_enabled es explícitamente false. Si proctoring_data.status === 'no_proctoring_data_available', NO penalices la cámara.
2. **Cambios de pestaña excesivos** (>5 = sospechoso, >10 = muy probable trampa). SOLO si hay datos.
3. **Tiempo de respuesta anómalo** (esto SIEMPRE se puede evaluar):
   - <10s en escenarios complejos = respuestas al azar
   - tiempo idéntico en todos los escenarios = bot/script
   - timeout en >50% = posible distracción/abandono
4. **Patrón de selección sospechoso** (esto SIEMPRE se puede evaluar):
   - mismo índice de opción siempre = sin leer
   - alternancia mecánica = sin pensar
5. **Inconsistencia entre escenarios de control**: respuestas contradictorias en "Control de consistencia"
6. **Asistencia externa**: respuestas inusualmente elaboradas vs perfil del candidato

REGLA CRÍTICA: Si proctoring_data dice 'no_proctoring_data_available', tu integrity_score base debe ser 80 (no 100), y solo penalizar por evidencia REAL en los patrones de respuesta. NO inventes red flags de proctoring que no puedes verificar.

OUTPUT (JSON estricto, sin texto extra):
{
  "integrity_score": <number 0-100>,
  "verdict": "CONFIABLE" | "SOSPECHOSO" | "NO CONFIABLE",
  "verdict_reason": "<resumen ejecutivo en 1-2 oraciones>",
  "red_flags": [
    { "category": "camera|tab_switches|timing|patterns|consistency|external_help", "severity": "low|medium|high", "evidence": "<dato concreto>", "interpretation": "<qué significa>" }
  ],
  "positive_signals": [ "<lista de señales positivas que apoyan confiabilidad>" ],
  "recommendation": "<qué hacer: aceptar resultado, requerir entrevista, repetir prueba, descartar>"
}

Sé estricto pero justo. Un cambio de pestaña ocasional NO es trampa. La cámara apagada por sí sola NO descalifica. Busca PATRONES, no eventos aislados.`;

function buildResponsePatterns(responses: any[], scenarios: any[]): string {
  return responses
    .map((r) => {
      const sc = scenarios.find((s) => s.id === r.scenario_id);
      const opt = (r.response_data?.selected_option ?? -1) + 1;
      const len = (r.response_text || "").length;
      const label = sc?.competency_label || sc?.id || "—";
      return `- "${label}" · ${r.time_spent_seconds}s · opción ${opt > 0 ? opt : "?"} · ${len} chars`;
    })
    .join("\n");
}

function buildControlScenarios(responses: any[], scenarios: any[]): string {
  const controlScenarios = scenarios.filter(
    (s) =>
      String(s.competency_label || "").toLowerCase().includes("control") ||
      String(s.competency_key || "").toLowerCase().includes("consistency") ||
      String(s.competency_key || "").toLowerCase().includes("control")
  );
  if (controlScenarios.length === 0) {
    return "(Sin escenarios de control configurados en este modelo)";
  }
  return controlScenarios
    .map((sc) => {
      const r = responses.find((rr) => rr.scenario_id === sc.id);
      const opt = (r?.response_data?.selected_option ?? -1) + 1;
      return `- "${sc.competency_label}": opción ${opt > 0 ? opt : "?"} · "${(r?.response_text || "(MC)").slice(0, 80)}"`;
    })
    .join("\n");
}

export async function POST(
  req: NextRequest,
  { params }: { params: { candidateId: string } }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { candidateId } = params;

    const { data: candidate } = await supabaseAdmin
      .from("ht_candidates")
      .select("*, ht_vacancies(title, model_id)")
      .eq("id", candidateId)
      .single();

    if (!candidate) {
      return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
    }

    const { data: result } = await supabaseAdmin
      .from("ht_results")
      .select("*")
      .eq("candidate_id", candidateId)
      .single();

    if (!result) {
      return NextResponse.json(
        { error: "El candidato no tiene resultados aún. Calcula el score primero." },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modelId = (candidate as any).ht_vacancies?.model_id;
    const { data: scenarios } = await supabaseAdmin
      .from("ht_scenarios")
      .select("id, competency_key, competency_label, scenario_text")
      .eq("model_id", modelId);

    const { data: responses } = await supabaseAdmin
      .from("ht_responses")
      .select("scenario_id, response_text, response_data, time_spent_seconds, is_final")
      .eq("candidate_id", candidateId)
      .eq("is_final", true);

    const proctoring = (result.benchmark_comparison as any)?.proctoring || {};
    // Si no hay datos de proctoring originales (e.g. se perdieron en una corrida
    // anterior), explícitamente marcamos "no_data" para que el AI no asuma que
    // la cámara estaba apagada o que hubo 0 snapshots — porque eso sería un
    // falso positivo.
    const hasProctoringData =
      proctoring.camera_enabled !== undefined ||
      proctoring.total_tab_switches !== undefined ||
      proctoring.total_camera_snapshots !== undefined;

    const proctoringSummary = hasProctoringData
      ? {
          camera_enabled: proctoring.camera_enabled ?? false,
          total_tab_switches: proctoring.total_tab_switches ?? 0,
          total_camera_snapshots: proctoring.total_camera_snapshots ?? 0,
          tab_switch_events_count: (proctoring.tab_switch_events || []).length,
          heuristic_integrity_score: proctoring.integrity_score ?? null,
        }
      : {
          status: "no_proctoring_data_available",
          note: "Los datos de proctoring no están disponibles para este candidato. Evalúa la integridad ÚNICAMENTE con base en los patrones de respuesta, tiempos y consistencia. NO asumas que la cámara estaba apagada o que hubo 0 snapshots — esa información simplemente no se conservó.",
        };

    const candidateSummary = {
      name: candidate.name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vacancy: (candidate as any).ht_vacancies?.title || "—",
      total_responses: (responses || []).length,
      total_scenarios: (scenarios || []).length,
      avg_time_per_scenario_seconds:
        (responses || []).reduce((a, r) => a + (r.time_spent_seconds || 0), 0) /
        Math.max(1, (responses || []).length),
      total_time_seconds: result.total_time_seconds || 0,
    };

    const prompt = AUDIT_PROMPT.replace(
      "{candidate_summary}",
      JSON.stringify(candidateSummary, null, 2)
    )
      .replace("{proctoring_data}", JSON.stringify(proctoringSummary, null, 2))
      .replace("{response_patterns}", buildResponsePatterns(responses || [], scenarios || []))
      .replace("{control_scenarios}", buildControlScenarios(responses || [], scenarios || []));

    const aiResult = await getAnthropic().messages.create({
      model: MODEL,
      max_tokens: 2000,
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

    const audit = JSON.parse(jsonMatch[0]);

    // Guardar el audit en benchmark_comparison.proctoring (preserva counts)
    const updatedProctoring = {
      ...proctoring,
      ai_audit: {
        ...audit,
        audited_at: new Date().toISOString(),
        model: MODEL,
      },
    };

    await supabaseAdmin
      .from("ht_results")
      .update({
        benchmark_comparison: {
          ...(result.benchmark_comparison as any),
          proctoring: updatedProctoring,
        },
      })
      .eq("id", result.id);

    return NextResponse.json({
      success: true,
      candidate_id: candidateId,
      audit,
      heuristic_integrity_score: proctoringSummary.heuristic_integrity_score,
    });
  } catch (err: any) {
    console.error("audit error:", err);
    return NextResponse.json(
      { error: "Error en auditoría", detail: err?.message || String(err) },
      { status: 500 }
    );
  }
}
