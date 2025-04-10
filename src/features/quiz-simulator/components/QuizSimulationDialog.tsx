"use client";
import React, { useState, useEffect, useContext } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  IconButton, 
  Box, 
  Divider,
  Typography,
  useTheme,
  useMediaQuery,
  Alert,
  Snackbar
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import QuizIcon from '@mui/icons-material/Quiz';
import { Quiz } from '@/app/models/quiz';
import QuizProgress from './QuizProgress';
import QuizQuestion from './QuizQuestion';
import QuizNavigation from './QuizNavigation';
import QuizResults from './QuizResults';
import { useQuizSimulation } from '../hooks/useQuizSimulation';
import { useAuth } from '@/contexts/AuthContext';
import { useQuizSubmission } from '@/app/lib-client/hooks/useQuizSubmissions';

interface QuizSimulationDialogProps {
  open: boolean;
  onClose: () => void;
  quiz: Quiz | null;
  resetMode?: boolean;
}

const QuizSimulationDialog: React.FC<QuizSimulationDialogProps> = ({ 
  open, 
  onClose, 
  quiz,
  resetMode = false
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [reviewMode, setReviewMode] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  
  // Get user auth information and refresh capabilities
  const { userId, isAuthenticated, accessToken, refreshSession } = useAuth();
  
  // Get previous submission if exists
  const { submission: previousSubmission, resetSubmission } = useQuizSubmission(
    quiz?.id,
    userId,
    quiz?.workspaceId
  );
  
  const {
    currentQuestionIndex,
    userAnswers,
    isFinished,
    isSubmitting,
    submissionError,
    submissionSuccess,
    reviewMode: simulationReviewMode,
    loadingSubmission,
    setAnswer,
    goToNextQuestion,
    goToPreviousQuestion,
    finishQuiz,
    resetQuiz,
    calculateResults,
    isQuestionAnswered,
    allQuestionsAnswered,
    submitQuizAnswers,
    handleReviewQuestions: startReviewQuestions,
    setReviewMode: setSimulationReviewMode
  } = useQuizSimulation(quiz, resetMode ? null : previousSubmission);

  // Reset quiz state when resetMode changes
  useEffect(() => {
    if (open && resetMode) {
      resetQuiz();
      resetSubmission();
      setReviewMode(false);
    }
  }, [open, resetMode, resetQuiz, resetSubmission]);
  
  // Sync review mode between component and hook
  useEffect(() => {
    setReviewMode(simulationReviewMode);
  }, [simulationReviewMode]);
  
  // Update review mode in the hook when changed in component
  useEffect(() => {
    setSimulationReviewMode(reviewMode);
  }, [reviewMode, setSimulationReviewMode]);
  
  // Log user authentication state when component mounts or auth changes
  useEffect(() => {
    console.log('QuizSimulationDialog - Auth state:', { 
      userId, 
      isAuthenticated,
      hasUserId: !!userId,
      hasToken: !!accessToken
    });
  }, [userId, isAuthenticated, accessToken]);
  
  // Handle session refresh
  const handleRefreshSession = async () => {
    try {
      setSnackbarMessage('Refreshing authentication session...');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      
      const refreshed = await refreshSession();
      
      if (refreshed) {
        setSnackbarMessage('Session refreshed successfully. Try submitting again.');
        setSnackbarSeverity('success');
      } else {
        setSnackbarMessage('Could not refresh session. Please log in again.');
        setSnackbarSeverity('error');
      }
    } catch (error) {
      setSnackbarMessage('Failed to refresh session. Please log in again.');
      setSnackbarSeverity('error');
    } finally {
      setSnackbarOpen(true);
    }
  };
  
  // NEW: Handle manual submission with better validation
  const handleSubmitResults = async () => {
    console.log('handleSubmitResults called with:', {
      quizId: quiz?.id,
      userId,
      isAuthenticated,
      hasToken: !!accessToken,
      workspaceId: quiz?.workspaceId,
      hasUserAnswers: Object.keys(userAnswers).length > 0
    });

    if (!quiz) {
      setSnackbarMessage('Cannot submit results: Quiz data is missing');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    if (!isAuthenticated || !userId || !accessToken) {
      setSnackbarMessage('Cannot submit results: Authentication required');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      
      // Offer to refresh the session
      setTimeout(() => {
        if (window.confirm('Your session may have expired. Would you like to refresh it?')) {
          handleRefreshSession();
        }
      }, 500);
      
      return;
    }
    
    if (submissionSuccess || isSubmitting) {
      return; // Already submitted or in progress
    }
    
    try {
      console.log('Submitting quiz results with userId:', userId);
      await submitQuizAnswers(userId);
      setSnackbarMessage('Quiz results saved successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      
      // Check if it's an auth error
      const isAuthError = errorMessage.toLowerCase().includes('auth') || 
                          errorMessage.toLowerCase().includes('log in');
      
      setSnackbarMessage(`Failed to save results: ${errorMessage}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      
      // For auth errors, offer to refresh the session
      if (isAuthError) {
        setTimeout(() => {
          if (window.confirm('Authentication error detected. Would you like to refresh your session?')) {
            handleRefreshSession();
          }
        }, 500);
      }
    }
  };
  
  // Show error message if submission fails
  useEffect(() => {
    if (submissionError) {
      setSnackbarMessage('Failed to save quiz results. Your answers will not be tracked.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [submissionError]);

  if (!quiz) return null;
  
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const answeredQuestionsCount = Object.keys(userAnswers).length;
  const results = calculateResults();
  
  // Use the hook's review function
  const handleReviewQuestions = () => {
    startReviewQuestions();
  };
  
  // When retrying, reset both the quiz and review mode
  const handleRetry = () => {
    resetQuiz();
    setReviewMode(false);
  };
  
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <Dialog
        fullScreen={fullScreen}
        open={open}
        onClose={onClose}
        aria-labelledby="quiz-dialog-title"
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: 'background.default'
          }
        }}
      >
        <DialogTitle id="quiz-dialog-title" sx={{ px: { xs: 2, sm: 3 }, pt: 2, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QuizIcon color="primary" />
            <Typography variant="h6" component="span" fontWeight="medium">
              {quiz.title}
            </Typography>
          </Box>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'text.secondary'
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <Divider />
        
        <DialogContent sx={{ 
          pt: 3, 
          px: { xs: 2, sm: 3 }, 
          pb: 3,
          overflowY: 'auto'
        }}>
          {isFinished && !reviewMode ? (
            <QuizResults 
              quiz={quiz} 
              userAnswers={userAnswers} 
              results={results}
              onRetry={handleRetry}
              onClose={onClose}
              onReviewQuestions={handleReviewQuestions}
              onSubmitResults={handleSubmitResults}
              submissionSuccess={submissionSuccess}
              isSubmitting={isSubmitting}
            />
          ) : (
            <>
              <QuizProgress 
                currentQuestion={currentQuestionIndex + 1} 
                totalQuestions={quiz.questions.length}
                answeredQuestions={answeredQuestionsCount}
              />
              
              <QuizQuestion 
                question={currentQuestion}
                selectedOptionId={userAnswers[currentQuestion.id]?.optionId || ""}
                onSelectOption={(optionId) => setAnswer(currentQuestionIndex, optionId)}
                showResult={reviewMode || isFinished}
              />
              
              {!reviewMode ? (
                <QuizNavigation 
                  currentQuestion={currentQuestionIndex + 1}
                  totalQuestions={quiz.questions.length}
                  onPrevious={goToPreviousQuestion}
                  onNext={goToNextQuestion}
                  onFinish={finishQuiz}
                  canFinish={allQuestionsAnswered}
                />
              ) : (
                <QuizNavigation 
                  currentQuestion={currentQuestionIndex + 1}
                  totalQuestions={quiz.questions.length}
                  onPrevious={goToPreviousQuestion}
                  onNext={goToNextQuestion}
                  onFinish={() => setReviewMode(false)}
                  canFinish={true}
                />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default QuizSimulationDialog; 