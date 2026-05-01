import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { candidateId } = await params;

    // Get candidate with all related data
    const { data: candidate, error: candError } = await supabaseAdmin
      .from('ht_candidates')
      .select('*')
      .eq('id', candidateId)
      .single();

    if (candError || !candidate) {
      return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 });
    }

    // Get result
    const { data: result } = await supabaseAdmin
      .from('ht_results')
      .select('*')
      .eq('candidate_id', candidateId)
      .single();

    // Get all responses with scenario info
    const { data: responses } = await supabaseAdmin
      .from('ht_responses')
      .select('*, ht_scenarios(block, competency_label, scenario_type, target_columns, order_index)')
      .eq('candidate_id', candidateId)
      .order('created_at');

    // Get vacancy
    const { data: vacancy } = await supabaseAdmin
      .from('ht_vacancies')
      .select('*')
      .eq('id', candidate.vacancy_id)
      .single();

    // Get client
    const { data: client } = await supabaseAdmin
      .from('ht_clients')
      .select('*')
      .eq('id', candidate.client_id)
      .single();

    // Get all scenarios for this model (para el informe completo)
    let scenarios: any[] = [];
    if (vacancy?.model_id) {
      const { data: sc } = await supabaseAdmin
        .from('ht_scenarios')
        .select('id, block, competency_key, competency_label, target_columns, order_index')
        .eq('model_id', vacancy.model_id)
        .order('order_index');
      scenarios = sc || [];
    }

    return NextResponse.json({
      candidate,
      result: result || null,
      responses: responses || [],
      vacancy: vacancy || null,
      client: client || null,
      scenarios,
    });
  } catch (err) {
    console.error('Get result error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
