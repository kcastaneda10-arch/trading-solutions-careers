import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/bateria/auth';

export const dynamic = 'force-dynamic';

/** Candidatos del funnel listos para presentar la bateria. */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const etapa = req.nextUrl.searchParams.get('etapa') || 'prefiltro_revision';

  const { data: cands, error } = await supabaseAdmin
    .from('ht_candidates')
    .select('id, name, email, stage, status, vacancy_id')
    .eq('stage', etapa)
    .order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const vacIds = Array.from(new Set((cands ?? []).map((c: any) => c.vacancy_id).filter(Boolean)));
  const vacMap: Record<string, string> = {};
  if (vacIds.length) {
    const { data: vacs } = await supabaseAdmin.from('ht_vacancies').select('id, title').in('id', vacIds);
    for (const v of vacs ?? []) vacMap[(v as any).id] = (v as any).title;
  }

  const { data: sesiones } = await supabaseAdmin
    .from('ts_bat_sessions')
    .select('id, token, ht_candidate_id, status, scores')
    .not('ht_candidate_id', 'is', null);
  const porCand: Record<string, any> = {};
  for (const s of sesiones ?? []) {
    const k = (s as any).ht_candidate_id;
    if (k && !porCand[k]) porCand[k] = s;
  }

  const origin = req.nextUrl.origin;
  return NextResponse.json(
    {
      etapa,
      candidatos: (cands ?? []).map((c: any) => {
        const s = porCand[c.id];
        return {
          id: c.id,
          nombre: c.name,
          email: c.email,
          vacante: vacMap[c.vacancy_id] ?? null,
          sesion: s
            ? { token: s.token, url: `${origin}/prueba/${s.token}`, status: s.status, calculada: !!s.scores }
            : null,
        };
      }),
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}
