/**
 * Informe del candidato después de las pruebas · el lado del servidor.
 *
 * QUÉ ES Y QUÉ NO ES
 * El ATS ya tiene un informe de VACANTE: cómo va la búsqueda, dónde se está
 * quedando la gente, cuántos días lleva cada etapa. Este es el otro: una
 * persona, todas las pruebas que se le aplicaron, y qué significan leídas
 * juntas. No se pisan.
 *
 * LA REGLA QUE SOSTIENE TODO EL DOCUMENTO
 * El porcentaje de match sale SOLO de la batería propia. Es la única prueba
 * con un perfil de cargo versionado, pesos con fundamento escrito y pisos
 * declarados. Las pruebas externas —DISC gratuito, 16personalities, IQ,
 * BETA— no tienen perfil de referencia ni validación: entran al informe
 * completas, cada una en su formato, pero no entran al número. Promediarlas
 * produciría una cifra que no se puede defender el día que alguien impugne
 * un descarte, y es justo el día en que un informe tiene que servir.
 *
 * TRES VISTAS DE LA MISMA VERDAD
 *   talent → todo, incluida validez, proctoring y escalas sueltas.
 *   lider  → sin lecturas internas. Misma regla que el informe de vacante.
 *   ceo    → una página: veredicto, lo que más pesa y la recomendación.
 * No son tres documentos: es el mismo, filtrado. Que el líder vea menos no
 * significa que vea otra cosa.
 */

import { supabaseAdmin } from "@/lib/supabase";
import { perfilDe, perfilPorTitulo, type PerfilCargo } from "@/lib/bateria/perfiles-cargo";
import { FACTORS, DISC_PATRONES } from "@/lib/bateria/interpretacion";
import { CEO_MANDATES } from "@/lib/ceo-mandates";
import { listarProveedores, estadoReal, etiquetaEstado, type EstadoPrueba } from "@/lib/pruebas-externas";

export type Vista = "talent" | "lider" | "ceo";

export const VISTAS: { key: Vista; label: string; para: string }[] = [
  { key: "talent", label: "Talent", para: "Todo, incluidas las lecturas internas" },
  { key: "lider", label: "Líder del área", para: "Sin validez, proctoring ni escalas sueltas" },
  { key: "ceo", label: "CEO", para: "Una página: veredicto y recomendación" },
];

export function esVista(v: unknown): v is Vista {
  return v === "talent" || v === "lider" || v === "ceo";
}

type Hallazgo = {
  senal: "convergente" | "contradictoria" | "alerta" | "hueco";
  titulo: string;
  texto: string;
  soloInterno?: boolean;
};

export type InformeCandidato = Awaited<ReturnType<typeof armarInforme>>;

