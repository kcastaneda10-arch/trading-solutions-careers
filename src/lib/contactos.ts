/**
 * HISTORIAL DE CONTACTOS · un solo lugar para todo lo que se habló con cada
 * candidato, venga de donde venga.
 *
 * TRES FUENTES, TRES NIVELES DE CERTEZA
 *   - Gmail: se lee de la bandeja de jointheteam. Es verificado: si está, salió
 *     o llegó. Incluye lo que el ATS envía solo y lo que se envía a mano.
 *   - WhatsApp exportado: el chat se exporta desde el celular y se importa en
 *     la ficha. También verificado, con hora exacta de cada mensaje.
 *   - Botón de WhatsApp del ATS: solo prueba que se abrió el chat con el texto
 *     listo. Si se envió, lo confirma la importación del chat. Por eso queda
 *     como «intento», no como contacto.
 *
 * Lo que no pasa por ninguna de las tres (una llamada, una conversación en la
 * oficina) se anota a mano y queda marcado como manual.
 */
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { searchGmailMessages, getGmailMessageMetadata, getValidAccessToken } from "@/lib/gmail";

export type Canal = "email" | "whatsapp" | "llamada" | "presencial" | "otro";
export type Direccion = "saliente" | "entrante";
export type Origen = "gmail_sync" | "whatsapp_export" | "whatsapp_boton" | "manual" | "sistema";

export type ContactoNuevo = {
  candidate_id: string;
  vacancy_id?: string | null;
  channel: Canal;
  direction: Direccion;
  kind?: string | null;
  occurred_at: string;
  summary?: string | null;
  body?: string | null;
  source: Origen;
  external_id?: string | null;
  thread_id?: string | null;
  status?: "confirmado" | "intento" | "borrador";
  created_by?: string | null;
};

/** Huella estable para no duplicar al volver a importar lo mismo. */
export function huella(...partes: (string | number | null | undefined)[]): string {
  return crypto.createHash("sha1").update(partes.map((p) => String(p ?? "")).join("|")).digest("hex");
}

/**
 * Qué tipo de mensaje es, por el asunto. Los asuntos del ATS son fijos, así
 * que esto reconoce casi todo lo que sale solo. Lo que no reconoce queda sin
 * tipo: mejor vacío que mal clasificado.
 */
export function clasificarAsunto(asunto: string, direccion: Direccion): string | null {
  const s = (asunto || "").toLowerCase();
  if (direccion === "entrante") return "respuesta";
  if (/sobre tu aplicaci[oó]n|about your application/.test(s)) return "rechazo";
  if (/^re:.*(prueba de selecci[oó]n|selection assessment)/.test(s)) return "recordatorio_prueba";
  if (/prueba de selecci[oó]n|selection assessment/.test(s)) return "invitacion_prueba";
  if (/cuestionario inicial|pre-screening/.test(s)) return "prefiltro";
  if (/recibimos tu aplicaci[oó]n|we received your application/.test(s)) return "acuse";
  if (/elige tu horario|entrevista|interview/.test(s)) return "entrevista";
  if (/bienvenid/.test(s)) return "bienvenida";
  if (/^re:/.test(s)) return "respuesta_nuestra";
  return null;
}

/** Inserta sin duplicar: lo que ya estaba (misma fuente + id) se ignora. */
export async function guardarContactos(filas: ContactoNuevo[]): Promise<{ nuevos: number; error?: string }> {
  if (filas.length === 0) return { nuevos: 0 };
  const { data, error } = await supabaseAdmin
    .from("ht_contact_events")
    .upsert(filas, { onConflict: "source,external_id", ignoreDuplicates: true })
    .select("id");
  if (error) return { nuevos: 0, error: error.message };
  return { nuevos: (data ?? []).length };
}

/**
 * Lee de Gmail todo lo que se cruzó con un candidato y lo guarda en su
 * historial. Idempotente: se puede correr las veces que haga falta.
 */
