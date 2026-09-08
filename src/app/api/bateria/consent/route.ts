import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export const CONSENT_TEXT_VERSION = 'hd-2026-09-08';

export async function POST(req: NextRequest) {
  try {
    const { token, camera, name, email } = await req.json();
    if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 });

    const { data: session } = await supabaseAdmin
      .from('ts_bat_sessions')
      .select('id, status')
      .eq('token', token)
      .single();
    if (!session) return NextResponse.json({ error: 'Enlace no válido' }, { status: 404 });

    const now = new Date().toISOString();
    // Evidencia de auditoría: quién, cuándo, desde dónde y qué versión del texto.
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      null;

    const { error } = await supabaseAdmin
      .from('ts_bat_sessions')
      .update({
        consent_data_at: now,
        consent_cam_at: camera ? now : null,
        consent_text_ver: CONSENT_TEXT_VERSION,
        consent_ip: ip,
        consent_ua: req.headers.get('user-agent'),
        modality: camera ? 'remoto' : 'presencial_pendiente',
        candidate_name: name || undefined,
        candidate_email: email || undefined,
        status: session.status === 'created' ? 'consented' : session.status,
        updated_at: now,
      })
      .eq('id', session.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, version: CONSENT_TEXT_VERSION });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
