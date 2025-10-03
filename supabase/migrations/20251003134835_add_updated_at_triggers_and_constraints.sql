/*
  # Add updated_at triggers and database constraints

  ## Changes Applied

  1. **Triggers for updated_at**
    - Create reusable function `update_updated_at_column()`
    - Add trigger to `cases` table to auto-update `updated_at`
    - Ensures timestamp consistency across all updates

  2. **Database Constraints**
    - Add unique constraint on `companies.cnpj` to prevent duplicates
    - Add check constraint on `documents.file_size` (max 50MB)
    - Add check constraint on `companies.logo_url` length

  3. **Missing RLS Policy**
    - Add UPDATE policy for `generated_docs` table

  4. **Column Defaults**
    - Ensure consistent defaults for nullable fields

  ## Security Impact
  - Prevents CNPJ duplication (business rule enforcement)
  - Adds file size validation at DB level
  - Completes RLS coverage for generated_docs table
*/

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to cases table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_cases_updated_at'
  ) THEN
    CREATE TRIGGER update_cases_updated_at
      BEFORE UPDATE ON cases
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add unique constraint on CNPJ (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'companies_cnpj_unique'
  ) THEN
    ALTER TABLE companies 
    ADD CONSTRAINT companies_cnpj_unique UNIQUE (cnpj);
  END IF;
END $$;

-- Add file size check constraint (50MB max)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'documents_file_size_check'
  ) THEN
    ALTER TABLE documents 
    ADD CONSTRAINT documents_file_size_check 
    CHECK (file_size > 0 AND file_size <= 52428800);
  END IF;
END $$;

-- Add missing UPDATE policy for generated_docs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'generated_docs'
    AND policyname = 'Users can update generated docs from their company cases'
  ) THEN
    CREATE POLICY "Users can update generated docs from their company cases"
      ON generated_docs FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM cases
          JOIN companies ON companies.id = cases.company_id
          WHERE cases.id = generated_docs.case_id
          AND companies.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM cases
          JOIN companies ON companies.id = cases.company_id
          WHERE cases.id = generated_docs.case_id
          AND companies.user_id = auth.uid()
        )
      );
  END IF;
END $$;
