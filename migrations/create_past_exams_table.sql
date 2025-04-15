-- Create past_exams table
CREATE TABLE IF NOT EXISTS past_exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  year TEXT,
  semester TEXT,
  course TEXT,
  url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_past_exams_workspace_id ON past_exams(workspace_id);
CREATE INDEX IF NOT EXISTS idx_past_exams_user_id ON past_exams(user_id);

-- Set up row level security policies
ALTER TABLE past_exams ENABLE ROW LEVEL SECURITY;

-- Policy for selecting past_exams: users can view their own past exams
CREATE POLICY select_past_exams ON past_exams
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for inserting past_exams: users can insert their own past exams
CREATE POLICY insert_past_exams ON past_exams
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for updating past_exams: users can update their own past exams
CREATE POLICY update_past_exams ON past_exams
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy for deleting past_exams: users can delete their own past exams
CREATE POLICY delete_past_exams ON past_exams
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_past_exams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER past_exams_updated_at
BEFORE UPDATE ON past_exams
FOR EACH ROW
EXECUTE FUNCTION update_past_exams_updated_at(); 