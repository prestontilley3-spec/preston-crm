export interface Interaction {
  id: string
  created_at: string
  date: string
  category: string
  summary: string
  action_items: string
  status: string
  notes: string
}

export interface TileJob {
  id: string
  created_at: string
  client_name: string
  client_phone: string
  client_email: string
  job_type: string
  description: string
  estimated_value: number
  stage: string
  score: number
  notes: string
  job_date: string
}

export interface Contact {
  id: string
  created_at: string
  name: string
  phone: string
  email: string
  category: string
  company: string
  notes: string
  last_contact: string
}

export interface Task {
  id: string
  created_at: string
  title: string
  description: string
  due_date: string
  priority: string
  status: string
  category: string
}
