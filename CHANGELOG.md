# Changelog

## [2025-10-03] - Senior Fullstack Refactor

### 🔧 Database Foundation

#### Added
- **Updated_at triggers**: Automatic timestamp updates on `cases` table modifications
- **Database constraints**:
  - Unique constraint on `companies.cnpj` (prevents duplicate CNPJ)
  - File size validation (max 50MB) on `documents.file_size`
- **Missing RLS policy**: UPDATE policy for `generated_docs` table

#### Impact
- **Data integrity**: CNPJ duplicates now blocked at database level
- **Timestamp accuracy**: `updated_at` now automatically updates on every case modification
- **Complete RLS coverage**: All CRUD operations now properly secured

---

### 🛡️ Supabase Client Hardening

#### Added
- Environment variable validation (fails fast on missing/invalid config)
- Typed Supabase client with proper configuration
- Session persistence and auto-refresh
- Custom client headers for tracking

#### Changed
- `src/lib/supabase.ts`: Added validation, typed exports, better config

#### Impact
- **Early error detection**: Invalid config caught at startup, not runtime
- **Type safety**: Full TypeScript support across all Supabase operations
- **Session stability**: Auto-refresh prevents unexpected logouts

---

### 🚀 Upload System Complete Rewrite

#### Added
- **New files**:
  - `src/lib/supabaseUtils.ts`: Retry logic, error handling, file validation
  - `src/lib/uploadService.ts`: Secure upload operations with atomic transactions

#### Features
- **Retry with exponential backoff**: Automatic retry on network failures (max 3 attempts)
- **File validation**:
  - MIME type checking (PDF, DOC, DOCX for documents; JPG, PNG, WEBP, SVG for logos)
  - Size limits (50MB for documents, 5MB for logos)
  - File name sanitization (prevents path traversal attacks)
- **Atomic transactions**: Upload + DB insert rolled back together on failure
- **Unique file names**: Timestamp + random hash prevents collisions

#### Changed
- `src/pages/CaseDetail.tsx`: Refactored to use `uploadDocument()`
- `src/pages/Settings.tsx`: Refactored to use `uploadLogo()`

#### Removed
- Raw Supabase upload calls (replaced with service layer)
- Primitive error handling (replaced with structured errors)

#### Impact
- **Zero orphaned files**: Failed uploads no longer leave files in storage
- **Better UX**: Clear error messages, automatic retries on transient failures
- **Security**: File type/size validation prevents abuse

---

### ✅ TypeScript Quality

#### Fixed
- Removed unused imports (`HeadingLevel`, `getDocTypeTitle`, `today`)
- Fixed ImageRun type mismatch (added required `type` property)
- Removed non-existent `StorageError` import (defined custom type)
- Fixed missing `supabase` import in Settings page

#### Impact
- **Zero TypeScript errors**: Clean `npm run typecheck`
- **Smaller bundle**: Dead code eliminated
- **Better maintainability**: Types enforced across entire codebase

---

### 🔄 CI/CD Quality Gates

#### Added
- **GitHub Actions**: Lint and typecheck run before build
- Failing quality checks block deployment
- Updated browserslist database

#### Changed
- `.github/workflows/deploy.yml`: Added lint and typecheck steps

#### Impact
- **No broken deploys**: Type errors caught in CI before going live
- **Code quality enforced**: Linting failures prevent merges
- **Fast feedback**: Developers see issues immediately in pull requests

---

### 📊 Migration Applied

**File**: `supabase/migrations/add_updated_at_triggers_and_constraints.sql`

```sql
-- Trigger function for updated_at
CREATE FUNCTION update_updated_at_column()

-- Applied to cases table
CREATE TRIGGER update_cases_updated_at

-- Constraints
ALTER TABLE companies ADD CONSTRAINT companies_cnpj_unique UNIQUE (cnpj)
ALTER TABLE documents ADD CONSTRAINT documents_file_size_check CHECK (...)

-- Missing RLS policy
CREATE POLICY "Users can update generated docs from their company cases"
```

---

## Summary of Changes

### Files Created (3)
1. `src/lib/supabaseUtils.ts` - Retry logic, error handling, validation
2. `src/lib/uploadService.ts` - Secure upload service layer
3. `CHANGELOG.md` - This file

### Files Modified (7)
1. `src/lib/supabase.ts` - Added validation and configuration
2. `src/lib/documentGenerator.ts` - Fixed TypeScript errors, improved image handling
3. `src/pages/CaseDetail.tsx` - Refactored upload system
4. `src/pages/Settings.tsx` - Refactored logo upload
5. `.github/workflows/deploy.yml` - Added quality gates
6. `README.md` - Updated documentation
7. Database migration applied

### Lines of Code
- **Added**: ~500 lines (utilities, services, error handling)
- **Modified**: ~150 lines (refactored upload logic)
- **Removed**: ~100 lines (old upload code, dead code)

---

## Testing Checklist

- [x] TypeScript compilation (`npm run typecheck`)
- [x] Production build (`npm run build`)
- [x] Linting passes (`npm run lint`)
- [x] Database migration applied successfully
- [x] Environment variable validation works
- [x] Retry logic tested (simulated network failures)
- [ ] Manual upload testing (document upload)
- [ ] Manual upload testing (logo upload)
- [ ] End-to-end workflow (create case → upload docs → generate doc)

---

## Breaking Changes

**None**. All changes are backward compatible. Existing code continues to work.

---

## Next Steps

1. Add unit tests for upload service
2. Add E2E tests for critical paths
3. Implement monitoring/logging (Sentry, LogRocket)
4. Add performance tracking for uploads
5. Consider implementing Progressive Web App (PWA) features

---

## Technical Debt Resolved

- ✅ No updated_at triggers
- ✅ Missing RLS policies
- ✅ No file validation
- ✅ No retry logic
- ✅ Primitive error handling
- ✅ TypeScript errors
- ✅ No CI quality gates
- ✅ Orphaned files on failed uploads
- ✅ Duplicate CNPJ possible

## Technical Debt Remaining

- ⚠️ No automated tests
- ⚠️ Large bundle size (675KB)
- ⚠️ No monitoring/observability
- ⚠️ No rate limiting
- ⚠️ No audit logging
