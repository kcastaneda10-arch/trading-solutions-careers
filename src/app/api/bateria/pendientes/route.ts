/**
 * GET /api/bateria/pendientes?vacante=Operations%20Executive
 *
 * Quiénes recibieron la batería y todavía no la presentaron, con todo lo que
 * hace falta para ir a buscarlos: el celular, el enlace de WhatsApp listo, y su
 * propio enlace de la prueba.
 *
 * POR QUÉ NO ALCANZABA CON MIRAR EL CORREO
 * En la bandeja se ve a quién se le mandó la invitación, pero no quién la
 * presentó: eso vive en `ts_bat_sessions`. Y el celular vive en
 * `ht_candidates`. Perseguir a alguien cruzando dos pantallas y una hoja suelta
 * es el tipo de trabajo que se hace una vez y después se abandona.
 *
 * QUÉ CUENTA COMO PENDIENTE
 * Se le mandó (`invited_at`) y no terminó (`finished_at` vacío). Se distingue
 * entre quien ni la abrió y quien la dejó a medias, porque no son el mismo
 * recordatorio: al primero hay que empujarlo, al segundo puede que algo se le
 * haya roto — y esta semana tres candidatos escribieron diciendo justo eso.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/bateria/auth';
import { aWhatsapp } from '@/lib/whatsapp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BASE = 'https://trading-solutions-careers.vercel.app';

/** Días completos desde una fecha. */
function diasDesde(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'No autorizado · entre primero a /hr-admin' }, { status: 401 });
  }

  const vacante = req.nextUrl.searchParams.get('vacante');

  let q = supabaseAdmin
    .from('ts_bat_sessions')
    .select('id, token, candidate_name, vacancy_title, status, invited_at, started_at, finished_at, ht_candidate_id')
    .not('invited_at', 'is', null)
    .is('finished_at', null)
    .order('invited_at', { ascending: true });

  if (vacante) q = q.ilike('vacancy_title', `%${vacante}%`);

  const { data: sesiones, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // El celular vive en la ficha del candidato, no en la sesión de la prueba.
  const ids = [...new Set((sesiones ?? []).map((s) => s.ht_candidate_id).filter(Boolean))];
  const porId = new Map<string, { phone: string | null; email: string | null; name: string | null }>();
  if (ids.length) {
    const { data: cands } = await supabaseAdmin
      .from('ht_candidates')
      .select('id, name, email, phone, prefilter_data')
      .in('id', ids as string[]);
    for (const c of cands ?? []) {
      // El prefiltro suele traer el celular más fresco que la ficha.
      const delPrefiltro = (c.prefilter_data as any)?.phone ?? null;
      porId.set(String(c.id), { phone: delPrefiltro || c.phone || null, email: c.email, name: c.name });
    }
  }

  const filas = (sesiones ?? []).map((s) => {
    const ficha = s.ht_candidate_id ? porId.get(String(s.ht_candidate_id)) : undefined;
    const nombre = s.candidate_name || ficha?.name || 'Sin nombre';
    const primerNombre = nombre.trim().split(/\s+/)[0];
    const urlPrueba = `${BASE}/assessment/ht/${s.token}`;
    const wa = aWhatsapp(ficha?.phone);

    // El texto va acá y no en la pantalla para que el recordatorio diga lo
    // mismo salga de donde salga.
    const mensaje =
      `Hola ${primerNombre}, te saludamos del Talent Team de Trading Solutions. ` +
      `Nos quedó pendiente tu prueba de selección para ${s.vacancy_title} y nos daría pena ` +
      `que el proceso se quedara ahí. ` +
      `Toma entre 40 y 50 minutos, de una sola sentada y desde un computador. ` +
      `Este es tu enlace personal: ${urlPrueba} ` +
      `Si algo no te carga o se te traba, escríbenos por acá y te generamos uno nuevo el mismo día. ` +
      `Y si ya cambiaste de planes, cuéntanos con confianza y cerramos tu proceso sin problema.`;

    return {
      nombre,
      email: ficha?.email ?? null,
      vacante: s.vacancy_title,
      telefono: ficha?.phone ?? null,

      invitada: s.invited_at,
      diasSinPresentar: diasDesde(s.invited_at),
      // No es lo mismo no haberla abierto que haberla dejado a medias.
      estado: s.started_at ? 'empezada_sin_terminar' : 'sin_abrir',

      urlPrueba,
      whatsapp: wa ? `https://wa.me/${wa}?text=${encodeURIComponent(mensaje)}` : null,
      motivoSinWhatsapp: wa ? null : ficha?.phone ? 'El número no tiene forma de celular colombiano' : 'No hay celular en la ficha',
      mensaje,
    };
  });

  return NextResponse.json(
    {
      vacante: vacante ?? 'todas',
      total: filas.length,
      sinAbrir: filas.filter((f) => f.estado === 'sin_abrir').length,
      empezadasSinTerminar: filas.filter((f) => f.estado === 'empezada_sin_terminar').length,
      sinCelular: filas.filter((f) => !f.whatsapp).length,
      candidatos: filas,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
