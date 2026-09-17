/**
 * GET /api/bateria/proctoring/<token>
 *
 * El desglose de los eventos de proctoring de una sesión, por tipo.
 *
 * POR QUÉ HACE FALTA
 * El informe dice «42 eventos de proctoring» y con eso declara la sesión
 * inválida. Pero ese 42 suma cosas que no significan lo mismo:
 *
 *   paste · copy · shortcut · contextmenu → intentos de copiar. Es la señal
 *      para la que se montó el proctoring: que nadie resuelva la batería con
 *      una IA al lado.
 *   tab_blur · cam_lost → el ambiente. Una notificación, una llamada, la
 *      cámara que se cae, el wifi. No dicen nada sobre la honestidad de nadie.
 *
 * Cuarenta y dos `paste` y cuarenta y dos `cam_lost` son dos conversaciones
 * completamente distintas, y el número solo no las distingue. Antes de cerrarle
 * el proceso a alguien por «42 eventos», hay que poder mirar cuáles fueron.
 * El dato ya está guardado; lo único que faltaba era una forma de verlo.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/bateria/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Los mismos kinds que cuenta `cerrar.ts`, separados por lo que significan. */
const COPIA = ['paste', 'copy', 'shortcut', 'contextmenu'];
const AMBIENTE = ['tab_blur', 'cam_lost'];

const ETIQUETA: Record<string, string> = {
  paste: 'Pegar (Ctrl+V)',
  copy: 'Copiar (Ctrl+C)',
  shortcut: 'Atajo de teclado bloqueado',
  contextmenu: 'Clic derecho',
  tab_blur: 'Salió de la pestaña',
  cam_lost: 'Se perdió la cámara',
};

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'No autorizado · entre primero a /hr-admin' }, { status: 401 });
  }

  const { data: sesion, error: sErr } = await supabaseAdmin
    .from('ts_bat_sessions')
    .select('id, candidate_name, ht_candidate_id, validity, started_at, finished_at')
    .eq('token', params.token)
    .maybeSingle<any>();

  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });
  if (!sesion) return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });

  const { data: eventos, error: eErr } = await supabaseAdmin
    .from('ts_bat_events')
    .select('kind, at')
    .eq('session_id', sesion.id)
    .in('kind', [...COPIA, ...AMBIENTE])
    .order('at');

  if (eErr) return NextResponse.json({ error: eErr.message }, { status: 500 });

  const porTipo: Record<string, number> = {};
  for (const e of eventos ?? []) porTipo[e.kind] = (porTipo[e.kind] ?? 0) + 1;

  const deCopia = COPIA.reduce((a, k) => a + (porTipo[k] ?? 0), 0);
  const deAmbiente = AMBIENTE.reduce((a, k) => a + (porTipo[k] ?? 0), 0);

  return NextResponse.json(
    {
      candidato: sesion.candidate_name,
      validez: sesion.validity?.veredicto ?? null,
      total: (eventos ?? []).length,

      // La separación es el punto de todo esto.
      intentosDeCopia: deCopia,
      eventosDeAmbiente: deAmbiente,

      detalle: Object.entries(porTipo)
        .sort((a, b) => b[1] - a[1])
        .map(([kind, n]) => ({
          tipo: kind,
          etiqueta: ETIQUETA[kind] ?? kind,
          familia: COPIA.includes(kind) ? 'copia' : 'ambiente',
          eventos: n,
        })),

      // Dicho en una línea, para que no haya que interpretarlo.
      lectura:
        deCopia === 0
          ? `Ningún intento de copiar. Los ${deAmbiente} eventos son de ambiente: no dicen nada sobre la honestidad de la persona.`
          : deAmbiente === 0
          ? `Los ${deCopia} eventos son intentos de copiar. Esa es la señal para la que se montó el proctoring.`
          : `${deCopia} intentos de copiar y ${deAmbiente} eventos de ambiente. Solo los primeros hablan de conducta.`,

      primeros: (eventos ?? []).slice(0, 20).map((e) => ({ tipo: e.kind, cuando: e.at })),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
