// services/api/fileClient.ts
import axiosInstance from '../lib/axios';
import { FileMetadata } from '@/app/models/file';
import { AxiosError } from 'axios';

/**
 * Upload a file to the server via /api/files/upload.
 * Expects a multipart/form-data request containing userId, workspaceId, and file.
 *
 * @param userId      - The ID of the user uploading the file.
 * @param workspaceId - The ID of the workspace to associate with the file.
 * @param file        - The File object to upload.
 * @returns The server response, typically the file metadata.
 */
export async function uploadFileClient(
  userId: string,
  workspaceId: string,
  file: File,
  token: string
) {
  try {
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('workspaceId', workspaceId);
    formData.append('file', file);

    const response = await axiosInstance.post('/api/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Fetch all files for a given workspace.
 *
 * @param workspaceId - The workspace ID whose files should be fetched.
 * @param token - The authentication token
 * @returns A promise that resolves to an array of FileMetadata objects.
 */
export async function getWorkspaceFilesClient(workspaceId: string, token: string): Promise<FileMetadata[]> {
  try {
    const response = await axiosInstance.get(`/api/files?workspaceId=${workspaceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 401) {
        throw new Error('Authentication error: Please log in again to view files');
      }
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
    }
    console.error('Error fetching workspace files:', error);
    throw new Error('Failed to fetch files. Please try again later.');
  }
}

/**
 * Delete a file by ID.
 * 
 * @param fileId - The ID of the file to delete
 * @param token - The authentication token
 * @returns A promise that resolves to a success object
 */
export async function deleteFileClient(
  fileId: string,
  token: string
): Promise<{ success: boolean }> {
  try {
    const response = await axiosInstance.delete(`/api/files?fileId=${fileId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

export const updateFileMetadata = async (
  fileId: string,
  updates: Partial<FileMetadata>,
  accessToken: string
): Promise<boolean> => {
  try {
    const response = await fetch(`/api/files/${fileId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error updating file metadata:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating file metadata:', error);
    return false;
  }
};
