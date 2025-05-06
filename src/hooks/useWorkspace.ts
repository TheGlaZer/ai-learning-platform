"use client";

import { useState, useEffect } from 'react';
import { Workspace } from '@/app/models/workspace';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Custom hook to get workspace data by ID
 */
export const useWorkspace = (workspaceId: string) => {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();

  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!workspaceId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // For now, just return a placeholder workspace from localStorage
        if (typeof window !== 'undefined') {
          const savedWorkspaces = localStorage.getItem('workspaces');
          if (savedWorkspaces) {
            const workspaces = JSON.parse(savedWorkspaces);
            const workspace = workspaces.find((w: any) => w.id === workspaceId);
            if (workspace) {
              setCurrentWorkspace(workspace);
            }
          }
        }
        
        // Later this would be replaced with an API call

      } catch (err: any) {
        console.error('Error fetching workspace:', err);
        setError(err.message || 'Failed to fetch workspace');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspace();
  }, [workspaceId, accessToken]);

  return {
    currentWorkspace,
    isLoading,
    error
  };
}; 