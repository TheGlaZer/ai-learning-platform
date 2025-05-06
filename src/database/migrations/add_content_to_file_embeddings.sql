-- Migration to add content column to file_embeddings table
-- This allows us to store text content directly along with the embeddings
-- Making retrieval operations more efficient without needing to load the original file

-- Add content column to file_embeddings table
-- Using TEXT data type for variable-length text content
ALTER TABLE file_embeddings ADD COLUMN IF NOT EXISTS content TEXT;

-- Create an index on the file_id column for faster lookups
CREATE INDEX IF NOT EXISTS idx_file_embeddings_file_id ON file_embeddings(file_id);

-- Update existing file_embeddings records with content (this will be a separate process)
-- Content will automatically be populated for new embeddings moving forward 