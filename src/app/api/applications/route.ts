import { NextRequest, NextResponse } from "next/server";
import { sql, initDB } from "@/lib/db";
import { prefilter, toPrefilterData } from "@/lib/agent/prefilter";
import { generatePortalToken } from "@/lib/portal-token";
import { getResend, EMAIL_FROM } from "@/lib/resend";
import { sendViaGmail, isGmailConnected } from "@/lib/gmail";

let dbInitialized = false;

async function ensureDB() {
  if (!dbInitialized) {
    await initDB();
    dbInitialized = true;
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDB();

    const body = await request.json();
    const { job_id, job_title, full_name, email, phone, linkedin, cv_filename, cv_data, why_ts, ref } = body;

    if (!job_id || !full_name || !email) {
      return NextResponse.json(
        { error: "Missing required fields: job_id, full_name, email" },
        { status: 400 }
      );
    }

    // ─── Detectar candidato INTERNO ────────────────────────────────────
    // Criterios (cualquiera dispara internal):
    //   1. Email termina en @tradingsolutions.com (más robusto · no se puede falsear)
    //   2. URL param ?ref=interno (vino del newsletter interno)
    // El flag se guarda en prefilter_data.is_internal para que el ATS
    // muestre un badge "INTERNO" y priorice estos candidatos.
    const emailLower = (email || "").toLowerCase().trim();
    const isInternal =
      emailLower.endsWith("@tradingsolutions.com") ||
      String(ref || "").toLowerCase() === "interno";

    // ─── PREFILTER 16 Mandamientos (aplica a TODA aplicación) ────────────
    const pf = prefilter({
      full_name,
      email,
      phone,
      linkedin,
      why_ts,
      cv_data,
      job_id,
    });
    const initialStatus = pf.decision; // 'reviewing' | 'new' | 'rejected'
    const prefilterPayload = toPrefilterData(pf) as Record<string, unknown>;
    if (isInternal) {
      prefilterPayload.is_internal = true;
      prefilterPayload.internal_source = ref || "email_domain";
    }

    const result = await sql`
      INSERT INTO applications (
        job_id, job_title, full_name, email, phone, linkedin,
        cv_filename, cv_data, why_ts, status, score, prefilter_data
      )
      VALUES (
        ${job_id}, ${job_title || ''}, ${full_name}, ${email}, ${phone || null}, ${linkedin || null},
        ${cv_filename || null}, ${cv_data || null}, ${why_ts || null},
        ${initialStatus}, ${pf.score}, ${JSON.stringify(prefilterPayload)}::jsonb
      )
      RETURNING id, created_at, status, score
    `;

    const newId = result[0].id as number;

    // ─── Email automático: confirmación de aplicación recibida con link al portal ──
    // Solo cuando la aplicación viene de la web pública (no de import bulk)
    const isWebApply = !request.headers.get('x-skip-email');
    if (isWebApply && email) {
      try {
        const portalToken = generatePortalToken(newId, email);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trading-solutions-careers.vercel.app';
        const portalLink = `${baseUrl}/portal/${portalToken}`;

        // Pull config de bcc/reply_to dinámicos
        let bcc: string | null = process.env.EMAIL_BCC ?? null;
        let replyTo: string | null = null;
        try {
          const cfgRows = await sql`SELECT email_bcc, email_reply_to FROM recruiter_config WHERE id = 1`;
          if (cfgRows.length > 0) {
            bcc = (cfgRows[0].email_bcc as string) || bcc;
            replyTo = (cfgRows[0].email_reply_to as string) || null;
          }
        } catch { /* config no existe aún — usa defaults */ }

        const firstName = full_name.split(' ')[0];
        const subject = `Trading Solutions · Recibimos tu aplicación a ${job_title}`;
        const html = `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#1a1a1a;background:#f5f5f5;margin:0;padding:0">
<div style="max-width:600px;margin:0 auto;background:#ffffff">
  <div style="background:#0F172A;padding:28px;text-align:center"><h1 style="color:#fff;font-size:22px;margin:0;font-weight:600">Trading Solutions</h1></div>
  <div style="padding:32px">
    <p>Hola ${firstName},</p>
    <p>Gracias por aplicar a <strong>${job_title}</strong> en Trading Solutions. Recibimos tu aplicación y ya está en revisión por nuestro equipo.</p>
    <div style="background:#EBF0FF;border-radius:8px;padding:16px;margin:16px 0">
      <p style="margin:0 0 8px"><strong>Nuestros compromisos contigo:</strong></p>
      <ul style="margin:0;padding-left:20px">
        <li>Te respondemos en <strong>máximo 7 días hábiles</strong>, avances o no</li>
        <li>Si no avanzas, te decimos por qué con respeto y honestidad</li>
        <li>Tu información se mantiene confidencial</li>
      </ul>
    </div>
    <p>Puedes ver el estado de tu aplicación en cualquier momento:</p>
    <p style="text-align:center"><a href="${portalLink}" style="display:inline-block;background:#2C64ED;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600">Ver mi proceso</a></p>
    <p style="font-size:12px;color:#666">Si tienes preguntas, simplemente responde este correo.</p>
    <p style="margin-top:24px">Un abrazo,<br><strong>Equipo Trading Solutions</strong></p>
  </div>
  <div style="padding:18px 32px;text-align:center;color:#999;font-size:12px;border-top:1px solid #eee">Boutique Freight Forwarder · Operación en +10 países</div>
</div></body></html>`;

        // Preferir Gmail si está conectado
        const gmail = await isGmailConnected();
        if (gmail.connected) {
          await sendViaGmail({ to: email, subject, html, replyTo: replyTo ?? undefined, bcc: bcc ?? undefined });
        } else {
          const resend = getResend();
          await resend.emails.send({
            from: EMAIL_FROM,
            to: email,
            ...(bcc ? { bcc } : {}),
            ...(replyTo ? { replyTo } : {}),
            subject,
            html,
          });
        }
      } catch (e) {
        // Email es best-effort — no bloquea la aplicación
        console.warn('Email confirmación falló:', e);
      }
    }

    return NextResponse.json(
      {
        success: true,
        id: newId,
        created_at: result[0].created_at,
        status: result[0].status,
        score: result[0].score,
        prefilter: prefilterPayload,
        portal_token: generatePortalToken(newId, email),
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating application:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const job_id = searchParams.get("job_id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    let applications;
    let countResult;

    if (status && job_id) {
      applications = await sql`
        SELECT id, job_id, job_title, full_name, email, phone, linkedin, cv_filename, why_ts, status, score, prefilter_data, created_at, updated_at,
        EXTRACT(DAY FROM NOW() - updated_at)::int AS days_in_stage,
        CASE
          WHEN status IN ('new','reviewing') AND EXTRACT(DAY FROM NOW() - updated_at) > 10 THEN 'overdue'
          WHEN status IN ('new','reviewing') AND EXTRACT(DAY FROM NOW() - updated_at) > 5 THEN 'warning'
          WHEN status = 'interview' AND EXTRACT(DAY FROM NOW() - updated_at) > 7 THEN 'overdue'
          WHEN status = 'interview' AND EXTRACT(DAY FROM NOW() - updated_at) > 3 THEN 'warning'
          WHEN status = 'offer' AND EXTRACT(DAY FROM NOW() - updated_at) > 5 THEN 'overdue'
          ELSE 'ok'
        END AS sla_status
        FROM applications WHERE status = ${status} AND job_id = ${parseInt(job_id)}
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`SELECT COUNT(*) as total FROM applications WHERE status = ${status} AND job_id = ${parseInt(job_id)}`;
    } else if (status) {
      applications = await sql`
        SELECT id, job_id, job_title, full_name, email, phone, linkedin, cv_filename, why_ts, status, score, prefilter_data, created_at, updated_at,
        EXTRACT(DAY FROM NOW() - updated_at)::int AS days_in_stage,
        CASE
          WHEN status IN ('new','reviewing') AND EXTRACT(DAY FROM NOW() - updated_at) > 10 THEN 'overdue'
          WHEN status IN ('new','reviewing') AND EXTRACT(DAY FROM NOW() - updated_at) > 5 THEN 'warning'
          WHEN status = 'interview' AND EXTRACT(DAY FROM NOW() - updated_at) > 7 THEN 'overdue'
          WHEN status = 'interview' AND EXTRACT(DAY FROM NOW() - updated_at) > 3 THEN 'warning'
          WHEN status = 'offer' AND EXTRACT(DAY FROM NOW() - updated_at) > 5 THEN 'overdue'
          ELSE 'ok'
        END AS sla_status
        FROM applications WHERE status = ${status}
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`SELECT COUNT(*) as total FROM applications WHERE status = ${status}`;
    } else if (job_id) {
      applications = await sql`
        SELECT id, job_id, job_title, full_name, email, phone, linkedin, cv_filename, why_ts, status, score, prefilter_data, created_at, updated_at,
        EXTRACT(DAY FROM NOW() - updated_at)::int AS days_in_stage,
        CASE
          WHEN status IN ('new','reviewing') AND EXTRACT(DAY FROM NOW() - updated_at) > 10 THEN 'overdue'
          WHEN status IN ('new','reviewing') AND EXTRACT(DAY FROM NOW() - updated_at) > 5 THEN 'warning'
          WHEN status = 'interview' AND EXTRACT(DAY FROM NOW() - updated_at) > 7 THEN 'overdue'
          WHEN status = 'interview' AND EXTRACT(DAY FROM NOW() - updated_at) > 3 THEN 'warning'
          WHEN status = 'offer' AND EXTRACT(DAY FROM NOW() - updated_at) > 5 THEN 'overdue'
          ELSE 'ok'
        END AS sla_status
        FROM applications WHERE job_id = ${parseInt(job_id)}
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`SELECT COUNT(*) as total FROM applications WHERE job_id = ${parseInt(job_id)}`;
    } else {
      applications = await sql`
        SELECT id, job_id, job_title, full_name, email, phone, linkedin, cv_filename, why_ts, status, score, prefilter_data, created_at, updated_at,
        EXTRACT(DAY FROM NOW() - updated_at)::int AS days_in_stage,
        CASE
          WHEN status IN ('new','reviewing') AND EXTRACT(DAY FROM NOW() - updated_at) > 10 THEN 'overdue'
          WHEN status IN ('new','reviewing') AND EXTRACT(DAY FROM NOW() - updated_at) > 5 THEN 'warning'
          WHEN status = 'interview' AND EXTRACT(DAY FROM NOW() - updated_at) > 7 THEN 'overdue'
          WHEN status = 'interview' AND EXTRACT(DAY FROM NOW() - updated_at) > 3 THEN 'warning'
          WHEN status = 'offer' AND EXTRACT(DAY FROM NOW() - updated_at) > 5 THEN 'overdue'
          ELSE 'ok'
        END AS sla_status
        FROM applications ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`SELECT COUNT(*) as total FROM applications`;
    }

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        total: parseInt(countResult[0].total),
        totalPages: Math.ceil(parseInt(countResult[0].total) / limit)
      }
    });
  } catch (error: unknown) {
    console.error("Error fetching applications:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
