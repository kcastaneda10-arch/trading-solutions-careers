/**
 * Resolución job_id (Neon · tabla `vacancies`) → vacancy_id (Supabase · `ht_vacancies`).
 *
 * POR QUÉ VIVE ACÁ
 * Había dos copias del mapa — una en /api/applications y otra en
 * /api/admin/sync-applications-to-funnel — y la del sync se quedó atrás con
 * solo los ids 2-5. Resultado: una aplicación a una vacante nueva entraba bien
 * por el formulario público pero el sync manual la descartaba por "no mapeada".
 * Con un solo módulo no pueden volver a divergir.
 *
 * POR QUÉ HAY UN FALLBACK POR TÍTULO
 * Un mapa de números escritos a mano se rompe solo: cada vacante nueva exige
 * que alguien se acuerde de agregar la línea, y hasta que lo haga las
 * aplicaciones se guardan en Neon pero nunca entran al funnel — en silencio, y
 * al candidato igual le llega el correo de "aplicación recibida". Ya pasó con
 * Full Stack, que compartía el id 6 con una vacante de China y mandaba sus
 * candidatos al funnel equivocado.
 *
 * Ahora, si el id no está en el mapa, se busca la vacante por título en
 * ht_vacancies. El mapa sigue mandando cuando existe: es más rápido y explícito.
 */
import { supabaseAdmin } from "@/lib/supabase";

const TS_CLIENT_ID = "98b62872-5767-4815-9b49-1394b9527c1f";

export const VACANCY_MAP: Record<number, string> = {
  // CERRADAS · el mapeo se conserva para que las aplicaciones históricas
  // sigan resolviendo, pero ya no se publican en /careers.
  2: "c25ce70b-9244-4393-aea6-75372a99a6ef", // Inside Sales Support — CERRADA 18-ago-2026
  // Customer Documentation Specialist · reabierta el 8-oct-2026. El id de
  // abril (6e4838dd) quedó cerrado con 181 candidatos; apuntar acá seguía
  // mandando a los nuevos a esa vacante muerta.
  3: "0085656c-c139-4f0c-a462-72c2e751b74f",
  4: "d354c55a-eb1c-4aee-bd02-b0a20162e1f1", // Pricing Junior
  5: "70c39cab-adaf-49a0-b137-29d0ff9b56b0", // Talent Acquisition and Development Lead

  // ─── Wellness ────────────────────────────────────────────────────
  12: "52e41180-79ca-48c5-97d1-f385f4d44dde", // Especialista SIG-SST (Wellness)

  // ─── CHINA · Builder Team (form_template_key='china', country='China') ──
  6: "ac368792-1cde-4afb-9185-24d5b4aa0579", // Customer Documentation and Support (Finance)
  7: "da9ca124-e610-450b-a9f1-56f4a538fd9a", // Operations Executive and Support (Operations)
  8: "81d82ac5-9746-4f80-94d5-4595d09bd7ab", // Overseas Sales Executive and Support (Commercial)
  9: "7350dc25-2791-4a9c-8d30-1c09fe48cbad", // Pricing Executive - Support (Pricing)

  // ─── Producto & Tecnología ──
  // Full Stack Developer Junior. Antes era job_id 6, el mismo que la vacante de
  // China de arriba: sus aplicaciones caían en el funnel equivocado. Se movió a
  // 10 y se resuelve por título — no hace falta configurar nada.
  // Si algún día se quiere fijar el UUID, basta con poner la variable
  // VACANCY_ID_FULLSTACK_JUNIOR y esta línea vuelve a mandar.
  ...(process.env.VACANCY_ID_FULLSTACK_JUNIOR
    ? { 10: String(process.env.VACANCY_ID_FULLSTACK_JUNIOR) }
    : ({} as Record<number, string>)),
};

/**
 * Títulos con los que buscar en ht_vacancies cuando el job_id no está mapeado.
 * Se comparan con ILIKE, así que alcanza con un fragmento distintivo.
 */
const TITLE_HINTS: Record<number, string> = {
  3: "customer documentation specialist",
  10: "full stack",
};

