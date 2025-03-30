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
}

export interface Quiz {
  id?: string;
  title: string;
  questions: QuizQuestion[];
  fileId?: string;
  workspaceId?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuizGenerationParams {
  fileId: string;
  topic: string;
  numberOfQuestions: number;
  difficultyLevel: 'easy' | 'medium' | 'hard' | 'expert';
  userId: string;
  workspaceId: string;
  aiProvider?: string;
}