"use client";
import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Divider, 
  Grid, 
  CircularProgress,
  Stack,
  useTheme,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Quiz } from '@/app/models/quiz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ReplayIcon from '@mui/icons-material/Replay';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import StyleOutlinedIcon from '@mui/icons-material/StyleOutlined';
import { UserAnswer } from '../hooks/useQuizSimulation';
import ExportQuizButton from '@/components/quiz/ExportQuizButton';
import CreateFlashcardsDialog from '@/components/flashcards/CreateFlashcardsDialog';
import { useTranslations } from 'next-intl';
import { useRTL } from '@/contexts/RTLContext';
import * as colors from '../../../../colors';

// Styled components
const ResultContainer = styled(Box)(({ theme }) => ({
  width: '100%',
}));

const ResultPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  border: '1px solid',
  borderColor: colors.border.light,
  marginBottom: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 1.5,
  padding: '10px 16px',
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
  },
}));

// Function to get question card styles based on correct/incorrect
const getQuestionCardStyles = (theme, isCorrect) => ({
  p: 2,
  borderRadius: 1,
  borderLeft: '4px solid',
  borderLeftColor: isCorrect ? colors.flashcardStatus.know : colors.flashcardStatus.dontKnow,
  display: 'flex',
  flexDirection: 'column',
  gap: 1
});

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

interface QuizResultsProps {
  quiz: Quiz;
  userAnswers: Record<string, UserAnswer>;
  results: {
    correct: number;
    total: number;
    percentage: number;
    questionResults: Record<string, boolean>;
  };
  onRetry: () => void;
  onClose: () => void;
  onReviewQuestions: () => void;
  submissionSuccess?: boolean;
  isSubmitting?: boolean;
  workspaceId?: string;
}

const QuizResults: React.FC<QuizResultsProps> = ({
  quiz,
  userAnswers,
  results,
  onRetry,
  onClose,
  onReviewQuestions,
  submissionSuccess = false,
  isSubmitting = false,
  workspaceId
}) => {
  const [openFlashcardsDialog, setOpenFlashcardsDialog] = useState(false);
  const t = useTranslations('QuizDialog');
  const { isRTL, direction } = useRTL();
  const theme = useTheme();

  const handleOpenFlashcardsDialog = () => {
    setOpenFlashcardsDialog(true);
  };

  const handleCloseFlashcardsDialog = () => {
    setOpenFlashcardsDialog(false);
  };

  // Generate feedback based on score
  const getFeedback = () => {
    if (results.percentage >= 90) return t('feedbackExcellent');
    if (results.percentage >= 75) return t('feedbackGreat');
    if (results.percentage >= 60) return t('feedbackGood');
    if (results.percentage >= 40) return t('feedbackOnTrack');
    return t('feedbackKeepStudying');
  };
  
  return (
    <ResultContainer dir={direction}>
      <ResultPaper elevation={0}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={4} 
          alignItems="center"
          justifyContent="center"
          sx={{ mb: 4 }}
        >
          <ScoreDisplay score={results.percentage} />
          
          <Box sx={{ textAlign: { xs: 'center', sm: isRTL ? 'right' : 'left' } }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <EmojiEventsIcon color="primary" />
              {t('quizComplete')}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {getFeedback()}
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {t('correctCount', { correct: results.correct, total: results.total })}
            </Typography>
            
            {/* Show submission status */}
            {isSubmitting && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  {t('refreshingSession')}
                </Typography>
              </Box>
            )}
            
            {submissionSuccess && (
              <Chip 
                icon={<SaveIcon />} 
                label={t('resultsSaved')}
                color="success" 
                size="small" 
                variant="outlined"
                sx={{ mt: 1 }} 
              />
            )}
          </Box>
        </Stack>
        
        <Divider sx={{ mb: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          {t('questionSummary')}
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {quiz.questions.map((question, index) => {
            const isCorrect = results.questionResults[question.id];
            
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
              <Grid item xs={12} sm={6} md={4} key={question.id}>
                <Paper
                  variant="outlined"
                  sx={getQuestionCardStyles(theme, isCorrect)}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5,
                    flexDirection: isRTL ? 'row-reverse' : 'row'
                  }}>
                    {isCorrect ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <CloseIcon color="error" />
                    )}
                    <Typography variant="body2" noWrap>
                      {t('questionNumber', { number: index + 1 })}
                    </Typography>
                  </Box>
                    
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 0.5, 
                    ml: isRTL ? 0 : 4,
                    mr: isRTL ? 4 : 0
                  }}>
                    {question.pages && question.pages.length > 0 && (
                      <Chip
                        label={`${t('page', { number: question.pages.join(', ') })}`}
                        color="primary"
                        variant="outlined"
                        size="small"
                        sx={{ height: 24 }}
                      />
                    )}
                    
                    {lineReferences && lineReferences.length > 0 && (
                      <Chip
                        label={`Line${lineReferences.length > 1 ? 's' : ''}: ${lineReferences.join('-')}`}
                        color="secondary"
                        variant="outlined"
                        size="small"
                        sx={{ height: 24 }}
                      />
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <StyledButton
            variant="outlined"
            color="primary"
            onClick={onRetry}
            startIcon={<ReplayIcon />}
          >
            {t('retry')}
          </StyledButton>
          <StyledButton
            variant="contained"
            color="primary"
            onClick={onReviewQuestions}
          >
            {t('reviewAnswers')}
          </StyledButton>
          
          {/* Add Export Quiz button */}
          {quiz.id && (
            <ExportQuizButton
              quizId={quiz.id}
              quizTitle={quiz.title}
              color="primary"
              label={t('exportToWord') || "Export to Word"}
            />
          )}
          
          <StyledButton
            variant="outlined"
            color="primary"
            onClick={handleOpenFlashcardsDialog}
            startIcon={<StyleOutlinedIcon />}
          >
            {t('createFlashcards') || "Create Flashcards"}
          </StyledButton>
          
          <StyledButton
            variant="outlined"
            color="inherit"
            onClick={onClose}
            startIcon={<CloseIcon />}
          >
            {t('cancel')}
          </StyledButton>
        </Box>
      </ResultPaper>
      <CreateFlashcardsDialog
        open={openFlashcardsDialog}
        onClose={handleCloseFlashcardsDialog}
        quiz={quiz}
        workspaceId={workspaceId || ""}
      />
    </ResultContainer>
  );
};

export default QuizResults; 