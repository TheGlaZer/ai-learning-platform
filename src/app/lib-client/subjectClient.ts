// src/app/lib-client/subjectClient.ts
import axiosInstance from '../lib/axios';
import { Subject, SubjectGenerationParams } from '@/app/models/subject';

/**
 * Fetch all subjects for a given workspace.
 *
 * @param workspaceId - The workspace ID to fetch subjects for
 * @returns A promise that resolves to an array of Subject objects.
 */
export async function getWorkspaceSubjectsClient(workspaceId: string): Promise<Subject[]> {
  try {
    const response = await axiosInstance.get(`/api/subjects?workspaceId=${workspaceId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching workspace subjects:', error);
    throw error;
  }
}

/**
 * Create a new subject in a workspace.
 *
 * @param subject - The subject to create
 * @param token - Access token for authentication
 * @returns A promise that resolves to the created Subject
 */
export async function createSubjectClient(
  subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>,
  token?: string | null
): Promise<Subject> {
  try {
    const response = await axiosInstance.post('/api/subjects', {
      ...subject,
      token
    });
    return response.data;
  } catch (error) {
    console.error('Error creating subject:', error);
    throw error;
  }
}

/**
 * Update an existing subject.
 *
 * @param id - The ID of the subject to update
 * @param updates - The fields to update
 * @param token - Access token for authentication
 * @returns A promise that resolves to the updated Subject
 */
export async function updateSubjectClient(
  id: string,
  updates: Partial<Subject>,
  token?: string | null
): Promise<Subject> {
  try {
    const response = await axiosInstance.put(`/api/subjects/${id}`, {
      ...updates,
      token
    });
    return response.data;
  } catch (error) {
    console.error('Error updating subject:', error);
    throw error;
  }
}

/**
 * Delete a subject.
 *
 * @param id - The ID of the subject to delete
 * @param token - Access token for authentication
 * @returns A promise that resolves when the subject is deleted
 */
export async function deleteSubjectClient(
  id: string,
  token?: string | null
): Promise<void> {
  try {
    await axiosInstance.delete(`/api/subjects/${id}`, {
      data: { token }
    });
  } catch (error) {
    console.error('Error deleting subject:', error);
    throw error;
  }
}

/**
 * Generate subjects from a file in a workspace.
 *
 * @param params - Parameters for subject generation
 * @param token - Access token for authentication
 * @returns A promise that resolves to the response with subjects or status
 */
export async function generateSubjectsClient(
  params: SubjectGenerationParams,
  token?: string | null
): Promise<{
  existingSubjects?: Subject[],
  newSubjects?: Subject[],
  status?: string,
  message?: string,
  count?: number,
  newSubjectsCount?: number,
  existingSubjectsCount?: number,
  hasNewSubjects?: boolean,
  debugInfo?: any
}> {
  try {
    const response = await axiosInstance.post('/api/subjects/generate', {
      ...params,
      token
    });
    return response.data;
  } catch (error) {
    console.error('Error generating subjects:', error);
    throw error;
  }
} 