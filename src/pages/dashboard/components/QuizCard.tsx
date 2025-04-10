"use client";
import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Chip, 
  IconButton,
  CardActionArea,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import QuizIcon from '@mui/icons-material/Quiz';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Quiz } from '@/app/models/quiz';
import QuizSimulator from '@/features/quiz-simulator';
import ExportQuizButton from '@/components/quiz/ExportQuizButton';
import { exportQuizClient } from '@/app/lib-client/quizClient';
import { useAuth } from '@/contexts/AuthContext';
import { saveAs } from 'file-saver';
import { useQuizSubmission } from '@/app/lib-client/hooks/useQuizSubmissions';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

interface QuizCardProps {
  quiz: Quiz;
  onClick: (quiz: Quiz) => void;
  onDelete?: (quiz: Quiz) => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz, onClick, onDelete }) => {
  const [showQuizSimulator, setShowQuizSimulator] = useState(false);
  const [resetQuiz, setResetQuiz] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { userId, accessToken } = useAuth();
  
  // Check if this quiz has previous submissions
  const { submission: previousSubmission, loading: loadingSubmission } = useQuizSubmission(
    quiz?.id,
    userId,
    quiz?.workspaceId
  );
  
  const hasPreviousSubmission = !!previousSubmission;
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event?: React.MouseEvent<HTMLElement>) => {
    if (event) {
      event.stopPropagation();
    }
    setAnchorEl(null);
  };

  // This handler is compatible with Menu's onClose
  const handleMenuCloseGeneric = () => {
    setAnchorEl(null);
  };
  
  const handleClick = () => {
    onClick(quiz);
  };
  
  const handleStartQuiz = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setShowQuizSimulator(true);
    setResetQuiz(false);
    handleMenuClose();
  };
  
  const handleResetQuiz = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setShowQuizSimulator(true);
    setResetQuiz(true);
    handleMenuClose();
  };
  
  const handleCloseQuizSimulator = () => {
    setShowQuizSimulator(false);
    setResetQuiz(false);
  };
  
  const handleDelete = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    handleMenuClose();
    // Confirm before deleting
    if (window.confirm(`Are you sure you want to delete the quiz "${quiz.title}"?`)) {
      onDelete?.(quiz);
    }
  };

  const handleExport = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    handleMenuClose();
    
    if (!quiz.id) {
      alert('Quiz ID is missing. Cannot export.');
      return;
    }

    if (!accessToken) {
      alert('You must be logged in to export quizzes.');
      return;
    }
    
    try {
      const blob = await exportQuizClient(quiz.id, accessToken);
      const fileName = `Quiz-${quiz.title.replace(/[^a-zA-Z0-9]/g, '-')}.docx`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Failed to export quiz:', error);
      alert(`Failed to export quiz: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleContinueQuiz = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setShowQuizSimulator(true);
    setResetQuiz(false);
    handleMenuClose();
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
    <>
      <Card 
        sx={{ 
          mb: 2, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          },
          maxWidth: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <CardActionArea 
          onClick={handleClick}
          sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
        >
          <CardContent sx={{ p: 2, pb: 1.5, flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: 'calc(100% - 50px)' }}>
                <QuizIcon color="primary" sx={{ mr: 1, fontSize: '1.2rem' }} />
                <Typography variant="subtitle1" noWrap sx={{ fontWeight: 500 }}>
                  {quiz.title}
                </Typography>
              </Box>
              <IconButton 
                size="small" 
                onClick={handleMenuOpen}
                sx={{ 
                  ml: 'auto', 
                  p: 0.5,
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' } 
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {formattedDate}
              </Typography>
              <Chip 
                label={`${quiz.questions.length} Q`} 
                size="small" 
                color="primary" 
                variant="outlined"
                sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.65rem' } }}
              />
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuCloseGeneric}
        onClick={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {hasPreviousSubmission ? (
          <MenuItem onClick={handleContinueQuiz}>
            <ListItemIcon>
              <PlayArrowIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText>Continue Quiz</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={handleStartQuiz}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Start Quiz</ListItemText>
          </MenuItem>
        )}
        
        <MenuItem onClick={handleResetQuiz}>
          <ListItemIcon>
            <RefreshIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reset Quiz</ListItemText>
        </MenuItem>
        
        {quiz.id && (
          <MenuItem onClick={handleExport}>
            <ListItemIcon>
              <FileDownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Export to Word</ListItemText>
          </MenuItem>
        )}
        
        {onDelete && (
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Quiz</ListItemText>
          </MenuItem>
        )}
      </Menu>
      
      <QuizSimulator
        quiz={quiz}
        open={showQuizSimulator}
        onClose={handleCloseQuizSimulator}
        resetMode={resetQuiz}
      />
    </>
  );
};

export default QuizCard;