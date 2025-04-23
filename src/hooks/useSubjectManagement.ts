"use client";
import { useState } from 'react';
import { Subject, SubjectGenerationParams } from '@/app/models/subject';
import { 
  getWorkspaceSubjectsClient, 
  createSubjectClient, 
  updateSubjectClient, 
  deleteSubjectClient,
  generateSubjectsClient
} from '@/app/lib-client/subjectClient';
import { useAuth } from '@/contexts/AuthContext';

interface UseSubjectManagementReturn {
  workspaceSubjects: Record<string, Subject[]>;
  generatedSubjects: Subject[] | null;
  generatedNewSubjects: Subject[] | null;
  generatedExistingSubjects: Subject[] | null;
  selectedSubject: Subject | null;
  loading: boolean;
  generating: boolean;
  error: string | null;
  unrelatedContentMessage: string | null;
  lastAIResponse: any | null;
  fetchWorkspaceSubjects: (workspaceId: string) => Promise<Subject[]>;
  createSubject: (subject: Partial<Subject>) => Promise<Subject | null>;
  updateSubject: (id: string, updates: Partial<Subject>) => Promise<Subject | null>;
  deleteSubject: (id: string) => Promise<boolean>;
  generateSubjects: (params: SubjectGenerationParams) => Promise<Subject[]>;
  selectSubject: (subject: Subject) => void;
  clearGeneratedSubjects: () => void;
  saveGeneratedSubjects: () => Promise<Subject[]>;
  resetState: () => void;
  updateSelectedNewSubjects: (selectedSubjects: Subject[]) => void;
}

