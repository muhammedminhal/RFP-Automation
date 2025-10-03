-- Migration 004: Production Schema Fixes and Enhancements
-- This migration adds critical constraints, indexes, and new tables for production readiness

-- ============================================================================
-- PART 0: PREREQUISITES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper: update updated_at column on row updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 1: FIX EXISTING TABLES
-- ============================================================================

-- 1.1 users TABLE
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- Harden not-null constraints (backfill first to avoid failure)
UPDATE "users" SET email = COALESCE(email, 'unknown@example.com') WHERE email IS NULL;
UPDATE "users" SET name = COALESCE(name, 'Unknown User') WHERE name IS NULL;
ALTER TABLE "users" ALTER COLUMN email SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN name SET NOT NULL;

-- Provider unique combo
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider_id ON "users" (provider, provider_id) WHERE provider IS NOT NULL AND provider_id IS NOT NULL;

-- Role check
ALTER TABLE "users" ADD CONSTRAINT IF NOT EXISTS chk_users_role CHECK (role IN ('admin', 'user', 'curator', 'viewer'));

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON "users" (email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON "users" (is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON "users" (created_at DESC);

-- Trigger
DROP TRIGGER IF EXISTS users_updated_at ON "users";
CREATE TRIGGER users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 1.2 documents TABLE
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS file_size bigint,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'uploaded',
  ADD COLUMN IF NOT EXISTS processing_started_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS processing_completed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS processing_error text,
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS client_organization_id uuid;

-- client_name should be required
UPDATE documents SET client_name = COALESCE(client_name, 'unknown');
ALTER TABLE documents ALTER COLUMN client_name SET NOT NULL;

-- FK for uploader with ON DELETE behavior
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_uploader_id_fkey;
ALTER TABLE documents ADD CONSTRAINT documents_uploader_id_fkey FOREIGN KEY (uploader_id) REFERENCES "users"(id) ON DELETE SET NULL;

-- FK for client_organization if table exists (added later below)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'client_organizations'
  ) THEN
    -- will be added below; add FK after table creation
    NULL;
  END IF;
END$$;

-- Status/file_size checks
ALTER TABLE documents ADD CONSTRAINT IF NOT EXISTS chk_documents_status CHECK (status IN ('uploaded', 'processing', 'completed', 'failed', 'deleted'));
ALTER TABLE documents ADD CONSTRAINT IF NOT EXISTS chk_documents_file_size CHECK (file_size IS NULL OR file_size > 0);

-- Prevent duplicates by (client_name, filename) when not soft-deleted
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_client_filename ON documents (client_name, filename) WHERE deleted_at IS NULL;

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_documents_client_name ON documents (client_name);
CREATE INDEX IF NOT EXISTS idx_documents_uploader_id ON documents (uploader_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents (status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents (uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON documents (deleted_at);

-- Trigger
DROP TRIGGER IF EXISTS documents_updated_at ON documents;
CREATE TRIGGER documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 1.3 chunks TABLE
ALTER TABLE chunks
  ADD COLUMN IF NOT EXISTS chunk_index integer,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS section_title text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Harden not-null + checks
UPDATE chunks SET text = COALESCE(text, '') WHERE text IS NULL;
UPDATE chunks SET token_count = COALESCE(token_count, 0) WHERE token_count IS NULL;
ALTER TABLE chunks ALTER COLUMN text SET NOT NULL;
ALTER TABLE chunks ALTER COLUMN token_count SET NOT NULL;
ALTER TABLE chunks ADD CONSTRAINT IF NOT EXISTS chk_chunks_embedding_status CHECK (embedding_status IN ('pending', 'processing', 'completed', 'failed'));
ALTER TABLE chunks ADD CONSTRAINT IF NOT EXISTS chk_chunks_token_count CHECK (token_count >= 0);
ALTER TABLE chunks ADD CONSTRAINT IF NOT EXISTS chk_chunks_char_positions CHECK (char_end IS NULL OR char_start IS NULL OR char_end >= char_start);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks (document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_created_at ON chunks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chunks_chunk_index ON chunks (document_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_chunks_metadata ON chunks USING gin (metadata);

-- Trigger
DROP TRIGGER IF EXISTS chunks_updated_at ON chunks;
CREATE TRIGGER chunks_updated_at BEFORE UPDATE ON chunks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 1.4 qa_pairs TABLE
ALTER TABLE qa_pairs
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS published_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS tags text[],
  ADD COLUMN IF NOT EXISTS confidence_score numeric(3,2),
  ADD COLUMN IF NOT EXISTS is_ai_generated boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS upvotes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS downvotes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Require answers
UPDATE qa_pairs SET answer = COALESCE(answer, 'No answer provided') WHERE answer IS NULL;
ALTER TABLE qa_pairs ALTER COLUMN answer SET NOT NULL;

-- Rebuild FKs with ON DELETE
ALTER TABLE qa_pairs DROP CONSTRAINT IF EXISTS qa_pairs_source_chunk_id_fkey;
ALTER TABLE qa_pairs ADD CONSTRAINT qa_pairs_source_chunk_id_fkey FOREIGN KEY (source_chunk_id) REFERENCES chunks(id) ON DELETE SET NULL;
ALTER TABLE qa_pairs DROP CONSTRAINT IF EXISTS qa_pairs_curated_by_fkey;
ALTER TABLE qa_pairs ADD CONSTRAINT qa_pairs_curated_by_fkey FOREIGN KEY (curated_by) REFERENCES "users"(id) ON DELETE SET NULL;

-- Checks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_qa_pairs_status'
  ) THEN
    ALTER TABLE qa_pairs ADD CONSTRAINT chk_qa_pairs_status CHECK (status IN ('draft', 'review', 'published', 'archived', 'deleted'));
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_qa_pairs_confidence'
  ) THEN
    ALTER TABLE qa_pairs ADD CONSTRAINT chk_qa_pairs_confidence CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1));
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_qa_pairs_votes'
  ) THEN
    ALTER TABLE qa_pairs ADD CONSTRAINT chk_qa_pairs_votes CHECK (upvotes >= 0 AND downvotes >= 0);
  END IF;
END$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_qa_pairs_source_chunk_id ON qa_pairs (source_chunk_id);
CREATE INDEX IF NOT EXISTS idx_qa_pairs_curated_by ON qa_pairs (curated_by);
CREATE INDEX IF NOT EXISTS idx_qa_pairs_status ON qa_pairs (status);
CREATE INDEX IF NOT EXISTS idx_qa_pairs_category ON qa_pairs (category);
CREATE INDEX IF NOT EXISTS idx_qa_pairs_created_at ON qa_pairs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qa_pairs_published_at ON qa_pairs (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_qa_pairs_tags ON qa_pairs USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_qa_pairs_deleted_at ON qa_pairs (deleted_at);

-- FTS for questions
ALTER TABLE qa_pairs ADD COLUMN IF NOT EXISTS question_search tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(question, ''))) STORED;
CREATE INDEX IF NOT EXISTS idx_qa_pairs_question_search ON qa_pairs USING gin (question_search);

