-- Enable helper extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS vector;

-- Users
CREATE TABLE IF NOT EXISTS "users" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  name text,
  provider text,
  provider_id text,
  created_at timestamp with time zone DEFAULT now()
);

-- Documents
CREATE TABLE IF NOT EXISTS "documents" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  path text NOT NULL,
  uploader_id uuid REFERENCES "users"(id),
  uploaded_at timestamp with time zone DEFAULT now()
);

-- Chunks (store textual chunks + embeddings)
CREATE TABLE IF NOT EXISTS "chunks" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  page_no integer,
  char_start integer,
  char_end integer,
  text text,
  token_count integer,
  embedding vector(1536),   -- set EMBEDDING_DIM when generating migrations
  created_at timestamp with time zone DEFAULT now()
);

-- Q&A repository
CREATE TABLE IF NOT EXISTS "qa_pairs" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text,
  source_chunk_id uuid REFERENCES chunks(id),
  curated_by uuid REFERENCES "users"(id),
  status text DEFAULT 'draft',
  created_at timestamp with time zone DEFAULT now()
);

-- Create Full Text Search tsvector column for chunks and index
ALTER TABLE chunks
  ADD COLUMN IF NOT EXISTS text_search tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(text, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_chunks_text_search ON chunks USING gin (text_search);

-- Create pgvector index (ivfflat)
-- NOTE: For large corpora choose appropriate lists value
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Sample seed user
INSERT INTO "users" (email, name, provider, provider_id)
  SELECT 'admin@example.com', 'Admin', 'system', 'admin'
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='admin@example.com');
