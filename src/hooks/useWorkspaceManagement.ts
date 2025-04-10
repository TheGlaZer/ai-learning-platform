"use client";
import { useState } from 'react';
import { Workspace } from '@/app/models/workspace';
import { createWorkspaceClient, getUserWorkspacesClient } from '@/app/lib-client/workspaceClient';
import { getWorkspaceFilesClient } from '@/app/lib-client/fileClient';
import { FileMetadata } from '@/app/models/file';
import { useAuth } from '@/contexts/AuthContext';

interface UseWorkspaceManagementReturn {
  workspaces: Workspace[];
  workspaceFiles: Record<string, FileMetadata[]>;
  selectedWorkspace: Workspace | null;
  loading: boolean;
  error: string | null;
  fetchWorkspaces: (userId: string) => Promise<void>;
  createWorkspace: (name: string, description?: string) => Promise<Workspace | null>;
  selectWorkspace: (workspace: Workspace) => void;
  addFileToWorkspace: (workspaceId: string, file: FileMetadata) => void;
  removeFileFromWorkspace: (workspaceId: string, fileId: string) => void;
}

export const useWorkspaceManagement = (userId: string | null): UseWorkspaceManagementReturn => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceFiles, setWorkspaceFiles] = useState<Record<string, FileMetadata[]>>({});
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();

  const fetchWorkspaces = async (userId: string) => {
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
      
      // Set the first workspace as selected by default if available
      if (workspacesData.length > 0 && !selectedWorkspace) {
        setSelectedWorkspace(workspacesData[0]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching workspace data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load workspaces. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

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

  const selectWorkspace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
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

  return {
    workspaces,
    workspaceFiles,
    selectedWorkspace,
    loading,
    error,
    fetchWorkspaces,
    createWorkspace,
    selectWorkspace,
    addFileToWorkspace,
    removeFileFromWorkspace
  };
};