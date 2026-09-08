import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { findItem } from '@/lib/bateria/items';

export const dynamic = 'force-dynamic';

/** Guardado incremental: cada respuesta se persiste al momento. */
export async function POST(req: NextRequest) {
  try {
    const { token, item_code, answer, latency_ms } = await req.json();
    if (!token || !item_code) return NextResponse.json({ error: 'Parámetros faltantes' }, { status: 400 });

    const item = findItem(item_code);
    if (!item) return NextResponse.json({ error: 'Ítem desconocido' }, { status: 400 });

    const { data: session } = await supabaseAdmin
      .from('ts_bat_sessions')
      .select('id, status, started_at')
      .eq('token', token)
      .single();
    if (!session) return NextResponse.json({ error: 'Enlace no válido' }, { status: 404 });
    if (session.status === 'completed') return NextResponse.json({ error: 'Prueba cerrada' }, { status: 403 });

    if (!session.started_at) {
      await supabaseAdmin
        .from('ts_bat_sessions')
        .update({ started_at: new Date().toISOString(), status: 'in_progress' })
        .eq('id', session.id);
    } else if (session.status !== 'in_progress') {
      await supabaseAdmin.from('ts_bat_sessions').update({ status: 'in_progress' }).eq('id', session.id);
    }

    const { error } = await supabaseAdmin.from('ts_bat_answers').upsert(
      {
        session_id: session.id,
        item_code,
        block: item.block,
        subdomain: item.subdomain,
        item_type: item.type,
        answer,
        latency_ms: latency_ms ?? null,
        answered_at: new Date().toISOString(),
      },
      { onConflict: 'session_id,item_code' }
    );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
