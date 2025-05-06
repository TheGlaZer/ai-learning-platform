import { Quiz, QuizGenerationParams } from '@/app/models/quiz';

/**
 * Generates a quiz using the traditional approach (whole file content)
 * @param params Quiz generation parameters
 * @returns Promise resolving to the generated quiz
 */
export async function generateQuiz(params: Omit<QuizGenerationParams, 'userId'>): Promise<Quiz> {
  try {
    const response = await fetch('/api/quiz/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate quiz');
    }

    const data = await response.json();
    return data.quiz;
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    throw error;
  }
}

/**
 * Generates a quiz using the embedding-based approach (semantic search)
 * This method leverages vector embeddings to find the most relevant content
 * @param params Quiz generation parameters
 * @returns Promise resolving to the generated quiz
 */
export async function generateQuizWithEmbeddings(params: Omit<QuizGenerationParams, 'userId'>): Promise<Quiz> {
  try {
    const response = await fetch('/api/quiz/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate quiz with embeddings');
    }

    const data = await response.json();
    return data.quiz;
  } catch (error: any) {
    console.error('Error generating quiz with embeddings:', error);
    throw error;
  }
} 