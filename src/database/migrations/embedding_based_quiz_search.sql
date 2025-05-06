-- Add function to find file chunks by embedding similarity
-- This function is used by the embedding-based quiz generation feature
CREATE OR REPLACE FUNCTION find_file_chunks_by_embedding(
  query_embedding vector(1536),
  file_id_param UUID,
  workspace_id UUID DEFAULT NULL,
  match_threshold float DEFAULT 0.65,
  match_count int DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  file_id UUID,
  content TEXT,
  similarity float,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fe.id,
    fe.file_id,
    fe.content,
    1 - (fe.embedding <=> query_embedding) AS similarity,
    fe.metadata
  FROM
    file_embeddings fe
  JOIN
    files f ON fe.file_id = f.id
  WHERE
    fe.file_id = file_id_param
    AND (workspace_id IS NULL OR f.workspace_id = workspace_id)
    AND (1 - (fe.embedding <=> query_embedding)) > match_threshold
  ORDER BY
    similarity DESC
  LIMIT match_count;
END;
$$;

-- Function to find chunks across multiple files within a workspace
CREATE OR REPLACE FUNCTION find_workspace_chunks_by_embedding(
  query_embedding vector(1536),
  workspace_id_param UUID,
  match_threshold float DEFAULT 0.65,
  match_count int DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  file_id UUID,
  content TEXT,
  similarity float,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fe.id,
    fe.file_id,
    fe.content,
    1 - (fe.embedding <=> query_embedding) AS similarity,
    fe.metadata
  FROM
    file_embeddings fe
  JOIN
    files f ON fe.file_id = f.id
  WHERE
    f.workspace_id = workspace_id_param
    AND (1 - (fe.embedding <=> query_embedding)) > match_threshold
  ORDER BY
    similarity DESC
  LIMIT match_count;
END;
$$;

-- Function to find chunks by any of multiple subject embeddings
-- This allows for searching with multiple subjects in a single query
CREATE OR REPLACE FUNCTION find_chunks_by_multiple_embeddings(
  query_embeddings vector(1536)[],
  file_id_param UUID DEFAULT NULL,
  workspace_id_param UUID DEFAULT NULL,
  match_threshold float DEFAULT 0.65,
  match_count int DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  file_id UUID,
  content TEXT,
  similarity float,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH similarities AS (
    SELECT
      fe.id,
      fe.file_id,
      fe.content,
      fe.metadata,
      -- Get maximum similarity from all provided embeddings
      (SELECT MAX(1 - (fe.embedding <=> e)) 
       FROM unnest(query_embeddings) e) AS max_similarity
    FROM
      file_embeddings fe
    JOIN
      files f ON fe.file_id = f.id
    WHERE
      (file_id_param IS NULL OR fe.file_id = file_id_param)
      AND (workspace_id_param IS NULL OR f.workspace_id = workspace_id_param)
  )
  SELECT
    s.id,
    s.file_id,
    s.content,
    s.max_similarity AS similarity,
    s.metadata
  FROM
    similarities s
  WHERE
    s.max_similarity > match_threshold
  ORDER BY
    s.max_similarity DESC
  LIMIT match_count;
END;
$$; 