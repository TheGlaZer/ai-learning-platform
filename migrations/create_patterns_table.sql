-- Create patterns table
CREATE TABLE IF NOT EXISTS patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  past_exam_id UUID NOT NULL REFERENCES past_exams(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_data JSONB NOT NULL DEFAULT '{}',
  confidence_score DECIMAL NOT NULL DEFAULT 0.7,
  usage_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patterns_past_exam_id ON patterns(past_exam_id);
CREATE INDEX IF NOT EXISTS idx_patterns_workspace_id ON patterns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_patterns_user_id ON patterns(user_id);

-- Set up row level security policies
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select their own patterns
CREATE POLICY select_own_patterns ON patterns
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Simplified policy: Only allow selection of patterns in workspaces the user owns
-- Removed reference to workspace_users
CREATE POLICY select_workspace_patterns ON patterns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = patterns.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  );

-- Create policy to allow users to insert their own patterns
CREATE POLICY insert_own_patterns ON patterns
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Create policy to allow users to update their own patterns
CREATE POLICY update_own_patterns ON patterns
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- Create policy to allow users to delete their own patterns
CREATE POLICY delete_own_patterns ON patterns
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- Create function to increment pattern usage count
CREATE OR REPLACE FUNCTION increment_pattern_usage(pattern_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE patterns
  SET usage_count = usage_count + 1
  WHERE id = pattern_id;
END;
$$ LANGUAGE plpgsql; 