export const useSubjectManagement = (userId: string | null): UseSubjectManagementReturn => {
  const [workspaceSubjects, setWorkspaceSubjects] = useState<Record<string, Subject[]>>({});
  const [generatedSubjects, setGeneratedSubjects] = useState<Subject[] | null>(null);
  const [generatedNewSubjects, setGeneratedNewSubjects] = useState<Subject[] | null>(null);
  const [generatedExistingSubjects, setGeneratedExistingSubjects] = useState<Subject[] | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [unrelatedContentMessage, setUnrelatedContentMessage] = useState<string | null>(null);
  const [lastAIResponse, setLastAIResponse] = useState<any | null>(null);
  const { accessToken } = useAuth();

  const fetchWorkspaceSubjects = async (workspaceId: string): Promise<Subject[]> => {
    if (!workspaceId) return [];
    
    // Return cached subjects if available and not loading
    if (workspaceSubjects[workspaceId] && !loading) {
      return workspaceSubjects[workspaceId];
    }
    
    try {
      setLoading(true);
      const subjects = await getWorkspaceSubjectsClient(workspaceId);
      
      // Update state with the fetched subjects
      setWorkspaceSubjects(prev => ({
        ...prev,
        [workspaceId]: subjects
      }));
      
      setError(null);
      return subjects;
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to fetch subjects. Please try again later.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createSubject = async (
    subject: Partial<Subject>
  ): Promise<Subject | null> => {
    if (!userId || !subject.workspaceId) return null;
    
    try {
      setLoading(true);
      const newSubject = await createSubjectClient({
        workspaceId: subject.workspaceId,
        userId: subject.userId || userId,
        name: subject.name || '',
        description: subject.description,
        source: subject.source || 'manual',
        order: subject.order
      }, accessToken);
      
      // Update state with the new subject
      setWorkspaceSubjects(prev => {
        const workspaceSubjectsList = prev[subject.workspaceId!] || [];
        return {
          ...prev,
          [subject.workspaceId!]: [newSubject, ...workspaceSubjectsList]
        };
      });
      
      setError(null);
      return newSubject;
    } catch (err) {
      console.error('Error creating subject:', err);
      setError('Failed to create subject. Please try again later.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateSubject = async (
    id: string, 
    updates: Partial<Subject>
  ): Promise<Subject | null> => {
    try {
      setLoading(true);
      const updatedSubject = await updateSubjectClient(id, updates, accessToken);
      
      // Update state with the updated subject
      setWorkspaceSubjects(prev => {
        const workspaceId = updatedSubject.workspaceId;
        const workspaceSubjectsList = prev[workspaceId] || [];
        
        return {
          ...prev,
          [workspaceId]: workspaceSubjectsList.map(subject => 
            subject.id === id ? updatedSubject : subject
          )
        };
      });
      
      // If this is the selected subject, update it too
      if (selectedSubject?.id === id) {
        setSelectedSubject(updatedSubject);
      }
      
      setError(null);
      return updatedSubject;
    } catch (err) {
      console.error('Error updating subject:', err);
      setError('Failed to update subject. Please try again later.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteSubject = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Get the subject before deleting it to know which workspaceId it belongs to
      let workspaceId = '';
      
      // Find the subject in workspaceSubjects
      for (const [wsId, subjects] of Object.entries(workspaceSubjects)) {
        const subjectToDelete = subjects.find(s => s.id === id);
        if (subjectToDelete) {
          workspaceId = wsId;
          break;
        }
      }
      
      if (!workspaceId) {
        throw new Error('Subject not found in state');
      }
      
      await deleteSubjectClient(id, accessToken);
      
      // Update state to remove the deleted subject
      setWorkspaceSubjects(prev => {
        const workspaceSubjectsList = prev[workspaceId] || [];
        return {
          ...prev,
          [workspaceId]: workspaceSubjectsList.filter(subject => subject.id !== id)
        };
      });
      
      // If this is the selected subject, clear the selection
      if (selectedSubject?.id === id) {
        setSelectedSubject(null);
      }
      
      // If this subject is in generatedSubjects, remove it from there too
      if (generatedSubjects?.some(s => s.id === id)) {
        setGeneratedSubjects(prev => prev ? prev.filter(s => s.id !== id) : null);
      }
      
      setError(null);
      return true;
    } catch (err) {
      console.error('Error deleting subject:', err);
      setError('Failed to delete subject. Please try again later.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const generateSubjects = async (params: SubjectGenerationParams): Promise<Subject[]> => {
    if (!userId || !params.workspaceId || !params.fileId) {
      return [];
    }
    
    try {
      setGenerating(true);
      setUnrelatedContentMessage(null);
      setLastAIResponse(null);
      
      // If we don't have any subjects for this workspace yet, fetch them first
      if (!workspaceSubjects[params.workspaceId]) {
        await fetchWorkspaceSubjects(params.workspaceId);
      }
      
      const response = await generateSubjectsClient({
        ...params,
        userId: userId
      }, accessToken);
      
      // Check for unrelated content status
      if (response.status === 'unrelated_content') {
        setUnrelatedContentMessage(response.message || 'The provided content appears unrelated to academic subjects.');
        setGeneratedSubjects([]);
        setGeneratedNewSubjects([]);
        setGeneratedExistingSubjects(response.existingSubjects || []);
        setError(null);
        setLastAIResponse(response.debugInfo?.aiDebug || null);
        return [];
      }
      
      // Save the response for debugging
      if (response.debugInfo?.aiDebug) {
        setLastAIResponse(response.debugInfo.aiDebug);
      }
      
      // Get the existing and new subjects from the response
      const existingSubjects = response.existingSubjects || [];
      const newSubjects = response.newSubjects || [];
      
      // Combine them for backward compatibility with components expecting a single array
      const allSubjects = [...existingSubjects, ...newSubjects];
      
      // Save all the generated subjects in state (for backward compatibility)
      setGeneratedSubjects(allSubjects);
      
      // Save the new and existing subjects separately
      setGeneratedNewSubjects(newSubjects);
      setGeneratedExistingSubjects(existingSubjects);
      
      // Don't automatically add to workspace subjects - user will confirm first
      
      setError(null);
      return allSubjects;
    } catch (err) {
      console.error('Error generating subjects:', err);
      setError('Failed to generate subjects. Please try again later.');
      return [];
    } finally {
      setGenerating(false);
    }
  };

  const selectSubject = (subject: Subject) => {
    setSelectedSubject(subject);
  };

  const clearGeneratedSubjects = () => {
    setGeneratedSubjects(null);
    setGeneratedNewSubjects(null);
    setGeneratedExistingSubjects(null);
  };

  /**
   * Update the generatedNewSubjects array with only the selected subjects
   */
  const updateSelectedNewSubjects = (selectedSubjects: Subject[]): void => {
    if (!generatedNewSubjects) return;
    
    // Filter generatedNewSubjects to only include the ones in selectedSubjects
    const newSelected = selectedSubjects.filter(selected => 
      generatedNewSubjects.some(generated => 
        (!generated.id && !selected.id && generated.name === selected.name) ||
        (generated.id && selected.id && generated.id === selected.id)
      )
    );
    
    // Update the generatedNewSubjects state with only the selected ones
    setGeneratedNewSubjects(newSelected);
  };

  /**
   * Save all currently generated subjects to the database
   * @returns An array of saved subjects
   */
  const saveGeneratedSubjects = async (): Promise<Subject[]> => {
    if (!generatedNewSubjects || generatedNewSubjects.length === 0) {
      return [];
    }
    
    try {
      setLoading(true);
      const savedSubjects: Subject[] = [];
      
      // Get max order of existing subjects to ensure new ones are added at the end
      const workspaceId = generatedNewSubjects[0].workspaceId;
      const existingSubjects = workspaceSubjects[workspaceId] || [];
      const maxOrder = existingSubjects.length > 0
        ? Math.max(...existingSubjects.map(s => s.order || 0))
        : -1;
      
      // Save each subject one by one
      for (let i = 0; i < generatedNewSubjects.length; i++) {
        const subject = generatedNewSubjects[i];
        
        const savedSubject = await createSubjectClient({
          ...subject,
          order: maxOrder + i + 1, // Ensure new subjects are at the end in order
        }, accessToken);
        
        savedSubjects.push(savedSubject);
      }
      
      // Update our local state
      setWorkspaceSubjects(prev => {
        const currentSubjects = prev[workspaceId] || [];
        return {
          ...prev,
          [workspaceId]: [...currentSubjects, ...savedSubjects]
        };
      });
      
      // Clear generated subjects since they're now saved
      clearGeneratedSubjects();
      
      return savedSubjects;
    } catch (error) {
      console.error('Error saving generated subjects:', error);
      setError('Failed to save subjects. Please try again later.');
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Reset all state in this hook
   */
  const resetState = () => {
    setSelectedSubject(null);
    setGeneratedSubjects(null);
    setGeneratedNewSubjects(null);
    setGeneratedExistingSubjects(null);
    setError(null);
    setUnrelatedContentMessage(null);
    setLastAIResponse(null);
  };

  return {
    workspaceSubjects,
    generatedSubjects,
    generatedNewSubjects,
    generatedExistingSubjects,
    selectedSubject,
    loading,
    generating,
    error,
    unrelatedContentMessage,
    lastAIResponse,
    fetchWorkspaceSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
    generateSubjects,
    selectSubject,
    clearGeneratedSubjects,
    saveGeneratedSubjects,
    resetState,
    updateSelectedNewSubjects
  };
}; 