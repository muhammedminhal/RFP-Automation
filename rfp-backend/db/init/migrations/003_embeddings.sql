-- Migration 003: Add embedding pipeline support to chunks table
-- This migration adds embedding status tracking, model metadata, and updates vector dimension

-- Add embedding status and metadata columns
ALTER TABLE chunks
  ADD COLUMN IF NOT EXISTS embedding_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS embed_model text,
  ADD COLUMN IF NOT EXISTS embed_version text,
  ADD COLUMN IF NOT EXISTS embedding_generated_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS embedding_error text,
  ADD COLUMN IF NOT EXISTS embedding_batch_id uuid;

-- Update embedding column to match all-MiniLM-L6-v2 dimension (384)
-- Note: This requires dropping and recreating the column
ALTER TABLE chunks DROP COLUMN IF EXISTS embedding;
ALTER TABLE chunks ADD COLUMN embedding vector(384);

-- Recreate the ivfflat index for the new dimension
DROP INDEX IF EXISTS idx_chunks_embedding;
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Add index on embedding_status for efficient querying
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_status ON chunks (embedding_status);

-- Add index on embedding_batch_id for batch processing
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_batch_id ON chunks (embedding_batch_id);
