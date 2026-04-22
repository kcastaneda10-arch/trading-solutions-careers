import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/headhunting/clients
export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { data, error } = await supabaseAdmin
      .from('ht_clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ clients: data || [] });
  } catch (err) {
    console.error('List clients error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
