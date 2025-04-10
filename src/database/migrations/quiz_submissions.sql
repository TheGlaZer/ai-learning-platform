-- Create quiz_submissions table
CREATE TABLE IF NOT EXISTS public.quiz_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  answers JSONB NOT NULL,
  score DECIMAL NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_quiz_id ON public.quiz_submissions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_user_id ON public.quiz_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_workspace_id ON public.quiz_submissions(workspace_id);

-- Enable Row Level Security
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to protect the data
CREATE POLICY quiz_submissions_select_policy ON public.quiz_submissions
  FOR SELECT USING (auth.uid()::UUID = user_id);

CREATE POLICY quiz_submissions_insert_policy ON public.quiz_submissions
  FOR INSERT WITH CHECK (auth.uid()::UUID = user_id);

CREATE POLICY quiz_submissions_update_policy ON public.quiz_submissions
  FOR UPDATE USING (auth.uid()::UUID = user_id);

CREATE POLICY quiz_submissions_delete_policy ON public.quiz_submissions
  FOR DELETE USING (auth.uid()::UUID = user_id);

-- Create subject_performance table
CREATE TABLE IF NOT EXISTS public.subject_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  score DECIMAL NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subject_performance_subject_id ON public.subject_performance(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_performance_user_id ON public.subject_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_subject_performance_workspace_id ON public.subject_performance(workspace_id);

-- Enable Row Level Security
ALTER TABLE public.subject_performance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to protect the data
CREATE POLICY subject_performance_select_policy ON public.subject_performance
  FOR SELECT USING (auth.uid()::UUID = user_id);

CREATE POLICY subject_performance_insert_policy ON public.subject_performance
  FOR INSERT WITH CHECK (auth.uid()::UUID = user_id);

CREATE POLICY subject_performance_update_policy ON public.subject_performance
  FOR UPDATE USING (auth.uid()::UUID = user_id);

CREATE POLICY subject_performance_delete_policy ON public.subject_performance
  FOR DELETE USING (auth.uid()::UUID = user_id);

-- Create a trigger to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quiz_submissions_timestamp
BEFORE UPDATE ON public.quiz_submissions
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_subject_performance_timestamp
BEFORE UPDATE ON public.subject_performance
FOR EACH ROW EXECUTE FUNCTION update_timestamp(); 