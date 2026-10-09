/**
 * Pruebas externas · el lado del servidor.
 *
 * Trading Solutions aplica pruebas en seis plataformas distintas. Ninguna
 * tiene integración: el resultado vive en el portal del proveedor y hay que
 * ir a buscarlo. Lo que este módulo hace no es traerlo solo —eso depende de
 * cada proveedor— sino dejar constancia en el ATS de qué se le aplicó a cada
 * persona, cuándo, cómo le fue y dónde quedó el soporte.
 *
 * La diferencia práctica: hoy, para comparar dos candidatos, hay que abrir
 * seis pestañas. Con esto se abre una tabla.
 *
 * No reemplaza la batería propia (`ts_bat_sessions`), que se calcula aquí y
 * tiene su propio match contra el perfil del cargo. Esto es para lo de afuera.
 */

import { supabaseAdmin } from "@/lib/supabase";

export type ViaProveedor = "manual" | "candidato" | "api";

export type Proveedor = {
  id: string;
  key: string;
  nombre: string;
  categoria: string | null;
  portal_url: string | null;
  via: ViaProveedor;
  campos: string[];
  activo: boolean;
  notas: string | null;
};

export type EstadoPrueba =
  | "pendiente"
  | "enviada"
  | "presentada"
  | "cargada"
  | "no_aplica";

export type ResultadoExterno = {
  id: string;
  candidate_id: string;
  provider_id: string;
  estado: EstadoPrueba;
  enviada_at: string | null;
  presentada_at: string | null;
  cargada_at: string | null;
  puntajes: Record<string, unknown> | null;
  resumen: string | null;
  archivo_url: string | null;
  archivo_nombre: string | null;
  portal_url: string | null;
  cargado_por: string | null;
  notas: string | null;
};

/** Cómo se lee cada estado en pantalla. El orden importa: es el del ciclo. */
export const ESTADOS: { key: EstadoPrueba; label: string; ayuda: string }[] = [
  { key: "pendiente", label: "Pendiente", ayuda: "Falta enviarla" },
  { key: "enviada", label: "Enviada", ayuda: "Se le mandó y no la ha presentado" },
  { key: "presentada", label: "Presentada", ayuda: "Ya la hizo · falta bajar el resultado" },
  { key: "cargada", label: "Resultado cargado", ayuda: "El resultado está en la ficha" },
  { key: "no_aplica", label: "No aplica", ayuda: "Este cargo no la pide" },
];

export function etiquetaEstado(e: EstadoPrueba | null | undefined): string {
  return ESTADOS.find((x) => x.key === e)?.label ?? "Pendiente";
}

/**
 * Qué estado le corresponde a una fila según lo que tenga.
 *
 * Se calcula en vez de confiar en lo que haya guardado porque el estado es lo
 * que se mira en la matriz, y un estado que no corresponde con los datos es
 * peor que no tener estado: manda a buscar un resultado que ya está, o da por
 * cerrado uno que nadie bajó.
 */
const ESTADOS_VALIDOS = new Set<EstadoPrueba>([
  "pendiente", "enviada", "presentada", "cargada", "no_aplica",
]);

export function estadoReal(r: Partial<ResultadoExterno>): EstadoPrueba {
  // Manda el estado guardado. La primera versión lo deducía del contenido y
  // daba «resultado cargado» a una prueba que NO se presentó, solo porque
  // tenía resumen — y el resumen muchas veces es justamente la explicación de
  // por qué no hay resultado: «no aparece en el panel». Un texto que cuenta
  // una ausencia no es un resultado.
  if (r.estado && ESTADOS_VALIDOS.has(r.estado)) return r.estado;

  // Sin estado guardado sí se deduce, y ahí solo cuenta la evidencia dura.
  if (r.archivo_url || (r.puntajes && Object.keys(r.puntajes).length > 0)) return "cargada";
  if (r.presentada_at) return "presentada";
  if (r.enviada_at) return "enviada";
  return "pendiente";
}

export async function listarProveedores(incluirInactivos = false): Promise<Proveedor[]> {
  let q = supabaseAdmin
    .from("ts_test_providers")
    .select("id, key, nombre, categoria, portal_url, via, campos, activo, notas")
    .order("categoria", { ascending: true })
    .order("nombre", { ascending: true });
  if (!incluirInactivos) q = q.eq("activo", true);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  return (data ?? []).map((p: any) => ({
    ...p,
    campos: Array.isArray(p.campos) ? p.campos : [],
  })) as Proveedor[];
}

/**
 * La matriz: una fila por candidato, una columna por proveedor.
 *
 * Devuelve TODOS los candidatos pedidos, incluidos los que no tienen ninguna
 * prueba registrada. Una matriz que esconde a quien no tiene nada no sirve
 * para lo único que se usa, que es ver quién va faltando.
 */
