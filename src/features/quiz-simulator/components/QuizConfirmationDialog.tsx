"use client";
import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Button,
  Typography,
  Box,
  Paper
} from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import { Quiz } from '@/app/models/quiz';
import { useTranslations } from 'next-intl';
import { useRTL } from '@/contexts/RTLContext';
import styled from '@emotion/styled';

interface QuizConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onStartQuiz: () => void;
  quiz: Quiz | null;
}

const StyledDialog = styled(Dialog)<{ isRTL: boolean }>`
  .MuiDialog-paper {
    border-radius: ${props => props.theme.shape.borderRadius * 2}px;
    overflow: hidden;
    direction: ${props => props.isRTL ? 'rtl' : 'ltr'};
  }
`;

const StyledDialogTitle = styled(DialogTitle)`
  background-color: ${props => props.theme.palette.primary.main};
  color: ${props => props.theme.palette.primary.contrastText};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing(1)};
`;

const StyledDialogContent = styled(DialogContent)`
  padding-top: ${props => props.theme.spacing(3)};
  padding-bottom: ${props => props.theme.spacing(2)};
`;

const ContentContainer = styled(Box)`
  margin-bottom: ${props => props.theme.spacing(3)};
`;

const InfoPaper = styled(Paper)`
  padding: ${props => props.theme.spacing(2)};
  margin-bottom: ${props => props.theme.spacing(2)};
  background-color: ${props => props.theme.palette.background.default};
`;

const StyledList = styled('ul')<{ isRTL: boolean }>`
  padding-left: ${props => props.isRTL ? 0 : props.theme.spacing(2)}px;
  padding-right: ${props => props.isRTL ? props.theme.spacing(2) : 0}px;
  margin: 0;
  list-style-position: inside;
`;

const StyledDialogActions = styled(DialogActions)`
  padding-left: ${props => props.theme.spacing(3)};
  padding-right: ${props => props.theme.spacing(3)};
  padding-bottom: ${props => props.theme.spacing(3)};
`;

const StartButton = styled(Button)<{ isRTL: boolean }>`
  margin-left: ${props => props.isRTL ? 0 : props.theme.spacing(1)}px;
  margin-right: ${props => props.isRTL ? props.theme.spacing(1) : 0}px;
`;

const QuizConfirmationDialog: React.FC<QuizConfirmationDialogProps> = ({
  open,
  onClose,
  onStartQuiz,
  quiz
}) => {
  const t = useTranslations('QuizDialog');
  const commonT = useTranslations('Common');
  const { isRTL } = useRTL();
  
  if (!quiz) return null;

  return (
    <StyledDialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      isRTL={isRTL}
    >
      <StyledDialogTitle>
        <QuizIcon />
        <Typography variant="h6">{t('confirmationTitle')}</Typography>
      </StyledDialogTitle>
      
      <StyledDialogContent>
        <ContentContainer>
          <Typography variant="h5" gutterBottom>
            {quiz.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('confirmationMessage')}
          </Typography>
        </ContentContainer>
        
        <InfoPaper variant="outlined">
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>{commonT('question')} {t('details')}:</strong>
          </Typography>
          
          <StyledList isRTL={isRTL}>
            <Box component="li">
              <Typography variant="body2">
                {quiz.questions.length} {t('questions')}
              </Typography>
            </Box>
            <Box component="li">
              <Typography variant="body2">
                {t('navigationInfo')}
              </Typography>
            </Box>
            <Box component="li">
              <Typography variant="body2">
                {t('feedbackInfo')}
              </Typography>
            </Box>
          </StyledList>
        </InfoPaper>
      </StyledDialogContent>
      
      <StyledDialogActions>
        <Button 
          onClick={onClose} 
          startIcon={isRTL ? null : <CloseIcon />}
          endIcon={isRTL ? <CloseIcon /> : null}
          color="inherit"
        >
          {commonT('cancel')}
        </Button>
        <StartButton 
          onClick={onStartQuiz} 
          variant="contained" 
          color="primary"
          startIcon={isRTL ? null : <PlayArrowIcon />}
          endIcon={isRTL ? <PlayArrowIcon /> : null}
          isRTL={isRTL}
        >
          {t('startQuiz')}
        </StartButton>
      </StyledDialogActions>
    </StyledDialog>
  );
};

export default QuizConfirmationDialog; 