"use client";
import React from 'react';
import { Box, Button, useTheme, useMediaQuery } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CheckIcon from '@mui/icons-material/Check';
import styled from '@emotion/styled';
import { useTranslations, useLocale } from 'next-intl';

interface QuizNavigationProps {
  currentQuestion: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  onFinish: () => void;
  canFinish: boolean;
}

const NavigationContainer = styled(Box)<{ isMobile: boolean }>`
  display: flex;
  justify-content: space-between;
  margin-top: ${props => props.theme.spacing(4)};
  flex-direction: ${props => props.isMobile ? 'column' : 'row'};
  gap: ${props => props.isMobile ? props.theme.spacing(2) : 0};
`;

const ButtonContainer = styled(Box)<{ isMobile: boolean }>`
  display: flex;
  gap: ${props => props.theme.spacing(2)};
  flex-direction: ${props => props.isMobile ? 'column' : 'row'};
`;

const NavigationButton = styled(Button)<{ isMobile: boolean; isRtl?: boolean }>`
  min-width: 120px;
  width: ${props => props.isMobile ? '100%' : 'auto'};
`;

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
  const locale = useLocale();
  const isRtl = locale === 'he';
  const t = useTranslations('QuizDialog');
  
  const isFirstQuestion = currentQuestion === 1;
  const isLastQuestion = currentQuestion === totalQuestions;
  
  // Use the appropriate icon based on direction
  const PreviousIcon = isRtl ? NavigateNextIcon : NavigateBeforeIcon;
  const NextIcon = isRtl ? NavigateBeforeIcon : NavigateNextIcon;
  
  return (
    <NavigationContainer isMobile={isMobile}>
      <NavigationButton
        variant="outlined"
        color="primary"
        onClick={onPrevious}
        disabled={isFirstQuestion}
        startIcon={<PreviousIcon />}
        isMobile={isMobile}
        isRtl={isRtl}
      >
        {t('previous')}
      </NavigationButton>
      
      <ButtonContainer isMobile={isMobile}>
        {isLastQuestion ? (
          <NavigationButton
            variant="contained"
            color="primary"
            onClick={onFinish}
            endIcon={<CheckIcon />}
            disabled={!canFinish}
            isMobile={isMobile}
            isRtl={isRtl}
          >
            {t('finish')}
          </NavigationButton>
        ) : (
          <NavigationButton
            variant="contained"
            color="primary"
            onClick={onNext}
            endIcon={<NextIcon />}
            isMobile={isMobile}
            isRtl={isRtl}
          >
            {t('next')}
          </NavigationButton>
        )}
      </ButtonContainer>
    </NavigationContainer>
  );
};

export default QuizNavigation; 