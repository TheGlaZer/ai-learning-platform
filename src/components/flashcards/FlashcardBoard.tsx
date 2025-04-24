"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Divider, 
  Switch, 
  FormControlLabel,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { styled } from '@mui/material/styles';
import { Flashcard as FlashcardType, CreateFlashcardParams } from '@/app/models/flashcard';
import FlashcardItem from './FlashcardItem';
import { useFlashcards } from '@/app/lib-client/hooks/useFlashcards';
import { accent, primary, secondary, flashcardStatus } from '../../../colors';
import { useTranslations } from 'next-intl';
import AddIcon from '@mui/icons-material/Add';
import { useRTL } from '@/contexts/RTLContext';

// Styled components
const ColumnHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: 'rgba(0, 0, 0, 0.02)',
}));

const ColumnTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const ColumnCount = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(0, 0, 0, 0.05)',
  borderRadius: '50%',
  width: 24,
  height: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
  fontWeight: 600,
}));

const CardsContainer = styled(Box)(({ theme }) => ({
  minHeight: 200,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(1),
  width: '100%',
  flexGrow: 1,
  borderRadius: 8,
  overflow: 'auto',
}));

const CardItemWrapper = styled(Box)(({ theme }) => ({
  userSelect: 'none',
  margin: '0 0 16px 0',
  width: '100%',
  position: 'relative',
  '&:last-child': {
    marginBottom: 0,
  },
}));

const ColumnContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 500,
  padding: theme.spacing(2),
  position: 'relative',
  border: '2px solid transparent',
}));

// Custom styles for drag handling
const getDragStyle = (isDragging: boolean, draggableStyle: any) => {
  const transformValue = draggableStyle?.transform;
  let transform = transformValue;
  
  // Only apply vertical movement (extract just the Y transform)
  if (isDragging && transformValue) {
    const match = transformValue.match(/translate\((.*?)px, (.*?)px\)/);
    if (match && match[2]) {
      transform = `translate(0px, ${match[2]}px)`;
    }
  }
  
  return {
    ...draggableStyle,
    transform,
    width: '100%',
    left: 0,
  };
};

// Get a droppable ID from a column key
const getDroppableId = (key: string) => `droppable-${key}`;

// Get the column key from a droppable ID
const getColumnKeyFromDroppableId = (droppableId: string) => droppableId.replace('droppable-', '');

interface FlashcardBoardProps {
  workspaceId: string;
}

interface AddFlashcardDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (question: string, answer: string) => Promise<void>;
}