export async function sincronizarGmailCandidato(
  cand: { id: string; email: string | null; vacancy_id?: string | null },
  dias = 180,
): Promise<{ ok: true; leidos: number; nuevos: number } | { ok: false; error: string }> {
  const marcar = () =>
    supabaseAdmin.from("ht_candidates").update({ contactos_sync_at: new Date().toISOString() }).eq("id", cand.id);

  const email = (cand.email || "").trim().toLowerCase().replace(/["'\s]/g, "");
  if (!email || !email.includes("@")) {
    await marcar();
    return { ok: true, leidos: 0, nuevos: 0 };
  }

  const buzon = await getValidAccessToken();
  if (!buzon) return { ok: false, error: "Gmail no está conectado" };

  const q = `(from:${email} OR to:${email} OR cc:${email}) -in:draft newer_than:${dias}d`;
  const busqueda = await searchGmailMessages(q, 100);
  if (!busqueda.ok) return busqueda;

  const filas: ContactoNuevo[] = [];
  for (const id of busqueda.ids) {
    const meta = await getGmailMessageMetadata(id);
    if (!meta.ok) continue;
    const m = meta.data;
    if (m.label_ids.includes("DRAFT")) continue;

    // Entrante si lo escribió el candidato; saliente si salió del buzón.
    const deCandidato = m.from.toLowerCase().includes(email);
    const direction: Direccion = deCandidato ? "entrante" : "saliente";

    filas.push({
      candidate_id: cand.id,
      vacancy_id: cand.vacancy_id ?? null,
      channel: "email",
      direction,
      kind: clasificarAsunto(m.subject, direction),
      occurred_at: m.internal_date ? new Date(m.internal_date).toISOString() : new Date(m.date || Date.now()).toISOString(),
      summary: m.subject || "(sin asunto)",
      body: m.snippet || null,
      source: "gmail_sync",
      external_id: m.id,
      thread_id: m.thread_id,
      status: "confirmado",
      created_by: buzon.email,
    });
  }

  const r = await guardarContactos(filas);
  if (r.error) return { ok: false, error: r.error };
  await marcar();
  return { ok: true, leidos: filas.length, nuevos: r.nuevos };
}

// ─────────────────────────────────────────────────────────────
// WhatsApp · lectura del chat exportado
// ─────────────────────────────────────────────────────────────

export type MensajeWhatsapp = { at: string; autor: string; texto: string };

/**
 * Lee el .txt que genera «Exportar chat» de WhatsApp.
 *
 * Reconoce los dos formatos que produce la app en español:
 *   iPhone:   [21/9/26, 10:57:03 a. m.] Luis: Hola, buen día
 *   Android:  21/9/26, 10:57 a. m. - Luis: Hola, buen día
 * y sus variantes con año de cuatro dígitos o reloj de 24 horas.
 *
 * Las fechas se leen día/mes/año (así exporta el celular en Colombia) y la
 * hora como hora de Bogotá. Los avisos del sistema («Los mensajes están
 * cifrados…») no tienen autor y se descartan. Un mensaje de varias líneas se
 * junta en uno solo.
 */
export function leerChatWhatsapp(texto: string): MensajeWhatsapp[] {
  const limpio = texto
    .replace(/\r\n?/g, "\n")
    .replace(/[\u00a0\u202f\u2009]/g, " ")
    .replace(/[\u200e\u200f\u202a-\u202e]/g, "");

  const cabecera =
    /^\[?(\d{1,2})\/(\d{1,2})\/(\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap])?\.?\s*m?\.?\]?\s*(?:-\s*)?(.*)$/i;

  const mensajes: MensajeWhatsapp[] = [];
  let actual: MensajeWhatsapp | null = null;

  for (const linea of limpio.split("\n")) {
    const m = linea.match(cabecera);
    if (!m) {
      if (actual && linea.trim()) actual.texto += "\n" + linea;
      continue;
    }
    const [, d, mes, a, h, min, seg, ampm, resto] = m;
    const sep = resto.indexOf(": ");
    if (sep <= 0) {
      // Aviso del sistema: tiene fecha pero no autor.
      actual = null;
      continue;
    }
    let hora = parseInt(h, 10);
    if (ampm) {
      const pm = ampm.toLowerCase() === "p";
      if (pm && hora < 12) hora += 12;
      if (!pm && hora === 12) hora = 0;
    }
    const anio = a.length === 2 ? 2000 + parseInt(a, 10) : parseInt(a, 10);
    const iso =
      `${anio}-${String(parseInt(mes, 10)).padStart(2, "0")}-${String(parseInt(d, 10)).padStart(2, "0")}` +
      `T${String(hora).padStart(2, "0")}:${min}:${seg ?? "00"}-05:00`;
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) {
      actual = null;
      continue;
    }
    actual = { at: fecha.toISOString(), autor: resto.slice(0, sep).trim(), texto: resto.slice(sep + 2) };
    mensajes.push(actual);
  }
  return mensajes;
}

