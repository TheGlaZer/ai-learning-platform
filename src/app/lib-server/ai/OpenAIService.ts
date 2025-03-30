import { AIService, AIModelResponse, AIServiceOptions } from './AIService';
import OpenAI from 'openai';

export class OpenAIService implements AIService {
  private openai: OpenAI;
  private defaultModel: string = 'gpt-4o';

  constructor(apiKey?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  async generateText(prompt: string, options?: AIServiceOptions): Promise<AIModelResponse> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: options?.model || this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 1000,
      });

      return {
        content: completion.choices[0].message.content || '',
        modelUsed: completion.model,
        tokenCount: completion.usage?.total_tokens,
      };
    } catch (error) {
      console.error('Error generating text with OpenAI:', error);
      throw new Error('Failed to generate text with AI service');
    }
  }

  async generateQuiz(
    fileContent: string, 
    topic: string, 
    numberOfQuestions: number, 
    difficultyLevel: string,
    options?: AIServiceOptions
  ): Promise<AIModelResponse> {
    const prompt = this.createQuizPrompt(fileContent, topic, numberOfQuestions, difficultyLevel);
    return this.generateText(prompt, options);
  }

  private createQuizPrompt(
    fileContent: string, 
    topic: string, 
    numberOfQuestions: number,
    difficultyLevel: string
  ): string {
    return `
Generate a ${difficultyLevel} level quiz with ${numberOfQuestions} questions about ${topic} based on the following content:

${fileContent}

Format the quiz as a JSON object with the following structure:
{
  "title": "Quiz title related to the topic",
  "questions": [
    {
      "id": "1",
      "question": "Question text",
      "options": [
        {"id": "a", "text": "First option"},
        {"id": "b", "text": "Second option"},
        {"id": "c", "text": "Third option"},
        {"id": "d", "text": "Fourth option"}
      ],
      "correctAnswer": "a",
      "explanation": "Explanation of why this is the correct answer"
    }
  ]
}

Make sure all questions are directly related to the content provided. Do not include any explanations or text outside the JSON structure.
`;
  }
}