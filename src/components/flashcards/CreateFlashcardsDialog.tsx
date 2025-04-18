"use client";
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { Quiz } from '@/app/models/quiz';
import { useFlashcards } from '@/app/lib-client/hooks/useFlashcards';

interface CreateFlashcardsDialogProps {
  open: boolean;
  onClose: () => void;
  quiz: Quiz | null;
  workspaceId: string;
}

const CreateFlashcardsDialog: React.FC<CreateFlashcardsDialogProps> = ({
  open,
  onClose,
  quiz,
  workspaceId
}) => {
  const [option, setOption] = useState<'all' | 'wrong'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { createFlashcardsFromQuiz } = useFlashcards(workspaceId);
  
  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOption(event.target.value as 'all' | 'wrong');
  };
  
  const handleCreateFlashcards = async () => {
    if (!quiz) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const wrongAnswersOnly = option === 'wrong';
      const result = await createFlashcardsFromQuiz(quiz, workspaceId, wrongAnswersOnly);
      
      if (result.count === 0) {
        setSuccess("No flashcards were created. You might not have any wrong answers.");
      } else {
        setSuccess(`Successfully created ${result.count} flashcards!`);
      }
    } catch (err: any) {
      console.error('Error creating flashcards:', err);
      setError(err.message || 'Failed to create flashcards');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    setOption('all');
    setError(null);
    setSuccess(null);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Create Flashcards</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" paragraph>
            Create flashcards from this quiz to help you study. You can create cards for all questions
            or only for the questions you answered incorrectly.
          </Typography>
          
          <RadioGroup
            value={option}
            onChange={handleOptionChange}
          >
            <FormControlLabel 
              value="all" 
              control={<Radio />} 
              label="All questions" 
            />
            <FormControlLabel 
              value="wrong" 
              control={<Radio />} 
              label="Only questions I got wrong" 
            />
          </RadioGroup>
        </Box>
        
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">Creating flashcards...</Typography>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ my: 2 }}>
            {success}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleCreateFlashcards} 
          color="primary" 
          variant="contained"
          disabled={loading || !quiz}
        >
          Create Flashcards
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateFlashcardsDialog; 