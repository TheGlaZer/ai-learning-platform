import { useState } from 'react';
import { QuestionAnswer, QuizSubmission } from '@/app/models/quizAnswer';
import axiosInstance from '@/app/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

interface SubmitAnswersOptions {
  onSuccess?: (data: QuizSubmission) => void;
  onError?: (error: Error) => void;
}

export function useQuizAnswers() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [submission, setSubmission] = useState<QuizSubmission | null>(null);
  const { accessToken, userId } = useAuth();

  const submitAnswers = async (
    quizId: string,
    workspaceId: string,
    answers: QuestionAnswer[],
    options?: SubmitAnswersOptions
  ) => {
    if (!userId || !accessToken) {
      throw new Error('User must be authenticated to submit answers');
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      console.log('Submitting quiz answers with userId:', userId);

      const response = await axiosInstance.post('/api/quiz-answers', {
        quizId,
        userId,
        workspaceId,
        answers
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const result = response.data as QuizSubmission;
      setSubmission(result);
      
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (err: any) {
      let errorMessage = 'Failed to submit quiz answers';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      if (err.response?.status === 401) {
        errorMessage = 'Authentication error: Please log in again to submit your answers';
      }
      
      const error = new Error(errorMessage);
      setError(error);
      
      if (options?.onError) {
        options.onError(error);
      }
      
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitAnswers,
    isSubmitting,
    error,
    submission
  };
} 