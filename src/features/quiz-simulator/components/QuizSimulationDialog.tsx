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
    setReviewMode: setSimulationReviewMode,
    finishAndSubmitQuiz
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
  
  // When the user clicks "Finish Quiz", we now use finishAndSubmitQuiz
  const handleFinishQuiz = async () => {
    const success = await finishAndSubmitQuiz();
    if (success) {
      setSnackbarMessage('Quiz results saved successfully!');
      setSnackbarSeverity('success');
    } else if (isAuthenticated && userId && accessToken) {
      // Only show error if user is authenticated but submission failed
      setSnackbarMessage('Note: Failed to save quiz results.');
      setSnackbarSeverity('error');
    }
    setSnackbarOpen(true);
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
              submissionSuccess={submissionSuccess}
              isSubmitting={isSubmitting || loadingSubmission}
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
                  onFinish={handleFinishQuiz}
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