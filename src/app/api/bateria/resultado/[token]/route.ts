import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/bateria/auth';
import { findItem, ITEMS } from '@/lib/bateria/items';
import { desempeno } from '@/lib/bateria/scoring';

export const dynamic = 'force-dynamic';

/** Informe completo. Solo para el equipo de selección, nunca para el candidato. */
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { data: session } = await supabaseAdmin
    .from('ts_bat_sessions')
    .select('*')
    .eq('token', params.token)
    .single();
  if (!session) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  const [{ data: answers }, { data: events }, { data: snaps }] = await Promise.all([
    supabaseAdmin.from('ts_bat_answers').select('*').eq('session_id', session.id).order('answered_at'),
    supabaseAdmin.from('ts_bat_events').select('*').eq('session_id', session.id).order('at'),
    supabaseAdmin.from('ts_bat_snapshots').select('*').eq('session_id', session.id).order('captured_at'),
  ]);

  // URLs firmadas para las capturas: el bucket es privado.
  let signed: { path: string; url: string | null; captured_at: string; block: string | null }[] = [];
  if (snaps?.length) {
    const paths = snaps.map((s: any) => s.storage_path);
    const { data: urls } = await supabaseAdmin.storage
      .from('proctoring-snapshots')
      .createSignedUrls(paths, 60 * 60);
    signed = snaps.map((s: any, idx: number) => ({
      path: s.storage_path,
      url: urls?.[idx]?.signedUrl ?? null,
      captured_at: s.captured_at,
      block: s.block,
    }));
  }

  // Revisión ítem por ítem: enunciado, lo que respondió, la clave y la fuente.
  const revision = (answers ?? []).map((a: any) => {
    const item = findItem(a.item_code);
    let correcta: string | null = null;
    let acerto: boolean | null = null;
    if (item && (item.type === 'mc' || item.type === 'figure')) {
      correcta = item.answer;
      acerto = a.answer?.choice === item.answer;
    }
    return {
      item_code: a.item_code,
      block: a.block,
      subdomain: a.subdomain,
      etiqueta: item?.hiddenLabel ?? null,
      tipo: a.item_type,
      respuesta: a.answer,
      correcta,
      acerto,
      latency_ms: a.latency_ms,
      fuente: item && 'source' in item ? item.source ?? null : null,
      sustento: item && 'rationale' in item ? item.rationale ?? null : null,
    };
  });

  const D = session.scores ? desempeno(session.scores as any) : { D: null, parcial: true };

  return NextResponse.json({
    session,
    desempeno: D,
    revision,
    eventos: events ?? [],
    capturas: signed,
    total_items: ITEMS.length,
  });
}
