export interface PerformanceAnalytics {
  userId: string;
  workspaceId: string;
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  completionRate: number;
  timeSpent: number; // in minutes
  lastUpdated: string;
  quizBreakdown: {
    quizId: string;
    title: string;
    score: number;
    completionTime: number;
    dateCompleted: string;
  }[];
  skillGaps: {
    skill: string;
    proficiency: number;
    recommendedResources: string[];
  }[];
} 