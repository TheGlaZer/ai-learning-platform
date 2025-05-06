-- Create extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS vector;

-- Create file_embeddings table
CREATE TABLE IF NOT EXISTS file_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index for faster similarity searches
CREATE INDEX IF NOT EXISTS file_embeddings_file_id_idx ON file_embeddings (file_id);

-- Create or replace function to match files by embedding similarity
CREATE OR REPLACE FUNCTION match_files(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  workspace_id text DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  file_id UUID,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.file_id,
    1 - (f.embedding <=> query_embedding) AS similarity
  FROM
    file_embeddings f
  JOIN
    files ON f.file_id = files.id
  WHERE
    (workspace_id IS NULL OR files.workspace_id = workspace_id)
    AND (1 - (f.embedding <=> query_embedding)) > match_threshold
  ORDER BY
    similarity DESC
  LIMIT match_count;
END;
$$;

-- Create function to find relevant sections by subject
CREATE OR REPLACE FUNCTION find_file_sections_by_subject(
  subject_query text,
  file_id_param UUID,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  file_id UUID,
  similarity float,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
  subject_embedding vector(1536);
BEGIN
  -- Generate embedding for the subject query
  SELECT embedding INTO subject_embedding FROM generate_embedding(subject_query);
  
  RETURN QUERY
  SELECT
    f.id,
    f.file_id,
    1 - (f.embedding <=> subject_embedding) AS similarity,
    f.metadata
  FROM
    file_embeddings f
  WHERE
    f.file_id = file_id_param
    AND (1 - (f.embedding <=> subject_embedding)) > match_threshold
  ORDER BY
    similarity DESC
  LIMIT match_count;
END;
$$; 