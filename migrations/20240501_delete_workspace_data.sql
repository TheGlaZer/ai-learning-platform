-- Migration: Delete all workspace data and related entities
-- 
-- This script safely deletes all workspace-related data including files, subjects, quizzes,
-- flashcards, past exams, patterns, and other related entities while preserving user accounts.
-- 
-- Run this script carefully as it will permanently delete data!
-- Consider creating a backup before running this script in production environments.

-- Start transaction to ensure all operations complete or none do
BEGIN;

-- Disable triggers temporarily to avoid issues with cascading deletes
SET session_replication_role = 'replica';

-- Record count before deletion for verification
DO $$
DECLARE
  workspace_count INT;
  files_count INT;
  subjects_count INT;
  quizzes_count INT;
  quiz_questions_count INT;
  quiz_submissions_count INT;
  flashcards_count INT;
  past_exams_count INT;
  patterns_count INT;
  file_embeddings_count INT;
BEGIN
  SELECT COUNT(*) INTO workspace_count FROM workspaces;
  SELECT COUNT(*) INTO files_count FROM files;
  SELECT COUNT(*) INTO subjects_count FROM subjects;
  SELECT COUNT(*) INTO quizzes_count FROM quizzes;
  SELECT COUNT(*) INTO quiz_questions_count FROM quiz_questions;
  SELECT COUNT(*) INTO quiz_submissions_count FROM quiz_submissions;
  SELECT COUNT(*) INTO flashcards_count FROM flashcards;
  SELECT COUNT(*) INTO past_exams_count FROM past_exams;
  SELECT COUNT(*) INTO patterns_count FROM patterns;
  SELECT COUNT(*) INTO file_embeddings_count FROM file_embeddings;

  RAISE NOTICE 'Before deletion - Workspaces: %, Files: %, Subjects: %, Quizzes: %, Quiz Questions: %, Quiz Submissions: %, Flashcards: %, Past Exams: %, Patterns: %, File Embeddings: %', 
    workspace_count, files_count, subjects_count, quizzes_count, quiz_questions_count, 
    quiz_submissions_count, flashcards_count, past_exams_count, patterns_count, file_embeddings_count;
END $$;

-- Clear dependent tables first (those with foreign keys to our main tables)

-- Clear embedding jobs (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'embedding_jobs') THEN
    DELETE FROM embedding_jobs;
    RAISE NOTICE 'Deleted all records from embedding_jobs';
  END IF;
END $$;

-- Clear file_embeddings
DELETE FROM file_embeddings;
RAISE NOTICE 'Deleted all records from file_embeddings';

-- Clear subject_performance 
DELETE FROM subject_performance;
RAISE NOTICE 'Deleted all records from subject_performance';

-- Clear quiz_submissions
DELETE FROM quiz_submissions;
RAISE NOTICE 'Deleted all records from quiz_submissions';

-- Clear quiz_questions
DELETE FROM quiz_questions;
RAISE NOTICE 'Deleted all records from quiz_questions';

-- Clear patterns
DELETE FROM patterns;
RAISE NOTICE 'Deleted all records from patterns';

-- Clear flashcards
DELETE FROM flashcards;
RAISE NOTICE 'Deleted all records from flashcards';

-- Clear past_exams
DELETE FROM past_exams;
RAISE NOTICE 'Deleted all records from past_exams';

-- Clear quizzes
DELETE FROM quizzes;
RAISE NOTICE 'Deleted all records from quizzes';

-- Clear files (this may also clear vectors if they are stored in the files table)
DELETE FROM files;
RAISE NOTICE 'Deleted all records from files';

-- Clear subjects
DELETE FROM subjects;
RAISE NOTICE 'Deleted all records from subjects';

-- Finally clear workspaces (the parent entity)
DELETE FROM workspaces;
RAISE NOTICE 'Deleted all records from workspaces';

-- Verify counts after deletion
DO $$
DECLARE
  workspace_count INT;
  files_count INT;
  subjects_count INT;
  quizzes_count INT;
  quiz_questions_count INT;
  quiz_submissions_count INT;
  flashcards_count INT;
  past_exams_count INT;
  patterns_count INT;
  file_embeddings_count INT;
BEGIN
  SELECT COUNT(*) INTO workspace_count FROM workspaces;
  SELECT COUNT(*) INTO files_count FROM files;
  SELECT COUNT(*) INTO subjects_count FROM subjects;
  SELECT COUNT(*) INTO quizzes_count FROM quizzes;
  SELECT COUNT(*) INTO quiz_questions_count FROM quiz_questions;
  SELECT COUNT(*) INTO quiz_submissions_count FROM quiz_submissions;
  SELECT COUNT(*) INTO flashcards_count FROM flashcards;
  SELECT COUNT(*) INTO past_exams_count FROM past_exams;
  SELECT COUNT(*) INTO patterns_count FROM patterns;
  SELECT COUNT(*) INTO file_embeddings_count FROM file_embeddings;

  RAISE NOTICE 'After deletion - Workspaces: %, Files: %, Subjects: %, Quizzes: %, Quiz Questions: %, Quiz Submissions: %, Flashcards: %, Past Exams: %, Patterns: %, File Embeddings: %', 
    workspace_count, files_count, subjects_count, quizzes_count, quiz_questions_count, 
    quiz_submissions_count, flashcards_count, past_exams_count, patterns_count, file_embeddings_count;
END $$;

-- Reset triggers
SET session_replication_role = 'origin';

-- Commit the transaction
COMMIT;

-- Optional: Vacuum the database to reclaim space
-- VACUUM FULL; -- Uncomment this line if you want to reclaim space immediately (note: this will lock tables) 