import { NextRequest, NextResponse } from "next/server";
import { sql, initDB } from "@/lib/db";

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
    const { job_id, job_title, full_name, email, phone, linkedin, cv_filename, cv_data, why_ts } = body;

    if (!job_id || !full_name || !email) {
      return NextResponse.json(
        { error: "Missing required fields: job_id, full_name, email" },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO applications (job_id, job_title, full_name, email, phone, linkedin, cv_filename, cv_data, why_ts)
      VALUES (${job_id}, ${job_title || ''}, ${full_name}, ${email}, ${phone || null}, ${linkedin || null}, ${cv_filename || null}, ${cv_data || null}, ${why_ts || null})
      RETURNING id, created_at
    `;

    return NextResponse.json(
      { success: true, id: result[0].id, created_at: result[0].created_at },
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
        SELECT id, job_id, job_title, full_name, email, phone, linkedin, cv_filename, why_ts, status, created_at
        FROM applications WHERE status = ${status} AND job_id = ${parseInt(job_id)}
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`SELECT COUNT(*) as total FROM applications WHERE status = ${status} AND job_id = ${parseInt(job_id)}`;
    } else if (status) {
      applications = await sql`
        SELECT id, job_id, job_title, full_name, email, phone, linkedin, cv_filename, why_ts, status, created_at
        FROM applications WHERE status = ${status}
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`SELECT COUNT(*) as total FROM applications WHERE status = ${status}`;
    } else if (job_id) {
      applications = await sql`
        SELECT id, job_id, job_title, full_name, email, phone, linkedin, cv_filename, why_ts, status, created_at
        FROM applications WHERE job_id = ${parseInt(job_id)}
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`SELECT COUNT(*) as total FROM applications WHERE job_id = ${parseInt(job_id)}`;
    } else {
      applications = await sql`
        SELECT id, job_id, job_title, full_name, email, phone, linkedin, cv_filename, why_ts, status, created_at
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
