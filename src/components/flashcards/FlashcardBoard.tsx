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
  Alert
} from '@mui/material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { styled } from '@mui/material/styles';
import { Flashcard as FlashcardType } from '@/app/models/flashcard';
import FlashcardItem from './FlashcardItem';
import { useFlashcards } from '@/app/lib-client/hooks/useFlashcards';
import { accent, primary, secondary } from '../../../colors';
import { useTranslations } from 'next-intl';

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
  borderRadius: theme.shape.borderRadius,
  border: '1px solid',
  borderColor: 'rgba(0, 0, 0, 0.08)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(2),
  overflow: 'hidden',
  position: 'relative',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
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

const FlashcardBoard: React.FC<FlashcardBoardProps> = ({ workspaceId }) => {
  const t = useTranslations('Flashcards');
  
  const columnDefinitions = {
    dont_know: {
      title: t('dontKnow'),
      color: secondary.main,
      icon: '😕',
      bgColor: 'rgba(255, 122, 90, 0.05)',
    },
    partially_know: {
      title: t('partiallyKnow'),
      color: '#FF9800',
      icon: '🤔',
      bgColor: 'rgba(255, 209, 102, 0.05)',
    },
    know_for_sure: {
      title: t('know'),
      color: accent.green.main,
      icon: '✓',
      bgColor: 'rgba(54, 214, 183, 0.05)',
    }
  };

  const {
    flashcards,
    loading,
    error,
    updateFlashcard,
    deleteFlashcard
  } = useFlashcards(workspaceId);
  
  const [hideAnswers, setHideAnswers] = useState(true);
  const [columns, setColumns] = useState<Record<string, FlashcardType[]>>({
    dont_know: [],
    partially_know: [],
    know_for_sure: []
  });
  
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
                    borderColor: key === 'dont_know' ? '#ffcdd2' : key === 'partially_know' ? '#fff9c4' : '#c8e6c9',
                    borderWidth: '2px',
                    borderRadius: '12px',
                  }}
                >
                  <ColumnHeader>
                    <ColumnTitle variant="subtitle1">
                      {column.icon} {column.title}
                      <ColumnCount>{columns[key].length}</ColumnCount>
                    </ColumnTitle>
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
    </Box>
  );
};

export default FlashcardBoard; 