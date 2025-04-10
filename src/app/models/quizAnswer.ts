export interface QuestionAnswer {
  questionId: string; // UUID format
  selectedOptionId: string;
  isCorrect: boolean;
  subjectIds?: string[]; // Optional array of subject IDs (UUID format) this question relates to
}

export interface QuizSubmission {
  id?: string; // UUID format
  quizId: string; // UUID format
  userId: string; // UUID format
  workspaceId: string; // UUID format
  answers: QuestionAnswer[];
  score: number; // Total correct answers / total questions
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubjectPerformance {
  id?: string; // UUID format
  subjectId: string; // UUID format
  userId: string; // UUID format
  workspaceId: string; // UUID format
  correctAnswers: number;
  totalQuestions: number;
  score: number; // Percentage score
  lastUpdated?: string;
}

export interface SubmitQuizAnswersParams {
  quizId: string; // UUID format
  userId: string; // UUID format
  workspaceId: string; // UUID format
  answers: QuestionAnswer[];
  token?: string;
}

export interface UserPerformanceAnalytics {
  overallScore: number;
  totalQuizzes: number;
  subjectPerformance: SubjectPerformance[];
  recentSubmissions: QuizSubmission[];
  weakSubjects: SubjectPerformance[];
  strongSubjects: SubjectPerformance[];
} 