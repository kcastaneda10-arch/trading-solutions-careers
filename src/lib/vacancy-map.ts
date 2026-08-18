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
  3: "6e4838dd-8aea-4426-bd26-ea588f0f493a", // Customer Documentation Specialist
  4: "d354c55a-eb1c-4aee-bd02-b0a20162e1f1", // Pricing Junior
  5: "70c39cab-adaf-49a0-b137-29d0ff9b56b0", // Talent Acquisition and Development Lead

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
  10: "full stack",
};

/**
 * Resuelve el vacancy_id de Supabase para un job_id del formulario público.
 * Devuelve null si no hay forma de resolverlo — quien llama debe loguearlo,
 * nunca descartar la aplicación en silencio.
 */
export async function resolveVacancyId(
  jobId: number,
  jobTitle?: string,
): Promise<string | null> {
  const mapped = VACANCY_MAP[jobId];
  if (mapped) return mapped;

  // Fallback por título: primero la pista fija del id, si no el título que
  // vino con la aplicación.
  const hint = TITLE_HINTS[jobId] || (jobTitle || "").trim();
  if (!hint) return null;

  try {
    const { data, error } = await supabaseAdmin
      .from("ht_vacancies")
      .select("id, title, status")
      .eq("client_id", TS_CLIENT_ID)
      .ilike("title", `%${hint}%`);

    if (error || !data || data.length === 0) return null;

    // Con varias coincidencias se prefiere una abierta: si hay una versión
    // vieja cerrada y una nueva abierta del mismo cargo, el candidato va a la
    // que está en curso.
    const abierta = data.find((v: any) => v.status == null || v.status === "open");
    const elegida = abierta || data[0];

    console.warn(
      `[vacancy-map] job_id ${jobId} no está en VACANCY_MAP · resuelto por título ` +
      `"${hint}" → ${elegida.title} (${elegida.id})`,
    );
    return elegida.id as string;
  } catch (e: any) {
    console.error(`[vacancy-map] fallo resolviendo job_id ${jobId}:`, e?.message || e);
    return null;
  }
}
