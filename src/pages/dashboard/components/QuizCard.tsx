"use client";
import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Chip, 
  IconButton,
  CardActionArea
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import QuizIcon from '@mui/icons-material/Quiz';
import { Quiz } from '@/app/models/quiz';

interface QuizCardProps {
  quiz: Quiz;
  onClick: (quiz: Quiz) => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz, onClick }) => {
  const handleClick = () => {
    onClick(quiz);
  };

  // Format the date nicely
  const formattedDate = quiz.createdAt 
    ? new Date(quiz.createdAt).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    : 'Unknown date';

  return (
    <Card 
      sx={{ 
        mb: 2, 
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }
      }}
    >
      <CardActionArea onClick={handleClick}>
        <CardContent sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <QuizIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" noWrap sx={{ maxWidth: '180px' }}>
                {quiz.title}
              </Typography>
            </Box>
            <Chip 
              label={`${quiz.questions.length} questions`} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Generated on {formattedDate}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <IconButton
              size="small"
              color="primary"
              aria-label="view quiz"
              sx={{ mr: -1 }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default QuizCard;