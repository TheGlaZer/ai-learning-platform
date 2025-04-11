"use client";
import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
}

const QuizProgress: React.FC<QuizProgressProps> = ({ 
  currentQuestion, 
  totalQuestions 
}) => {
  const progress = (currentQuestion / totalQuestions) * 100;
  
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Question {currentQuestion} of {totalQuestions}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {Math.round(progress)}% Complete
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={progress} 
        sx={{ 
          height: 8, 
          borderRadius: 4,
          mb: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
          }
        }} 
      />
    </Box>
  );
};

export default QuizProgress;