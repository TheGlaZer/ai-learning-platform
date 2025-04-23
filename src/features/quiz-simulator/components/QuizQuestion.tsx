"use client";
import React from 'react';
import { 
  Box, 
  Typography, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  Paper,
  Chip,
  Fade
} from '@mui/material';
import { QuizQuestion as QuizQuestionType } from '@/app/models/quiz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface QuizQuestionProps {
  question: QuizQuestionType;
  selectedOptionId: string;
  onSelectOption: (optionId: string) => void;
  showResult?: boolean;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  selectedOptionId,
  onSelectOption,
  showResult = false
}) => {
  const isCorrect = selectedOptionId === question.correctAnswer;
  
  // Extract line references from explanation if they exist
  const extractLineReferences = (explanation: string): string[] | null => {
    // Match patterns like "Reference: Line 1145-1147" or "References: Lines 1145-1147"
    const linePattern = /references?:\s*lines?\s*(\d+(?:\s*-\s*\d+)?)/i;
    const match = explanation.match(linePattern);
    
    if (match && match[1]) {
      return match[1].split('-').map(num => num.trim());
    }
    return null;
  };
  
  const lineReferences = extractLineReferences(question.explanation);
  
  return (
    <Box sx={{ mb: 4 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 2, 
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          mb: 3
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
          {question.question}
        </Typography>
        
        <RadioGroup 
          value={selectedOptionId}
          onChange={(e) => onSelectOption(e.target.value)}
        >
          {question.options.map((option) => {
            const isSelected = option.id === selectedOptionId;
            const isCorrectOption = option.id === question.correctAnswer;
            
            let borderColor = 'divider';
            let bgColor = 'transparent';
            
            if (showResult) {
              if (isCorrectOption) {
                borderColor = 'success.main';
                bgColor = 'success.light';
              } else if (isSelected && !isCorrect) {
                borderColor = 'error.main';
                bgColor = 'error.light';
              }
            }
            
            return (
              <Paper
                key={option.id}
                variant="outlined"
                sx={{ 
                  mt: 1.5, 
                  borderRadius: 1,
                  borderColor: isSelected && !showResult ? 'primary.main' : borderColor,
                  bgcolor: bgColor,
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <FormControlLabel 
                  value={option.id} 
                  control={<Radio color="primary" />} 
                  label={option.text}
                  disabled={showResult}
                  sx={{ 
                    display: 'flex',
                    py: 1,
                    pl: 1,
                    pr: 2,
                    width: '100%',
                    borderRadius: 1,
                    m: 0,
                    '&:hover': {
                      bgcolor: showResult ? 'transparent' : 'action.hover'
                    }
                  }}
                />
                
                {showResult && (
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      right: 16,
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                  >
                    {isCorrectOption && (
                      <CheckCircleIcon color="success" fontSize="small" />
                    )}
                    {isSelected && !isCorrect && (
                      <CancelIcon color="error" fontSize="small" />
                    )}
                  </Box>
                )}
              </Paper>
            );
          })}
        </RadioGroup>
      </Paper>
      
      {showResult && (
        <Fade in={showResult}>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              borderRadius: 2,
              borderLeft: '4px solid',
              borderLeftColor: isCorrect ? 'success.main' : 'error.main',
              bgcolor: isCorrect ? 'success.lighter' : 'error.lighter'
            }}
          >
            <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip 
                label={isCorrect ? 'Correct' : 'Incorrect'} 
                color={isCorrect ? 'success' : 'error'} 
                size="small"
                icon={isCorrect ? <CheckCircleIcon /> : <CancelIcon />}
              />
              {question.pages && question.pages.length > 0 && (
                <Chip
                  label={`Page${question.pages.length > 1 ? 's' : ''}: ${question.pages.join(', ')}`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              )}
              {lineReferences && (
                <Chip
                  label={`Line${lineReferences.length > 1 ? 's' : ''}: ${lineReferences.join('-')}`}
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
              )}
            </Box>
            <Typography variant="body2">
              {question.explanation.replace(/\s*references?:\s*lines?\s*\d+(?:\s*-\s*\d+)?\.?\s*$/i, '')}
            </Typography>
          </Paper>
        </Fade>
      )}
    </Box>
  );
};

export default QuizQuestion; 