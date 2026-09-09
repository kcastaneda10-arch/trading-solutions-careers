import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/bateria/auth';
import { ITEMS, BATTERY_VERSION } from '@/lib/bateria/items';
import { score, applyProctoring } from '@/lib/bateria/scoring';

export const dynamic = 'force-dynamic';

/**
 * Diagnostico. Abrir en el navegador con la sesion de hr-admin iniciada:
 *   /api/bateria/diag/<token>
 * Dice si el calculo corre, si la escritura persiste y que quedo guardado.
 * No es una ruta permanente: se quita cuando el problema este resuelto.
 */
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'No autorizado · entre primero a /hr-admin' }, { status: 401 });

  const out: Record<string, unknown> = { bateria: BATTERY_VERSION, items: ITEMS.length };

  const { data: sesion, error: eSes } = await supabaseAdmin
    .from('ts_bat_sessions').select('*').eq('token', params.token).single();
  if (eSes || !sesion) return NextResponse.json({ ...out, paso: 'leer_sesion', error: eSes?.message ?? 'no existe' }, { status: 404 });

  out.sesion = {
    id: sesion.id,
    version: sesion.battery_version,
    status: sesion.status,
    started_at: sesion.started_at,
    finished_at: sesion.finished_at,
    duration_seconds: sesion.duration_seconds,
    updated_at: sesion.updated_at,
    scoresEsNull: sesion.scores === null,
    scoresTipo: typeof sesion.scores,
    scoresClaves: sesion.scores && typeof sesion.scores === 'object' ? Object.keys(sesion.scores) : null,
    validityTipo: typeof sesion.validity,
  };

  const { data: respuestas, error: eAns } = await supabaseAdmin
    .from('ts_bat_answers').select('item_code, answer, latency_ms, answered_at')
    .eq('session_id', sesion.id).order('answered_at').limit(2000);
  out.respuestas = { n: respuestas?.length ?? 0, error: eAns?.message ?? null, primera: respuestas?.[0] ?? null };

  if (!respuestas?.length) return NextResponse.json(out);

  // 1) ¿el motor calcula?
  let scores: any = null, validity: any = null;
  try {
    const r = score(respuestas as any);
    scores = r.scores;
    validity = applyProctoring(r.validity, 0, 0, 5);
    out.calculo = {
      ok: true,
      claves: Object.keys(scores),
      factores: scores.personalidad?.factores,
      arquetipo: scores.personalidad?.arquetipo,
      patronDisc: scores.disc?.patron,
      tamanoJson: JSON.stringify(scores).length,
    };
  } catch (err: any) {
    out.calculo = { ok: false, error: err?.message ?? String(err), stack: String(err?.stack ?? '').split('\n').slice(0, 4) };
    return NextResponse.json(out);
  }

  // 2) ¿la escritura persiste? Se escribe y se vuelve a leer en la misma llamada.
  const { data: escrito, error: eUpd } = await supabaseAdmin
    .from('ts_bat_sessions')
    .update({ scores, validity, status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', sesion.id)
    .select('id, status, updated_at, scores');

  out.escritura = {
    error: eUpd?.message ?? null,
    filasDevueltas: escrito?.length ?? 0,
    scoresTrasEscribir: escrito?.[0]?.scores ? Object.keys(escrito[0].scores) : null,
  };

  const { data: relectura } = await supabaseAdmin
    .from('ts_bat_sessions').select('status, updated_at, scores').eq('id', sesion.id).single();
  out.relectura = {
    status: relectura?.status,
    updated_at: relectura?.updated_at,
    scoresEsNull: relectura?.scores === null,
    scoresClaves: relectura?.scores ? Object.keys(relectura.scores) : null,
  };

  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
