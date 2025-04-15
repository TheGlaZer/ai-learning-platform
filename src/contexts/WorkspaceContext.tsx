'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Workspace } from '@/app/models/workspace';
import { FileMetadata } from '@/app/models/file';
import { useAuth } from './AuthContext';
import { getUserWorkspacesClient, createWorkspaceClient, deleteWorkspaceClient } from '@/app/lib-client/workspaceClient';
import { getWorkspaceFilesClient } from '@/app/lib-client/fileClient';

interface WorkspaceContextType {
  workspaces: Workspace[];
  workspaceFiles: Record<string, FileMetadata[]>;
  selectedWorkspace: Workspace | null;
  loading: boolean;
  error: string | null;
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (name: string, description?: string) => Promise<Workspace | null>;
  deleteWorkspace: (workspaceId: string) => Promise<boolean>;
  selectWorkspace: (workspace: Workspace) => void;
  addFileToWorkspace: (workspaceId: string, file: FileMetadata) => void;
  removeFileFromWorkspace: (workspaceId: string, fileId: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceFiles, setWorkspaceFiles] = useState<Record<string, FileMetadata[]>>({});
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { userId, isAuthenticated, accessToken } = useAuth();

  // Save selected workspace to localStorage
  useEffect(() => {
    if (selectedWorkspace) {
      localStorage.setItem('selectedWorkspaceId', selectedWorkspace.id);
    }
  }, [selectedWorkspace]);

  // Load selected workspace from localStorage on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWorkspaceId = localStorage.getItem('selectedWorkspaceId');
      if (savedWorkspaceId && workspaces.length > 0) {
        const workspace = workspaces.find(w => w.id === savedWorkspaceId);
        if (workspace) {
          setSelectedWorkspace(workspace);
        }
      }
    }
  }, [workspaces]);

  // Auto-fetch workspaces when user is authenticated
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchWorkspaces();
    }
  }, [isAuthenticated, userId]);

  const fetchWorkspaces = async () => {
    if (!userId || !accessToken) return;
    
    try {
      setLoading(true);
      const workspacesData = await getUserWorkspacesClient(userId, accessToken);
      setWorkspaces(workspacesData);
      
      // Fetch files for each workspace
      const filesData: Record<string, FileMetadata[]> = {};
      for (const workspace of workspacesData) {
        const files = await getWorkspaceFilesClient(workspace.id, accessToken);
        filesData[workspace.id] = files;
      }
      setWorkspaceFiles(filesData);
      
      // Get saved workspace ID from localStorage
      const savedWorkspaceId = localStorage.getItem('selectedWorkspaceId');
      
      // Try to find the saved workspace in the fetched workspaces
      let workspaceToSelect: Workspace | null = null;
      
      if (savedWorkspaceId) {
        workspaceToSelect = workspacesData.find(w => w.id === savedWorkspaceId) || null;
      }
      
      // If no saved workspace was found or none was saved, use the first one
      if (!workspaceToSelect && workspacesData.length > 0) {
        workspaceToSelect = workspacesData[0];
      }
      
      // Set the selected workspace
      setSelectedWorkspace(workspaceToSelect);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching workspace data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load workspaces. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const selectWorkspace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    localStorage.setItem('selectedWorkspaceId', workspace.id);
  };

  // Add a new file to a workspace
  const addFileToWorkspace = (workspaceId: string, file: FileMetadata) => {
    setWorkspaceFiles(prev => {
      const workspaceFilesList = prev[workspaceId] || [];
      return {
        ...prev,
        [workspaceId]: [file, ...workspaceFilesList]
      };
    });
  };

  // Remove a file from a workspace
  const removeFileFromWorkspace = (workspaceId: string, fileId: string) => {
    setWorkspaceFiles(prev => {
      const workspaceFilesList = prev[workspaceId] || [];
      return {
        ...prev,
        [workspaceId]: workspaceFilesList.filter(file => file.id !== fileId)
      };
    });
  };

  // Create a new workspace
  const createWorkspace = async (name: string, description?: string): Promise<Workspace | null> => {
    if (!userId || !accessToken) return null;
    
    try {
      setLoading(true);
      const newWorkspace = await createWorkspaceClient(userId, name, description, accessToken);
      
      // Update the workspaces list with the new workspace
      setWorkspaces(prevWorkspaces => [...prevWorkspaces, newWorkspace]);
      
      // Initialize the files for this workspace to an empty array
      setWorkspaceFiles(prev => ({
        ...prev,
        [newWorkspace.id]: []
      }));
      
      // Select the newly created workspace
      setSelectedWorkspace(newWorkspace);
      
      return newWorkspace;
    } catch (err) {
      console.error('Error creating workspace:', err);
      setError(err instanceof Error ? err.message : 'Failed to create workspace. Please try again later.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete a workspace
  const deleteWorkspace = async (workspaceId: string): Promise<boolean> => {
    if (!accessToken) return false;
    
    try {
      setLoading(true);
      await deleteWorkspaceClient(workspaceId, accessToken);
      
      // Update the workspaces list by removing the deleted workspace
      setWorkspaces(prevWorkspaces => prevWorkspaces.filter(w => w.id !== workspaceId));
      
      // Remove the workspace files from state
      setWorkspaceFiles(prev => {
        const { [workspaceId]: _, ...rest } = prev;
        return rest;
      });
      
      // If the deleted workspace was selected, select another workspace if available
      if (selectedWorkspace?.id === workspaceId) {
        const remainingWorkspaces = workspaces.filter(w => w.id !== workspaceId);
        if (remainingWorkspaces.length > 0) {
          setSelectedWorkspace(remainingWorkspaces[0]);
          localStorage.setItem('selectedWorkspaceId', remainingWorkspaces[0].id);
        } else {
          setSelectedWorkspace(null);
          localStorage.removeItem('selectedWorkspaceId');
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error deleting workspace:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete workspace. Please try again later.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    workspaces,
    workspaceFiles,
    selectedWorkspace,
    loading,
    error,
    fetchWorkspaces,
    createWorkspace,
    deleteWorkspace,
    selectWorkspace,
    addFileToWorkspace,
    removeFileFromWorkspace
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export default WorkspaceContext; 