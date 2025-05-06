-- Purge Workspace Data Migration
-- 
-- This script safely deletes all workspace-related data including files, subjects, quizzes,
-- flashcards, past exams, patterns, and other related entities while preserving user accounts.
--
-- IMPORTANT: Run this script carefully as it will permanently delete data!
-- Consider creating a backup before running this script in production environments.
--
-- Usage: 
--   psql -h <host> -U <username> -d <database> -f purge-workspace-data.sql
--
-- Or from Supabase SQL Editor

BEGIN;

-- Disable triggers temporarily to avoid issues with cascading deletes
SET session_replication_role = 'replica';

-- Record counts before deletion for verification
DO $$
DECLARE
    workspace_count INTEGER;
    subject_count INTEGER;
    file_count INTEGER;
    quiz_count INTEGER;
    flashcard_count INTEGER;
    exam_count INTEGER;
    pattern_count INTEGER;
    embedding_count INTEGER;
    quiz_submission_count INTEGER;
    performance_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO workspace_count FROM workspaces;
    SELECT COUNT(*) INTO subject_count FROM subjects;
    SELECT COUNT(*) INTO file_count FROM files;
    SELECT COUNT(*) INTO quiz_count FROM quizzes;
    SELECT COUNT(*) INTO flashcard_count FROM flashcards;
    SELECT COUNT(*) INTO exam_count FROM past_exams;
    SELECT COUNT(*) INTO pattern_count FROM patterns;
    SELECT COUNT(*) INTO embedding_count FROM file_embeddings;
    SELECT COUNT(*) INTO quiz_submission_count FROM quiz_submissions;
    SELECT COUNT(*) INTO performance_count FROM subject_performance;

    RAISE NOTICE 'Records to be deleted:';
    RAISE NOTICE '- Workspaces: %', workspace_count;
    RAISE NOTICE '- Subjects: %', subject_count;
    RAISE NOTICE '- Files: %', file_count;
    RAISE NOTICE '- Quizzes: %', quiz_count;
    RAISE NOTICE '- Flashcards: %', flashcard_count;
    RAISE NOTICE '- Past Exams: %', exam_count;
    RAISE NOTICE '- Patterns: %', pattern_count;
    RAISE NOTICE '- File Embeddings: %', embedding_count;
    RAISE NOTICE '- Quiz Submissions: %', quiz_submission_count;
    RAISE NOTICE '- Subject Performance: %', performance_count;
END $$;

-- Delete records from dependent tables first
-- Check if embedding_jobs table exists and delete from it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'embedding_jobs') THEN
        EXECUTE 'DELETE FROM embedding_jobs';
        RAISE NOTICE 'Deleted all records from embedding_jobs';
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table embedding_jobs does not exist, skipping.';
END $$;

-- Delete from other tables in order
DELETE FROM file_embeddings;
DELETE FROM subject_performance;
DELETE FROM quiz_submissions;
DELETE FROM quiz_questions;
DELETE FROM patterns;
DELETE FROM flashcards;
DELETE FROM past_exams;
DELETE FROM quizzes;
DELETE FROM files;
DELETE FROM subjects;
DELETE FROM workspaces;

-- Verify deletion
DO $$
DECLARE
    remaining_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_count FROM workspaces;
    RAISE NOTICE 'Remaining workspaces: %', remaining_count;
    
    SELECT COUNT(*) INTO remaining_count FROM subjects;
    RAISE NOTICE 'Remaining subjects: %', remaining_count;
    
    SELECT COUNT(*) INTO remaining_count FROM files;
    RAISE NOTICE 'Remaining files: %', remaining_count;
END $$;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Reset sequences if needed (optional)
-- ALTER SEQUENCE workspaces_id_seq RESTART WITH 1;

COMMIT; 