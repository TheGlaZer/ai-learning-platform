-- Function to search patterns by similarity with embeddings
CREATE OR REPLACE FUNCTION search_patterns_by_similarity(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  workspace_filter uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  past_exam_id uuid,
  workspace_id uuid,
  user_id uuid,
  pattern_data jsonb,
  confidence_score decimal,
  usage_count int,
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Search for patterns by vector similarity
  -- The pattern table itself doesn't have embeddings, but we can join it
  -- with the past_exams table to get related file content
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.past_exam_id,
    p.workspace_id,
    p.user_id,
    p.pattern_data,
    p.confidence_score,
    p.usage_count,
    p.created_at,
    p.updated_at,
    1 - (f.embedding <=> query_embedding) AS similarity
  FROM patterns p
  -- Join with past_exams to get exam info
  JOIN past_exams pe ON p.past_exam_id = pe.id
  -- Join with files to get embeddings
  JOIN files f ON pe.url LIKE '%' || f.url || '%'
  WHERE 
    1 - (f.embedding <=> query_embedding) > match_threshold
    AND (workspace_filter IS NULL OR p.workspace_id = workspace_filter)
  ORDER BY
    similarity DESC
  LIMIT match_count;
END;
$$; 