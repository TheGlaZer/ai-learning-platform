import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Flashcard, CreateFlashcardParams, UpdateFlashcardParams } from '@/app/models/flashcard';

export const useFlashcards = (workspaceId?: string) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { accessToken } = useAuth();

  // Fetch all flashcards for a workspace
  const fetchFlashcards = useCallback(async (wsId?: string) => {
    if (!wsId && !workspaceId) return;
    
    const targetWorkspaceId = wsId || workspaceId;
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/flashcards?workspaceId=${targetWorkspaceId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch flashcards: ${response.statusText}`);
      }
      
      const data = await response.json();
      setFlashcards(data.flashcards || []);
    } catch (err: any) {
      console.error('Error fetching flashcards:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, accessToken]);

  // Create a single flashcard
  const createFlashcard = useCallback(async (flashcardData: CreateFlashcardParams) => {
    setError(null);
    
    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(flashcardData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create flashcard: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Add the new flashcard to the local state
      setFlashcards(prev => [...prev, data.flashcard]);
      
      return data.flashcard;
    } catch (err: any) {
      console.error('Error creating flashcard:', err);
      setError(err);
      throw err;
    }
  }, [accessToken]);

  // Create multiple flashcards at once
  const createFlashcardsBatch = useCallback(async (flashcardsData: CreateFlashcardParams[]) => {
    setError(null);
    
    try {
      const response = await fetch('/api/flashcards/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ flashcards: flashcardsData }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create flashcards: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update local state without the actual flashcard objects since API only returns count
      // We'll fetch the updated list on next refresh
      // Option: we could do a fetch here to get the latest
      
      return {
        count: data.count,
        message: `Created ${data.count} flashcards`
      };
    } catch (err: any) {
      console.error('Error creating flashcards batch:', err);
      setError(err);
      throw err;
    }
  }, [accessToken]);

  // Update a flashcard with optimistic updates
  const updateFlashcard = useCallback(async (id: string, updateData: UpdateFlashcardParams) => {
    // Immediately update local state (optimistic update)
    setFlashcards(prev => 
      prev.map(card => card.id === id ? { ...card, ...updateData } : card)
    );
    
    try {
      // Send the update to the server in the background
      const response = await fetch(`/api/flashcards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update flashcard: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.flashcard;
    } catch (err: any) {
      console.error('Error updating flashcard:', err);
      
      // Revert the optimistic update if the API call fails
      setFlashcards(prev => {
        // Find the original card to restore from our current state
        const originalCard = prev.find(card => card.id === id);
        if (!originalCard) return prev;
        
        // Revert the changes
        return prev.map(card => 
          card.id === id ? { ...card, ...originalCard } : card
        );
      });
      
      setError(err);
      throw err;
    }
  }, [accessToken]);

  // Delete a flashcard with optimistic update
  const deleteFlashcard = useCallback(async (id: string) => {
    // Store the current state in case we need to revert
    const previousFlashcards = [...flashcards];
    
    // Immediately update local state (optimistic update)
    setFlashcards(prev => prev.filter(card => card.id !== id));
    
    try {
      // Send the delete request to the server in the background
      const response = await fetch(`/api/flashcards/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete flashcard: ${response.statusText}`);
      }
      
      return true;
    } catch (err: any) {
      console.error('Error deleting flashcard:', err);
      
      // Revert the optimistic update if the API call fails
      setFlashcards(previousFlashcards);
      
      setError(err);
      throw err;
    }
  }, [accessToken, flashcards]);

  // Create flashcards from quiz
  const createFlashcardsFromQuiz = useCallback(async (
    quiz: any, 
    workspaceId: string, 
    wrongAnswersOnly: boolean = false
  ) => {
    const flashcardsToCreate: CreateFlashcardParams[] = [];
    const userId = localStorage.getItem('userId') || '';
    
    quiz.questions.forEach((question: any) => {
      // If wrongAnswersOnly is true, check if the user got this question wrong
      const userAnswer = quiz.userAnswers?.[question.id];
      const isCorrect = userAnswer?.optionId === question.correctAnswer;
      
      if (!wrongAnswersOnly || (wrongAnswersOnly && !isCorrect)) {
        // Format the correct answer text
        const correctOption = question.options.find((opt: any) => opt.id === question.correctAnswer);
        const answerText = correctOption ? correctOption.text : '';
        
        flashcardsToCreate.push({
          question: question.question,
          answer: `${answerText}\n\n${question.explanation || ''}`,
          workspaceId,
          userId,
          status: 'dont_know',
          pages: question.pages || [],
          fileName: quiz.fileName || ''
        });
      }
    });
    
    if (flashcardsToCreate.length === 0) {
      return { count: 0, message: 'No flashcards created' };
    }
    
    try {
      return await createFlashcardsBatch(flashcardsToCreate);
    } catch (error) {
      console.error('Error in createFlashcardsFromQuiz:', error);
      throw error;
    }
  }, [createFlashcardsBatch]);

  // Initial load
  useEffect(() => {
    if (workspaceId) {
      fetchFlashcards();
    }
  }, [workspaceId, fetchFlashcards]);

  return {
    flashcards,
    loading,
    error,
    fetchFlashcards,
    createFlashcard,
    createFlashcardsBatch,
    updateFlashcard,
    deleteFlashcard,
    createFlashcardsFromQuiz
  };
}; 