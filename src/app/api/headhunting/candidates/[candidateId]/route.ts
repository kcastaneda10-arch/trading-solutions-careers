import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-auth';

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

/**
 * PATCH /api/headhunting/candidates/[candidateId]
 * Updates whitelisted fields on a candidate. Currently supports: vacancy_id, name, email, phone, stage, status.
 * Used for cases like switching a candidate to a different vacancy.
 */
const ALLOWED_PATCH_FIELDS = ["vacancy_id", "name", "email", "phone", "stage", "status"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> },
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { candidateId } = await params;
    if (!candidateId) {
      return NextResponse.json({ error: 'candidateId requerido' }, { status: 400 });
    }
    const body = await req.json();
    const updates: Record<string, unknown> = {};
    for (const k of ALLOWED_PATCH_FIELDS) {
      if (body[k] !== undefined) updates[k] = body[k];
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Sin campos válidos para actualizar' }, { status: 400 });
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('ht_candidates')
      .update(updates)
      .eq('id', candidateId)
      .select('id, name, email, vacancy_id, stage, status')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, candidate: data });
  } catch (err: any) {
    console.error('Candidate PATCH error:', err);
    return NextResponse.json({ error: err?.message || 'Error interno' }, { status: 500 });
  }
}
