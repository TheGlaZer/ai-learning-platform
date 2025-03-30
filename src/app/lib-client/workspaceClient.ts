// services/api/workspaceClient.ts
import axiosInstance from './axiosInstance';
import { Workspace } from '@/app/models/workspace';

/**
 * Fetch all workspaces for a given user.
 *
 * @param userId - The user ID whose workspaces should be fetched.
 * @returns A promise that resolves to an array of Workspace objects.
 */
export async function getUserWorkspacesClient(userId: string): Promise<Workspace[]> {
  const response = await axiosInstance.get(`/api/workspaces?userId=${userId}`);
  return response.data;
}

/**
 * Create a new workspace for a given user.
 *
 * @param userId      - The user ID creating the workspace.
 * @param name        - The name of the workspace.
 * @param description - Optional description of the workspace.
 * @param token       - Access token for authentication.
 * @returns A promise that resolves to the newly created Workspace.
 */
export async function createWorkspaceClient(
  userId: string,
  name: string,
  description?: string,
  token?: string | null
): Promise<Workspace> {
  const response = await axiosInstance.post('/api/workspaces', {
    userId,
    name,
    description,
    token // Include the token in the request body
  });
  return response.data;
}
