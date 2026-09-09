import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/bateria/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('ts_bat_sessions')
    .select('id, token, purpose, candidate_name, vacancy_title, status, battery_version, started_at, finished_at, duration_seconds, scores, validity, created_at, consent_cam_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (data ?? []).map((s: any) => s.id);
  const counts: Record<string, { respuestas: number; capturas: number; alertas: number }> = {};
  if (ids.length) {
    const [{ data: ans }, { data: snap }, { data: ev }] = await Promise.all([
      supabaseAdmin.from('ts_bat_answers').select('session_id').in('session_id', ids),
      supabaseAdmin.from('ts_bat_snapshots').select('session_id').in('session_id', ids),
      supabaseAdmin
        .from('ts_bat_events')
        .select('session_id')
        .in('session_id', ids)
        .in('kind', ['tab_blur', 'paste', 'copy', 'contextmenu', 'shortcut', 'cam_lost']),
    ]);
    for (const id of ids) counts[id] = { respuestas: 0, capturas: 0, alertas: 0 };
    for (const r of ans ?? []) counts[(r as any).session_id].respuestas++;
    for (const r of snap ?? []) counts[(r as any).session_id].capturas++;
    for (const r of ev ?? []) counts[(r as any).session_id].alertas++;
  }

  return NextResponse.json({ sessions: (data ?? []).map((s: any) => ({ ...s, ...counts[s.id] })) });
}