export async function armarInforme(candidateId: string, vista: Vista = "talent") {
  const { data: cand, error } = await supabaseAdmin
    .from("ht_candidates")
    .select("id, name, email, stage, status, headline, current_job_role, current_company, vacancy_id, ht_vacancies(id, title, country, form_template_key, created_at)")
    .eq("id", candidateId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!cand) throw new Error("No existe ese candidato");

  const vacante: any = (cand as any).ht_vacancies ?? null;

  // ── La batería propia ───────────────────────────────────────
  // Se toma la sesión terminada más reciente. Si alguien presentó dos veces,
  // el informe habla de la última: las anteriores quedan en el expediente
  // pero no son lo que la persona es hoy.
  const { data: sesiones } = await supabaseAdmin
    .from("ts_bat_sessions")
    .select("id, token, status, scores, validity, match_data, informe_ia, perfil_cargo, vacancy_title, invited_at, started_at, finished_at, duration_seconds, battery_version")
    .eq("ht_candidate_id", candidateId)
    .order("finished_at", { ascending: false, nullsFirst: false })
    .limit(3);

  const bateria: any =
    (sesiones ?? []).find((s: any) => s.status === "completed") ?? (sesiones ?? [])[0] ?? null;

  const perfilKey: string | null =
    bateria?.perfil_cargo ?? perfilPorTitulo(vacante?.title ?? bateria?.vacancy_title ?? null);
  const perfil: PerfilCargo | null = perfilDe(perfilKey);

  // ── Las pruebas de afuera ───────────────────────────────────
  const proveedores = await listarProveedores();
  const { data: filas } = await supabaseAdmin
    .from("ht_external_test_results")
    .select("provider_id, estado, puntajes, resumen, presentada_at, archivo_url, portal_url, cargado_por, notas")
    .eq("candidate_id", candidateId);

  const porProveedor = new Map((filas ?? []).map((f: any) => [f.provider_id, f]));

  const externas = proveedores.map((p) => {
    const r: any = porProveedor.get(p.id) ?? null;
    const estado: EstadoPrueba = r ? estadoReal(r) : "pendiente";
    return {
      key: p.key,
      nombre: p.nombre,
      categoria: p.categoria,
      via: p.via,
      estado,
      estadoLabel: etiquetaEstado(estado),
      presentadaEl: r?.presentada_at ?? null,
      puntajes: (r?.puntajes ?? null) as Record<string, unknown> | null,
      resumen: r?.resumen ?? null,
      soporte: r?.archivo_url ?? r?.portal_url ?? p.portal_url ?? null,
      cargadoPor: r?.cargado_por ?? null,
      notas: r?.notas ?? null,
    };
  });

  const aplicables = externas.filter((e) => e.estado !== "no_aplica");
  const conResultado = aplicables.filter((e) => e.estado === "cargada");

  // ── La entrevista inicial ───────────────────────────────────
  // La pieza que ninguna prueba puede dar: conducta observada. Una batería
  // mide lo que la persona dice de sí misma respondiendo escalas; la
  // entrevista mide lo que contó que hizo, con fecha y nombres. Por eso entra
  // al informe y también al agente: es lo único que puede confirmar o tumbar
  // lo que dicen los puntajes.
  const { data: evals } = await supabaseAdmin
    .from("ts_recruiter_assessments")
    .select("assessment_stage, interview_date, interviewer_email, duration_minutes, mandate_scores, mandate_evidence, mandate_quotes, english_declared, english_real, english_verdict, verdict, verdict_summary, pass_reasons, fail_reasons, next_filter_probes, parsed_by_ai, human_reviewed")
    .eq("candidate_id", candidateId)
    .order("interview_date", { ascending: false })
    .limit(1);

  const ev: any = (evals ?? [])[0] ?? null;
  const PUNTAJE: Record<string, string> = {
    pass: "Cumple", partial: "Parcial", fail: "No cumple",
    data: "Solo dato", not_probed: "No se preguntó",
  };

  const entrevista = ev
    ? {
        fecha: ev.interview_date,
        entrevistador: ev.interviewer_email,
        duracionMin: ev.duration_minutes,
        verdict: ev.verdict,
        resumen: ev.verdict_summary,
        ingles: { declarado: ev.english_declared, real: ev.english_real, veredicto: ev.english_verdict },
        revisadaPorHumano: Boolean(ev.human_reviewed),
        porIA: Boolean(ev.parsed_by_ai),
        aFavor: ev.pass_reasons ?? [],
        enContra: ev.fail_reasons ?? [],
        porIndagar: ev.next_filter_probes ?? [],
        principios: CEO_MANDATES.map((m: any) => {
          const p = (ev.mandate_scores ?? {})[String(m.num)] ?? (ev.mandate_scores ?? {})[m.num];
          return {
            num: m.num,
            label: m.label,
            puntaje: p ?? "not_probed",
            puntajeLabel: PUNTAJE[p ?? "not_probed"] ?? "No se preguntó",
            evidencia: (ev.mandate_evidence ?? {})[String(m.num)] ?? null,
            cita: (ev.mandate_quotes ?? {})[String(m.num)] ?? null,
            soloDato: Boolean(m.dataOnly),
          };
        }),
      }
    : null;

  // ── Contra quién compite ────────────────────────────────────
  // Un CEO rara vez decide sobre una persona: decide entre personas. Sin esta
  // tabla, «87%» no dice nada — puede ser el mejor del proceso o el cuarto.
  const { data: hermanos } = await supabaseAdmin
    .from("ht_candidates")
    .select("id, name, stage, status")
    .eq("vacancy_id", cand.vacancy_id)
    .neq("status", "rejected");

  const idsHermanos = (hermanos ?? []).map((h: any) => h.id);
  let terna: any[] = [];
  if (idsHermanos.length) {
    const { data: ses } = await supabaseAdmin
      .from("ts_bat_sessions")
      .select("ht_candidate_id, match_data, validity, finished_at")
      .in("ht_candidate_id", idsHermanos)
      .eq("status", "completed");

    const porCand = new Map((ses ?? []).map((s: any) => [String(s.ht_candidate_id), s]));
    terna = (hermanos ?? [])
      .map((h: any) => {
        const s: any = porCand.get(String(h.id));
        return {
          id: h.id,
          nombre: h.name,
          esEste: h.id === cand.id,
          match: s?.match_data?.global ?? null,
          apto: s?.match_data?.apto ?? null,
          // La validez no sale de la vista del líder ni de la del CEO.
          validez: vista === "talent" ? s?.validity?.veredicto ?? null : null,
          presentadaEl: s?.finished_at ?? null,
        };
      })
      .filter((x) => x.match != null)
      .sort((a, b) => (b.match ?? 0) - (a.match ?? 0));
  }

  // ── El costo de no decidir ──────────────────────────────────
  const abiertaDesde = vacante?.created_at ?? null;
  const diasAbierta = abiertaDesde
    ? Math.floor((Date.now() - new Date(abiertaDesde).getTime()) / 86_400_000)
    : null;

  const contexto = {
    diasAbierta,
    activos: (hermanos ?? []).length,
    conBateria: terna.length,
    posicion: terna.findIndex((t) => t.esEste) + 1 || null,
  };

  // ── Lo que escribió el agente ───────────────────────────────
  const ia: any = bateria?.informe_ia ?? null;
  const hallazgosTodos: Hallazgo[] = Array.isArray(ia?.lecturaCruzada) ? ia.lecturaCruzada : [];
  const hallazgos =
    vista === "talent" ? hallazgosTodos : hallazgosTodos.filter((h) => !h.soloInterno);

  const sc: any = bateria?.scores ?? null;

  // ── Nuestro DISC ────────────────────────────────────────────
  // Va rotulado como NUESTRO y con sus tres gráficas. El DISC de los
  // proveedores vive en su propia sección y nadie los compara eje por eje:
  // «DISC» es una familia de instrumentos, no un instrumento. Cada uno tiene
  // su banco de ítems y sus baremos, el nuestro entrega tres gráficas y el
  // gratuito una sola, y todos son ipsativos —dicen qué eje pesa más DENTRO
  // de la persona, no cuánto tiene frente a los demás—. Enfrentar un número
  // contra el otro produce una discrepancia que no significa nada.
  const EJES = ["D", "I", "S", "C"] as const;
  const disc = sc?.disc
    ? {
        patron: sc.disc.patron ?? null,
        patronNombre: DISC_PATRONES[sc.disc.patron]?.nombre ?? null,
        patronDescripcion: DISC_PATRONES[sc.disc.patron]?.descripcion ?? null,
        graficas: [
          { key: "natural", label: "Natural", ayuda: "Su perfil de trabajo · la síntesis de las otras dos" },
          { key: "mascara", label: "Máscara social", ayuda: "Cómo se muestra ante los demás" },
          { key: "presion", label: "Bajo presión", ayuda: "A qué eje recurre cuando aprieta" },
        ].map((g) => ({
          ...g,
          ejes: EJES.map((e) => ({
            eje: e,
            seg: sc.disc?.[g.key]?.[e]?.seg ?? null,
            referencia: g.key === "natural" ? (perfil?.disc as any)?.[e] ?? null : null,
          })),
        })),
      }
    : null;

  const rasgos = Object.entries(FACTORS).map(([k, f]: [string, any]) => ({
    key: k,
    label: f.label,
    valor: sc?.personalidad?.factores?.[k] ?? null,
    referencia: (perfil?.bigfive as any)?.[k] ?? null,
  }));

  // Razonamiento e integridad sueltos son lectura interna: fuera de las otras
  // dos vistas. No se recortan en el servidor "por si acaso" — se recortan
  // aquí, en un solo lugar, para que la pantalla no tenga que acordarse.
  const pisos =
    vista === "talent" && perfil
      ? {
          razonamiento: { valor: sc?.razonamiento?.total ?? null, piso: perfil.pisos.razonamiento },
          integridad: { valor: sc?.integridad?.permisividadGlobal ?? null, piso: perfil.pisos.integridad },
        }
      : null;

  const validez =
    vista === "talent"
      ? {
          veredicto: bateria?.validity?.veredicto ?? null,
          duracionMin: bateria?.duration_seconds ? Math.round(bateria.duration_seconds / 60) : null,
          detalle: bateria?.validity ?? null,
        }
      : null;

  return {
    vista,
    generadoEl: new Date().toISOString(),
    candidato: {
      id: cand.id,
      nombre: cand.name,
      email: cand.email,
      stage: cand.stage,
      titular: (cand as any).headline ?? (cand as any).current_job_role ?? null,
      empresa: (cand as any).current_company ?? null,
    },
    cargo: perfil
      ? { nombre: perfil.nombre, version: perfil.version, descripcion: perfil.descripcion,
          pesos: perfil.pesos, fundamentoPesos: perfil.fundamentoPesos, criticos: perfil.criticos }
      : { nombre: vacante?.title ?? "Sin perfil de cargo", version: null, descripcion: null,
          pesos: null, fundamentoPesos: null, criticos: [] },
    sinPerfil: !perfil,
    bateria: bateria
      ? {
          token: bateria.token,
          presentadaEl: bateria.finished_at,
          estado: bateria.status,
          match: bateria.match_data?.global ?? null,
          banda: bateria.match_data?.banda ?? null,
          apto: bateria.match_data?.apto ?? null,
          rasgos,
          disc,
          validez,
          pisos,
          tieneInforme: Boolean(ia),
        }
      : null,
    entrevista,
    terna,
    contexto,
    externas,
    completitud: { conResultado: conResultado.length, aplicables: aplicables.length },
    lectura: ia
      ? {
          resumen: ia.resumen ?? null,
          fortalezas: ia.fortalezas ?? [],
          oportunidades: ia.oportunidades ?? [],
          compatibilidad: ia.compatibilidad ?? null,
          preguntas: ia.preguntasEntrevista ?? [],
          planEntrada: vista === "ceo" ? [] : ia.planEntrada ?? [],
          conclusion: ia.conclusion ?? null,
          suficiencia: ia.suficiencia ?? null,
          hallazgos,
          hallazgosOcultos: hallazgosTodos.length - hallazgos.length,
          errorCruce: ia.lecturaCruzadaError ?? null,
          generadoEl: ia.generado_at ?? null,
        }
      : null,
  };
}

