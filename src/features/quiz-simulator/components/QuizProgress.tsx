"use client";
import React from 'react';
import { Box, LinearProgress, Typography, Chip } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import styled from '@emotion/styled';
import { useTranslations, useLocale } from 'next-intl';

interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredQuestions: number;
}

const ProgressContainer = styled(Box)`
  margin-bottom: ${props => props.theme.spacing(4)};
`;

const ProgressHeader = styled(Box)<{ isRtl: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing(1)};
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing(1)};
`;

const QuestionInfo = styled(Box)`
`;

const StyledLinearProgress = styled(LinearProgress)`
  height: 8px;
  border-radius: 4px;
  margin-top: ${props => props.theme.spacing(2)};
  margin-bottom: ${props => props.theme.spacing(1)};
  background-color: rgba(0, 0, 0, 0.05);
  
  & .MuiLinearProgress-bar {
    border-radius: 4px;
  }
`;

const QuizProgress: React.FC<QuizProgressProps> = ({ 
  currentQuestion, 
  totalQuestions,
  answeredQuestions
}) => {
  const progress = (currentQuestion / totalQuestions) * 100;
  const completionProgress = (answeredQuestions / totalQuestions) * 100;
  const locale = useLocale();
  const isRtl = locale === 'he';
  const t = useTranslations('QuizDialog');
  
  return (
    <ProgressContainer>
      <ProgressHeader isRtl={isRtl}>
        <QuestionInfo>
          <Typography variant="subtitle1" fontWeight={500}>
            {t('question', { current: currentQuestion, total: totalQuestions })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('answeredOf', { answered: answeredQuestions, total: totalQuestions, percentage: Math.round(completionProgress) })}
          </Typography>
        </QuestionInfo>
        
        <Chip 
          icon={<AccessTimeIcon fontSize="small" />} 
          label={t('noTimeLimit')} 
          size="small"
          variant="outlined"
          color="primary"
          dir={isRtl ? 'rtl' : 'ltr'}
        />
      </ProgressHeader>
      
      <StyledLinearProgress 
        variant="determinate" 
        value={progress}
      />
    </ProgressContainer>
  );
};

export default QuizProgress; 