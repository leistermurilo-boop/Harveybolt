import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Company = {
  id: string;
  user_id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  logo_url: string;
  created_at: string;
};

export type Case = {
  id: string;
  company_id: string;
  title: string;
  process_number: string;
  agency: string;
  description: string;
  status: 'active' | 'archived' | 'completed';
  created_at: string;
  updated_at: string;
};

export type Document = {
  id: string;
  case_id: string;
  filename: string;
  type: 'edital' | 'recurso_concorrente' | 'outros';
  storage_path: string;
  file_size: number;
  uploaded_at: string;
};

export type GeneratedDoc = {
  id: string;
  case_id: string;
  doc_type: string;
  content: string;
  docx_url: string;
  parameters: Record<string, any>;
  created_at: string;
};
