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
import { useTranslations } from 'next-intl';
import { useRTL } from '@/contexts/RTLContext';
import styled from '@emotion/styled';

interface QuizSimulationDialogProps {
  open: boolean;
  onClose: () => void;
  quiz: Quiz | null;
  resetMode?: boolean;
}

const StyledCloseButton = styled(IconButton)<{ isRTL?: boolean }>`
  position: absolute;
  ${props => props.isRTL ? 'left' : 'right'}: 8px;
  top: 8px;
  color: ${props => props.theme.palette.text.secondary};
`;

const StyledDialogTitle = styled(DialogTitle)`
  padding-left: ${props => props.theme.spacing(3)};
  padding-right: ${props => props.theme.spacing(3)};
  padding-top: ${props => props.theme.spacing(2)};
  padding-bottom: ${props => props.theme.spacing(2)};
  
  ${props => props.theme.breakpoints.down('sm')} {
    padding-left: ${props => props.theme.spacing(2)};
    padding-right: ${props => props.theme.spacing(2)};
  }
`;

const TitleContainer = styled(Box)`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing(1)};
`;

const StyledDialogContent = styled(DialogContent)`
  padding-top: ${props => props.theme.spacing(3)};
  padding-left: ${props => props.theme.spacing(3)};
  padding-right: ${props => props.theme.spacing(3)};
  padding-bottom: ${props => props.theme.spacing(3)};
  overflow-y: auto;
  
  ${props => props.theme.breakpoints.down('sm')} {
    padding-left: ${props => props.theme.spacing(2)};
    padding-right: ${props => props.theme.spacing(2)};
  }
`;

const StyledDialog = styled(Dialog)<{ isRTL: boolean }>`
  .MuiDialog-paper {
    direction: ${props => props.isRTL ? 'rtl' : 'ltr'};
  }
`;

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
  const t = useTranslations('QuizDialog');
  const { isRTL } = useRTL();
  
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
      console.log('Resetting quiz state due to resetMode');
      resetQuiz();
      resetSubmission();
      
      // Instead of directly setting state, which could cause conflicts with the hook,
      // only set if needed (and the hook's review mode state will sync via the other effect)
      if (reviewMode) {
        setReviewMode(false);
      }
    }
  }, [open, resetMode, resetQuiz, resetSubmission]);
  
  // Sync review mode between component and hook
  useEffect(() => {
    if (reviewMode !== simulationReviewMode) {
      setReviewMode(simulationReviewMode);
    }
  }, [simulationReviewMode]);
  
  // Update review mode in the hook when changed in component
  useEffect(() => {
    if (simulationReviewMode !== reviewMode) {
      setSimulationReviewMode(reviewMode);
    }
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
      setSnackbarMessage(t('refreshingSession'));
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      
      const refreshed = await refreshSession();
      
      if (refreshed) {
        setSnackbarMessage(t('sessionRefreshed'));
        setSnackbarSeverity('success');
      } else {
        setSnackbarMessage(t('sessionRefreshFailed'));
        setSnackbarSeverity('error');
      }
    } catch (error) {
      setSnackbarMessage(t('sessionRefreshFailed'));
      setSnackbarSeverity('error');
    } finally {
      setSnackbarOpen(true);
    }
  };
  
  // When the user clicks "Finish Quiz", we now use finishAndSubmitQuiz
  const handleFinishQuiz = async () => {
    const success = await finishAndSubmitQuiz();
    if (success) {
      setSnackbarMessage(t('resultsSaved'));
      setSnackbarSeverity('success');
    } else if (isAuthenticated && userId && accessToken) {
      // Only show error if user is authenticated but submission failed
      setSnackbarMessage(t('resultsSaveFailed'));
      setSnackbarSeverity('error');
    }
    setSnackbarOpen(true);
  };
  
  // Show error message if submission fails
  useEffect(() => {
    if (submissionError) {
      setSnackbarMessage(t('submissionError'));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [submissionError, t]);

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
      <StyledDialog
        fullScreen={fullScreen}
        open={open}
        onClose={onClose}
        aria-labelledby="quiz-dialog-title"
        maxWidth="md"
        fullWidth
        isRTL={isRTL}
      >
        <StyledDialogTitle id="quiz-dialog-title">
          <TitleContainer>
            <QuizIcon color="primary" />
            <Typography variant="h6" component="span" fontWeight="medium">
              {quiz.title}
            </Typography>
          </TitleContainer>
          <StyledCloseButton
            aria-label="close"
            onClick={onClose}
            isRTL={isRTL}
          >
            <CloseIcon />
          </StyledCloseButton>
        </StyledDialogTitle>
        
        <Divider />
        
        <StyledDialogContent>
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
              workspaceId={quiz?.workspaceId}
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
        </StyledDialogContent>
      </StyledDialog>
      
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
          sx={{ width: '100%', direction: isRTL ? 'rtl' : 'ltr' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default QuizSimulationDialog; 