"use client";
import { useState } from 'react';
import { Quiz, QuizGenerationParams } from '@/app/models/quiz';
import { generateQuizClient, getWorkspaceQuizzesClient, deleteQuizClient } from '@/app/lib-client/quizClient';
import { useAuth } from '@/contexts/AuthContext';

export const useQuizGeneration = (userId: string | null) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
  const [workspaceQuizzes, setWorkspaceQuizzes] = useState<{ [workspaceId: string]: Quiz[] }>({});
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const { accessToken } = useAuth();

  const resetState = () => {
    setIsGenerating(false);
    setError(null);
    setGeneratedQuiz(null);
    setGenerationProgress(0);
  };

  const fetchWorkspaceQuizzes = async (workspaceId: string): Promise<Quiz[]> => {
    setError(null);
    
    try {
      const quizzes = await getWorkspaceQuizzesClient(workspaceId, accessToken!);
      setWorkspaceQuizzes(prev => ({
        ...prev,
        [workspaceId]: quizzes
      }));
      return quizzes;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch quizzes');
      return [];
    }
  };

  const generateQuiz = async (params: Omit<QuizGenerationParams, 'userId'>): Promise<Quiz | null> => {
    if (!userId) {
      setError('User must be authenticated to generate quizzes');
      return null;
    }

    resetState();
    setIsGenerating(true);
    
    // Log the params including locale
    console.log('useQuizGeneration - Generating quiz with params:', {
      ...params,
      locale: params.locale || 'not set'
    });
    
    try {
      // Create a simulated progress bar
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => {
          const newProgress = prev + Math.random() * 10;
          return newProgress < 90 ? newProgress : 90;
        });
      }, 600);
      
      // Add the authorization header via axios instance
      // The accessToken will be added to the request headers automatically
      // if it's present in the AuthContext
      if (!accessToken) {
        throw new Error('No access token available. Please log in again.');
      }
      
      // Pass user ID and ensure axiosInstance uses the auth token for the request
      const quiz = await generateQuizClient({
        ...params,
        userId
      });
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setGeneratedQuiz(quiz);
      
      // Update the workspace quizzes list
      if (params.workspaceId) {
        setWorkspaceQuizzes(prev => ({
          ...prev,
          [params.workspaceId]: [quiz, ...(prev[params.workspaceId] || [])]
        }));
      }
      
      return quiz;
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteQuiz = async (quizId: string, workspaceId: string): Promise<boolean> => {
    setError(null);
    
    try {
      if (!accessToken) {
        throw new Error('No access token available. Please log in again.');
      }
      
      const success = await deleteQuizClient(quizId, accessToken);
      
      if (success) {
        // Update the workspace quizzes list to remove the deleted quiz
        setWorkspaceQuizzes(prev => ({
          ...prev,
          [workspaceId]: (prev[workspaceId] || []).filter(quiz => quiz.id !== quizId)
        }));
      }
      
      return success;
    } catch (err: any) {
      setError(err.message || 'Failed to delete quiz');
      return false;
    }
  };

  return {
    isGenerating,
    error,
    generatedQuiz,
    workspaceQuizzes,
    generationProgress,
    generateQuiz,
    fetchWorkspaceQuizzes,
    deleteQuiz,
    resetState
  };
};