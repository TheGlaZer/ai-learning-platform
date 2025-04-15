"use client";
import React from 'react';
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
import { Quiz } from '@/app/models/quiz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ReplayIcon from '@mui/icons-material/Replay';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import { UserAnswer } from '../hooks/useQuizSimulation';
import ExportQuizButton from '@/components/quiz/ExportQuizButton';

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
}

const QuizResults: React.FC<QuizResultsProps> = ({
  quiz,
  userAnswers,
  results,
  onRetry,
  onClose,
  onReviewQuestions,
  submissionSuccess = false,
  isSubmitting = false
}) => {
  // Generate feedback based on score
  const getFeedback = () => {
    if (results.percentage >= 90) return "Excellent! You've mastered this topic!";
    if (results.percentage >= 75) return "Great job! You have a solid understanding.";
    if (results.percentage >= 60) return "Good effort! Keep practicing to improve.";
    if (results.percentage >= 40) return "You're on the right track. A bit more practice will help.";
    return "Keep studying! Don't give up, you'll improve with practice.";
  };
  
  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 4 },
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          mb: 3
        }}
      >
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={4} 
          alignItems="center"
          justifyContent="center"
          sx={{ mb: 4 }}
        >
          <ScoreDisplay score={results.percentage} />
          
          <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmojiEventsIcon color="primary" />
              Quiz Complete!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {getFeedback()}
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {results.correct} correct out of {results.total} questions
            </Typography>
            
            {/* Show submission status */}
            {isSubmitting && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Saving your results...
                </Typography>
              </Box>
            )}
            
            {submissionSuccess && (
              <Chip 
                icon={<SaveIcon />} 
                label="Results saved" 
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
          Question Summary
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {quiz.questions.map((question, index) => {
            const isCorrect = results.questionResults[question.id];
            return (
              <Grid item xs={12} sm={6} md={4} key={question.id}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    borderLeft: '4px solid',
                    borderLeftColor: isCorrect ? 'success.main' : 'error.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5
                  }}
                >
                  {isCorrect ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <CloseIcon color="error" />
                  )}
                  <Typography variant="body2" noWrap>
                    Question {index + 1}
                  </Typography>
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
          <Button
            variant="outlined"
            color="primary"
            onClick={onRetry}
            startIcon={<ReplayIcon />}
          >
            Retry Quiz
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={onReviewQuestions}
          >
            Review Answers
          </Button>
          
          {/* Add Export Quiz button */}
          {quiz.id && (
            <ExportQuizButton
              quizId={quiz.id}
              quizTitle={quiz.title}
              color="primary"
              label="Export to Word"
            />
          )}
          
          <Button
            variant="outlined"
            color="inherit"
            onClick={onClose}
            startIcon={<CloseIcon />}
          >
            Close
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default QuizResults; 