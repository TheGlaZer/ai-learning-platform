"use client";
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  IconButton, 
  Box, 
  Divider,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import QuizIcon from '@mui/icons-material/Quiz';
import { Quiz } from '@/app/models/quiz';
import QuizProgress from './QuizProgress';
import QuizQuestion from './QuizQuestion';
import QuizNavigation from './QuizNavigation';
import QuizResults from './QuizResults';
import { useQuizSimulation } from './hooks/useQuizSimulation';

interface QuizSimulationDialogProps {
  open: boolean;
  onClose: () => void;
  quiz: Quiz | null;
}

const QuizSimulationDialog: React.FC<QuizSimulationDialogProps> = ({ 
  open, 
  onClose, 
  quiz 
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  
  const {
    currentQuestionIndex,
    userAnswers,
    isFinished,
    setAnswer,
    goToNextQuestion,
    goToPreviousQuestion,
    finishQuiz,
    resetQuiz,
    calculateScore
  } = useQuizSimulation(quiz);

  useEffect(() => {
    if (open) {
      resetQuiz();
    }
  }, [open, resetQuiz]);

  if (!quiz) return null;
  
  const currentQuestion = quiz.questions[currentQuestionIndex];
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="md"
      fullScreen={fullScreen}
      sx={{ 
        '& .MuiDialog-paper': { 
          borderRadius: 2,
          height: fullScreen ? '100%' : 'auto'
        } 
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        py: 2,
        px: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <QuizIcon color="primary" sx={{ mr: 1.5 }} />
          <Typography variant="h6" component="div">
            {quiz.title}
          </Typography>
        </Box>
        <IconButton 
          edge="end" 
          color="inherit" 
          onClick={onClose} 
          aria-label="close"
          sx={{ mt: -1, mr: -1 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ pt: 3, px: { xs: 2, sm: 3 }, pb: 3 }}>
        {!isFinished ? (
          <>
            <QuizProgress 
              currentQuestion={currentQuestionIndex + 1} 
              totalQuestions={quiz.questions.length} 
            />
            
            <QuizQuestion 
              question={currentQuestion}
              selectedOptionId={userAnswers[currentQuestionIndex]?.optionId || ""}
              onSelectOption={(optionId) => setAnswer(currentQuestionIndex, optionId)}
              isFinished={isFinished}
            />
            
            <QuizNavigation 
              currentQuestion={currentQuestionIndex + 1}
              totalQuestions={quiz.questions.length}
              onPrevious={goToPreviousQuestion}
              onNext={goToNextQuestion}
              onFinish={finishQuiz}
              canFinish={Object.keys(userAnswers).length === quiz.questions.length}
            />
          </>
        ) : (
          <QuizResults 
            quiz={quiz} 
            userAnswers={userAnswers} 
            score={calculateScore()}
            onRetry={() => resetQuiz()}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuizSimulationDialog;