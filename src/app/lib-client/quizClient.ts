import axiosInstance from '../lib/axios';
import { Quiz, QuizGenerationParams } from '@/app/models/quiz';
import { AxiosError } from 'axios';

/**
 * Generates a quiz using the AI service
 * @param params Quiz generation parameters
 * @returns The generated quiz
 */
export async function generateQuizClient(params: QuizGenerationParams): Promise<Quiz> {
  try {
    console.log('quizClient - Sending quiz generation request with params:', {
      ...params,
      locale: params.locale || 'not provided'
    });
    
    const response = await axiosInstance.post('/api/quizzes-v2', params);
    return response.data;
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw error;
  }
}

/**
 * Gets quizzes for a specific workspace
 * @param workspaceId The workspace ID
 * @returns A list of quizzes
 */
export async function getWorkspaceQuizzesClient(workspaceId: string): Promise<Quiz[]> {
  console.log('Making request to fetch quizzes for workspace:', workspaceId);
  try {
    const response = await axiosInstance.get(`/api/quizzes-v2?workspaceId=${workspaceId}`);
    console.log('Received response from quizzes-v2:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    throw error;
  }
}

/**
 * Gets a quiz by its ID
 * @param quizId The quiz ID
 * @returns The quiz data
 */
export async function getQuizByIdClient(quizId: string): Promise<Quiz> {
  try {
    const response = await axiosInstance.get(`/api/quizzes-v2?quizId=${quizId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching quiz:', error);
    throw error;
  }
}

/**
 * Deletes a quiz by its ID
 * @param quizId The ID of the quiz to delete
 * @param token Authentication token
 * @returns A success indicator
 */
export async function deleteQuizClient(quizId: string, token: string): Promise<boolean> {
  try {
    const response = await axiosInstance.delete(`/api/quizzes/${quizId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.data.success;
  } catch (error) {
    console.error('Error deleting quiz:', error);
    throw error;
  }
}

/**
 * Exports a quiz to a Word document
 * @param quizId The ID of the quiz to export
 * @param token Authentication token
 * @returns A Blob containing the Word document
 */
export async function exportQuizClient(quizId: string, token: string): Promise<Blob> {
  try {
    console.log('Exporting quiz:', quizId);
    const response = await axiosInstance.get(`/api/quizzes/export?id=${quizId}`, {
      responseType: 'blob',
      maxRedirects: 0,
      headers: {
        'Authorization': `Bearer ${token}`
      },
      validateStatus: function (status) {
        return status >= 200 && status < 300;
      }
    });

    if (!(response.data instanceof Blob)) {
      throw new Error('Response is not a blob');
    }

    return response.data;
  } catch (error) {
    console.error('Error exporting quiz:', error);
    
    if (error instanceof AxiosError && error.response) {
      const errorText = await error.response.data.text();
      console.error('Error response:', errorText);
      throw new Error(errorText || 'Failed to export quiz');
    }
    
    throw error instanceof Error ? error : new Error('Failed to export quiz');
  }
}