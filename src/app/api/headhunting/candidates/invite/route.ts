import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { candidate_id } = await req.json();

    if (!candidate_id) {
      return NextResponse.json({ error: 'candidate_id requerido' }, { status: 400 });
    }

    // Get candidate
    const { data: candidate, error } = await supabaseAdmin
      .from('ht_candidates')
      .select('*, ht_vacancies(*), ht_clients(*)')
      .eq('id', candidate_id)
      .single();

    if (error || !candidate) {
      return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 });
    }

    if (candidate.status !== 'pending') {
      return NextResponse.json(
        { error: `Candidato ya tiene estado: ${candidate.status}` },
        { status: 400 }
      );
    }

    // Generate unique token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72); // 72-hour expiry

    // Update candidate with token
    await supabaseAdmin
      .from('ht_candidates')
      .update({
        assessment_token: token,
        token_expires_at: expiresAt.toISOString(),
        status: 'invited',
        invited_at: new Date().toISOString(),
      })
      .eq('id', candidate_id);

    // Build assessment URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.elevarecareer.com';
    const assessmentUrl = `${baseUrl}/assessment/ht/${token}`;

    // Get client info for branding
    const clientName = candidate.ht_clients?.name || 'Trading Solutions';
    const vacancyTitle = candidate.ht_vacancies?.title || 'la vacante';
    const senderEmail = candidate.ht_clients?.sender_email || 'kcastaneda@tradingsolutions.com';

    // Send invitation email via Resend
    const { error: emailError } = await resend.emails.send({
      from: `Kelly Castaneda <${senderEmail}>`,
      to: candidate.email,
      subject: `Invitación a Evaluación — ${clientName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Inter, -apple-system, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: #2C64ED; padding: 32px; text-align: center; }
            .header h1 { color: white; font-size: 24px; margin: 0; font-weight: 600; }
            .body { padding: 32px; }
            .cta { display: inline-block; background: #2C64ED; color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; }
            .footer { padding: 24px 32px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; }
            .info-box { background: #EBF0FF; border-radius: 8px; padding: 16px; margin: 16px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${clientName}</h1>
            </div>
            <div class="body">
              <p>Hola <strong>${candidate.name}</strong>,</p>

              <p>Has sido seleccionado(a) para participar en nuestro proceso de evaluación para la posición de <strong>${vacancyTitle}</strong> en ${clientName}.</p>

              <div class="info-box">
                <p style="margin:0"><strong>Detalles de la evaluación:</strong></p>
                <ul style="margin:8px 0">
                  <li>Duración aproximada: <strong>55 minutos</strong></li>
                  <li>Formato: Escenarios de role play y análisis</li>
                  <li>Necesitas: Computador con internet estable</li>
                  <li>Enlace válido por: <strong>72 horas</strong></li>
                </ul>
              </div>

              <p>Cuando estés listo(a), haz clic en el siguiente enlace para comenzar:</p>

              <p style="text-align:center">
                <a href="${assessmentUrl}" class="cta">Iniciar Evaluación</a>
              </p>

              <p><strong>Recomendaciones:</strong></p>
              <ul>
                <li>Busca un espacio tranquilo sin interrupciones</li>
                <li>No hay respuestas correctas o incorrectas — queremos conocer tu forma de pensar</li>
                <li>Responde con honestidad y en tus propias palabras</li>
                <li>Tus respuestas se guardan automáticamente</li>
              </ul>

              <p>Si tienes alguna pregunta, no dudes en responder a este correo.</p>

              <p>Saludos cordiales,<br>
              <strong>Kelly Castaneda</strong><br>
              ${clientName}</p>
            </div>
            <div class="footer">
              Powered by ELEVARE Career · Evaluación confidencial<br>
              Este enlace es personal e intransferible.
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error('Email send error:', emailError);
      return NextResponse.json(
        { error: 'Candidato actualizado pero hubo error al enviar email', token },
        { status: 207 }
      );
    }

    return NextResponse.json({
      success: true,
      candidate_id,
      assessment_url: assessmentUrl,
      expires_at: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error('Invite error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
