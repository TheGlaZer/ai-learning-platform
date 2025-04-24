-- Add pages and fileName columns to flashcards table
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS pages TEXT[];
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Create an index on the file_name column for faster querying
CREATE INDEX IF NOT EXISTS idx_flashcards_file_name ON flashcards(file_name);

COMMENT ON COLUMN flashcards.pages IS 'List of page numbers where the flashcard content appears';
COMMENT ON COLUMN flashcards.file_name IS 'Original file name the flashcard was created from'; 