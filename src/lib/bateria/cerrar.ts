import { supabaseAdmin } from '@/lib/supabase';
import { score, applyProctoring } from './scoring';

/**
 * Calcula y guarda los puntajes de una sesion a partir de sus respuestas.
 *
 * Vive aparte porque se llama desde tres sitios: cuando el candidato pulsa
 * terminar, automaticamente cuando responde el ultimo item (si cierra el
 * navegador ahi, el informe igual queda calculado), y desde el panel para
 * recalcular una sesion vieja o una que quedo a medias.
 */
export async function cerrarSesion(sessionId: string, opts?: { forzarEstado?: boolean }) {
  const { data: session } = await supabaseAdmin
    .from('ts_bat_sessions')
    .select('id, started_at, finished_at, status')
    .eq('id', sessionId)
    .single();
  if (!session) return { ok: false as const, error: 'Sesión no encontrada' };

  const { data: answers } = await supabaseAdmin
    .from('ts_bat_answers')
    .select('item_code, answer, latency_ms')
    .eq('session_id', sessionId);

  if (!answers?.length) return { ok: false as const, error: 'La sesión no tiene respuestas' };

  const [{ count: eventos }, { count: capturas }] = await Promise.all([
    supabaseAdmin.from('ts_bat_events').select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .in('kind', ['tab_blur', 'paste', 'copy', 'contextmenu', 'shortcut', 'cam_lost']),
    supabaseAdmin.from('ts_bat_snapshots').select('id', { count: 'exact', head: true }).eq('session_id', sessionId),
  ]);

  const finished = session.finished_at ? new Date(session.finished_at) : new Date();
  const started = session.started_at ? new Date(session.started_at) : finished;
  const durationSeconds = Math.max(0, Math.round((finished.getTime() - started.getTime()) / 1000));

  const { scores, validity } = score(answers as any);
  const finalValidity = applyProctoring(validity, eventos ?? 0, capturas ?? 0, durationSeconds / 60);

  const { error } = await supabaseAdmin
    .from('ts_bat_sessions')
    .update({
      status: opts?.forzarEstado === false ? session.status : 'completed',
      finished_at: session.finished_at ?? finished.toISOString(),
      duration_seconds: durationSeconds,
      scores,
      validity: finalValidity,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, respuestas: answers.length, capturas: capturas ?? 0, eventos: eventos ?? 0 };
}