export async function matrizDeVacante(vacancyId: string) {
  const proveedores = await listarProveedores();

  const { data: cands, error: eCand } = await supabaseAdmin
    .from("ht_candidates")
    .select("id, name, email, stage, status")
    .eq("vacancy_id", vacancyId)
    .order("name", { ascending: true });
  if (eCand) throw new Error(eCand.message);

  const ids = (cands ?? []).map((c: any) => c.id);
  let filas: any[] = [];
  if (ids.length) {
    const { data, error } = await supabaseAdmin
      .from("ht_external_test_results")
      .select(
        "id, candidate_id, provider_id, estado, enviada_at, presentada_at, cargada_at, puntajes, resumen, archivo_url, archivo_nombre, portal_url, cargado_por, notas",
      )
      .in("candidate_id", ids);
    if (error) throw new Error(error.message);
    filas = data ?? [];
  }

  const porCandidato = new Map<string, Map<string, ResultadoExterno>>();
  for (const f of filas) {
    const m = porCandidato.get(f.candidate_id) ?? new Map();
    m.set(f.provider_id, { ...f, estado: estadoReal(f) } as ResultadoExterno);
    porCandidato.set(f.candidate_id, m);
  }

  const candidatos = (cands ?? []).map((c: any) => ({
    id: c.id,
    nombre: c.name,
    email: c.email,
    stage: c.stage,
    status: c.status,
    pruebas: proveedores.map((p) => {
      const r = porCandidato.get(c.id)?.get(p.id) ?? null;
      return {
        provider_id: p.id,
        provider_key: p.key,
        estado: r ? r.estado : ("pendiente" as EstadoPrueba),
        resumen: r?.resumen ?? null,
        archivo_url: r?.archivo_url ?? null,
        presentada_at: r?.presentada_at ?? null,
        resultado_id: r?.id ?? null,
      };
    }),
  }));

  return { proveedores, candidatos };
}

/**
 * Crea o actualiza el resultado de una prueba. Es upsert por (candidato,
 * proveedor): volver a cargar la misma prueba corrige la fila en vez de
 * duplicarla.
 */
export async function guardarResultado(entrada: {
  candidateId: string;
  providerId: string;
  vacancyId?: string | null;
  clientId?: string | null;
  estado?: EstadoPrueba;
  enviadaAt?: string | null;
  presentadaAt?: string | null;
  puntajes?: Record<string, unknown> | null;
  resumen?: string | null;
  archivoUrl?: string | null;
  archivoNombre?: string | null;
  portalUrl?: string | null;
  cargadoPor?: string | null;
  notas?: string | null;
}) {
  const ahora = new Date().toISOString();
  const tieneResultado =
    Boolean(entrada.archivoUrl) ||
    Boolean(entrada.resumen) ||
    (entrada.puntajes != null && Object.keys(entrada.puntajes).length > 0);

  const fila: Record<string, unknown> = {
    candidate_id: entrada.candidateId,
    provider_id: entrada.providerId,
    updated_at: ahora,
  };
  if (entrada.vacancyId !== undefined) fila.vacancy_id = entrada.vacancyId;
  if (entrada.clientId !== undefined) fila.client_id = entrada.clientId;
  if (entrada.enviadaAt !== undefined) fila.enviada_at = entrada.enviadaAt;
  if (entrada.presentadaAt !== undefined) fila.presentada_at = entrada.presentadaAt;
  if (entrada.puntajes !== undefined) fila.puntajes = entrada.puntajes;
  if (entrada.resumen !== undefined) fila.resumen = entrada.resumen;
  if (entrada.archivoUrl !== undefined) fila.archivo_url = entrada.archivoUrl;
  if (entrada.archivoNombre !== undefined) fila.archivo_nombre = entrada.archivoNombre;
  if (entrada.portalUrl !== undefined) fila.portal_url = entrada.portalUrl;
  if (entrada.cargadoPor !== undefined) fila.cargado_por = entrada.cargadoPor;
  if (entrada.notas !== undefined) fila.notas = entrada.notas;

  // Quien carga un resultado está diciendo, sin escribirlo, que la persona la
  // presentó. Pedirle además que marque la fecha es la clase de paso que se
  // olvida y deja la matriz mintiendo.
  if (tieneResultado) {
    fila.cargada_at = ahora;
    if (entrada.presentadaAt === undefined) fila.presentada_at = ahora;
  }
  fila.estado = entrada.estado ?? estadoReal({ ...fila, estado: entrada.estado } as any);

  const { data, error } = await supabaseAdmin
    .from("ht_external_test_results")
    .upsert(fila, { onConflict: "candidate_id,provider_id" })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Las pruebas externas de una persona, con las etiquetas legibles que el
 * agente psicólogo necesita para poder citarlas.
 *
 * Devuelve TAMBIÉN las que no tienen resultado. Es deliberado: que una prueba
 * no se haya presentado es parte del expediente, y si el agente solo ve lo
 * que sí se midió va a escribir como si el expediente estuviera completo —
 * que es exactamente el error que este informe existe para evitar.
 */
export async function pruebasExternasParaAgente(candidateId: string) {
  const [proveedores, filas] = await Promise.all([
    listarProveedores(),
    supabaseAdmin
      .from("ht_external_test_results")
      .select("provider_id, estado, puntajes, resumen, presentada_at, notas")
      .eq("candidate_id", candidateId)
      .then((r) => r.data ?? []),
  ]);

  const porProveedor = new Map(filas.map((f: any) => [f.provider_id, f]));

  return proveedores
    .map((p) => {
      const r: any = porProveedor.get(p.id);
      const estado = r ? estadoReal(r) : "pendiente";
      if (estado === "no_aplica") return null;
      return {
        prueba: p.nombre,
        mide: p.categoria,
        laPresentaElCandidato: p.via === "candidato",
        estado,
        estadoEnPalabras: etiquetaEstado(estado),
        presentadaEl: r?.presentada_at ? String(r.presentada_at).slice(0, 10) : null,
        puntajes: r?.puntajes ?? null,
        resultado: r?.resumen ?? null,
        notaDeQuienLaCargo: r?.notas ?? null,
      };
    })
    .filter(Boolean);
}
