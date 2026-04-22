/**
 * /api/assessments
 *   GET  → lista todas las pruebas enviadas (con filtros opcionales)
 *   POST → crea un token de prueba para un candidato y devuelve el link
 *
 * Esto NO envía el email — eso lo hace el cliente (mailto:) o el HR Admin
 * (botón "Enviar prueba" que abre Gmail con el correo prellenado).
 *
 * Cuando se conecte Resend/SendGrid, se añade el envío server-side aquí.
 */
import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

function generateToken(prefix = "ats"): string {
  // Token URL-safe: ats-<16 hex chars>-<timestamp_base36>
  const id = randomBytes(8).toString("hex");
  const ts = Date.now().toString(36);
  return `${prefix}-${id}-${ts}`;
}

/* ========== GET /api/assessments ========== */
export async function GET(req: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const vacancyId = searchParams.get("vacancy_id");
    const email = searchParams.get("email");
    const limit = parseInt(searchParams.get("limit") ?? "100", 10);

    let rows;
    if (status && vacancyId) {
      rows = await sql`
        SELECT * FROM assessment_tokens
         WHERE status = ${status} AND vacancy_id = ${parseInt(vacancyId, 10)}
         ORDER BY sent_at DESC LIMIT ${limit}`;
    } else if (status) {
      rows = await sql`
        SELECT * FROM assessment_tokens
         WHERE status = ${status}
         ORDER BY sent_at DESC LIMIT ${limit}`;
    } else if (vacancyId) {
      rows = await sql`
        SELECT * FROM assessment_tokens
         WHERE vacancy_id = ${parseInt(vacancyId, 10)}
         ORDER BY sent_at DESC LIMIT ${limit}`;
    } else if (email) {
      rows = await sql`
        SELECT * FROM assessment_tokens
         WHERE candidate_email = ${email.toLowerCase()}
         ORDER BY sent_at DESC LIMIT ${limit}`;
    } else {
      rows = await sql`
        SELECT * FROM assessment_tokens
         ORDER BY sent_at DESC LIMIT ${limit}`;
    }

    return NextResponse.json(
      { data: rows, count: rows.length },
      { headers: corsHeaders }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json(
      { error: "fetch_failed", detail: msg },
      { status: 500, headers: corsHeaders }
    );
  }
}

/* ========== POST /api/assessments ========== */
type CreateBody = {
  candidate_name: string;
  candidate_email: string;
  vacancy_id?: number | null;
  vacancy_slug?: string | null;
  assessment_ids?: string[];
  language?: "es" | "en";
  source?: string;
  candidate_id?: number | null;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateBody;
    if (!body.candidate_name || !body.candidate_email) {
      return NextResponse.json(
        { error: "missing_fields", required: ["candidate_name", "candidate_email"] },
        { status: 400, headers: corsHeaders }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);
    const token = generateToken();
    const language = body.language ?? "es";
    // Default: la prueba única Factor X · Trading Solutions (migrada de Elevare)
    const assessmentIds =
      body.assessment_ids && body.assessment_ids.length > 0
        ? body.assessment_ids.join(",")
        : "factor_x_ts";
    const source = body.source ?? "manual";

    const inserted = await sql`
      INSERT INTO assessment_tokens (
        token, candidate_id, candidate_name, candidate_email,
        vacancy_id, vacancy_slug, assessment_ids, language, status, source
      ) VALUES (
        ${token},
        ${body.candidate_id ?? null},
        ${body.candidate_name},
        ${body.candidate_email.toLowerCase()},
        ${body.vacancy_id ?? null},
        ${body.vacancy_slug ?? null},
        ${assessmentIds},
        ${language},
        'sent',
        ${source}
      )
      RETURNING *`;

    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;
    const link = `${origin}/assessment/${token}`;

    // Mailto helper para el HR Admin
    const subject = encodeURIComponent(
      language === "en"
        ? `Trading Solutions · Assessment for ${body.candidate_name}`
        : `Trading Solutions · Evaluación para ${body.candidate_name}`
    );
    const message = encodeURIComponent(
      language === "en"
        ? `Hi ${body.candidate_name.split(" ")[0]},\n\nThanks for applying to Trading Solutions. The next step is a short assessment (about 90 minutes total, you can pause anytime).\n\nStart here: ${link}\n\nThe link is valid for 30 days. Any questions, just reply to this email.\n\nBest,\nTrading Solutions Recruiting`
        : `Hola ${body.candidate_name.split(" ")[0]},\n\nGracias por aplicar a Trading Solutions. El siguiente paso es completar una evaluación corta (en total ~90 minutos, puedes pausar cuando quieras).\n\nEmpieza aquí: ${link}\n\nEl enlace es válido por 30 días. Cualquier duda, respóndenos directamente.\n\nUn abrazo,\nEquipo Trading Solutions`
    );
    const mailto = `mailto:${body.candidate_email}?subject=${subject}&body=${message}`;

    return NextResponse.json(
      {
        data: inserted[0],
        link,
        mailto,
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json(
      { error: "create_failed", detail: msg },
      { status: 500, headers: corsHeaders }
    );
  }
}