/** Lo que se resolvió y cómo, para poder avisar cuando algo huele mal. */
export type VacanteResuelta = {
  id: string;
  titulo: string | null;
  cerrada: boolean;
  via: "mapa" | "titulo" | "mapa_reemplazado";
  aviso: string | null;
};

type FilaVacante = { id: string; title: string | null; status: string | null };

const estaAbierta = (v: FilaVacante) => v.status == null || v.status === "open";

async function buscarPorTitulo(hint: string): Promise<FilaVacante[]> {
  const { data, error } = await supabaseAdmin
    .from("ht_vacancies")
    .select("id, title, status")
    .eq("client_id", TS_CLIENT_ID)
    .ilike("title", `%${hint}%`);
  if (error || !data) return [];
  return data as FilaVacante[];
}

/**
 * Resuelve la vacante de una aplicación del formulario público.
 *
 * POR QUÉ EL MAPA YA NO MANDA SOLO
 * El 8 de octubre quince personas aplicaron a Customer Documentation y
 * ninguna apareció en el funnel: el mapa mandaba el job_id 3 a la vacante de
 * abril, cerrada hacía meses, y nadie lo notó porque la aplicación se guardaba
 * igual y al candidato le llegaba su correo de confirmación.
 *
 * Un cargo que se vuelve a abrir nace con otro id, y el mapa se queda con el
 * viejo hasta que alguien se acuerde de editarlo. Así que ahora, si lo que
 * dice el mapa está CERRADO y existe una vacante abierta con ese mismo
 * nombre, manda la abierta. El mapa sigue valiendo mientras su vacante esté
 * viva, que es el caso normal.
 */
export async function resolverVacante(
  jobId: number,
  jobTitle?: string,
): Promise<VacanteResuelta | null> {
  const hint = TITLE_HINTS[jobId] || (jobTitle || "").trim();
  const mapeada = VACANCY_MAP[jobId];

  if (mapeada) {
    const { data } = await supabaseAdmin
      .from("ht_vacancies")
      .select("id, title, status")
      .eq("id", mapeada)
      .maybeSingle();
    const fila = (data as FilaVacante) || null;

    if (fila && !estaAbierta(fila) && hint) {
      const abierta = (await buscarPorTitulo(hint)).find(estaAbierta);
      if (abierta && abierta.id !== mapeada) {
        const aviso =
          `el mapa manda el job_id ${jobId} a "${fila.title}" (${mapeada}), que está cerrada; ` +
          `se usó la abierta "${abierta.title}" (${abierta.id}). Actualiza VACANCY_MAP.`;
        console.warn(`[vacancy-map] ${aviso}`);
        return { id: abierta.id, titulo: abierta.title, cerrada: false, via: "mapa_reemplazado", aviso };
      }
    }

    const cerrada = Boolean(fila && !estaAbierta(fila));
    return {
      id: mapeada,
      titulo: fila?.title ?? null,
      cerrada,
      via: "mapa",
      aviso: cerrada
        ? `la vacante del mapa para el job_id ${jobId} está cerrada y no hay una abierta con ese nombre`
        : null,
    };
  }

  if (!hint) return null;

  try {
    const encontradas = await buscarPorTitulo(hint);
    if (!encontradas.length) return null;
    const elegida = encontradas.find(estaAbierta) || encontradas[0];
    const aviso =
      `job_id ${jobId} no está en VACANCY_MAP · resuelto por título "${hint}" → ` +
      `${elegida.title} (${elegida.id})`;
    console.warn(`[vacancy-map] ${aviso}`);
    return {
      id: elegida.id,
      titulo: elegida.title,
      cerrada: !estaAbierta(elegida),
      via: "titulo",
      aviso,
    };
  } catch (e: any) {
    console.error(`[vacancy-map] fallo resolviendo job_id ${jobId}:`, e?.message || e);
    return null;
  }
}

/**
 * Igual que `resolverVacante` pero devolviendo solo el id, para quien no
 * necesita el detalle. Devuelve null si no hay forma de resolverlo — quien
 * llama debe loguearlo, nunca descartar la aplicación en silencio.
 */
export async function resolveVacancyId(
  jobId: number,
  jobTitle?: string,
): Promise<string | null> {
  const r = await resolverVacante(jobId, jobTitle);
  return r?.id ?? null;
}
