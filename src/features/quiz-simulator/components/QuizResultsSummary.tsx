"use client";
import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip,
  CircularProgress,
  Stack,
  useTheme,
  Grid
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useRTL } from '@/contexts/RTLContext';
import styled from '@emotion/styled';
import * as colors from '../../../../colors';

interface ScoreDisplayProps {
  score: number;
  size?: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, size = 120 }) => {
  const theme = useTheme();
  
  // Determine color based on score
  let color = theme.palette.error.main; // Below 50%
  if (score >= 80) {
    color = theme.palette.success.main; // 80% and above
  } else if (score >= 50) {
    color = theme.palette.warning.main; // 50-79%
  }
  
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant="determinate"
        value={100}
        size={size}
        thickness={5}
        sx={{ color: theme.palette.grey[200] }}
      />
      <CircularProgress
        variant="determinate"
        value={score}
        size={size}
        thickness={5}
        sx={{ 
          color: color, 
          position: 'absolute',
          left: 0
        }}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="h4"
          component="div"
          color="text.primary"
          fontWeight="bold"
        >
          {score}%
        </Typography>
      </Box>
    </Box>
  );
};

const ResultContainer = styled(Paper)`
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid ${colors.border.light};
  margin-bottom: 1.5rem;
  box-shadow: none;
`;

const QuestionSummaryTitle = styled(Typography)`
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${colors.text.primary};
`;

const QuestionItem = styled(Paper)<{ isRTL?: boolean }>`
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid ${colors.border.light};
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  text-align: ${props => props.isRTL ? 'right' : 'left'};
`;

const PageChip = styled(Chip)`
  font-size: 0.75rem;
  height: 24px;
  background-color: ${colors.background.lighter};
  color: ${colors.text.secondary};
  border: 1px solid ${colors.border.light};
  margin-left: 1rem;
`;

interface QuizResultsSummaryProps {
  score: number;
  correctCount: number;
  totalQuestions: number;
  resultsSaved?: boolean;
  questionPages: number[];
}

const QuizResultsSummary: React.FC<QuizResultsSummaryProps> = ({
  score,
  correctCount,
  totalQuestions,
  resultsSaved = false,
  questionPages
}) => {
  const t = useTranslations('QuizDialog');
  const { isRTL } = useRTL();

  // Generate feedback based on score
  const getFeedback = () => {
    if (score >= 90) return t('feedbackExcellent');
    if (score >= 75) return t('feedbackGreat');
    if (score >= 60) return t('feedbackGood');
    if (score >= 40) return t('feedbackOnTrack');
    return t('feedbackKeepStudying');
  };
  
  return (
    <ResultContainer>
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={4} 
        alignItems="center"
        justifyContent="center"
        sx={{ mb: 4 }}
      >
        <ScoreDisplay score={score} />
        
        <Box sx={{ textAlign: { xs: 'center', sm: isRTL ? 'right' : 'left' } }}>
          <Typography variant="h5" gutterBottom>
            {t('quizComplete')}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {getFeedback()}
          </Typography>
          <Typography variant="body1" fontWeight={500}>
            {t('correctCount', { correct: correctCount, total: totalQuestions })}
          </Typography>
          
          {resultsSaved && (
            <Chip 
              label={t('resultsSaved')} 
              color="success" 
              size="small" 
              variant="outlined"
              sx={{ mt: 1 }} 
            />
          )}
        </Box>
      </Stack>
      
      <QuestionSummaryTitle variant="h6">
        {t('questionSummary')}
      </QuestionSummaryTitle>
      
      <Grid container spacing={2}>
        {questionPages.map((page, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <QuestionItem isRTL={isRTL}>
              <Typography variant="body2">
                {t('questionNumber', { number: index + 1 })}
              </Typography>
              <PageChip 
                label={t('page', { number: page })} 
                size="small" 
              />
            </QuestionItem>
          </Grid>
        ))}
      </Grid>
    </ResultContainer>
  );
};

export default QuizResultsSummary; 