/**
 * De los autores del chat, cuál es el equipo. En el chat exportado cada
 * persona aparece con el nombre que tiene en los contactos del celular, así
 * que no se puede saber por el nombre; se adivina por lo que escribe, y quien
 * importa lo confirma antes de guardar.
 */
export function adivinarNosotros(mensajes: MensajeWhatsapp[]): string | null {
  const puntaje = new Map<string, number>();
  for (const m of mensajes) {
    const t = m.texto.toLowerCase();
    let p = 0;
    if (t.includes("talent team")) p += 3;
    if (t.includes("trading solutions")) p += 2;
    if (t.includes("/prueba/") || t.includes("vercel.app")) p += 2;
    puntaje.set(m.autor, (puntaje.get(m.autor) ?? 0) + p);
  }
  let mejor: string | null = null;
  let max = 0;
  for (const [autor, p] of puntaje) {
    if (p > max) {
      max = p;
      mejor = autor;
    }
  }
  return mejor;
}

/**
 * Pasa por Gmail un lote de candidatos, empezando por los que llevan más
 * tiempo sin revisar. Lo usan el cron y el botón «Auditar Gmail».
 *
 * Por lotes porque cada candidato son varias llamadas a Gmail: todos de una
 * vez no caben en el tiempo de una función.
 */
export async function sincronizarLote(
  lote = 20,
  { soloVencidosHoras = 0 }: { soloVencidosHoras?: number } = {},
): Promise<{ procesados: number; nuevos: number; restantes: number; errores: string[] }> {
  const desde = new Date(Date.now() - 200 * 86_400_000).toISOString();
  const corte = new Date(Date.now() - soloVencidosHoras * 3_600_000).toISOString();

  let q = supabaseAdmin
    .from("ht_candidates")
    .select("id, name, email, vacancy_id")
    .gte("created_at", desde)
    .not("email", "is", null)
    .order("contactos_sync_at", { ascending: true, nullsFirst: true })
    .limit(lote);
  q = soloVencidosHoras > 0 ? q.or(`contactos_sync_at.is.null,contactos_sync_at.lt.${corte}`) : q.is("contactos_sync_at", null);

  const { data, error } = await q;
  if (error) return { procesados: 0, nuevos: 0, restantes: 0, errores: [error.message] };

  let nuevos = 0;
  const errores: string[] = [];
  for (const c of data ?? []) {
    const r = await sincronizarGmailCandidato(c);
    if (r.ok) nuevos += r.nuevos;
    else {
      errores.push(`${c.name}: ${r.error}`);
      if (/no está conectado/.test(r.error)) break;
    }
  }

  let rq = supabaseAdmin
    .from("ht_candidates")
    .select("id", { count: "exact", head: true })
    .gte("created_at", desde)
    .not("email", "is", null);
  rq = soloVencidosHoras > 0 ? rq.or(`contactos_sync_at.is.null,contactos_sync_at.lt.${corte}`) : rq.is("contactos_sync_at", null);
  const { count } = await rq;

  return { procesados: (data ?? []).length, nuevos, restantes: count ?? 0, errores };
}
