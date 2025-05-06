/**
 * Options for vector search operations
 */
export interface SearchOptions {
  /**
   * Maximum number of results to return
   */
  limit?: number;
  
  /**
   * Similarity threshold (0-1) for matching
   */
  threshold?: number;
  
  /**
   * Filters to apply to search results
   */
  filters?: Record<string, any>;
  
  /**
   * Whether to include metadata in results
   */
  includeMetadata?: boolean;
}

/**
 * Search result format for vector searches
 */
export interface SearchResult<T> {
  /**
   * The matched item
   */
  item: T;
  
  /**
   * Similarity score (0-1) with query
   */
  similarity: number;
}

/**
 * Interface for vector search services
 * Provides methods for semantic search functionality
 */
export interface VectorSearchService {
  /**
   * Search for subjects by semantic similarity
   * @param query The search query text
   * @param options Search configuration options
   * @returns Promise resolving to matching subjects with similarity scores
   */
  searchSubjects(query: string, options?: SearchOptions): Promise<SearchResult<any>[]>;
  
  /**
   * Search for files by semantic similarity
   * @param query The search query text
   * @param options Search configuration options
   * @returns Promise resolving to matching files with similarity scores
   */
  searchFiles(query: string, options?: SearchOptions): Promise<SearchResult<any>[]>;
  
  /**
   * Search for quiz questions by semantic similarity
   * @param query The search query text
   * @param options Search configuration options
   * @returns Promise resolving to matching quiz questions with similarity scores
   */
  searchQuizQuestions(query: string, options?: SearchOptions): Promise<SearchResult<any>[]>;
  
  /**
   * Generic vector search method for any content type
   * @param query The search query text
   * @param tableName Database table to search in
   * @param embeddingColumn Column containing the embedding vector
   * @param options Search configuration options
   * @returns Promise resolving to search results
   */
  search<T>(
    query: string,
    tableName: string,
    embeddingColumn: string,
    options?: SearchOptions
  ): Promise<SearchResult<T>[]>;
} 