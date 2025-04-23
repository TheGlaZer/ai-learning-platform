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

interface QuizConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onStartQuiz: () => void;
  quiz: Quiz | null;
}

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
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'hidden',
          direction: isRTL ? 'rtl' : 'ltr'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: 'primary.main', 
        color: 'primary.contrastText',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <QuizIcon />
        <Typography variant="h6">{t('confirmationTitle')}</Typography>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            {quiz.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('confirmationMessage')}
          </Typography>
        </Box>
        
        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>{commonT('question')} {t('details')}:</strong>
          </Typography>
          
          <Box component="ul" sx={{ pl: isRTL ? 0 : 2, pr: isRTL ? 2 : 0, m: 0 }}>
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
          </Box>
        </Paper>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onClose} 
          startIcon={isRTL ? null : <CloseIcon />}
          endIcon={isRTL ? <CloseIcon /> : null}
          color="inherit"
        >
          {commonT('cancel')}
        </Button>
        <Button 
          onClick={onStartQuiz} 
          variant="contained" 
          color="primary"
          startIcon={isRTL ? null : <PlayArrowIcon />}
          endIcon={isRTL ? <PlayArrowIcon /> : null}
          sx={{ ml: isRTL ? 0 : 1, mr: isRTL ? 1 : 0 }}
        >
          {t('startQuiz')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuizConfirmationDialog; 