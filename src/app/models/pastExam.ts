export interface PastExam {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  year?: string;
  semester?: 'Fall' | 'Spring' | 'Summer' | 'Winter';
  course?: string;
  url: string;
  metadata?: Record<string, any>;
  created_at: string;
} 