"use client";
import { useState, useEffect } from 'react';
import { Pattern } from '@/app/models/pattern';
import { 
  getWorkspacePatternsClient,
  getPastExamPatternsClient,
  generatePatternClient,
  deletePatternClient,
  updatePatternClient
} from '@/app/lib-client/patternClient';
import { useAuth } from '@/contexts/AuthContext';

export const usePatterns = (userId: string | null) => {
  const [workspacePatterns, setWorkspacePatterns] = useState<{ [workspaceId: string]: Pattern[] }>({});
  const [pastExamPatterns, setPastExamPatterns] = useState<{ [pastExamId: string]: Pattern[] }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();
  
  /**
   * Fetches patterns for a workspace
   */
  const fetchWorkspacePatterns = async (workspaceId: string): Promise<Pattern[]> => {
    // If already loading, don't make another request
    if (isLoading) {
      return workspacePatterns[workspaceId] || [];
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      if (!accessToken) {
        throw new Error('No access token available. Please log in again.');
      }
      
      const patterns = await getWorkspacePatternsClient(workspaceId, accessToken);
      
      setWorkspacePatterns(prev => ({
        ...prev,
        [workspaceId]: patterns
      }));
      
      return patterns;
    } catch (err: any) {
      console.error('Error fetching workspace patterns:', err);
      setError(err.message || 'Failed to fetch patterns');
      
      // Return any existing patterns we might have to prevent UI disruption
      return workspacePatterns[workspaceId] || [];
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Fetches patterns for a past exam
   */
  const fetchPastExamPatterns = async (pastExamId: string): Promise<Pattern[]> => {
    // If already loading, don't make another request
    if (isLoading) {
      return pastExamPatterns[pastExamId] || [];
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      if (!accessToken) {
        throw new Error('No access token available. Please log in again.');
      }
      
      const patterns = await getPastExamPatternsClient(pastExamId, accessToken);
      
      setPastExamPatterns(prev => ({
        ...prev,
        [pastExamId]: patterns
      }));
      
      return patterns;
    } catch (err: any) {
      console.error('Error fetching past exam patterns:', err);
      setError(err.message || 'Failed to fetch patterns');
      
      // Return any existing patterns we might have to prevent UI disruption
      return pastExamPatterns[pastExamId] || [];
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Generates a pattern for a past exam
   */
  const generatePattern = async (pastExamId: string, workspaceId: string): Promise<Pattern | null> => {
    if (!userId) {
      setError('User must be authenticated to generate patterns');
      return null;
    }
    
    setError(null);
    setIsGenerating(true);
    
    try {
      if (!accessToken) {
        throw new Error('No access token available. Please log in again.');
      }
      
      const pattern = await generatePatternClient(pastExamId, workspaceId, accessToken);
      
      // Update the patterns lists
      setPastExamPatterns(prev => ({
        ...prev,
        [pastExamId]: [pattern, ...(prev[pastExamId] || [])]
      }));
      
      setWorkspacePatterns(prev => ({
        ...prev,
        [workspaceId]: [pattern, ...(prev[workspaceId] || [])]
      }));
      
      return pattern;
    } catch (err: any) {
      setError(err.message || 'Failed to generate pattern');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };
  
  /**
   * Updates a pattern
   */
  const updatePattern = async (patternId: string, updates: Partial<Pattern>): Promise<Pattern | null> => {
    setError(null);
    
    try {
      if (!accessToken) {
        throw new Error('No access token available. Please log in again.');
      }
      
      const updatedPattern = await updatePatternClient(patternId, updates, accessToken);
      
      // Update the patterns lists
      setPastExamPatterns(prev => {
        const newPatterns = { ...prev };
        
        for (const pastExamId in newPatterns) {
          newPatterns[pastExamId] = newPatterns[pastExamId].map(p => 
            p.id === patternId ? updatedPattern : p
          );
        }
        
        return newPatterns;
      });
      
      setWorkspacePatterns(prev => {
        const newPatterns = { ...prev };
        
        for (const workspaceId in newPatterns) {
          newPatterns[workspaceId] = newPatterns[workspaceId].map(p => 
            p.id === patternId ? updatedPattern : p
          );
        }
        
        return newPatterns;
      });
      
      return updatedPattern;
    } catch (err: any) {
      setError(err.message || 'Failed to update pattern');
      return null;
    }
  };
  
  /**
   * Deletes a pattern
   */
  const deletePattern = async (patternId: string): Promise<boolean> => {
    setError(null);
    
    try {
      if (!accessToken) {
        throw new Error('No access token available. Please log in again.');
      }
      
      const success = await deletePatternClient(patternId, accessToken);
      
      if (success) {
        // Update the patterns lists
        setPastExamPatterns(prev => {
          const newPatterns = { ...prev };
          
          for (const pastExamId in newPatterns) {
            newPatterns[pastExamId] = newPatterns[pastExamId].filter(p => p.id !== patternId);
          }
          
          return newPatterns;
        });
        
        setWorkspacePatterns(prev => {
          const newPatterns = { ...prev };
          
          for (const workspaceId in newPatterns) {
            newPatterns[workspaceId] = newPatterns[workspaceId].filter(p => p.id !== patternId);
          }
          
          return newPatterns;
        });
      }
      
      return success;
    } catch (err: any) {
      setError(err.message || 'Failed to delete pattern');
      return false;
    }
  };
  
  return {
    workspacePatterns,
    pastExamPatterns,
    isLoading,
    isGenerating,
    error,
    fetchWorkspacePatterns,
    fetchPastExamPatterns,
    generatePattern,
    updatePattern,
    deletePattern
  };
}; 