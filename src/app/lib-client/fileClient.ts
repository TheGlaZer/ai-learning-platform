// services/api/fileClient.ts
import axiosInstance from './axiosInstance';
import { FileMetadata } from '@/app/models/file';

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
}

/**
 * Fetch all files for a given workspace.
 *
 * @param workspaceId - The workspace ID whose files should be fetched.
 * @returns A promise that resolves to an array of FileMetadata objects.
 */
export async function getWorkspaceFilesClient(workspaceId: string): Promise<FileMetadata[]> {
  const response = await axiosInstance.get(`/api/files?workspaceId=${workspaceId}`);
  return response.data;
}
