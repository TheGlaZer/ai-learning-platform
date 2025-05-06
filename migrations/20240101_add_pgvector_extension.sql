-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create quiz_questions table before adding embedding column
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  explanation TEXT,
  options JSONB,
  correct_option_index INTEGER,
  difficulty_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create basic index for quiz_id
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);

-- Add embedding columns to relevant tables
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE files ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create indexes for vector similarity search
CREATE INDEX IF NOT EXISTS idx_subjects_embedding ON subjects USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_files_embedding ON files USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_embedding ON quiz_questions USING ivfflat (embedding vector_cosine_ops);

-- Function to perform vector similarity search on subjects
CREATE OR REPLACE FUNCTION match_subjects(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  workspace_id uuid,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.description,
    s.workspace_id,
    s.user_id,
    s.created_at,
    s.updated_at,
    1 - (s.embedding <=> query_embedding) AS similarity
  FROM
    subjects s
  WHERE
    1 - (s.embedding <=> query_embedding) > match_threshold
  ORDER BY
    similarity DESC
  LIMIT match_count;
END;
$$;

-- Function to perform vector similarity search on files
CREATE OR REPLACE FUNCTION match_files(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  url text,
  content_type text,
  workspace_id uuid,
  user_id uuid,
  created_at timestamptz,
  size int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.name,
    f.description,
    f.url,
    f.content_type,
    f.workspace_id,
    f.user_id,
    f.created_at,
    f.size,
    1 - (f.embedding <=> query_embedding) AS similarity
  FROM
    files f
  WHERE
    1 - (f.embedding <=> query_embedding) > match_threshold
  ORDER BY
    similarity DESC
  LIMIT match_count;
END;
$$;

-- Function to perform vector similarity search on quiz questions
CREATE OR REPLACE FUNCTION match_quiz_questions(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  quiz_id uuid,
  question text,
  explanation text,
  options jsonb,
  correct_option_index int,
  difficulty_level text,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.quiz_id,
    q.question,
    q.explanation,
    q.options,
    q.correct_option_index,
    q.difficulty_level,
    q.created_at,
    1 - (q.embedding <=> query_embedding) AS similarity
  FROM
    quiz_questions q
  WHERE
    1 - (q.embedding <=> query_embedding) > match_threshold
  ORDER BY
    similarity DESC
  LIMIT match_count;
END;
$$;

-- Generic vector search function with dynamic SQL
CREATE OR REPLACE FUNCTION vector_search(
  table_name text,
  embedding_column text,
  query_vector vector(1536),
  threshold float,
  limit_count int,
  filter_conditions text DEFAULT NULL
)
RETURNS SETOF json
LANGUAGE plpgsql
AS $$
DECLARE
  query text;
  filter_clause text;
BEGIN
  -- Set the default filter clause if not provided
  IF filter_conditions IS NULL OR filter_conditions = '' THEN
    filter_clause := '';
  ELSE
    filter_clause := ' AND ' || filter_conditions;
  END IF;
  
  -- Build dynamic SQL query
  query := format('
    SELECT
      *,
      1 - (%I <=> $1) AS similarity
    FROM
      %I
    WHERE
      1 - (%I <=> $1) > $2
      %s
    ORDER BY
      similarity DESC
    LIMIT $3;
  ', embedding_column, table_name, embedding_column, filter_clause);
  
  -- Execute the dynamic query
  RETURN QUERY EXECUTE query USING query_vector, threshold, limit_count;
END;
$$; 