-- Trigger
DROP TRIGGER IF EXISTS qa_pairs_updated_at ON qa_pairs;
CREATE TRIGGER qa_pairs_updated_at BEFORE UPDATE ON qa_pairs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 2: NEW TABLES
-- ============================================================================

-- 2.1 client_organizations
CREATE TABLE IF NOT EXISTS client_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  industry text,
  website text,
  contact_email text,
  contact_phone text,
  address jsonb,
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone
);
CREATE INDEX IF NOT EXISTS idx_client_orgs_name ON client_organizations (name);
CREATE INDEX IF NOT EXISTS idx_client_orgs_is_active ON client_organizations (is_active);
CREATE INDEX IF NOT EXISTS idx_client_orgs_created_at ON client_organizations (created_at DESC);
DROP TRIGGER IF EXISTS client_organizations_updated_at ON client_organizations;
CREATE TRIGGER client_organizations_updated_at BEFORE UPDATE ON client_organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Link documents to client_organizations
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_client_organization_id_fkey;
ALTER TABLE documents ADD CONSTRAINT documents_client_organization_id_fkey FOREIGN KEY (client_organization_id) REFERENCES client_organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_documents_client_org_id ON documents (client_organization_id);

-- 2.2 document_versions
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  filename text NOT NULL,
  path text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid REFERENCES "users"(id) ON DELETE SET NULL,
  change_description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (document_id, version_number)
);
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions (document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_at ON document_versions (created_at DESC);

-- 2.3 audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL,
  user_id uuid REFERENCES "users"(id) ON DELETE SET NULL,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs (table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_audit_logs_action'
  ) THEN
    ALTER TABLE audit_logs ADD CONSTRAINT chk_audit_logs_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT'));
  END IF;
END$$;

-- 2.4 search_logs
CREATE TABLE IF NOT EXISTS search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES "users"(id) ON DELETE SET NULL,
  query_text text NOT NULL,
  search_type text NOT NULL,
  filters jsonb DEFAULT '{}',
  results_count integer,
  response_time_ms integer,
  ip_address inet,
  created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON search_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_search_type ON search_logs (search_type);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_search_logs_search_type'
  ) THEN
    ALTER TABLE search_logs ADD CONSTRAINT chk_search_logs_search_type CHECK (search_type IN ('semantic', 'keyword', 'hybrid', 'qa'));
  END IF;
