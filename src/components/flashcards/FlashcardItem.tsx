"use client";
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  IconButton, 
  Collapse, 
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { Flashcard } from '@/app/models/flashcard';
import { accent, primary, secondary } from '../../../colors';
import { useRTL } from '@/contexts/RTLContext';
import { useTranslations } from 'next-intl';

interface FlashcardItemProps {
  flashcard: Flashcard;
  hideAnswer?: boolean;
  onUpdateStatus?: (id: string, status: 'dont_know' | 'partially_know' | 'know_for_sure') => void;
  onEdit?: (id: string, question: string, answer: string) => void;
  onDelete?: (id: string) => void;
}

const FlashcardItem: React.FC<FlashcardItemProps> = ({
  flashcard,
  hideAnswer = true,
  onUpdateStatus,
  onEdit,
  onDelete
}) => {
  const [flipped, setFlipped] = useState(!hideAnswer);
  const [editMode, setEditMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [question, setQuestion] = useState(flashcard.question);
  const [answer, setAnswer] = useState(flashcard.answer);
  const { isRTL } = useRTL();
  const t = useTranslations('Flashcards');

  const handleFlip = () => {
    if (!editMode) {
      setFlipped(!flipped);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = () => {
    if (onEdit && question.trim() && answer.trim()) {
      onEdit(flashcard.id!, question, answer);
    }
    setEditMode(false);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (onDelete) {
      onDelete(flashcard.id!);
    }
    setShowDeleteDialog(false);
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
  };

  const cancelEdit = () => {
    setQuestion(flashcard.question);
    setAnswer(flashcard.answer);
    setEditMode(false);
  };

  return (
    <>
      <Card 
        sx={{ 
          width: '100%',
          height: '100%',
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative',
          transition: 'all 0.2s ease-in-out',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          cursor: editMode ? 'default' : 'pointer',
          ':hover': {
            boxShadow: 3,
            transform: 'translateY(-4px)'
          },
          borderRadius: 2,
          bgcolor: flipped ? 'rgba(79, 108, 255, 0.03)' : 'white'
        }}
        onClick={handleFlip}
      >
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 4, 
            [isRTL ? 'left' : 'right']: 8, 
            display: 'flex', 
            gap: 0.5,
            flexDirection: isRTL ? 'row-reverse' : 'row',
            zIndex: 10
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {onEdit && (
            <IconButton 
              size="small" 
              onClick={editMode ? handleSave : handleEdit}
              sx={{ 
                color: editMode ? accent.green.main : accent.green.main, 
                backgroundColor: 'transparent',
                ':hover': {
                  backgroundColor: 'rgba(54, 214, 183, 0.2)'
                }
              }}
            >
              {editMode ? <SaveIcon fontSize="small" /> : <EditOutlinedIcon fontSize="small" />}
            </IconButton>
          )}
          
          {onDelete && (
            <IconButton 
              size="small" 
              onClick={handleDelete}
              sx={{ 
                color: secondary.main, 
                backgroundColor: 'transparent',
                ':hover': {
                  backgroundColor: 'rgba(255, 122, 90, 0.2)'
                }
              }}
            >
              <DeleteOutlinedIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        <CardContent sx={{ 
          p: 4, 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          paddingBottom: "4px !important",
          textAlign: isRTL ? 'right' : 'left',
          direction: isRTL ? 'rtl' : 'ltr'
        }}>
          {editMode ? (
            <>
              <TextField
                label={t('question')}
                variant="outlined"
                fullWidth
                multiline
                minRows={2}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  dir: isRTL ? 'rtl' : 'ltr'
                }}
                inputProps={{
                  dir: isRTL ? 'rtl' : 'ltr'
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <TextField
                label={t('answer')}
                variant="outlined"
                fullWidth
                multiline
                minRows={3}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                InputProps={{
                  dir: isRTL ? 'rtl' : 'ltr'
                }}
                inputProps={{
                  dir: isRTL ? 'rtl' : 'ltr'
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <Box sx={{ 
                display: 'flex', 
                justifyContent: isRTL ? 'flex-start' : 'flex-end', 
                mt: 2, 
                gap: 1,
                flexDirection: isRTL ? 'row-reverse' : 'row'
              }}
              onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CancelIcon />}
                  onClick={cancelEdit}
                  sx={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
                >
                  {t('cancel')}
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  sx={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
                >
                  {t('save')}
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Typography 
                variant="subtitle1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600, 
                  mb: 1,
                  fontSize: '0.95rem'
                }}
              >
                {flashcard.question}
              </Typography>
              
              <Collapse in={flipped} timeout={300} sx={{ mt: 'auto' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.85rem'
                  }}
                >
                  {flashcard.answer}
                </Typography>
              </Collapse>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={showDeleteDialog}
        onClose={cancelDelete}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {t('deleteFlashcard')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {t('confirmDelete')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>{t('cancel')}</Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            autoFocus
          >
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FlashcardItem; 