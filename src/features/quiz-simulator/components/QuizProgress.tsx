"use client";
import React from 'react';
import { Box, LinearProgress, Typography, Chip } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredQuestions: number;
}

const QuizProgress: React.FC<QuizProgressProps> = ({ 
  currentQuestion, 
  totalQuestions,
  answeredQuestions
}) => {
  const progress = (currentQuestion / totalQuestions) * 100;
  const completionProgress = (answeredQuestions / totalQuestions) * 100;
  
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 1,
        flexWrap: 'wrap',
        gap: 1
      }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={500}>
            Question {currentQuestion} of {totalQuestions}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {answeredQuestions} of {totalQuestions} questions answered ({Math.round(completionProgress)}%)
          </Typography>
        </Box>
        
        <Chip 
          icon={<AccessTimeIcon fontSize="small" />} 
          label="No time limit" 
          size="small"
          variant="outlined"
          color="primary"
        />
      </Box>
      
      <LinearProgress 
        variant="determinate" 
        value={progress} 
        sx={{ 
          height: 8, 
          borderRadius: 4,
          mt: 2,
          mb: 1,
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