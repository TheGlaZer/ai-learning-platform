export interface AIModelResponse {
  content: string;
  modelUsed?: string;
  tokenCount?: number;
  metadata?: Record<string, any>;
}

export interface AIServiceOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
  apiKey?: string;
  language?: string; // Language code ('en', 'he', etc.)
  existingSubjects?: any[];
  organizationId?: string;
  includeFileReferences?: boolean; // Whether to include file references in explanations
  includePastExam?: boolean; // Whether to include past exam reference
  pastExamContent?: string; // Content from past exam file
  countRange?: 'small' | 'medium' | 'large'; // Range of subjects to generate (5-10, 10-15, 15-20)
  specificity?: 'general' | 'specific'; // Whether subjects should be general or specific
}

export interface AIService {
  generateText(prompt: string, options?: AIServiceOptions): Promise<AIModelResponse>;
  generateQuiz(
    fileContent: string, 
    topic: string, 
    numberOfQuestions: number, 
    difficultyLevel: string, 
    options?: AIServiceOptions,
    userComments?: string,
    selectedSubjectNames?: string[],
    previousQuestions?: string[]
  ): Promise<AIModelResponse>;
  generateSubjects(fileContent: string, options?: AIServiceOptions): Promise<AIModelResponse>;
}