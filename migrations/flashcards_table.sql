-- Create flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'dont_know',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_flashcards_workspace_id ON flashcards(workspace_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_status ON flashcards(status);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_flashcard_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_flashcard_updated_at ON flashcards;
CREATE TRIGGER trigger_update_flashcard_updated_at
BEFORE UPDATE ON flashcards
FOR EACH ROW
EXECUTE FUNCTION update_flashcard_updated_at();

-- Set row level security
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY flashcards_user_policy ON flashcards
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow read access to a user's own flashcards and flashcards in workspaces they belong to
CREATE POLICY flashcards_workspace_select_policy ON flashcards
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users 
      WHERE user_id = auth.uid()
    )
  );

-- Allow all operations for service role
CREATE POLICY flashcards_service_policy ON flashcards
  FOR ALL
  TO service_role
  USING (true); 

  -- Add an explicit insert policy
CREATE POLICY flashcards_insert_policy ON flashcards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);