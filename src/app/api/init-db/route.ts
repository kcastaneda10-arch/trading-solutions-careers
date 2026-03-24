import { neon } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Create vacancies table
    await sql(`
      CREATE TABLE IF NOT EXISTS vacancies (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        department VARCHAR(100),
        location VARCHAR(255),
        work_mode VARCHAR(50),
        employment_type VARCHAR(50),
        description TEXT,
        responsibilities TEXT,
        requirements TEXT,
        preferred_qualifications TEXT,
        salary_range VARCHAR(100),
        status VARCHAR(50) DEFAULT 'open',
        linkedin_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create talent_pool table
    await sql(`
      CREATE TABLE IF NOT EXISTS talent_pool (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        "current_role" VARCHAR(255),
        years_experience INTEGER,
        skills TEXT,
        education VARCHAR(500),
        languages TEXT,
        location VARCHAR(255),
        linkedin_url VARCHAR(500),
        cv_data TEXT,
        cv_filename VARCHAR(255),
        summary TEXT,
        tags TEXT,
        source VARCHAR(100) DEFAULT 'manual',
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create matching_results table
    await sql(`
      CREATE TABLE IF NOT EXISTS matching_results (
        id SERIAL PRIMARY KEY,
        vacancy_id INTEGER REFERENCES vacancies(id),
        candidate_id INTEGER REFERENCES talent_pool(id),
        match_score DECIMAL(5,2),
        match_details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes
    await sql(`CREATE INDEX IF NOT EXISTS idx_vacancies_status ON vacancies(status)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_vacancies_department ON vacancies(department)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_talent_pool_status ON talent_pool(status)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_talent_pool_email ON talent_pool(email)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_matching_vacancy ON matching_results(vacancy_id)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_matching_candidate ON matching_results(candidate_id)`);

    // Insert vacancies
    await sql(`
      INSERT INTO vacancies (title, department, location, work_mode, employment_type, description, responsibilities, requirements, preferred_qualifications, status, linkedin_url)
      VALUES
      (
        'Customer Service Specialist',
        'Operations',
        'Shenzhen, CantÃ³n, China',
        'remote',
        'full-time',
        'Global company specializing in international logistics. Comprehensive solutions for sea, air, and land transport, customs brokerage, and digital tools for foreign trade.',
        'Support cargo release and coordination with shipping companies; Track shipments and update internal systems; Send sailing/arrival notifications; Support air and land exports; Track & Trace management; Document organization; Issue/review HBL/BL; AMS and ISF transmissions; Booking management; Administrative support',
        'Student in final semesters or technician; Complementary training/certifications; Computer programs; Basic Foreign Trade or International Logistics course; Customer Service training; Basic Microsoft Office; Basic logistics platforms knowledge; Advanced English (C1-C2)',
        'Additional logistics training; Advanced Microsoft Office skills; ERP platform experience',
        'open',
        'https://www.linkedin.com/jobs/view/4361977888'
      ),
      (
        'Lead Accounting & Finance Officer',
        'Finance',
        'Barranquilla, AtlÃ¡ntico, Colombia',
        'on-site',
        'full-time',
        'Drive financial integrity and multi-country compliance as company scales global operations.',
        'Lead accounting function; Own monthly/annual closing cycles; Drive international tax compliance; Coordinate multi-entity cross-border accounting; Prepare financial reports; Establish internal financial controls; Partner cross-functionally; Optimize accounting workflows',
        'Bachelor''s in Accounting; 3-5 years experience in corporate accounting; Track record managing tax filings and closings; Strong analytical mindset; English B1+ level',
        'Experience in international companies/freight forwarding; IFRS/NIIF knowledge; Financial audits background; ERP experience (SAP, Oracle); Financial consolidation; Leadership experience',
        'open',
        'https://www.linkedin.com/jobs/view/4376444434'
      ),
      (
        'Overseas Procurement Manager',
        'Commercial',
        'Shanghai, China',
        'remote',
        'full-time',
        'Strategic pricing role connecting China with global markets.',
        'Rate management and updating; Review/negotiate FCL, LCL, air freight rates; Maintain rates by region (US, LATAM, Europe, Asia); Adjust rates for fuel/seasons/demand; Negotiation with suppliers/customers; Lead negotiations with carriers/airlines; Negotiate high-impact customers; Evaluate high-volume contracts; Incident resolution; Market analysis; Profitability reports; Cost reduction; Competitive pricing; Scrap and commodities management',
        'Bachelor''s in International Trade, Business, Engineering or related; Additional logistics/pricing/supply chain training; Specialized software proficiency; In-depth knowledge of FCL, LCL, Air freight, LTL rates; Advanced ocean/air/land freight knowledge; BI tools, Excel, CRM, RMS proficiency; Transportation contracts and procurement expertise; Experience managing shipping company relationships',
        'Master''s degree in Supply Chain or International Trade; 8+ years in procurement; Established supplier network in China; Language skills (Mandarin preferred)',
        'open',
        'https://www.linkedin.com/jobs/view/4360984564'
      )
    `);

    return NextResponse.json(
      {
        message: 'Database initialized successfully',
        tables_created: ['vacancies', 'talent_pool', 'matching_results'],
        vacancies_inserted: 3,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database initialization failed' },
      { status: 500, headers: corsHeaders }
    );
  }
}
