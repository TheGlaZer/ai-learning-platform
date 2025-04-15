import { useState, useCallback, useMemo, useEffect } from 'react';
import { Quiz, QuizQuestion } from '@/app/models/quiz';
import { useQuizAnswers } from '@/app/lib-client/hooks/useQuizAnswers';
import { QuestionAnswer, QuizSubmission } from '@/app/models/quizAnswer';
import { useQuizSubmission } from '@/app/lib-client/hooks/useQuizSubmissions';
import { useAuth } from '@/contexts/AuthContext';

export interface UserAnswer {
  questionId: string;
  optionId: string;
}

interface QuizResult {
  correct: number;
  total: number;
  percentage: number;
  answers: Record<string, UserAnswer>;
  questionResults: Record<string, boolean>;
}

export const useQuizSimulation = (quiz: Quiz | null, initialState?: QuizSubmission | null) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, UserAnswer>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<Error | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  
  // Get the quiz submission hook
  const { submitAnswers } = useQuizAnswers();
  const { userId } = useAuth();
  
  // Get previous quiz submission
  const {
    submission: previousSubmission,
    loading: loadingSubmission,
    resetSubmission
  } = useQuizSubmission(
    quiz?.id,
    userId,
    quiz?.workspaceId
  );

  // Initialize from previous submission if available
  useEffect(() => {
    if (initialState) {
      initializeFromSubmission(initialState);
    } else if (previousSubmission && !isFinished && Object.keys(userAnswers).length === 0) {
      initializeFromSubmission(previousSubmission);
    }
  }, [previousSubmission, initialState]);

  // Initialize quiz state from a submission
  const initializeFromSubmission = useCallback((submission: QuizSubmission) => {
    if (!quiz) return;
    
    // Format the answers from the submission to our format
    const formattedAnswers: Record<string, UserAnswer> = {};
    submission.answers.forEach(answer => {
      formattedAnswers[answer.questionId] = {
        questionId: answer.questionId,
        optionId: answer.selectedOptionId
      };
    });
    
    setUserAnswers(formattedAnswers);
    setIsFinished(true);
    setReviewMode(true);
  }, [quiz]);

  const resetQuiz = useCallback(() => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setIsFinished(false);
    setIsSubmitting(false);
    setSubmissionError(null);
    setSubmissionSuccess(false);
    setReviewMode(false);
    
    // Call the reset submission function to clear the cached submission
    resetSubmission();
  }, [resetSubmission]);

  const setAnswer = useCallback((questionIndex: number, optionId: string) => {
    if (!quiz) return;
    
    const question = quiz.questions[questionIndex];
    
    setUserAnswers(prev => ({
      ...prev,
      [question.id]: {
        questionId: question.id,
        optionId
      }
    }));
  }, [quiz]);

  const goToNextQuestion = useCallback(() => {
    if (!quiz) return;
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [quiz, currentQuestionIndex]);

  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  const finishQuiz = useCallback(() => {
    setIsFinished(true);
  }, []);

  const calculateResults = useCallback((): QuizResult => {
    if (!quiz) {
      return { 
        correct: 0, 
        total: 0, 
        percentage: 0, 
        answers: {}, 
        questionResults: {} 
      };
    }

    const questionResults: Record<string, boolean> = {};
    let correctCount = 0;

    quiz.questions.forEach(question => {
      const userAnswer = userAnswers[question.id];
      const isCorrect = userAnswer && userAnswer.optionId === question.correctAnswer;
      
      if (isCorrect) correctCount++;
      
      questionResults[question.id] = !!isCorrect;
    });

    const totalQuestions = quiz.questions.length;
    const percentage = totalQuestions > 0 
      ? Math.round((correctCount / totalQuestions) * 100) 
      : 0;

    return {
      correct: correctCount,
      total: totalQuestions,
      percentage,
      answers: userAnswers,
      questionResults
    };
  }, [quiz, userAnswers]);

  const isQuestionAnswered = useCallback((questionIndex: number) => {
    if (!quiz) return false;
    const question = quiz.questions[questionIndex];
    return !!userAnswers[question.id];
  }, [quiz, userAnswers]);

  const allQuestionsAnswered = useMemo(() => {
    if (!quiz) return false;
    return quiz.questions.every((_, index) => isQuestionAnswered(index));
  }, [quiz, isQuestionAnswered]);

  // Updated function to submit quiz answers to the backend with better validation
  const submitQuizAnswers = useCallback(async (userId: string) => {
    if (!quiz) {
      const error = new Error('Cannot submit answers: Quiz data is missing');
      setSubmissionError(error);
      console.error(error.message);
      return;
    }
    
    if (!quiz.id) {
      const error = new Error('Cannot submit answers: Quiz ID is missing');
      setSubmissionError(error);
      console.error(error.message);
      return;
    }
    
    if (!quiz.workspaceId) {
      const error = new Error('Cannot submit answers: Workspace ID is missing');
      setSubmissionError(error);
      console.error(error.message);
      return;
    }
    
    if (!userId || userId.trim() === '') {
      const error = new Error('Cannot submit answers: User ID is missing');
      setSubmissionError(error);
      console.error(error.message);
      return;
    }
    
    try {
      setIsSubmitting(true);
      setSubmissionError(null);
      
      // Format answers for API
      const results = calculateResults();
      const formattedAnswers: QuestionAnswer[] = Object.values(userAnswers).map(answer => {
        const question = quiz.questions.find(q => q.id === answer.questionId);
        const isCorrect = question?.correctAnswer === answer.optionId;
        
        return {
          questionId: answer.questionId,
          selectedOptionId: answer.optionId,
          isCorrect,
          // Map questions to subjects if the quiz has subject information
          subjectIds: quiz.selectedSubjects
        };
      });
      
      if (formattedAnswers.length === 0) {
        throw new Error('No answers to submit');
      }
      
      console.log('Submitting quiz answers:', {
        quizId: quiz.id,
        userId,
        workspaceId: quiz.workspaceId,
        answersCount: formattedAnswers.length
      });
      
      // Submit to the API
      await submitAnswers(
        quiz.id,
        quiz.workspaceId,
        formattedAnswers
      );
      
      setSubmissionSuccess(true);
    } catch (error: any) {
      setSubmissionError(error);
      console.error('Failed to submit quiz answers:', error);
      throw error; // Re-throw so the calling component can handle it
    } finally {
      setIsSubmitting(false);
    }
  }, [quiz, userAnswers, calculateResults, submitAnswers]);

  const handleReviewQuestions = useCallback(() => {
    setReviewMode(true);
    setCurrentQuestionIndex(0);
  }, []);

  // New function to handle both finishing the quiz and submitting results
  const finishAndSubmitQuiz = useCallback(async () => {
    // First mark the quiz as finished
    setIsFinished(true);
    
    // Then submit the answers if user is authenticated
    if (quiz && userId) {
      try {
        // Call submitQuizAnswers with userId as that's what it expects
        await submitQuizAnswers(userId);
        return true;
      } catch (error) {
        console.error('Error submitting quiz:', error);
        return false;
      }
    }
    return false;
  }, [quiz, userId, submitQuizAnswers, setIsFinished]);

  return {
    currentQuestionIndex,
    userAnswers,
    isFinished,
    isSubmitting,
    submissionError,
    submissionSuccess,
    reviewMode,
    loadingSubmission,
    previousSubmission,
    setAnswer,
    goToNextQuestion,
    goToPreviousQuestion,
    finishQuiz,
    resetQuiz,
    calculateResults,
    isQuestionAnswered,
    allQuestionsAnswered,
    submitQuizAnswers,
    handleReviewQuestions,
    setReviewMode,
    finishAndSubmitQuiz
  };
}; 