"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkspaceQuizzesClient, deleteQuizClient } from '@/app/lib-client/quizClient';
import { Quiz } from '@/app/models/quiz';
import { useAuth } from '@/contexts/AuthContext';
import axiosInstance from '@/app/lib/axios';

export const useWorkspaceQuizzes = (workspaceId: string) => {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  
  // Define a unique query key for this workspace's quizzes
  const quizzesQueryKey = ['quizzes', workspaceId];
  
  // Create a query for fetching quizzes
  const {
    data: quizzes = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: quizzesQueryKey,
    queryFn: async () => {
      // Configure axios with auth token for this request
      if (accessToken) {
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      }
      return getWorkspaceQuizzesClient(workspaceId);
    },
    enabled: !!workspaceId && !!accessToken,
    // Don't refetch on window focus to reduce API calls
    refetchOnWindowFocus: false,
    // Keep cached data for 5 minutes
    staleTime: 1000 * 60 * 5,
  });
  
  // Create a mutation for deleting quizzes
  const deleteMutation = useMutation({
    mutationFn: (quizId: string) => deleteQuizClient(quizId, accessToken!),
    onSuccess: () => {
      // Invalidate the quizzes query to refetch data after delete
      queryClient.invalidateQueries({ queryKey: quizzesQueryKey });
    },
  });
  
  // Helper function to delete a quiz
  const deleteQuiz = async (quizId: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(quizId);
      return true;
    } catch (error) {
      return false;
    }
  };
  
  return {
    quizzes,
    isLoading,
    isError,
    error,
    refetch,
    deleteQuiz,
    isDeleting: deleteMutation.isPending
  };
}; 