export interface Pattern {
  id: string;
  name: string;
  past_exam_id: string;
  workspace_id: string;
  user_id: string;
  pattern_data: PatternData;
  confidence_score: number;
  usage_count: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatternData {
  // Question format distribution (normalized to percentages)
  question_formats: {
    multiple_choice: number; // Percentage
    short_answer: number;
    calculation: number;
    essay: number;
    other: number;
  };
  
  // Topic distribution with normalized weights
  topic_distribution: Record<string, {
    frequency: number; // Percentage
    importance_score: number; // Calculated based on frequency and points
  }>;
  
  // Exam structure information
  exam_structure: {
    section_breakdown: Record<string, number>; // Section name -> percentage of exam
    difficulty_progression: {
      beginning: string; // 'easy', 'medium', 'hard'
      middle: string;
      end: string;
    };
  };
  
  // Key insights and study focus
  key_insights: {
    high_value_topics: string[]; // Topics with best point/question ratio
    common_keywords: {word: string, importance: number}[];
    recurring_concepts: {concept: string, frequency: number}[];
  };
  
  // Confusion points - areas where students might get confused
  confusion_points: {
    misleading_questions: string[];
    watch_out_for: string[];
    common_mistakes: string[];
  };
  
  // Confidence metrics for the pattern analysis
  confidence_metrics: {
    overall_exam_predictability: number; // 0-1 score
    format_prediction_confidence: number;
  };
} 