/**
 * La entrevista inicial en el formato que el agente puede citar.
 *
 * Solo lo que tiene evidencia: un principio que nadie preguntó no es un
 * «no cumple», y pasárselo al modelo como una fila más invita a que lo lea
 * como un hallazgo. Los que quedaron sin indagar van aparte, contados.
 */
export async function entrevistaParaAgente(candidateId: string) {
  const { data } = await supabaseAdmin
    .from("ts_recruiter_assessments")
    .select("interview_date, duration_minutes, mandate_scores, mandate_evidence, mandate_quotes, english_declared, english_real, english_verdict, verdict, verdict_summary, pass_reasons, fail_reasons, next_filter_probes, human_reviewed")
    .eq("candidate_id", candidateId)
    .order("interview_date", { ascending: false })
    .limit(1);

  const ev: any = (data ?? [])[0];
  if (!ev) return null;

  const scores = ev.mandate_scores ?? {};
  const conEvidencia: any[] = [];
  const sinIndagar: string[] = [];

  for (const m of CEO_MANDATES as any[]) {
    const p = scores[String(m.num)] ?? scores[m.num] ?? "not_probed";
    if (p === "not_probed") { sinIndagar.push(m.label); continue; }
    conEvidencia.push({
      principio: m.label,
      resultado: p,
      evidencia: (ev.mandate_evidence ?? {})[String(m.num)] ?? null,
      citaDelCandidato: (ev.mandate_quotes ?? {})[String(m.num)] ?? null,
    });
  }

  return {
    fecha: ev.interview_date ? String(ev.interview_date).slice(0, 10) : null,
    duracionMin: ev.duration_minutes,
    veredictoDeLaEntrevista: ev.verdict,
    resumen: ev.verdict_summary,
    ingles: { declarado: ev.english_declared, observado: ev.english_real, veredicto: ev.english_verdict },
    aFavor: ev.pass_reasons ?? [],
    enContra: ev.fail_reasons ?? [],
    porIndagarEnLaSiguiente: ev.next_filter_probes ?? [],
    principios: conEvidencia,
    principiosSinIndagar: sinIndagar,
    revisadaPorUnaPersona: Boolean(ev.human_reviewed),
    nota: "Esto es conducta observada, no una escala: pesa distinto que un puntaje.",
  };
}
