-- Preston CRM Initial Schema Migration
-- Run this in Supabase Dashboard > SQL Editor

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

-- Enable Row Level Security
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tile_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Allow all operations (single-user CRM, no auth needed)
CREATE POLICY "allow_all_interactions" ON interactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_tile_jobs" ON tile_jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_contacts" ON contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
