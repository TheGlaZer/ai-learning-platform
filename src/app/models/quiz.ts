export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  correctAnswer: string;
  explanation: string;
  relatedSubject?: string; // The specific subject this question tests
  pages?: number[];       // Array of page numbers where the question's content is found
  lines?: { [pageNumber: string]: number[] }; // Map of page numbers to line numbers relative to that page
}

export interface Quiz {
  id?: string;
  title: string; // Will store the user-provided topic name
  questions: QuizQuestion[];
  fileId?: string;
  workspaceId?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  userComments?: string; // User comments about this quiz
  selectedSubjects?: string[]; // IDs of subjects this quiz focuses on
}

export interface QuizGenerationParams {
  fileId: string;
  topic: string;
  numberOfQuestions: number;
  difficultyLevel: 'easy' | 'medium' | 'hard' | 'expert';
  userId: string;
  workspaceId: string;
  aiProvider?: string;
  token?: string; // Authentication token for accessing protected resources
  locale?: string; // User interface locale (e.g., 'en', 'he') for language preference
  userComments?: string; // User comments/instructions for the AI to prioritize during generation
  selectedSubjects?: string[]; // IDs of specific subjects to focus on in the quiz
  includeFileReferences?: boolean; // Whether to include file references (page/line numbers) in the explanations
  previousQuestions?: string[]; // List of previous question texts to avoid repetition
  includePastExam?: boolean; // Whether to include a past exam for reference
  pastExamContent?: string; // Content extracted from the past exam file
  pastExamId?: string; // ID of the selected past exam (alternative to pastExamContent)
}