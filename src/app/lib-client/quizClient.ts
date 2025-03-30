import axiosInstance from './axiosInstance';
import { Quiz, QuizGenerationParams } from '@/app/models/quiz';

/**
 * Generates a quiz using the AI service
 * @param params Quiz generation parameters
 * @returns The generated quiz
 */
export async function generateQuizClient(params: QuizGenerationParams): Promise<Quiz> {
  const response = await axiosInstance.post('/api/quizzes', params);
  return response.data;
}

/**
 * Gets quizzes for a specific workspace
 * @param workspaceId The workspace ID
 * @returns A list of quizzes
 */
export async function getWorkspaceQuizzesClient(workspaceId: string): Promise<Quiz[]> {
  const response = await axiosInstance.get(`/api/quizzes?workspaceId=${workspaceId}`);
  return response.data;
}

/**
 * Gets a quiz by its ID
 * @param quizId The quiz ID
 * @returns The quiz data
 */
export async function getQuizByIdClient(quizId: string): Promise<Quiz> {
  const response = await axiosInstance.get(`/api/quizzes?quizId=${quizId}`);
  return response.data;
}