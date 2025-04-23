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
  DialogTitle,
  Chip
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

  // Extract line references from the flashcard if they exist
  const extractLineReferences = (): number[] | null => {
    if (flashcard.lines && flashcard.lines.length > 0) {
      return flashcard.lines;
    }
    return null;
  };
  
  const lineReferences = extractLineReferences();

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
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  onClick={cancelEdit}
                  startIcon={<CancelIcon />}
                  sx={{ color: 'text.secondary' }}
                >
                  {t('cancel')}
                </Button>
                <Button 
                  onClick={handleSave}
                  startIcon={<SaveIcon />}
                  variant="contained"
                  color="primary"
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
                
                {(flashcard.pages?.length > 0 || flashcard.fileName || lineReferences) && (
                  <Box sx={{ 
                    mt: 2, 
                    pt: 1, 
                    borderTop: '1px dashed rgba(0,0,0,0.1)', 
                    fontSize: '0.75rem', 
                    color: 'text.secondary',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5
                  }}>
                    {flashcard.fileName && (
                      <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                        {t('source')}: {flashcard.fileName}
                      </Typography>
                    )}
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {flashcard.pages && flashcard.pages.length > 0 && (
                        <Chip
                          label={`${t('pages')}: ${flashcard.pages.join(', ')}`}
                          size="small"
                          variant="outlined"
                          color="primary"
                          sx={{ height: 24 }}
                        />
                      )}
                      
                      {lineReferences && lineReferences.length > 0 && (
                        <Chip
                          label={`${t('lines')}: ${lineReferences.join(', ')}`}
                          size="small"
                          variant="outlined"
                          color="secondary"
                          sx={{ height: 24 }}
                        />
                      )}
                    </Box>
                  </Box>
                )}
              </Collapse>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={showDeleteDialog}
        onClose={cancelDelete}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">{t('deleteFlashcard')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('deleteConfirmation')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} color="primary">
            {t('cancel')}
          </Button>
          <Button onClick={confirmDelete} color="error" autoFocus>
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FlashcardItem; 