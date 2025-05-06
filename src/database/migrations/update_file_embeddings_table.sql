-- Update file_embeddings table to store content
-- This is needed for the embedding-based quiz generation feature

-- First check if content column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'file_embeddings' 
        AND column_name = 'content'
    ) THEN
        -- Add content column to store the actual text content
        -- This allows retrieving content directly without loading the entire file
        ALTER TABLE file_embeddings ADD COLUMN content TEXT;
    END IF;
END $$;

-- Check if any existing data needs content added
-- This will be filled in by the FileEmbeddingService when embeddings are generated
SELECT 'Content column added to file_embeddings table. New embeddings will include content.';

-- Update metadata index to improve search performance
DROP INDEX IF EXISTS idx_file_embeddings_metadata;
CREATE INDEX IF NOT EXISTS idx_file_embeddings_metadata ON file_embeddings USING GIN (metadata);

-- Create partial index for chunk search optimization
CREATE INDEX IF NOT EXISTS idx_file_embeddings_chunk_index ON file_embeddings ((metadata->>'chunkIndex')); 