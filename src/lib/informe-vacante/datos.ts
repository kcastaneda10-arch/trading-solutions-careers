/**
 * INFORME DE VACANTE · los números
 *
 * Todo lo que va en el informe para el hiring manager y la dirección sale de
 * acá, calculado en el momento. El PDF solo dibuja.
 *
 * QUÉ NO VA, A PROPÓSITO
 * El informe es para personas de fuera del equipo de Talent. No lleva la
 * validez de la prueba, ni el razonamiento suelto, ni «respuestas pendientes»:
 * son lecturas internas que afuera se entienden mal. Lleva el match, la
 * integridad y la fortaleza principal de cada persona.
 */
import { supabaseAdmin } from "@/lib/supabase";
import { normalizeStage, stageOrder } from "@/lib/stage-labels";

export type FilaPrueba = {
  token: string;
  candidateId: string | null;
  nombre: string;
  match: number;
  integridad: number | null;
  razonamiento: number | null;
  fortaleza: string;
  fortalezaIA: boolean;
  banda: "sup" | "med" | "inf";
  terminada: string | null;
  informe: null | {
    fortalezas: string[];
    validar: string[];
    pregunta: string | null;
    lectura: string | null;
  };
};

export type Informe = {
  generado: string;
  vacante: { id: string; titulo: string; abiertaDesde: string; dias: number; etapa: string };
  kpis: {
    aplicaron: number;
    prefiltro: number;
    invitados: number;
    presentaron: number;
    pctPresentaron: number;
    bandaSuperior: number;
    bandaDesde: number;
    bandaHasta: number;
    activos: number;
  };
  embudo: { etiqueta: string; n: number; sub: string | null }[];
  hoy: { etiqueta: string; n: number; color: string }[];
  descartes: { etiqueta: string; n: number }[];
  gestion: { activos: number; contactos: number; recuperadas: number; enSeguimiento: number };
  pruebas: FilaPrueba[];
  top10: FilaPrueba[];
  fraseSugerida: string;
  pasosSugeridos: string[];
};

// ── Fortaleza principal ────────────────────────────────────────
// Si el psicólogo IA ya escribió el informe, manda su primera fortaleza. Si
// no, se toma el rasgo que más supera lo que pide el cargo, medido contra el
// margen que tenía para superarlo: sin esa normalización ganaba siempre el
// rasgo con la referencia más baja.
const ETQ_RASGO: Record<string, string> = {
  EXT: "Comunicación y relacionamiento",
  APE: "Apertura a aprender y adaptarse",
  AMA: "Orientación al servicio y al equipo",
  RES: "Organización y rigor en el trabajo",
  EST: "Calma bajo presión",
};

function fortalezaDe(s: any, raz: number | null, integ: number | null): { texto: string; ia: boolean } {
  const ia = limpiar((s.informe_ia?.fortalezas ?? []).map((x: any) => x?.titulo))[0];
  if (ia) return { texto: String(ia), ia: true };
  if ((raz ?? 0) >= 90) return { texto: "Razonamiento analítico", ia: false };
  if ((integ ?? 0) >= 95) return { texto: "Apego a normas y procesos", ia: false };
  const rasgos: any[] = s.match_data?.rasgos ?? [];
  let mejor: { v: number; k: string } | null = null;
  for (const r of rasgos) {
    if (r.referencia == null || r.referencia >= 100) continue;
    const v = (r.obtenido - r.referencia) / (100 - r.referencia);
    if (v > 0 && (!mejor || v > mejor.v)) mejor = { v, k: r.key };
  }
  if (mejor && ETQ_RASGO[mejor.k]) return { texto: ETQ_RASGO[mejor.k], ia: false };
  return { texto: (raz ?? 0) >= (integ ?? 0) ? "Razonamiento analítico" : "Apego a normas y procesos", ia: false };
}

// Lo que es de control interno no sale del equipo: señales de copia, cámara,
// validez de la sesión o deseabilidad social. Al hiring manager le sirve lo
// que la persona es, no cómo se vigiló la prueba.
const INTERNO = /copi|peg[oó]|pegad|proctor|validez|v[aá]lid|sesi[oó]n|deseabilidad|c[aá]mara|pesta[nñ]a|reserva/i;
const limpiar = (xs: string[]) => xs.filter((x) => x && !INTERNO.test(x));
function lecturaLimpia(t: string | null | undefined): string | null {
  if (!t) return null;
  const frases = t.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).filter((f) => !INTERNO.test(f));
  return frases.join(" ").trim() || null;
}

function componente(s: any, key: string): number | null {
  const c = (s.match_data?.componentes ?? []).find((x: any) => x.key === key);
  return typeof c?.puntaje === "number" ? Math.round(c.puntaje) : null;
}

