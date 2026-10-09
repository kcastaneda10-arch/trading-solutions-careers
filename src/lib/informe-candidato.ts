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
import { FACTORS } from "@/lib/bateria/interpretacion";
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
    .select("id, name, email, stage, status, headline, current_job_role, current_company, vacancy_id, ht_vacancies(id, title, country, form_template_key)")
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

  // ── Lo que escribió el agente ───────────────────────────────
  const ia: any = bateria?.informe_ia ?? null;
  const hallazgosTodos: Hallazgo[] = Array.isArray(ia?.lecturaCruzada) ? ia.lecturaCruzada : [];
  const hallazgos =
    vista === "talent" ? hallazgosTodos : hallazgosTodos.filter((h) => !h.soloInterno);

  const sc: any = bateria?.scores ?? null;

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
          validez,
          pisos,
          tieneInforme: Boolean(ia),
        }
      : null,
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
