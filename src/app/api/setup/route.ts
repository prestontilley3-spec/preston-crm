import { NextRequest, NextResponse } from 'next/server'

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  date date,
  category text,
  summary text,
  action_items text,
  status text,
  notes text
);

CREATE TABLE IF NOT EXISTS tile_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  client_name text,
  client_phone text,
  client_email text,
  job_type text,
  description text,
  estimated_value numeric,
  stage text,
  score integer,
  notes text,
  job_date date
);

CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text,
  phone text,
  email text,
  category text,
  company text,
  notes text,
  last_contact date
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  title text,
  description text,
  due_date date,
  priority text,
  status text,
  category text
);

ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tile_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'interactions' AND policyname = 'allow_all_interactions') THEN
    CREATE POLICY allow_all_interactions ON interactions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tile_jobs' AND policyname = 'allow_all_tile_jobs') THEN
    CREATE POLICY allow_all_tile_jobs ON tile_jobs FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'allow_all_contacts') THEN
    CREATE POLICY allow_all_contacts ON contacts FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'allow_all_tasks') THEN
    CREATE POLICY allow_all_tasks ON tasks FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
`

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const dbPassword = searchParams.get('db_password')
  
  if (!dbPassword) {
    return NextResponse.json({
      message: 'Tables not yet created in Supabase.',
      instructions: 'Run the SQL below in your Supabase Dashboard > SQL Editor, OR pass ?db_password=YOUR_DB_PASSWORD to auto-migrate.',
      sql: SCHEMA_SQL,
      supabase_dashboard: 'https://supabase.com/dashboard/project/roghzufimqhiphqpmlhu/sql/new'
    })
  }
  
  // Try to connect using the provided DB password
  try {
    const { Client } = await import('pg')
    const client = new Client({
      connectionString: `postgresql://postgres.roghzufimqhiphqpmlhu:${encodeURIComponent(dbPassword)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000
    })
    await client.connect()
    await client.query(SCHEMA_SQL)
    await client.end()
    
    return NextResponse.json({ 
      success: true, 
      message: 'All 4 tables created successfully! Your CRM is ready.' 
    })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      fallback_instructions: 'Run the SQL manually in Supabase Dashboard',
      sql: SCHEMA_SQL
    }, { status: 500 })
  }
}
