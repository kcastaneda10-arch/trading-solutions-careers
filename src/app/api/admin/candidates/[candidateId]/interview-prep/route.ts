/**
 * GET /api/admin/candidates/[candidateId]/interview-prep
 *
 * Devuelve TODA la data del candidato consolidada para preparar la entrevista
 * con recruiter. Pull de:
 *   - ht_candidates (perfil + prefilter_data)
 *   - ht_results (Elevare scores + AI interview)
 *   - ts_recruiter_assessments (eval previa si existe)
 *   - ht_vacancies (info de la vacante para context)
 *
 * Retorna un blob estructurado que la UI usa para renderizar el prep page.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { candidateId: string } }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { candidateId } = params;

    // Candidato + vacante
    const { data: cand, error: cErr } = await supabaseAdmin
      .from("ht_candidates")
      .select("*, ht_vacancies(id, title, area, role_level, vacancy_type)")
      .eq("id", candidateId)
      .single();

    if (cErr || !cand) {
      return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
    }

    // Resultados Elevare / AI interview
    const { data: results } = await supabaseAdmin
      .from("ht_results")
      .select("*")
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: false });

    // Evaluaciones previas (recruiter + cwo + hm) · separadas por stage
    const { data: assessmentsRaw } = await supabaseAdmin
      .from("ts_recruiter_assessments")
      .select("*")
      .eq("candidate_id", candidateId)
      .order("interview_date", { ascending: false });

    const assessmentsByStage: Record<string, any> = {};
    (assessmentsRaw || []).forEach((a: any) => {
      const s = a.assessment_stage || "recruiter_interview";
      if (!assessmentsByStage[s]) assessmentsByStage[s] = a; // tomamos la más reciente por stage
    });

    // Backwards-compat · `assessment` = recruiter por default
    const assessment = assessmentsByStage["recruiter_interview"] || (assessmentsRaw || [])[0] || null;

    // ─── Strengths y red flags computados a partir del prefilter_data ───
    const pf = (cand.prefilter_data as any) || {};
    const strengths: string[] = [];
    const redFlags: string[] = [];

    // Inglés
    if (pf.english_level) {
      if (pf.english_level.startsWith("C")) {
        strengths.push(`Inglés ${pf.english_level} declarado · validar en vivo`);
      } else if (pf.english_level.startsWith("B2")) {
        strengths.push(`Inglés B2 declarado · validar fluidez`);
      } else {
        redFlags.push(`Inglés ${pf.english_level} · vacante puede requerir B2+ para clientes internacionales`);
      }
    }

    // Salario
    if (pf.salary && pf._meta?.cap_used) {
      const lower = pf._meta.salary_lower_bound;
      const cap = pf._meta.cap_used;
      if (lower && cap) {
        if (lower <= cap) strengths.push(`Salario abajo del cap (${pf.salary} vs ${(cap / 1_000_000).toFixed(1)}M)`);
        else redFlags.push(`Salario ${pf.salary} arriba del cap ${(cap / 1_000_000).toFixed(1)}M · margen de negociación`);
      }
    }

    // Pricing experience
    if (pf.pricing_exp) strengths.push("Pricing experience declarada · validar profundidad");
    else redFlags.push("Sin pricing experience · validar capacidad de aprender rápido");

    // Liderazgo
    if (pf.leadership && pf.team_size > 0) {
      strengths.push(`Lideró equipo de ${pf.team_size} personas`);
    } else {
      redFlags.push("Sin equipo a cargo · validar liderazgo lateral");
    }

    // Clientes internacionales
    if (pf.intl_clients) strengths.push("Experiencia con clientes internacionales");

    // Años experiencia · suspicious si son iguales sales y logistics y altos
    if (pf.years_sales && pf.years_logistics && pf.years_sales === pf.years_logistics && pf.years_sales >= 10) {
      redFlags.push(`${pf.years_sales} años en logística + ${pf.years_logistics} años en ventas (mismo número, alto) · validar timeline real`);
    }

    // CRMs
    if (pf.crms && pf.crms.length >= 4) {
      strengths.push(`${pf.crms.length} CRMs (${pf.crms.join(", ")})`);
    }

    // ─── Preguntas tailored a partir del prefilter ───
    const tailoredQuestions: { topic: string; q: string; why: string }[] = [];

    // Salario
    if (pf.salary) {
      tailoredQuestions.push({
        topic: "Compensación",
        q: `Pediste salario en el rango ${pf.salary}. ¿Cómo llegaste a ese número? ¿Qué incluye? ¿Bonos esperados?`,
        why: "Validar si hay margen de negociación.",
      });
    }

    // Pricing
    if (pf.pricing_exp) {
      tailoredQuestions.push({
        topic: "Pricing experience",
        q: "Cuéntame el caso más complejo de pricing que manejaste · margen, estrategia, cliente difícil.",
        why: "Validar profundidad real vs declarada.",
      });
    } else {
      tailoredQuestions.push({
        topic: "Sin pricing experience",
        q: "Inside Sales requiere pricing. ¿Cómo aprenderías rápido si llegas?",
        why: "Validar curva de aprendizaje.",
      });
    }

    // Liderazgo
    if (pf.leadership && pf.team_size > 0) {
      tailoredQuestions.push({
        topic: `Liderazgo · ${pf.team_size} personas`,
        q: `Cuéntame de la persona más difícil de tu equipo · ¿qué hiciste?`,
        why: "Validar agency · cómo maneja conflicto humano.",
      });
    } else {
      tailoredQuestions.push({
        topic: "Sin equipo a cargo",
        q: "¿Has liderado proyectos cross-funcional? Cuéntame uno.",
        why: "Validar liderazgo lateral.",
      });
    }

    // Why TS
    if (pf.why_ts) {
      tailoredQuestions.push({
        topic: "Why TS · profundizar",
        q: `Escribiste: "${String(pf.why_ts).slice(0, 100)}..." · ¿Qué sabes específicamente de Trading Solutions? ¿Investigaste algo concreto?`,
        why: "Distinguir cliché vs investigación real.",
      });
    }

    // Disponibilidad
    if (pf.availability === "Inmediato") {
      tailoredQuestions.push({
        topic: "Availability inmediato",
        q: "¿Por qué saliste / vas a salir del rol actual? ¿Cómo terminó?",
        why: "Detectar rotación, conflicto previo, o señales de víctima.",
      });
    }

    return NextResponse.json({
      candidate: {
        id: cand.id,
        name: cand.name,
        email: cand.email,
        phone: cand.phone,
        stage: cand.stage,
        status: cand.status,
        vacancy_id: cand.vacancy_id,
        vacancy_title: (cand as any).ht_vacancies?.title || "—",
        vacancy_role_level: (cand as any).ht_vacancies?.role_level || null,
        prefilter_data: pf,
        prefilter_decision: cand.prefilter_decision,
        rejection_category: cand.rejection_category,
        rejection_sub_detail: cand.rejection_sub_detail,
        cv_url: cand.cv_url,
        linkedin_url: cand.linkedin_url,
        preferred_language: cand.preferred_language,
      },
      results: results || [],
      previous_assessment: assessment || null,
      // Nuevo · todas las assessments por stage
      assessments_by_stage: assessmentsByStage,
      strengths,
      red_flags: redFlags,
      tailored_questions: tailoredQuestions,
    });
  } catch (err: any) {
    console.error("interview-prep error:", err);
    return NextResponse.json({ error: err?.message || "Error" }, { status: 500 });
  }
}
