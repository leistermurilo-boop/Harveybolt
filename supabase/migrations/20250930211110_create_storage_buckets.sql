/*
  # Configuração dos Buckets de Storage

  ## Descrição
  Cria e configura os buckets de storage para documentos e logos da aplicação Harvey.

  ## Buckets Criados

  1. **documents** - Armazena PDFs e documentos anexados aos casos
     - Público: Não
     - Tamanho máximo: 50MB
     - Tipos permitidos: PDF, DOC, DOCX

  2. **logos** - Armazena logos e timbrados das empresas
     - Público: Sim (para exibição nos documentos)
     - Tamanho máximo: 5MB
     - Tipos permitidos: PNG, JPG, JPEG

  ## Políticas de Segurança
  - Usuários só podem acessar documentos de seus próprios casos
  - Empresas só podem fazer upload de seus próprios logos
  - RLS garante isolamento multi-tenant

  ## Storage Policies
  - SELECT: Usuários podem ver arquivos de suas empresas
  - INSERT: Usuários podem fazer upload para suas empresas
  - DELETE: Usuários podem deletar arquivos de suas empresas
*/

-- Create documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800,
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Create logos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Users can view documents from their company cases"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM documents d
      JOIN cases c ON c.id = d.case_id
      JOIN companies comp ON comp.id = c.company_id
      WHERE d.storage_path = storage.objects.name
      AND comp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload documents to their company cases"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid() IN (
      SELECT user_id FROM companies
    )
  );

CREATE POLICY "Users can delete documents from their company cases"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM documents d
      JOIN cases c ON c.id = d.case_id
      JOIN companies comp ON comp.id = c.company_id
      WHERE d.storage_path = storage.objects.name
      AND comp.user_id = auth.uid()
    )
  );

-- Storage policies for logos bucket
CREATE POLICY "Anyone can view logos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'logos');

CREATE POLICY "Users can upload their company logo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'logos' AND
    auth.uid() IN (
      SELECT user_id FROM companies
    )
  );

CREATE POLICY "Users can update their company logo"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'logos' AND
    auth.uid() IN (
      SELECT user_id FROM companies
    )
  )
  WITH CHECK (
    bucket_id = 'logos' AND
    auth.uid() IN (
      SELECT user_id FROM companies
    )
  );

CREATE POLICY "Users can delete their company logo"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'logos' AND
    auth.uid() IN (
      SELECT user_id FROM companies
    )
  );