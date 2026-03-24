import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const sql = `
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
  `

  // Use pg connection via supabase service role
  const { error } = await supabase.rpc('exec_sql', { sql })
  
  if (error) {
    // Try alternative: direct REST calls to create via PostgREST introspection workaround
    return NextResponse.json({ 
      message: 'Tables may already exist or need manual creation via Supabase Dashboard',
      note: 'Please run the SQL in Supabase Dashboard > SQL Editor',
      error: error.message 
    })
  }

  return NextResponse.json({ success: true, message: 'Tables created!' })
}