/** Nombres como vienen del formulario: todo en mayúsculas o todo en minúsculas. */
export function nombrePropio(s: string): string {
  const menores = new Set(["de", "del", "la", "las", "los", "y"]);
  return s
    .trim()
    .split(/\s+/)
    .map((w, i) => {
      const l = w.toLowerCase();
      if (i > 0 && menores.has(l)) return l;
      return l.charAt(0).toUpperCase() + l.slice(1);
    })
    .join(" ");
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Bogota" });

export async function armarInforme(vacancyId: string): Promise<Informe> {
  const { data: vac, error: eV } = await supabaseAdmin
    .from("ht_vacancies")
    .select("id, title, created_at, status")
    .eq("id", vacancyId)
    .maybeSingle();
  if (eV) throw new Error(eV.message);
  if (!vac) throw new Error("Vacante no encontrada");

  const { data: cands, error: eC } = await supabaseAdmin
    .from("ht_candidates")
    .select("id, name, stage, rejection_category, prefilter_completed_at")
    .eq("vacancy_id", vacancyId)
    .limit(2000);
  if (eC) throw new Error(eC.message);
  const C = cands ?? [];
  const ids = C.map((c) => c.id);
  const porId = new Map(C.map((c) => [c.id, c]));

  // ── Pruebas psicométricas ──
  // Por ficha del candidato y, para las sesiones que no quedaron enlazadas,
  // por el título de la vacante.
  const [{ data: s1 }, { data: s2 }] = await Promise.all([
    ids.length
      ? supabaseAdmin
          .from("ts_bat_sessions")
          .select("token, ht_candidate_id, candidate_name, vacancy_title, invited_at, finished_at, match_data, informe_ia")
          .in("ht_candidate_id", ids)
      : Promise.resolve({ data: [] as any[] }),
    supabaseAdmin
      .from("ts_bat_sessions")
      .select("token, ht_candidate_id, candidate_name, vacancy_title, invited_at, finished_at, match_data, informe_ia")
      .is("ht_candidate_id", null)
      .eq("vacancy_title", vac.title),
  ]);
  const sesiones = new Map<string, any>();
  for (const s of [...(s1 ?? []), ...(s2 ?? [])]) sesiones.set(s.token, s);
  const S = [...sesiones.values()];
  const invitadas = S.filter((s) => s.invited_at);
  const terminadas = S.filter((s) => s.finished_at && s.match_data?.global != null);

  // ── Hasta dónde llegó cada uno (etapa actual + historial) ──
  const alcance = new Map<string, number>();
  for (const c of C) {
    const st = normalizeStage(c.stage);
    if (st !== "rechazado") alcance.set(c.id, stageOrder(st));
  }
  if (ids.length) {
    const { data: ev } = await supabaseAdmin
      .from("ht_candidate_stage_events")
      .select("candidate_id, to_stage")
      .in("candidate_id", ids)
      .limit(5000);
    for (const e of ev ?? []) {
      const st = normalizeStage(e.to_stage);
      if (st === "rechazado") continue;
      const o = stageOrder(st);
      if (o > (alcance.get(e.candidate_id) ?? 0)) alcance.set(e.candidate_id, o);
    }
  }
  const llegaron = (o: number) => [...alcance.values()].filter((x) => x >= o).length;

  const aplicaron = C.length;
  const prefiltro = C.filter((c) => c.prefilter_completed_at).length;
  const invitados = invitadas.length;
  const presentaron = terminadas.length;
  const entrevista = llegaron(stageOrder("recruiter_interview"));
  const terna = llegaron(stageOrder("terna"));
  const contratados = C.filter((c) => normalizeStage(c.stage) === "contratado").length;
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

  const embudo = [
    { etiqueta: "Aplicaron", n: aplicaron, sub: null },
    { etiqueta: "Completaron el prefiltro", n: prefiltro, sub: `${pct(prefiltro, aplicaron)} % de los que aplicaron` },
    { etiqueta: "Invitados a pruebas psicométricas", n: invitados, sub: `${pct(invitados, prefiltro)} % del prefiltro` },
    { etiqueta: "Presentaron las pruebas", n: presentaron, sub: `${pct(presentaron, invitados)} % de los invitados` },
    { etiqueta: "Entrevista", n: entrevista, sub: entrevista ? `${pct(entrevista, presentaron)} % de los evaluados` : "Siguiente paso" },
    { etiqueta: "Terna", n: terna, sub: null },
    { etiqueta: "Contratación", n: contratados, sub: null },
  ];

  // ── Dónde están hoy ──
  const terminoPorCand = new Set(terminadas.map((s) => s.ht_candidate_id).filter(Boolean));
  const grupos: Record<string, { etiqueta: string; n: number; color: string }> = {
    pre: { etiqueta: "Por completar el prefiltro", n: 0, color: "#d4d4d4" },
    rev: { etiqueta: "En revisión de prefiltro", n: 0, color: "#a3a3a3" },
    seg: { etiqueta: "Pruebas en seguimiento", n: 0, color: "#737373" },
    dec: { etiqueta: "Pruebas presentadas · por decidir entrevista", n: 0, color: "#1a7d3e" },
    ent: { etiqueta: "En entrevista o prueba técnica", n: 0, color: "#2f6fd6" },
    ter: { etiqueta: "En terna o contratación", n: 0, color: "#6b3fb5" },
    fin: { etiqueta: "Contratados", n: 0, color: "#0f5b2c" },
    des: { etiqueta: "Descartados", n: 0, color: "#0a0a0a" },
  };
  for (const c of C) {
    const st = normalizeStage(c.stage);
    const o = stageOrder(st);
    if (st === "rechazado") grupos.des.n++;
    else if (st === "contratado") grupos.fin.n++;
    else if (o >= stageOrder("terna")) grupos.ter.n++;
    else if (o >= stageOrder("prueba_tecnica")) grupos.ent.n++;
    else if (st === "pruebas") (terminoPorCand.has(c.id) ? grupos.dec : grupos.seg).n++;
    else if (st === "prefiltro_pasado" || st === "prefiltro_revision") grupos.rev.n++;
    else grupos.pre.n++;
  }
  const hoy = Object.values(grupos).filter((g) => g.n > 0);

  // ── Descartes por motivo ──
  const { data: cats } = await supabaseAdmin.from("ts_rejection_categories").select("category_key, category_label");
  const etiquetaCat = new Map((cats ?? []).map((c: any) => [c.category_key, c.category_label]));
  etiquetaCat.set("decision_candidato", "El candidato desistió");
  etiquetaCat.set("idioma_insuficiente", "Nivel de inglés insuficiente");
  const conteo = new Map<string, number>();
  for (const c of C.filter((x) => normalizeStage(x.stage) === "rechazado")) {
    const k = c.rejection_category || "sin_clasificar";
    conteo.set(k, (conteo.get(k) ?? 0) + 1);
  }
  const descartes = [...conteo.entries()]
    .map(([k, n]) => ({ etiqueta: k === "sin_clasificar" ? "Sin motivo registrado" : etiquetaCat.get(k) || k, n }))
    .sort((a, b) => b.n - a.n);

  // ── Gestión ──
  const activos = C.filter((c) => !["rechazado", "contratado"].includes(normalizeStage(c.stage))).length;
  let contactos = 0;
  let recuperadas = 0;
  if (ids.length) {
    const { count } = await supabaseAdmin
      .from("ht_contact_events")
      .select("id", { count: "exact", head: true })
      .in("candidate_id", ids)
      .eq("direction", "saliente")
      .neq("status", "intento");
    contactos = count ?? 0;
    // Una prueba cuenta como «recuperada» si se presentó después de un
    // recordatorio: sin el seguimiento, esa persona no estaría en la tabla.
    const { data: recs } = await supabaseAdmin
      .from("ht_contact_events")
      .select("candidate_id, occurred_at")
      .in("candidate_id", ids)
      .eq("kind", "recordatorio_prueba");
    const primerRec = new Map<string, number>();
    for (const r of recs ?? []) {
      const t = new Date(r.occurred_at).getTime();
      if (!primerRec.has(r.candidate_id) || t < primerRec.get(r.candidate_id)!) primerRec.set(r.candidate_id, t);
    }
    recuperadas = terminadas.filter(
      (s) => s.ht_candidate_id && primerRec.has(s.ht_candidate_id) && new Date(s.finished_at).getTime() > primerRec.get(s.ht_candidate_id)!,
    ).length;
  }
  const enSeguimiento = invitadas.filter((s) => {
    if (s.finished_at) return false;
    const c = s.ht_candidate_id ? porId.get(s.ht_candidate_id) : null;
    return !c || normalizeStage(c.stage) !== "rechazado";
  }).length;

  // ── Resultados de las pruebas ──
  const filas: FilaPrueba[] = terminadas
    .filter((s) => {
      // Quien ya fue descartado no va en la lista para el hiring manager.
      const c = s.ht_candidate_id ? porId.get(s.ht_candidate_id) : null;
      return !c || normalizeStage(c.stage) !== "rechazado";
    })
    .map((s) => {
      const integ = componente(s, "integridad");
      const raz = componente(s, "razonamiento");
      const f = fortalezaDe(s, raz, integ);
      const ia = s.informe_ia;
      const c = s.ht_candidate_id ? porId.get(s.ht_candidate_id) : null;
      return {
        token: s.token,
        candidateId: s.ht_candidate_id ?? null,
        nombre: nombrePropio(c?.name || s.candidate_name || "Sin nombre"),
        match: Math.round(s.match_data.global),
        integridad: integ,
        razonamiento: raz,
        fortaleza: f.texto,
        fortalezaIA: f.ia,
        banda: "med" as const,
        terminada: s.finished_at,
        informe: ia?.fortalezas
          ? {
              fortalezas: limpiar((ia.fortalezas ?? []).map((x: any) => x.titulo)).slice(0, 3),
              validar: limpiar((ia.oportunidades ?? []).map((x: any) => x.titulo)).slice(0, 2),
              pregunta: limpiar((ia.preguntasEntrevista ?? []).map((x: any) => x.pregunta))[0] ?? null,
              lectura: lecturaLimpia(ia.compatibilidad?.lectura),
            }
          : null,
      };
    })
    .sort((a, b) => b.match - a.match);

  // Banda superior: dentro de 5 puntos del primero van empatados.
  const tope = filas[0]?.match ?? 0;
  for (const f of filas) f.banda = f.match >= tope - 5 ? "sup" : f.match >= 80 ? "med" : "inf";
  const sup = filas.filter((f) => f.banda === "sup").length;

  // ── Etapa en la que va la búsqueda ──
  const maxActivo = Math.max(0, ...[...alcance.entries()].filter(([id]) => {
    const c = porId.get(id);
    return c && !["rechazado", "contratado"].includes(normalizeStage(c.stage));
  }).map(([, o]) => o));
  const etapa =
    contratados > 0 ? "Contratación"
    : maxActivo >= stageOrder("terna") ? "Terna"
    : maxActivo >= stageOrder("prueba_tecnica") ? "Entrevistas"
    : presentaron > 0 ? "Pruebas psicométricas y selección para entrevista"
    : invitados > 0 ? "Pruebas psicométricas"
    : "Prefiltro";

  const nombresSup = filas.filter((f) => f.banda === "sup").map((f) => f.nombre.split(" ").slice(0, 1).concat(f.nombre.split(" ").slice(-2, -1)).join(" "));

  const fraseSugerida =
    entrevista > 0
      ? `${entrevista} ${entrevista === 1 ? "candidato llegó" : "candidatos llegaron"} a entrevista de ${presentaron} que presentaron las pruebas psicométricas iniciales. El siguiente paso es cerrar las entrevistas y armar la terna con el hiring manager.`
      : presentaron > 0
        ? `${presentaron} de ${invitados} invitados presentaron las pruebas psicométricas iniciales y ${sup} ${sup === 1 ? "candidato está" : "candidatos están"} en la banda superior de match, empatados entre sí. El siguiente paso es definir con el hiring manager quiénes pasan a entrevista.`
        : `La búsqueda está en prefiltro: ${prefiltro} de ${aplicaron} candidatos completaron el cuestionario inicial. El siguiente paso es invitar a pruebas psicométricas a quienes lo superaron.`;

  const pasosSugeridos =
    presentaron > 0 && entrevista === 0
      ? [
          `Definir la lista de entrevista con el hiring manager a partir de la banda superior (${nombresSup.join(", ")}).`,
          enSeguimiento > 0
            ? `Cerrar las pruebas psicométricas de los ${enSeguimiento} candidatos en seguimiento.`
            : "Cerrar la etapa de pruebas psicométricas.",
          "Agendar entrevistas y presentar la terna al hiring manager.",
        ]
      : entrevista > 0
        ? ["Cerrar las entrevistas en curso.", "Presentar la terna al hiring manager.", "Iniciar la etapa de contratación con la persona elegida."]
        : ["Completar el prefiltro de los candidatos pendientes.", "Invitar a pruebas psicométricas a quienes lo superaron.", "Presentar los resultados al hiring manager."];

  const creada = vac.created_at as string;
  return {
    generado: new Date().toISOString(),
    vacante: {
      id: vac.id,
      titulo: vac.title,
      abiertaDesde: fmt(creada),
      dias: Math.max(0, Math.floor((Date.now() - new Date(creada).getTime()) / 86_400_000)),
      etapa,
    },
    kpis: {
      aplicaron,
      prefiltro,
      invitados,
      presentaron,
      pctPresentaron: pct(presentaron, invitados),
      bandaSuperior: sup,
      bandaDesde: Math.max(0, tope - 5),
      bandaHasta: tope,
      activos,
    },
    embudo,
    hoy,
    descartes,
    gestion: { activos, contactos, recuperadas, enSeguimiento },
    pruebas: filas,
    top10: filas.slice(0, 10),
    fraseSugerida,
    pasosSugeridos,
  };
}
