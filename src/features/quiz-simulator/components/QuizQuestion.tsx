"use client";
import React from 'react';
import { 
  Typography, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  Paper,
  Chip,
  Fade,
  Box
} from '@mui/material';
import { QuizQuestion as QuizQuestionType } from '@/app/models/quiz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import styled from '@emotion/styled';

interface QuizQuestionProps {
  question: QuizQuestionType;
  selectedOptionId: string;
  onSelectOption: (optionId: string) => void;
  showResult?: boolean;
}

const QuestionContainer = styled(Box)`
  margin-bottom: 2rem;
`;

const QuestionPaper = styled(Paper)`
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid;
  border-color: ${props => props.theme.palette.divider};
  margin-bottom: 1.5rem;
`;

const OptionPaper = styled(Paper)<{ isSelected: boolean; isCorrect?: boolean; isCorrectOption?: boolean; showResult: boolean }>`
  margin-top: 0.75rem;
  border-radius: 0.25rem;
  border-color: ${props => 
    props.showResult 
      ? (props.isCorrectOption ? props.theme.palette.success.main : 
         (props.isSelected ? props.theme.palette.error.main : props.theme.palette.divider))
      : (props.isSelected ? props.theme.palette.primary.main : props.theme.palette.divider)
  };
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
`;

const StyledFormControlLabel = styled(FormControlLabel)`
  display: flex;
  padding: 0.5rem 0 0.5rem 0.5rem;
  padding-right: 1rem;
  width: 100%;
  border-radius: 0.25rem;
  margin: 0;
`;

const ResultIndicator = styled(Box)`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
`;

const ResultPaper = styled(Paper)<{ isCorrect: boolean }>`
  padding: 1rem;
  border-radius: 0.5rem;
  border-left: 4px solid;
  border-left-color: ${props => 
    props.isCorrect ? props.theme.palette.success.main : props.theme.palette.error.main
  };
`;

const ChipContainer = styled(Box)`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
`;

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
    <QuestionContainer>
      <QuestionPaper elevation={0}>
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
            
            return (
              <OptionPaper
                key={option.id}
                variant="outlined"
                isSelected={isSelected}
                isCorrectOption={isCorrectOption}
                showResult={showResult}
              >
                <StyledFormControlLabel 
                  value={option.id} 
                  control={<Radio color="primary" />} 
                  label={option.text}
                  disabled={showResult}
                />
                
                {showResult && (
                  <ResultIndicator>
                    {isCorrectOption && (
                      <CheckCircleIcon color="success" fontSize="small" />
                    )}
                    {isSelected && !isCorrect && (
                      <CancelIcon color="error" fontSize="small" />
                    )}
                  </ResultIndicator>
                )}
              </OptionPaper>
            );
          })}
        </RadioGroup>
      </QuestionPaper>
      
      {showResult && (
        <Fade in={showResult}>
          <ResultPaper variant="outlined" isCorrect={isCorrect}>
            <ChipContainer>
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
            </ChipContainer>
            <Typography variant="body2">
              {question.explanation.replace(/\s*references?:\s*lines?\s*\d+(?:\s*-\s*\d+)?\.?\s*$/i, '')}
            </Typography>
          </ResultPaper>
        </Fade>
      )}
    </QuestionContainer>
  );
};

export default QuizQuestion; 