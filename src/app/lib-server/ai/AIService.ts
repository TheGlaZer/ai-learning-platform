export interface AIModelResponse {
  content: string;
  modelUsed: string;
  tokenCount?: number;
  metadata?: Record<string, any>;
}

export interface AIServiceOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
  apiKey?: string;
}

export interface AIService {
  generateText(prompt: string, options?: AIServiceOptions): Promise<AIModelResponse>;
  generateQuiz(fileContent: string, topic: string, numberOfQuestions: number, difficultyLevel: string, options?: AIServiceOptions): Promise<AIModelResponse>;
}