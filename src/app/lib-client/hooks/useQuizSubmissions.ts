import { useState, useEffect } from 'react';
import { QuizSubmission } from '@/app/models/quizAnswer';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

interface UseQuizSubmissionReturn {
  submission: QuizSubmission | null;
  loading: boolean;
  error: Error | null;
  resetSubmission: () => void;
}

export function useQuizSubmission(
  quizId?: string,
  userId?: string | null,
  workspaceId?: string
): UseQuizSubmissionReturn {
  const [submission, setSubmission] = useState<QuizSubmission | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { accessToken } = useAuth();

  const fetchQuizSubmission = async () => {
    if (!quizId || !userId || !workspaceId || !accessToken) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/api/quiz-submissions', {
        params: {
          quizId,
          userId,
          workspaceId
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = response.data;
      setSubmission(data);
    } catch (err: any) {
      let errorMessage = 'Failed to fetch quiz submission';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const resetSubmission = () => {
    setSubmission(null);
  };

  useEffect(() => {
    fetchQuizSubmission();
  }, [quizId, userId, workspaceId, accessToken]);

  return {
    submission,
    loading,
    error,
    resetSubmission
  };
} 