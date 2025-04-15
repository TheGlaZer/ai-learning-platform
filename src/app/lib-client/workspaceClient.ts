// services/api/workspaceClient.ts
import axiosInstance from '../lib/axios';
import { Workspace } from '@/app/models/workspace';
import { AxiosError } from 'axios';

/**
 * Get all workspaces for a user
 */
export async function getUserWorkspacesClient(userId: string, token: string): Promise<Workspace[]> {
  try {
    const response = await axiosInstance.get(`/api/workspaces?userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 401) {
        throw new Error('Authentication error: Please log in again to view workspaces');
      }
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
    }
    console.error('Error fetching user workspaces:', error);
    throw new Error('Failed to fetch workspaces. Please try again later.');
  }
}

/**
 * Create a new workspace
 */
export async function createWorkspaceClient(
  userId: string,
  name: string,
  description?: string,
  token?: string
): Promise<Workspace> {
  try {
    const response = await axiosInstance.post('/api/workspaces', {
      userId,
      name,
      description
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 401) {
        throw new Error('Authentication error: Please log in again to create a workspace');
      }
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
    }
    console.error('Error creating workspace:', error);
    throw new Error('Failed to create workspace. Please try again later.');
  }
}

/**
 * Update an existing workspace
 */
export async function updateWorkspaceClient(
  workspace: Workspace,
  token: string
): Promise<Workspace> {
  try {
    const response = await axiosInstance.put(`/api/workspaces/${workspace.id}`, workspace, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 401) {
        throw new Error('Authentication error: Please log in again to update workspace');
      }
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
    }
    console.error('Error updating workspace:', error);
    throw new Error('Failed to update workspace. Please try again later.');
  }
}

/**
 * Delete a workspace
 */
export async function deleteWorkspaceClient(workspaceId: string, token: string): Promise<void> {
  try {
    const response = await axiosInstance.delete(`/api/workspaces/${workspaceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Check for successful response
    if (response.status !== 200) {
      throw new Error(`Failed to delete workspace with status: ${response.status}`);
    }
    
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 401) {
        throw new Error('Authentication error: Please log in again to delete workspace');
      }
      if (error.response?.status === 404) {
        throw new Error('Workspace not found. It may have already been deleted.');
      }
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
    }
    console.error('Error deleting workspace:', error);
    throw new Error('Failed to delete workspace. Please try again later.');
  }
}
