-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  source TEXT DEFAULT 'manual',
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subjects_workspace_id ON subjects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);

-- Set up row level security policies
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Policy for selecting subjects: users can view their own subjects
CREATE POLICY select_subjects ON subjects
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for inserting subjects: users can insert their own subjects
CREATE POLICY insert_subjects ON subjects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for updating subjects: users can update their own subjects
CREATE POLICY update_subjects ON subjects
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy for deleting subjects: users can delete their own subjects
CREATE POLICY delete_subjects ON subjects
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_subjects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subjects_updated_at
BEFORE UPDATE ON subjects
FOR EACH ROW
EXECUTE FUNCTION update_subjects_updated_at(); 