const AddFlashcardDialog: React.FC<AddFlashcardDialogProps> = ({ open, onClose, onAdd }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const { isRTL } = useRTL();
  const t = useTranslations('Flashcards');

  const handleAdd = async () => {
    if (!question.trim() || !answer.trim()) return;
    
    setLoading(true);
    try {
      await onAdd(question, answer);
      setQuestion('');
      setAnswer('');
      onClose();
    } catch (err) {
      console.error('Error adding flashcard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('addFlashcard')}</DialogTitle>
      <DialogContent>
        <TextField
          label={t('question')}
          fullWidth
          multiline
          minRows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          margin="normal"
          variant="outlined"
          InputProps={{
            dir: isRTL ? 'rtl' : 'ltr'
          }}
        />
        <TextField
          label={t('answer')}
          fullWidth
          multiline
          minRows={3}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          margin="normal"
          variant="outlined"
          InputProps={{
            dir: isRTL ? 'rtl' : 'ltr'
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button 
          onClick={handleAdd} 
          variant="contained" 
          color="primary"
          disabled={loading || !question.trim() || !answer.trim()}
        >
          {loading ? t('adding') : t('add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const FlashcardBoard: React.FC<FlashcardBoardProps> = ({ workspaceId }) => {
  const t = useTranslations('Flashcards');
  
  const columnDefinitions = {
    dont_know: {
      title: t('dontKnow'),
      color: flashcardStatus.dontKnow,
      icon: '😕',
      bgColor: 'rgba(255, 122, 90, 0.05)',
    },
    partially_know: {
      title: t('partiallyKnow'),
      color: flashcardStatus.partiallyKnow,
      icon: '🤔',
      bgColor: 'rgba(255, 209, 102, 0.05)',
    },
    know_for_sure: {
      title: t('know'),
      color: flashcardStatus.know,
      icon: '✓',
      bgColor: 'rgba(54, 214, 183, 0.05)',
    }
  };

  const {
    flashcards,
    loading,
    error,
    updateFlashcard,
    deleteFlashcard,
    createFlashcard,
    fetchFlashcards
  } = useFlashcards(workspaceId);
  
  const [hideAnswers, setHideAnswers] = useState(true);
  const [columns, setColumns] = useState<Record<string, FlashcardType[]>>({
    dont_know: [],
    partially_know: [],
    know_for_sure: []
  });
  const [openAddDialog, setOpenAddDialog] = useState(false);
  
  // Initialize columns with flashcards when they load
  useEffect(() => {
    if (flashcards) {
      const newColumns: Record<string, FlashcardType[]> = {
        dont_know: [],
        partially_know: [],
        know_for_sure: []
      };
      
      flashcards.forEach(card => {
        const status = card.status || 'dont_know';
        newColumns[status].push(card);
      });
      
      setColumns(newColumns);
    }
  }, [flashcards]);

  // Handle drag end to move flashcards between columns
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    // Return if dropped outside of any droppable area
    if (!destination) return;
    
    // Get the column keys from the droppable IDs
    const sourceColumnKey = getColumnKeyFromDroppableId(source.droppableId);
    const destColumnKey = getColumnKeyFromDroppableId(destination.droppableId);
    
    // Return if dropped in the same place
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }
    
    // Find the flashcard being moved
    const flashcard = Object.values(columns)
      .flat()
      .find(card => card.id === draggableId);
      
    if (!flashcard) return;
    
    // Create a copy of the source column
    const sourceColumn = [...columns[sourceColumnKey]];
    
    // Remove the flashcard from the source column
    sourceColumn.splice(source.index, 1);
    
    // Handle reordering within the same column
    if (sourceColumnKey === destColumnKey) {
      // Just reorder without changing status
      sourceColumn.splice(destination.index, 0, flashcard);
      
      // Update only the affected column
      setColumns({
        ...columns,
        [sourceColumnKey]: sourceColumn
      });
      
      return;
    }
    
    // If moving to a different column:
    // Create a copy of the destination column
    const destinationColumn = [...columns[destColumnKey]];
    
    // Add the flashcard to the destination column with updated status
    const updatedFlashcard = { 
      ...flashcard, 
      status: destColumnKey as 'dont_know' | 'partially_know' | 'know_for_sure' 
    };
    destinationColumn.splice(destination.index, 0, updatedFlashcard);
    
    // Update the columns state
    setColumns({
      ...columns,
      [sourceColumnKey]: sourceColumn,
      [destColumnKey]: destinationColumn
    });
    
    // Update the flashcard status in the database
    updateFlashcard(draggableId, {
      id: draggableId,
      status: destColumnKey as 'dont_know' | 'partially_know' | 'know_for_sure'
    }).catch(err => {
      console.error('Error updating flashcard status:', err);
    });
  };

  // Handle flashcard edit
  const handleEditFlashcard = (id: string, question: string, answer: string) => {
    // Find flashcard in columns
    let flashcardToUpdate: FlashcardType | undefined;
    let columnKey: string | undefined;

    Object.entries(columns).some(([key, cards]) => {
      const foundCard = cards.find(card => card.id === id);
      if (foundCard) {
        flashcardToUpdate = foundCard;
        columnKey = key;
        return true;
      }
      return false;
    });

    if (!flashcardToUpdate || !columnKey) return;

    // Update locally
    const updatedFlashcard = { 
      ...flashcardToUpdate, 
      question, 
      answer 
    };

    // Update columns state
    setColumns(prev => ({
      ...prev,
      [columnKey]: prev[columnKey].map(card => 
        card.id === id ? updatedFlashcard : card
      )
    }));
    
    // Update in the database
    updateFlashcard(id, { id, question, answer }).catch(err => {
      console.error('Error updating flashcard:', err);
    });
  };

  // Handle flashcard deletion
  const handleDeleteFlashcard = (id: string) => {
    // Find and remove the flashcard from columns
    let columnKey: string | undefined;

    Object.entries(columns).some(([key, cards]) => {
      const cardIndex = cards.findIndex(card => card.id === id);
      if (cardIndex !== -1) {
        columnKey = key;
        return true;
      }
      return false;
    });
    
    if (!columnKey) return;

    // Update columns state
    setColumns(prev => ({
      ...prev,
      [columnKey!]: prev[columnKey!].filter(card => card.id !== id)
    }));
    
    // Delete from the database
    deleteFlashcard(id).catch(err => {
      console.error('Error deleting flashcard:', err);
    });
  };

  // Handle adding a new flashcard
  const handleAddFlashcard = async (question: string, answer: string) => {
    const userId = localStorage.getItem('userId') || '';
    
    const newFlashcard: CreateFlashcardParams = {
      question,
      answer,
      workspaceId,
      userId,
      status: 'dont_know'
    };
    
    try {
      const flashcard = await createFlashcard(newFlashcard);
      // Refresh flashcards list after adding
      fetchFlashcards(workspaceId);
      return flashcard;
    } catch (err) {
      console.error('Error creating flashcard:', err);
      throw err;
    }
  };

  // Handle errors
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {t('error')}
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%' }}>      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Grid container spacing={3}>
            {Object.entries(columnDefinitions).map(([key, column]) => (
              <Grid item xs={12} md={4} key={key}>
                <ColumnContainer
                  elevation={0}
                  sx={{
                    bgcolor: 'white',
                    borderColor: key === 'dont_know' ? flashcardStatus.dontKnow : 
                                key === 'partially_know' ? flashcardStatus.partiallyKnow : 
                                flashcardStatus.know,
                    borderWidth: '2px',
                    borderRadius: '12px',
                  }}
                >
                  <ColumnHeader>
                    <ColumnTitle variant="subtitle1">
                      {column.icon} {column.title}
                      <ColumnCount>{columns[key].length}</ColumnCount>
                    </ColumnTitle>
                    
                    {key === 'dont_know' && (
                      <IconButton 
                        size="small" 
                        onClick={() => setOpenAddDialog(true)}
                        sx={{ 
                          color: flashcardStatus.dontKnow,
                          bgcolor: `${flashcardStatus.dontKnow}15`,
                          '&:hover': {
                            bgcolor: `${flashcardStatus.dontKnow}30`,
                          } 
                        }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    )}
                  </ColumnHeader>
                  
                  <Droppable droppableId={getDroppableId(key)} direction="vertical">
                    {(provided, snapshot) => (
                      <CardsContainer
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {columns[key].map((card, index) => (
                          <Draggable 
                            key={card.id} 
                            draggableId={card.id!} 
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <CardItemWrapper
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                sx={getDragStyle(snapshot.isDragging, provided.draggableProps.style)}
                              >
                                <FlashcardItem
                                  flashcard={card}
                                  hideAnswer={hideAnswers}
                                  onEdit={handleEditFlashcard}
                                  onDelete={handleDeleteFlashcard}
                                />
                              </CardItemWrapper>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </CardsContainer>
                    )}
                  </Droppable>
                </ColumnContainer>
              </Grid>
            ))}
          </Grid>
        </DragDropContext>
      )}
      
      <AddFlashcardDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        onAdd={handleAddFlashcard}
      />
    </Box>
  );
};

export default FlashcardBoard; 