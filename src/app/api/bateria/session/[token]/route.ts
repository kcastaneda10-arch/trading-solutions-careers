import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { BLOCKS, BLOCK_ORDER, ITEMS, sanitizeForCandidate, BATTERY_VERSION } from '@/lib/bateria/items';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const { data: session, error } = await supabaseAdmin
    .from('ts_bat_sessions')
    .select('*')
    .eq('token', params.token)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: 'Enlace no válido' }, { status: 404 });
  }
  if (session.status === 'completed') {
    return NextResponse.json({ error: 'Esta prueba ya fue presentada', status: 'completed' }, { status: 403 });
  }

  const { data: answers } = await supabaseAdmin
    .from('ts_bat_answers')
    .select('item_code, answer')
    .eq('session_id', session.id);

  return NextResponse.json({
    session: {
      id: session.id,
      status: session.status,
      candidate_name: session.candidate_name,
      vacancy_title: session.vacancy_title,
      battery_version: session.battery_version ?? BATTERY_VERSION,
      consent_data_at: session.consent_data_at,
      consent_cam_at: session.consent_cam_at,
      purpose: session.purpose,
    },
    blocks: BLOCK_ORDER.map((b) => ({
      key: b,
      ...BLOCKS[b],
      items: ITEMS.filter((i) => i.block === b).map(sanitizeForCandidate),
    })),
    existing: Object.fromEntries((answers ?? []).map((a: any) => [a.item_code, a.answer])),
  });
}
