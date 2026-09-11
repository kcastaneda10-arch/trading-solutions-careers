/**
 * POST /api/headhunting/candidates/citar-assessment
 *
 * Citacion masiva al assessment presencial. Deja un borrador por persona en
 * Gmail; no manda nada solo. Igual que la bateria: Kelly revisa y envia.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { createDraftViaGmail, isGmailConnected } from '@/lib/gmail';
import { asuntoCitacion, htmlCitacion, textoCitacion, FIRMA_CITACION, type DatosCitacion } from '@/lib/citacion-assessment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

type Modo = 'previsualizar' | 'borrador';

function faltantes(b: any): string[] {
  const req: [string, string][] = [
    ['fecha', 'la fecha'],
    ['horaLlegada', 'la hora de llegada'],
    ['horaFin', 'la hora de fin'],
    ['direccion', 'la dirección'],
  ];
  return req.filter(([k]) => !String(b?.[k] ?? '').trim()).map(([, l]) => l);
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const modo: Modo = body?.modo ?? 'previsualizar';
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];

    const falta = faltantes(body);
    if (falta.length) {
      return NextResponse.json({ error: `Falta ${falta.join(', ')}. Sin eso la citación no sirve.` }, { status: 400 });
    }

    const base = {
      fecha: String(body.fecha).trim(),
      horaLlegada: String(body.horaLlegada).trim(),
      horaFin: String(body.horaFin).trim(),
      direccion: String(body.direccion).trim(),
      referencia: body.referencia ? String(body.referencia).trim() : null,
    };

    // ── Vista previa: no toca la base ni Gmail ──
    if (modo === 'previsualizar') {
      const datos: DatosCitacion = {
        ...base,
        nombre: body?.nombre ?? 'María Fernanda Gómez',
        vacante: body?.vacante ?? 'Especialista SIG-SST',
      };
      return NextResponse.json(
        { modo, asunto: asuntoCitacion(datos), html: htmlCitacion(datos), texto: textoCitacion(datos), para: body?.email ?? 'candidato@ejemplo.com' },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    if (!ids.length) return NextResponse.json({ error: 'Sin candidatos' }, { status: 400 });

    const gmail = await isGmailConnected();
    if (!gmail.connected) {
      return NextResponse.json(
        { error: 'Gmail no está conectado, así que no puedo dejar los borradores en su bandeja. Conéctelo en Ajustes.' },
        { status: 409 }
      );
    }

    const { data: cands, error } = await supabaseAdmin
      .from('ht_candidates')
      .select('id, name, email, ht_vacancies(title)')
      .in('id', ids.slice(0, 50));

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const resultado: any[] = [];

    for (const c of cands ?? []) {
      if (!c.email) {
        resultado.push({ id: c.id, nombre: c.name, error: 'sin correo en la ficha' });
        continue;
      }
      const datos: DatosCitacion = { ...base, nombre: c.name ?? null, vacante: (c as any).ht_vacancies?.title ?? null };
      const r = await createDraftViaGmail({
        to: c.email,
        subject: asuntoCitacion(datos),
        html: htmlCitacion(datos),
        fromName: `${FIRMA_CITACION} · Trading Solutions`,
      });
      resultado.push({ id: c.id, nombre: c.name, email: c.email, error: r.ok ? null : (r.error ?? 'Gmail rechazó el borrador') });
    }

    const ok = resultado.filter((r) => !r.error).length;
    return NextResponse.json(
      {
        ok,
        fallaron: resultado.filter((r) => r.error).length,
        resultado,
        nota: `Quedaron ${ok} citaciones en la bandeja de borradores de ${gmail.email ?? 'Gmail'}. Revíselas y déles Enviar.`,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    console.error('citar-assessment', err);
    return NextResponse.json({ error: err?.message ?? 'Error interno' }, { status: 500 });
  }
}
