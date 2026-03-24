import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export { sql };

export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      job_id INTEGER NOT NULL,
      job_title TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      linkedin TEXT,
      cv_filename TEXT,
      cv_data TEXT,
      why_ts TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
  
  await sql`
    CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id)
  `;
  
  await sql`
    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)
  `;
  
  await sql`
    CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC)
  `;
}
