-- Update the find_file_sections_by_subject function to include content field
-- This function is used to find relevant sections in a file based on a subject query

-- First, drop the existing function
DROP FUNCTION IF EXISTS find_file_sections_by_subject(text, uuid, float, int);

-- Create the updated function with content field
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
  content TEXT,
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
    f.content,
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