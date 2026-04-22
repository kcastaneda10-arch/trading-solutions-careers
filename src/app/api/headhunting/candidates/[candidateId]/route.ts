import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/headhunting/candidates/[candidateId]
 * Returns basic info for a single candidate.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> },
) {
  try {
    const { candidateId } = await params;
    if (!candidateId) {
      return NextResponse.json({ error: 'candidateId requerido' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('ht_candidates')
      .select('id, name, email, phone, status, vacancy_id, started_at, completed_at, created_at')
      .eq('id', candidateId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ candidate: data });
  } catch (err) {
    console.error('Candidate GET error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