END$$;

-- 2.5 tags and document_tags
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text,
  description text,
  color text,
  usage_count integer DEFAULT 0,
  created_by uuid REFERENCES "users"(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags (name);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags (category);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags (usage_count DESC);
DROP TRIGGER IF EXISTS tags_updated_at ON tags;
CREATE TRIGGER tags_updated_at BEFORE UPDATE ON tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS document_tags (
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (document_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_document_tags_tag_id ON document_tags (tag_id);

-- 2.6 api_keys
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  name text NOT NULL,
  scopes text[] DEFAULT '{}',
  rate_limit integer DEFAULT 1000,
  is_active boolean DEFAULT true,
  last_used_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys (user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys (key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys (is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys (expires_at);
DROP TRIGGER IF EXISTS api_keys_updated_at ON api_keys;
CREATE TRIGGER api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2.7 sessions (for connect-pg-simple or similar)
CREATE TABLE IF NOT EXISTS sessions (
  sid varchar PRIMARY KEY,
  sess jsonb NOT NULL,
  expire timestamp(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions (expire);

-- ============================================================================
-- PART 3: ANALYTICS VIEWS & FUNCTIONS
-- ============================================================================

-- Materialized view: document stats
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_document_stats_by_client AS
SELECT 
  documents.client_name,
  COUNT(*) as total_documents,
  SUM(file_size) as total_size,
  AVG(file_size) as avg_size,
  COUNT(DISTINCT uploader_id) as unique_uploaders,
  MAX(uploaded_at) as last_upload_at,
  MIN(uploaded_at) as first_upload_at
FROM documents
WHERE documents.deleted_at IS NULL
GROUP BY documents.client_name;
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_doc_stats_client ON mv_document_stats_by_client (client_name);

-- Materialized view: embedding stats
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_embedding_stats AS
SELECT 
  chunks.embedding_status,
  COUNT(*) as chunk_count,
  chunks.embed_model,
  DATE(chunks.created_at) as date
FROM chunks
GROUP BY chunks.embedding_status, chunks.embed_model, DATE(chunks.created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_embed_keys ON mv_embedding_stats (embedding_status, embed_model, date);
CREATE INDEX IF NOT EXISTS idx_mv_embed_stats_date ON mv_embedding_stats (date DESC);

-- Refresh helper
DROP FUNCTION IF EXISTS public.refresh_all_materialized_views();
CREATE OR REPLACE FUNCTION public.refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
  -- Refresh without CONCURRENTLY to avoid unique-index requirement
  REFRESH MATERIALIZED VIEW mv_document_stats_by_client;
  REFRESH MATERIALIZED VIEW mv_embedding_stats;
END;
$$ LANGUAGE plpgsql;

-- Per-document processing stats
CREATE OR REPLACE FUNCTION get_document_processing_stats(doc_id uuid)
RETURNS TABLE (
  total_chunks integer,
  completed_chunks integer,
  pending_chunks integer,
  failed_chunks integer,
  avg_tokens integer,
  processing_progress numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::integer as total_chunks,
    COUNT(*) FILTER (WHERE embedding_status = 'completed')::integer as completed_chunks,
    COUNT(*) FILTER (WHERE embedding_status = 'pending')::integer as pending_chunks,
    COUNT(*) FILTER (WHERE embedding_status = 'failed')::integer as failed_chunks,
    AVG(token_count)::integer as avg_tokens,
    CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE embedding_status = 'completed')::numeric / COUNT(*)::numeric) * 100, 2) ELSE 0 END as processing_progress
  FROM chunks
  WHERE document_id = doc_id;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE "users" IS 'User accounts with authentication providers';
COMMENT ON TABLE documents IS 'Uploaded RFP documents with processing status';
COMMENT ON TABLE chunks IS 'Text chunks from documents with embeddings for semantic search';
COMMENT ON TABLE qa_pairs IS 'Curated question-answer pairs from documents';
COMMENT ON TABLE client_organizations IS 'Client organizations for multi-tenancy';
COMMENT ON TABLE document_versions IS 'Version history for documents';
COMMENT ON TABLE audit_logs IS 'Audit trail for all database changes';
COMMENT ON TABLE search_logs IS 'Search query analytics and monitoring';
COMMENT ON TABLE tags IS 'Tags for categorizing documents and Q&A pairs';
COMMENT ON TABLE api_keys IS 'API authentication keys for external integrations';


