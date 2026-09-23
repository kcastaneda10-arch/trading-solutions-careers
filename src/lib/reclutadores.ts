/**
 * RECLUTADORES · quién responde por cada vacante
 *
 * POR QUÉ EXISTE ESTO
 * Con una sola persona reclutando, el dueño del proceso es obvio y no hace
 * falta guardarlo. Con dos deja de serlo: los correos de citación salen con la
 * agenda de quien no va a entrevistar, las métricas de gestión se suman en un
 * montón que no le sirve a nadie, y no hay a quién preguntarle por un candidato
 * detenido. Una fila por persona y un dueño por vacante resuelven las tres.
 *
 * DUEÑO Y APOYO
 * El dueño responde por el proceso. El apoyo puede operarlo igual —relevos,
 * vacaciones, una vacante que se lleva entre dos— sin quitarle la vacante a
 * nadie. Para efectos de la agenda y la firma manda siempre el dueño: el
 * candidato tiene que ver una sola cara.
 *
 * LO QUE ESTO TODAVÍA NO HACE
 * No da ni quita permisos. El ATS sigue entrando con la misma llave para todos.
 * Esto es el dato que el login por persona va a necesitar después.
 */

import { supabaseAdmin } from "@/lib/supabase";

export type Rol = "talent_lead" | "reclutador" | "hiring_manager";

export type Reclutador = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  cargo: string | null;
  calendly_url: string | null;
  activo: boolean;
};

export const ROLES: { id: Rol; label: string; ayuda: string }[] = [
  { id: "talent_lead", label: "Talent Lead", ayuda: "Ve y opera todas las vacantes; maneja la configuración" },
  { id: "reclutador", label: "Reclutador", ayuda: "Lleva sus vacantes de punta a punta" },
  { id: "hiring_manager", label: "Hiring manager", ayuda: "Líder del área: ve su proceso y deja su evaluación" },
];

export function etiquetaRol(rol: string): string {
  return ROLES.find((r) => r.id === rol)?.label ?? rol;
}

const CAMPOS = "id, nombre, email, rol, cargo, calendly_url, activo";

/** Todas las personas del equipo. Por defecto solo las activas. */
export async function listarReclutadores(incluirInactivos = false): Promise<Reclutador[]> {
  let q = supabaseAdmin.from("ts_recruiters").select(CAMPOS).order("nombre");
  if (!incluirInactivos) q = q.eq("activo", true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Reclutador[];
}

export async function reclutadorPorId(id: string): Promise<Reclutador | null> {
  const { data } = await supabaseAdmin.from("ts_recruiters").select(CAMPOS).eq("id", id).maybeSingle();
  return (data as Reclutador) ?? null;
}

/**
 * Firma con la que se presenta quien lleva el proceso.
 *
 * El nombre propio va en el cuerpo del correo («vas a ver el calendario de
 * Maykol») y el cargo en el pie. La compañía sigue firmando debajo: el
 * candidato habla con Trading Solutions, no con una persona suelta.
 */
export type Firma = { firstName: string; fullName: string; role: string };

export function firmaDe(r: Reclutador): Firma {
  return {
    firstName: r.nombre.trim().split(/\s+/)[0] || r.nombre,
    fullName: r.nombre,
    role: r.cargo || "Talent · Trading Solutions",
  };
}

export type DuenoDeVacante = {
  dueno: Reclutador | null;
  apoyo: Reclutador | null;
};

/** Dueño y apoyo de una vacante. Devuelve nulls si la vacante no existe. */
export async function duenoDeVacante(vacancyId: string): Promise<DuenoDeVacante> {
  const { data } = await supabaseAdmin
    .from("ht_vacancies")
    .select("owner_recruiter_id, support_recruiter_id")
    .eq("id", vacancyId)
    .maybeSingle();

  const ids = [data?.owner_recruiter_id, data?.support_recruiter_id].filter(Boolean) as string[];
  if (!ids.length) return { dueno: null, apoyo: null };

  const { data: rs } = await supabaseAdmin.from("ts_recruiters").select(CAMPOS).in("id", ids);
  const porId = new Map((rs ?? []).map((r: any) => [r.id, r as Reclutador]));
  return {
    dueno: data?.owner_recruiter_id ? porId.get(data.owner_recruiter_id) ?? null : null,
    apoyo: data?.support_recruiter_id ? porId.get(data.support_recruiter_id) ?? null : null,
  };
}

/**
 * Agenda y firma con las que sale un correo de esta vacante.
 *
 * Cae con elegancia: si la vacante no tiene dueño, o el dueño todavía no
 * conectó su agenda, devuelve null y quien llama usa lo que usaba antes. Un
 * correo que no sale por falta de configuración es peor que un correo con la
 * agenda del equipo.
 */
export async function agendaDeVacante(
  vacancyId: string | null | undefined,
): Promise<{ calendlyUrl: string | null; firma: Firma | null; dueno: Reclutador | null }> {
  if (!vacancyId) return { calendlyUrl: null, firma: null, dueno: null };
  try {
    const { dueno } = await duenoDeVacante(vacancyId);
    if (!dueno) return { calendlyUrl: null, firma: null, dueno: null };
    return {
      calendlyUrl: dueno.calendly_url || null,
      firma: firmaDe(dueno),
      dueno,
    };
  } catch {
    // Si la tabla todavía no existe (migración sin correr), seguimos como antes.
    return { calendlyUrl: null, firma: null, dueno: null };
  }
}

/** Validación mínima antes de guardar. Devuelve el error o null. */
export function revisarDatos(d: Partial<Reclutador>): string | null {
  if (!d.nombre || !d.nombre.trim()) return "El nombre es obligatorio";
  if (!d.email || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(d.email)) return "El correo no parece válido";
  if (d.rol && !ROLES.some((r) => r.id === d.rol)) return "Rol desconocido";
  if (d.calendly_url && !/^https?:\/\//i.test(d.calendly_url)) return "El enlace de agenda debe empezar por https://";
  return null;
}
