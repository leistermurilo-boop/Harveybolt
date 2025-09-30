/*
  # Harvey - Assistente Jurídico para Licitações - Schema Inicial

  ## Descrição
  Sistema multi-tenant B2B para gestão de licitações públicas com geração de peças jurídicas por IA.

  ## Tabelas Criadas

  1. **companies** - Dados das empresas cadastradas
     - `id` (uuid, primary key) - Identificador único da empresa
     - `user_id` (uuid, foreign key) - Vincula ao usuário do Supabase Auth
     - `name` (text) - Razão social da empresa
     - `cnpj` (text, unique) - CNPJ da empresa
     - `email` (text) - Email de contato
     - `phone` (text) - Telefone
     - `address` (text) - Endereço completo
     - `logo_url` (text) - URL do logo/timbrado armazenado no Storage
     - `created_at` (timestamptz) - Data de criação

  2. **cases** - Casos/processos de licitação
     - `id` (uuid, primary key) - Identificador único do caso
     - `company_id` (uuid, foreign key) - Empresa proprietária
     - `title` (text) - Título do caso
     - `process_number` (text) - Número do processo licitatório
     - `agency` (text) - Órgão licitante
     - `description` (text) - Descrição detalhada
     - `status` (text) - Status: 'active', 'archived', 'completed'
     - `created_at` (timestamptz) - Data de criação
     - `updated_at` (timestamptz) - Data de atualização

  3. **documents** - Documentos anexados aos casos
     - `id` (uuid, primary key) - Identificador único do documento
     - `case_id` (uuid, foreign key) - Caso ao qual pertence
     - `filename` (text) - Nome original do arquivo
     - `type` (text) - Tipo: 'edital', 'recurso_concorrente', 'outros'
     - `storage_path` (text) - Caminho no Supabase Storage
     - `file_size` (bigint) - Tamanho em bytes
     - `uploaded_at` (timestamptz) - Data de upload

  4. **generated_docs** - Peças jurídicas geradas pela IA
     - `id` (uuid, primary key) - Identificador único
     - `case_id` (uuid, foreign key) - Caso relacionado
     - `doc_type` (text) - Tipo: 'recurso_administrativo', 'contrarrazoes', etc
     - `content` (text) - Conteúdo gerado pela IA
     - `docx_url` (text) - URL do DOCX gerado no Storage
     - `parameters` (jsonb) - Parâmetros usados na geração
     - `created_at` (timestamptz) - Data de criação

  ## Segurança
  - RLS habilitado em todas as tabelas
  - Políticas garantem isolamento multi-tenant
  - Apenas usuários autenticados podem acessar
  - Cada empresa só acessa seus próprios dados

  ## Índices
  - Índices em foreign keys para performance
  - Índice em CNPJ para busca rápida
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  cnpj text UNIQUE NOT NULL,
  email text NOT NULL,
  phone text DEFAULT '',
  address text DEFAULT '',
  logo_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create cases table
CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  process_number text NOT NULL,
  agency text NOT NULL,
  description text DEFAULT '',
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  type text NOT NULL CHECK (type IN ('edital', 'recurso_concorrente', 'outros')),
  storage_path text NOT NULL,
  file_size bigint NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Create generated_docs table
CREATE TABLE IF NOT EXISTS generated_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  doc_type text NOT NULL,
  content text NOT NULL,
  docx_url text DEFAULT '',
  parameters jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_cases_company_id ON cases(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_generated_docs_case_id ON generated_docs(case_id);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_docs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Users can view their own company"
  ON companies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company"
  ON companies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for cases
CREATE POLICY "Users can view cases from their company"
  ON cases FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = cases.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert cases for their company"
  ON cases FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = cases.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update cases from their company"
  ON cases FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = cases.company_id
      AND companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = cases.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete cases from their company"
  ON cases FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = cases.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- RLS Policies for documents
CREATE POLICY "Users can view documents from their company cases"
  ON documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cases
      JOIN companies ON companies.id = cases.company_id
      WHERE cases.id = documents.case_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert documents to their company cases"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cases
      JOIN companies ON companies.id = cases.company_id
      WHERE cases.id = documents.case_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents from their company cases"
  ON documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cases
      JOIN companies ON companies.id = cases.company_id
      WHERE cases.id = documents.case_id
      AND companies.user_id = auth.uid()
    )
  );

-- RLS Policies for generated_docs
CREATE POLICY "Users can view generated docs from their company cases"
  ON generated_docs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cases
      JOIN companies ON companies.id = cases.company_id
      WHERE cases.id = generated_docs.case_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert generated docs to their company cases"
  ON generated_docs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cases
      JOIN companies ON companies.id = cases.company_id
      WHERE cases.id = generated_docs.case_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete generated docs from their company cases"
  ON generated_docs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cases
      JOIN companies ON companies.id = cases.company_id
      WHERE cases.id = generated_docs.case_id
      AND companies.user_id = auth.uid()
    )
  );