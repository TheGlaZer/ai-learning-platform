"use client";
import React from 'react';
import { Box, Button, useTheme, useMediaQuery } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CheckIcon from '@mui/icons-material/Check';

interface QuizNavigationProps {
  currentQuestion: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  onFinish: () => void;
  canFinish: boolean;
}

const QuizNavigation: React.FC<QuizNavigationProps> = ({
  currentQuestion,
  totalQuestions,
  onPrevious,
  onNext,
  onFinish,
  canFinish
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const isFirstQuestion = currentQuestion === 1;
  const isLastQuestion = currentQuestion === totalQuestions;
  
  return (
    <Box 
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        mt: 4,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 2 : 0
      }}
    >
      <Button
        variant="outlined"
        color="primary"
        onClick={onPrevious}
        disabled={isFirstQuestion}
        startIcon={<NavigateBeforeIcon />}
        sx={{ minWidth: '120px' }}
        fullWidth={isMobile}
      >
        Previous
      </Button>
      
      <Box sx={{ display: 'flex', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
        {isLastQuestion ? (
          <Button
            variant="contained"
            color="primary"
            onClick={onFinish}
            endIcon={<CheckIcon />}
            disabled={!canFinish}
            sx={{ minWidth: '120px' }}
            fullWidth={isMobile}
          >
            Finish Quiz
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={onNext}
            endIcon={<NavigateNextIcon />}
            sx={{ minWidth: '120px' }}
            fullWidth={isMobile}
          >
            Next
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default QuizNavigation; 