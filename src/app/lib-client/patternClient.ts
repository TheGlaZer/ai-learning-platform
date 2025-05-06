import axios from 'axios';
import { Pattern } from '../models/pattern';

/**
 * Fetches all patterns for a workspace
 */
export async function getWorkspacePatternsClient(workspaceId: string, token: string): Promise<Pattern[]> {
  try {
    const response = await axios.get('/api/patterns', {
      params: { workspaceId },
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching workspace patterns:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch patterns');
  }
}

/**
 * Fetches patterns for a specific past exam
 */
export async function getPastExamPatternsClient(pastExamId: string, token: string): Promise<Pattern[]> {
  try {
    const response = await axios.get('/api/patterns', {
      params: { pastExamId },
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching past exam patterns:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch patterns');
  }
}

/**
 * Fetches a specific pattern by ID
 */
export async function getPatternByIdClient(patternId: string, token: string): Promise<Pattern> {
  try {
    const response = await axios.get('/api/patterns', {
      params: { id: patternId },
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching pattern:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch pattern');
  }
}

/**
 * Generates a pattern for a past exam
 */
export async function generatePatternClient(pastExamId: string, workspaceId: string, token: string): Promise<Pattern> {
  try {
    const response = await axios.post('/api/patterns', {
      generateFor: 'pastExam',
      pastExamId,
      workspaceId
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error generating pattern:', error);
    throw new Error(error.response?.data?.error || 'Failed to generate pattern');
  }
}

/**
 * Creates a new pattern
 */
export async function createPatternClient(pattern: Omit<Pattern, 'id' | 'created_at' | 'updated_at'>, token: string): Promise<Pattern> {
  try {
    const response = await axios.post('/api/patterns', {
      pattern
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error creating pattern:', error);
    throw new Error(error.response?.data?.error || 'Failed to create pattern');
  }
}

/**
 * Updates an existing pattern
 */
export async function updatePatternClient(id: string, updates: Partial<Pattern>, token: string): Promise<Pattern> {
  try {
    const response = await axios.patch('/api/patterns', {
      id,
      updates
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error updating pattern:', error);
    throw new Error(error.response?.data?.error || 'Failed to update pattern');
  }
}

/**
 * Deletes a pattern
 */
export async function deletePatternClient(id: string, token: string): Promise<boolean> {
  try {
    const response = await axios.delete('/api/patterns', {
      params: { id },
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    return response.data.success;
  } catch (error: any) {
    console.error('Error deleting pattern:', error);
    throw new Error(error.response?.data?.error || 'Failed to delete pattern');
  }
} 