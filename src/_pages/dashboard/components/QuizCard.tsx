"use client";
import React, { useState } from 'react';
import { 
  CardActionArea, 
  CardContent, 
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import { Quiz } from '@/app/models/quiz';
import QuizSimulator from '@/features/quiz-simulator';
import { exportQuizClient } from '@/app/lib-client/quizClient';
import { useAuth } from '@/contexts/AuthContext';
import { saveAs } from 'file-saver';
import { useQuizSubmission } from '@/app/lib-client/hooks/useQuizSubmissions';
import { 
  BaseCard,
  CardHeader,
  CardTitleContainer,
  CardIconAvatar,
  CardTitle,
  CardMenuButton,
  CardFooter,
  CardDate,
  CardChip
} from './DashboardStyledComponents';
import { primary, accent } from '../../../../colors';
import { useRTL } from '@/contexts/RTLContext';

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
  const { isRTL } = useRTL();
  
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
    // Don't call onClick(quiz) anymore, directly start the quiz
    console.log('Quiz card clicked, opening quiz directly: ', quiz.title);
    if (hasPreviousSubmission) {
      // If there's a previous submission, continue the quiz
      handleContinueQuiz();
    } else {
      // Otherwise start a new quiz
      handleStartQuiz();
    }
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
      <BaseCard>
        <CardActionArea onClick={handleClick}>
          <CardContent sx={{ p: 1.5, pb: '12px !important' }}>
            <CardHeader>
              <CardTitleContainer>
                <CardIconAvatar sx={{ 
                  bgcolor: 'white', 
                  border: '1px solid #d0d0d0',
                  width: 28, 
                  height: 28,
                  marginRight: isRTL ? 0 : '0.75rem',
                  marginLeft: isRTL ? '0.75rem' : 0
                }}>
                  <QuizOutlinedIcon fontSize="small" sx={{ color: 'black' }} />
                </CardIconAvatar>
                <CardTitle variant="subtitle1">
                  {quiz.title}
                </CardTitle>
              </CardTitleContainer>
              <CardMenuButton
                size="small"
                onClick={handleMenuOpen}
                aria-label="quiz options"
                sx={{
                  marginLeft: isRTL ? 'unset' : 'auto',
                  marginRight: isRTL ? 'auto' : 'unset'
                }}
              >
                <MoreVertIcon fontSize="small" />
              </CardMenuButton>
            </CardHeader>
            
            <CardFooter sx={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <CardDate variant="caption">
                {formattedDate}
              </CardDate>
              <CardChip 
                label={`${quiz.questions.length} Q`} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            </CardFooter>
          </CardContent>
        </CardActionArea>
      </BaseCard>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuCloseGeneric}
        onClick={handleMenuClose}
        transformOrigin={{ horizontal: isRTL ? 'left' : 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: isRTL ? 'left' : 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 2,
          sx: { 
            minWidth: 180,
            borderRadius: '8px',
            mt: 0.5,
            direction: isRTL ? 'rtl' : 'ltr'
          }
        }}
      >
        {hasPreviousSubmission ? (
          <MenuItem onClick={handleContinueQuiz}>
            <ListItemIcon sx={{ minWidth: 36, marginRight: isRTL ? 'auto' : 0, marginLeft: isRTL ? 0 : 'auto' }}>
              <PlayArrowOutlinedIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary="Continue Quiz" />
          </MenuItem>
        ) : (
          <MenuItem onClick={handleStartQuiz}>
            <ListItemIcon sx={{ minWidth: 36, marginRight: isRTL ? 'auto' : 0, marginLeft: isRTL ? 0 : 'auto' }}>
              <VisibilityOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Start Quiz" />
          </MenuItem>
        )}
        
        <MenuItem onClick={handleResetQuiz}>
          <ListItemIcon sx={{ minWidth: 36, marginRight: isRTL ? 'auto' : 0, marginLeft: isRTL ? 0 : 'auto' }}>
            <RefreshOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Reset Quiz" />
        </MenuItem>
        
        {quiz.id && (
          <MenuItem onClick={handleExport}>
            <ListItemIcon sx={{ minWidth: 36, marginRight: isRTL ? 'auto' : 0, marginLeft: isRTL ? 0 : 'auto' }}>
              <FileDownloadOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Export to Word" />
          </MenuItem>
        )}
        
        {onDelete && quiz.id && (
          <MenuItem onClick={handleDelete}>
            <ListItemIcon sx={{ minWidth: 36, marginRight: isRTL ? 'auto' : 0, marginLeft: isRTL ? 0 : 'auto' }}>
              <DeleteOutlinedIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primary="Delete Quiz" />
          </MenuItem>
        )}
      </Menu>
      
      {showQuizSimulator && (
        <QuizSimulator
          open={showQuizSimulator}
          onClose={handleCloseQuizSimulator}
          quiz={quiz}
          resetMode={resetQuiz}
        />
      )}
    </>
  );
};

export default QuizCard;