"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Workspace } from '@/app/models/workspace';

/**
 * Custom hook to get the current workspace from both context and URL
 * This hook prioritizes the URL parameter but falls back to the context if not available
 */
export const useCurrentWorkspace = () => {
  const params = useParams();
  const { selectedWorkspace, workspaces, selectWorkspace, loading: contextLoading } = useWorkspace();
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // To prevent unnecessary updates and refreshes
  const urlWorkspaceIdRef = useRef<string | undefined>();
  const initializedRef = useRef(false);

  // Extract workspaceId from URL
  const urlWorkspaceId = params?.workspaceId as string | undefined;

  // Track if URL workspaceId changed
  if (urlWorkspaceIdRef.current !== urlWorkspaceId) {
    urlWorkspaceIdRef.current = urlWorkspaceId;
  }

  useEffect(() => {
    // Skip if already initialized and no changes detected
    if (initializedRef.current && 
        (currentWorkspace?.id === urlWorkspaceId || 
          (!urlWorkspaceId && currentWorkspace?.id === selectedWorkspace?.id))) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Case 1: URL has workspaceId and it exists in workspaces
      if (urlWorkspaceId && workspaces.length > 0) {
        const workspaceFromUrl = workspaces.find(w => w.id === urlWorkspaceId);
        if (workspaceFromUrl) {
          setCurrentWorkspace(workspaceFromUrl);
          
          // Sync the context if different but don't trigger unnecessary updates
          if (selectedWorkspace?.id !== urlWorkspaceId) {
            selectWorkspace(workspaceFromUrl);
          }
        } else {
          // Workspace ID in URL doesn't exist in workspaces list
          setError(`Workspace with ID ${urlWorkspaceId} not found`);
          
          // Fall back to selected workspace from context
          if (selectedWorkspace) {
            setCurrentWorkspace(selectedWorkspace);
          }
        }
      } 
      // Case 2: No URL workspaceId but has selectedWorkspace from context
      else if (selectedWorkspace) {
        setCurrentWorkspace(selectedWorkspace);
      } 
      // Case 3: No URL workspaceId, no selectedWorkspace, but has workspaces
      else if (workspaces.length > 0) {
        setCurrentWorkspace(workspaces[0]);
        selectWorkspace(workspaces[0]);
      }
      // Case 4: No workspaces available yet - handled by loading state
      
      initializedRef.current = true;
    } catch (err) {
      console.error('Error in useCurrentWorkspace:', err);
      setError(err instanceof Error ? err.message : 'Failed to determine current workspace');
    } finally {
      setLoading(false);
    }
  }, [urlWorkspaceId, selectedWorkspace, workspaces, selectWorkspace, currentWorkspace]);

  return {
    currentWorkspace,
    workspaceId: currentWorkspace?.id || '',
    loading: loading || contextLoading,
    error
  };
}; 