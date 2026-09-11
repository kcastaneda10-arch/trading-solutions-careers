import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/bateria/auth';
import { cerrarPendientes } from '@/lib/bateria/cerrar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * Estado de la bateria por candidato, para pintarlo en el funnel.
 *
 * Devuelve un mapa ht_candidate_id -> estado. El funnel ya tiene los
 * candidatos cargados; lo unico que le falta es saber en que va la prueba de
 * cada uno, sin tener que abrir otra pantalla.
 */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  // Antes de responder, cerrar lo que quedo a medio camino: si alguien
  // respondio los 172 items y la fila se quedo sin puntuar, el funnel lo
  // mostraria como 'sin abrir' aunque ya termino.
  const reparadas = await cerrarPendientes();

  const { data, error } = await supabaseAdmin
    .from('ts_bat_sessions')
    .select('ht_candidate_id, token, status, invited_at, match_data, informe_ia, finished_at')
    .not('ht_candidate_id', 'is', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const estados: Record<string, any> = {};
  for (const s of data ?? []) {
    const id = String(s.ht_candidate_id);
    // Si por lo que sea hay dos, gana la que tenga resultado.
    if (estados[id] && !s.finished_at) continue;
    estados[id] = {
      token: s.token,
      status: s.status,
      invitada: !!s.invited_at,
      match: (s.match_data as any)?.global ?? null,
      conInforme: !!s.informe_ia,
    };
  }

  return NextResponse.json({ estados, reparadas }, { headers: { 'Cache-Control': 'no-store' } });
}
