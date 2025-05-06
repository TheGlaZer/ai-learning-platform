import axiosInstance from '../lib/axios';

/**
 * Options for vector search
 */
export interface VectorSearchOptions {
  /** Maximum number of results to return */
  limit?: number;
  
  /** Similarity threshold (0-1) */
  threshold?: number;
  
  /** Any additional filter criteria */
  filters?: Record<string, any>;
}

/**
 * Result from a vector search
 */
export interface VectorSearchResult<T> {
  /** The matched item */
  item: T;
  
  /** The similarity score (0-1) */
  similarity: number;
}

/**
 * Perform a semantic vector search on content
 * @param query The search query text
 * @param contentType Type of content to search ('subjects', 'files', 'quiz_questions')
 * @param workspaceId Optional workspace ID to filter by
 * @param options Additional search options
 * @returns Promise resolving to search results
 */
export async function vectorSearch<T>(
  query: string,
  contentType: 'subjects' | 'files' | 'quiz_questions',
  workspaceId?: string,
  options?: VectorSearchOptions
): Promise<VectorSearchResult<T>[]> {
  try {
    const response = await axiosInstance.post('/api/search/vector', {
      query,
      contentType,
      workspaceId,
      options
    });
    
    return response.data.results;
  } catch (error) {
    console.error('Vector search error:', error);
    throw error;
  }
}

/**
 * Find subjects similar to a query
 * @param query The search query text
 * @param workspaceId Workspace ID to search in
 * @param options Search options
 * @returns Promise resolving to similar subjects
 */
export async function findSimilarSubjects<T>(
  query: string,
  workspaceId: string,
  options?: VectorSearchOptions
): Promise<VectorSearchResult<T>[]> {
  return vectorSearch<T>(query, 'subjects', workspaceId, options);
}

/**
 * Find quiz questions similar to a query
 * @param query The search query text
 * @param workspaceId Workspace ID to search in
 * @param options Search options
 * @returns Promise resolving to similar quiz questions
 */
export async function findSimilarQuestions<T>(
  query: string,
  workspaceId: string,
  options?: VectorSearchOptions
): Promise<VectorSearchResult<T>[]> {
  return vectorSearch<T>(query, 'quiz_questions', workspaceId, options);
}

/**
 * Find files similar to a query
 * @param query The search query text
 * @param workspaceId Workspace ID to search in
 * @param options Search options
 * @returns Promise resolving to similar files
 */
export async function findSimilarFiles<T>(
  query: string,
  workspaceId: string,
  options?: VectorSearchOptions
): Promise<VectorSearchResult<T>[]> {
  return vectorSearch<T>(query, 'files', workspaceId, options);
} 