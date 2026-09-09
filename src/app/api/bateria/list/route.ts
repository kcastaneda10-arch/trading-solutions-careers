import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/bateria/auth';

export const dynamic = 'force-dynamic';

const ALERTA_KINDS = ['tab_blur', 'paste', 'copy', 'contextmenu', 'shortcut', 'cam_lost'];

/** Conteo exacto por sesion. Antes se traian todas las filas y se tallaban en
 *  memoria; con eso una sesion aparecia en cero mientras el informe si encontraba
 *  sus respuestas. Contar en la base elimina el problema de raiz. */
async function contar(table: string, sessionId: string, kinds?: string[]) {
  let q = supabaseAdmin.from(table).select('id', { count: 'exact', head: true }).eq('session_id', sessionId);
  if (kinds) q = q.in('kind', kinds);
  const { count } = await q;
  return count ?? 0;
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('ts_bat_sessions')
    .select('id, token, purpose, candidate_name, vacancy_title, status, battery_version, started_at, finished_at, duration_seconds, scores, validity, created_at, consent_cam_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sessions = await Promise.all(
    (data ?? []).map(async (s: any) => {
      const [respuestas, capturas, alertas] = await Promise.all([
        contar('ts_bat_answers', s.id),
        contar('ts_bat_snapshots', s.id),
        contar('ts_bat_events', s.id, ALERTA_KINDS),
      ]);
      return { ...s, respuestas, capturas, alertas, calculada: !!s.scores };
    })
  );

  return NextResponse.json({ sessions }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
