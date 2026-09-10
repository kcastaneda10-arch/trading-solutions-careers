import { supabaseAdmin } from '@/lib/supabase';
import { score, applyProctoring } from './scoring';
import { calcularMatch } from './match';
import { perfilPorTitulo } from './perfiles-cargo';

/**
 * Calcula y guarda los puntajes de una sesion a partir de sus respuestas.
 *
 * Vive aparte porque se llama desde tres sitios: cuando el candidato pulsa
 * terminar, automaticamente cuando responde el ultimo item (si cierra el
 * navegador ahi, el informe igual queda calculado), y desde el panel para
 * recalcular una sesion vieja o una que quedo a medias.
 *
 * Cada paso reporta su propio error. Un "no se pudo calcular" a secas obliga a
 * adivinar; con el paso y el mensaje real se arregla de una.
 */
export async function cerrarSesion(sessionId: string) {
  const paso = (etapa: string, detalle: string) =>
    ({ ok: false as const, etapa, error: `[${etapa}] ${detalle}` });

  try {
    const { data: session, error: eSess } = await supabaseAdmin
      .from('ts_bat_sessions')
      .select('id, started_at, finished_at, status, vacancy_title, perfil_cargo')
      .eq('id', sessionId)
      .single();
    if (eSess) return paso('leer_sesion', eSess.message);
    if (!session) return paso('leer_sesion', 'Sesión no encontrada');

    const { data: answers, error: eAns } = await supabaseAdmin
      .from('ts_bat_answers')
      .select('item_code, answer, latency_ms, answered_at')
      .eq('session_id', sessionId)
      .order('answered_at')
      .limit(2000);
    if (eAns) return paso('leer_respuestas', eAns.message);
    if (!answers?.length) return paso('leer_respuestas', 'La sesión no tiene respuestas guardadas');

    const [ev, sn] = await Promise.all([
      supabaseAdmin.from('ts_bat_events').select('id', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .in('kind', ['tab_blur', 'paste', 'copy', 'contextmenu', 'shortcut', 'cam_lost']),
      supabaseAdmin.from('ts_bat_snapshots').select('id', { count: 'exact', head: true }).eq('session_id', sessionId),
    ]);
    const eventos = ev.count ?? 0;
    const capturas = sn.count ?? 0;

    // El fin de la sesion es la ULTIMA RESPUESTA, no el momento del calculo.
    // Si no se toma asi, recalcular una sesion de ayer le mete horas de duracion
    // inventadas y ademas dispara una falsa alerta de proctoring: el indice de
    // cobertura divide las capturas entre los minutos de sesion.
    const ultima = answers[answers.length - 1]?.answered_at;
    const finished = session.finished_at
      ? new Date(session.finished_at)
      : ultima
      ? new Date(ultima)
      : new Date();
    const started = session.started_at ? new Date(session.started_at) : finished;
    const durationSeconds = Math.max(0, Math.round((finished.getTime() - started.getTime()) / 1000));

    let scores, finalValidity;
    try {
      const r = score(answers as any);
      scores = r.scores;
      finalValidity = applyProctoring(r.validity, eventos, capturas, durationSeconds / 60);
    } catch (err: any) {
      return paso('puntuar', err?.message ?? String(err));
    }

    // El match se calcula al cerrar: asi el ranking existe sin pedir nada mas.
    const perfilKey = session.perfil_cargo ?? perfilPorTitulo(session.vacancy_title);
    const match = calcularMatch(scores, perfilKey);

    const { error: eUpd } = await supabaseAdmin
      .from('ts_bat_sessions')
      .update({
        perfil_cargo: perfilKey ?? null,
        match_data: match,
        status: 'completed',
        finished_at: session.finished_at ?? finished.toISOString(),
        duration_seconds: durationSeconds,
        scores,
        validity: finalValidity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);
    if (eUpd) return paso('guardar', eUpd.message);

    return { ok: true as const, respuestas: answers.length, capturas, eventos, duracionSeg: durationSeconds, match: match?.global ?? null };
  } catch (err: any) {
    return paso('inesperado', err?.message ?? String(err));
  }
}
