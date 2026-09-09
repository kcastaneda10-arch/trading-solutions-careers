import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/bateria/auth';
import { cerrarSesion } from '@/lib/bateria/cerrar';

export const dynamic = 'force-dynamic';

/** Recalcula los puntajes de una sesion desde sus respuestas guardadas. */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 });

    const { data: session } = await supabaseAdmin
      .from('ts_bat_sessions').select('id, battery_version').eq('token', token).single();
    if (!session) return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });

    const res = await cerrarSesion(session.id);
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
    return NextResponse.json(res);
  } catch (err) {
    console.error('bateria/recalcular', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
