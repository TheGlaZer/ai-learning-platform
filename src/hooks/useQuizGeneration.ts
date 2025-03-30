"use client";
import { useState } from 'react';
import { Quiz, QuizGenerationParams } from '@/app/models/quiz';
import { generateQuizClient, getWorkspaceQuizzesClient } from '@/app/lib-client/quizClient';

export const useQuizGeneration = (userId: string | null) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
  const [workspaceQuizzes, setWorkspaceQuizzes] = useState<{ [workspaceId: string]: Quiz[] }>({});
  const [generationProgress, setGenerationProgress] = useState<number>(0);

  const resetState = () => {
    setIsGenerating(false);
    setError(null);
    setGeneratedQuiz(null);
    setGenerationProgress(0);
  };

  const fetchWorkspaceQuizzes = async (workspaceId: string): Promise<Quiz[]> => {
    setError(null);
    
    try {
      const quizzes = await getWorkspaceQuizzesClient(workspaceId);
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
    
    try {
      // Create a simulated progress bar
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => {
          const newProgress = prev + Math.random() * 10;
          return newProgress < 90 ? newProgress : 90;
        });
      }, 600);
      
      // Generate the quiz
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

  return {
    isGenerating,
    error,
    generatedQuiz,
    workspaceQuizzes,
    generationProgress,
    generateQuiz,
    fetchWorkspaceQuizzes,
    resetState
  };
};