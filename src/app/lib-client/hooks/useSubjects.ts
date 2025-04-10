import { useState, useEffect } from 'react';
import { Subject } from '@/app/models/subject';
import { getWorkspaceSubjectsClient } from '@/app/lib-client/subjectClient';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export function useSubjects(workspaceId?: string) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsMap, setSubjectsMap] = useState<Record<string, Subject>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { accessToken } = useAuth();
  const { selectedWorkspace } = useWorkspace();
  
  // Use the provided workspaceId or fall back to the selected workspace from context
  const effectiveWorkspaceId = workspaceId || selectedWorkspace?.id;

  const fetchSubjects = async (workspaceIdParam = effectiveWorkspaceId) => {
    if (!workspaceIdParam) {
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const fetchedSubjects = await getWorkspaceSubjectsClient(workspaceIdParam);
      setSubjects(fetchedSubjects);
      
      // Create a map of id -> subject for easy lookup
      const subjectsMapData = fetchedSubjects.reduce<Record<string, Subject>>(
        (acc, subject) => {
          if (subject.id) {
            acc[subject.id] = subject;
          }
          return acc;
        }, 
        {}
      );
      
      setSubjectsMap(subjectsMapData);
      return fetchedSubjects;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch subjects';
      const error = new Error(errorMessage);
      setError(error);
      console.error('Error fetching subjects:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Get a subject name by ID with fallback
  const getSubjectName = (subjectId: string) => {
    if (!subjectId) return 'Unknown Subject';
    
    const subject = subjectsMap[subjectId];
    if (subject?.name) {
      return subject.name;
    }
    
    // Return a formatted short version of the ID if no name is found
    return `Subject ${subjectId.substring(0, 8)}`;
  };

  useEffect(() => {
    if (effectiveWorkspaceId) {
      fetchSubjects(effectiveWorkspaceId);
    }
  }, [effectiveWorkspaceId]);

  return {
    subjects,
    subjectsMap,
    isLoading,
    error,
    fetchSubjects,
    getSubjectName
  };
} 