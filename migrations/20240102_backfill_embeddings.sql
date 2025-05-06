-- Backfill SQL script for vector database integration
-- This script is meant to be run manually after the pgvector extension is installed
-- It creates the necessary tables and functions for tracking and managing the embedding generation process

-- Create a table to track embedding generation jobs
CREATE TABLE IF NOT EXISTS embedding_jobs (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT,
  attempts INT NOT NULL DEFAULT 0,
  UNIQUE(table_name, record_id)
);

-- Create indexes for the embedding jobs table
CREATE INDEX IF NOT EXISTS idx_embedding_jobs_status ON embedding_jobs(status);
CREATE INDEX IF NOT EXISTS idx_embedding_jobs_table ON embedding_jobs(table_name);

-- Function to queue embedding generation for subjects
CREATE OR REPLACE FUNCTION queue_subjects_for_embedding()
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  inserted_count INT;
BEGIN
  -- Insert records for subjects without embeddings
  INSERT INTO embedding_jobs (table_name, record_id)
  SELECT 'subjects', id
  FROM subjects
  WHERE embedding IS NULL
  ON CONFLICT (table_name, record_id) DO NOTHING;
  
  -- Get the count of inserted records
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  
  -- Return the count
  RETURN inserted_count;
END;
$$;

-- Function to queue embedding generation for files
CREATE OR REPLACE FUNCTION queue_files_for_embedding()
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  inserted_count INT;
BEGIN
  -- Insert records for files without embeddings
  INSERT INTO embedding_jobs (table_name, record_id)
  SELECT 'files', id
  FROM files
  WHERE embedding IS NULL
  ON CONFLICT (table_name, record_id) DO NOTHING;
  
  -- Get the count of inserted records
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  
  -- Return the count
  RETURN inserted_count;
END;
$$;

-- Function to queue embedding generation for quiz questions
CREATE OR REPLACE FUNCTION queue_quiz_questions_for_embedding()
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  inserted_count INT;
BEGIN
  -- Insert records for quiz questions without embeddings
  INSERT INTO embedding_jobs (table_name, record_id)
  SELECT 'quiz_questions', id
  FROM quiz_questions
  WHERE embedding IS NULL
  ON CONFLICT (table_name, record_id) DO NOTHING;
  
  -- Get the count of inserted records
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  
  -- Return the count
  RETURN inserted_count;
END;
$$;

-- Function to get the next batch of embedding jobs to process
CREATE OR REPLACE FUNCTION get_next_embedding_jobs(
  batch_size INT,
  max_attempts INT DEFAULT 3
)
RETURNS TABLE (
  job_id INT,
  table_name TEXT,
  record_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH updated_jobs AS (
    UPDATE embedding_jobs
    SET 
      status = 'processing',
      started_at = NOW(),
      attempts = attempts + 1
    WHERE id IN (
      SELECT id
      FROM embedding_jobs
      WHERE status IN ('pending', 'error')
      AND attempts < max_attempts
      ORDER BY status = 'error', created_at
      LIMIT batch_size
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, table_name, record_id
  )
  SELECT * FROM updated_jobs;
END;
$$;

-- Function to mark an embedding job as complete
CREATE OR REPLACE FUNCTION complete_embedding_job(
  p_job_id INT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE embedding_jobs
  SET 
    status = 'completed',
    completed_at = NOW()
  WHERE id = p_job_id;
END;
$$;

-- Function to mark an embedding job as failed
CREATE OR REPLACE FUNCTION fail_embedding_job(
  p_job_id INT,
  p_error TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE embedding_jobs
  SET 
    status = 'error',
    error = p_error
  WHERE id = p_job_id;
END;
$$;

-- Queue all existing content for embedding generation
SELECT queue_subjects_for_embedding();
SELECT queue_files_for_embedding();
SELECT queue_quiz_questions_for_embedding(); 