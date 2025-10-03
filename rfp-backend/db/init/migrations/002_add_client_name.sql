-- Add client_name to documents table
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS client_name text;

-- Optional: you may later add a unique index to enforce uniqueness at DB level
-- CREATE UNIQUE INDEX IF NOT EXISTS uniq_documents_client_filename
--   ON documents (client_name, filename);


