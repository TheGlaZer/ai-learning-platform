// services/api/fileClient.ts
import axiosInstance from './axiosInstance';

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
  file: File
) {
  const formData = new FormData();
  formData.append('userId', userId);
  formData.append('workspaceId', workspaceId);
  formData.append('file', file);

  const response = await axiosInstance.post('/api/files', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}
