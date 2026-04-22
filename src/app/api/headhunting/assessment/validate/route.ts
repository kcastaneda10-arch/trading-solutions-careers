import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { TS_SCENARIOS } from '@/lib/headhunting/scenarios-ts';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
    }

    // Look up candidate by assessment token
    const { data: candidate, error } = await supabaseAdmin
      .from('ht_candidates')
      .select('*')
      .eq('assessment_token', token)
      .single();

    if (error || !candidate) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 404 });
    }

    // Check token expiry
    if (candidate.token_expires_at && new Date(candidate.token_expires_at) < new Date()) {
      await supabaseAdmin
        .from('ht_candidates')
        .update({ status: 'expired' })
        .eq('id', candidate.id);
      return NextResponse.json({ error: 'Token expirado' }, { status: 410 });
    }

    // Check candidate status
    if (!['invited', 'in_progress'].includes(candidate.status)) {
      return NextResponse.json(
        { error: 'Evaluación no disponible', status: candidate.status },
        { status: 403 }
      );
    }

    // Get vacancy info
    const { data: vacancy } = await supabaseAdmin
      .from('ht_vacancies')
      .select('*')
      .eq('id', candidate.vacancy_id)
      .single();

    // Get client branding
    const { data: client } = await supabaseAdmin
      .from('ht_clients')
      .select('name, logo_url, primary_color')
      .eq('id', candidate.client_id)
      .single();

    // Get scenarios for this competency model
    const modelId = vacancy?.model_id;
    const { data: scenarios } = await supabaseAdmin
      .from('ht_scenarios')
      .select('*')
      .eq('model_id', modelId)
      .order('order_index');

    // Get any existing responses (for session resume)
    const { data: existingResponses } = await supabaseAdmin
      .from('ht_responses')
      .select('scenario_id, response_text, response_data, time_spent_seconds, is_final')
      .eq('candidate_id', candidate.id);

    // If status is 'invited', transition to 'in_progress'
    if (candidate.status === 'invited') {
      await supabaseAdmin
        .from('ht_candidates')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', candidate.id);
    }

    // Enrich scenarios with options and correct scenario_type from TS source
    // (Supabase table doesn't have 'options' column yet)
    const enrichedScenarios = (scenarios || []).map((s: any) => {
      const tsMatch = TS_SCENARIOS.find(
        (ts) => ts.competency_key === s.competency_key && ts.order_index === s.order_index
      );
      if (tsMatch && tsMatch.options?.length) {
        return {
          ...s,
          scenario_type: tsMatch.scenario_type, // 'role_play_mc'
          options: tsMatch.options,
          scenario_text: tsMatch.scenario_text, // Use latest text from TS
        };
      }
      return s;
    });

    return NextResponse.json({
      candidate: {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
      },
      vacancy: vacancy
        ? { id: vacancy.id, title: vacancy.title, area: vacancy.area, description: vacancy.description }
        : null,
      client: client || { name: 'Trading Solutions', logo_url: null, primary_color: '#2C64ED' },
      scenarios: enrichedScenarios,
      existing_responses: existingResponses || [],
    });
  } catch (err) {
    console.error('Assessment validate error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
