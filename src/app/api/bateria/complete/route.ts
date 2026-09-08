import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { score, applyProctoring } from '@/lib/bateria/scoring';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 });

    const { data: session } = await supabaseAdmin
      .from('ts_bat_sessions')
      .select('id, started_at, status')
      .eq('token', token)
      .single();
    if (!session) return NextResponse.json({ error: 'Enlace no válido' }, { status: 404 });

    const { data: answers } = await supabaseAdmin
      .from('ts_bat_answers')
      .select('item_code, answer, latency_ms')
      .eq('session_id', session.id);

    const { count: eventos } = await supabaseAdmin
      .from('ts_bat_events')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', session.id)
      .in('kind', ['tab_blur', 'paste', 'copy', 'contextmenu', 'shortcut', 'cam_lost']);

    const { count: capturas } = await supabaseAdmin
      .from('ts_bat_snapshots')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', session.id);

    const finished = new Date();
    const started = session.started_at ? new Date(session.started_at) : finished;
    const durationSeconds = Math.max(0, Math.round((finished.getTime() - started.getTime()) / 1000));

    const { scores, validity } = score((answers ?? []) as any);
    const finalValidity = applyProctoring(validity, eventos ?? 0, capturas ?? 0, durationSeconds / 60);

    await supabaseAdmin
      .from('ts_bat_sessions')
      .update({
        status: 'completed',
        finished_at: finished.toISOString(),
        duration_seconds: durationSeconds,
        scores,
        validity: finalValidity,
        updated_at: finished.toISOString(),
      })
      .eq('id', session.id);

    // El candidato NO recibe resultados. Solo la confirmación de envío.
    return NextResponse.json({ completed: true });
  } catch (err) {
    console.error('bateria/complete', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
