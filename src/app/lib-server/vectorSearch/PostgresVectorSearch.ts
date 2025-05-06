import { SearchOptions, SearchResult, VectorSearchService } from './VectorSearchService';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Subject } from '@/app/models/subject';
import { FileMetadata } from '@/app/models/file';
import { QuizQuestion } from '@/app/models/quiz';
import EmbeddingManager from '../vectorEmbedding';
import { getAuthenticatedClient, supabase } from '../supabaseClient';

/**
 * PostgreSQL implementation of vector search using pgvector
 * This service leverages Supabase's PostgreSQL database with pgvector extension
 */
export class PostgresVectorSearch implements VectorSearchService {
  private supabase: SupabaseClient;
  
  /**
   * Create a new PostgresVectorSearch instance
   * @param supabaseClient Optional Supabase client (defaults to shared instance)
   */
  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || supabase;
  }
  
  /**
   * Create an authenticated PostgresVectorSearch instance for a user
   * @param token JWT token for authentication
   * @returns Promise resolving to authenticated search service
   */
  public static async createAuthenticatedService(token: string): Promise<PostgresVectorSearch> {
    const client = await getAuthenticatedClient(token);
    return new PostgresVectorSearch(client);
  }
  
  /**
   * Generate embeddings for a query text
   * @param query Text to generate embedding for
   * @returns Promise resolving to embedding vector
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    return await EmbeddingManager.generateEmbedding(query, { useCache: true });
  }
  
  /**
   * Transform a database row to a search result
   * @param row Database row from search result
   * @returns Formatted search result
   */
  private transformToSearchResult<T>(row: any): SearchResult<T> {
    // Extract similarity from row
    const similarity = row.similarity;
    
    // Remove metadata fields
    const { similarity: _, ...item } = row;
    
    return { item: item as T, similarity };
  }
  
  /**
   * Search for subjects by semantic similarity
   * @param query Text query to search for
   * @param options Search configuration options
   * @returns Promise resolving to matching subjects with similarity scores
   */
  async searchSubjects(query: string, options?: SearchOptions): Promise<SearchResult<Subject>[]> {
    return this.search<Subject>(query, 'subjects', 'embedding', options);
  }
  
  /**
   * Search for files by semantic similarity
   * @param query Text query to search for
   * @param options Search configuration options
   * @returns Promise resolving to matching files with similarity scores
   */
  async searchFiles(query: string, options?: SearchOptions): Promise<SearchResult<FileMetadata>[]> {
    return this.search<FileMetadata>(query, 'files', 'embedding', options);
  }
  
  /**
   * Search for quiz questions by semantic similarity
   * @param query Text query to search for
   * @param options Search configuration options
   * @returns Promise resolving to matching quiz questions with similarity scores
   */
  async searchQuizQuestions(query: string, options?: SearchOptions): Promise<SearchResult<QuizQuestion>[]> {
    return this.search<QuizQuestion>(query, 'quiz_questions', 'embedding', options);
  }
  
  /**
   * Generic vector search implementation
   * @param query Text query to search for
   * @param tableName Database table to search in
   * @param embeddingColumn Column containing the embedding vector
   * @param options Search configuration options
   * @returns Promise resolving to search results
   */
  async search<T>(
    query: string,
    tableName: string,
    embeddingColumn: string = 'embedding',
    options?: SearchOptions
  ): Promise<SearchResult<T>[]> {
    try {
      // Generate embedding for the query
      const embedding = await this.generateQueryEmbedding(query);
      
      // Set default options
      const limit = options?.limit || 10;
      const threshold = options?.threshold || 0.7;
      
      // Build the RPC call to match_documents function
      const { data, error } = await this.supabase.rpc(
        `match_${tableName}`,
        {
          query_embedding: embedding,
          match_threshold: threshold,
          match_count: limit,
          ...options?.filters
        }
      );
      
      if (error) {
        console.error(`Error in vector search for ${tableName}:`, error);
        throw new Error(`Vector search failed: ${error.message}`);
      }
      
      // Transform results to standard format
      return (data || []).map(row => this.transformToSearchResult<T>(row));
    } catch (error) {
      console.error('Vector search error:', error);
      throw new Error(`Vector search failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Perform a raw vector similarity search using direct SQL query
   * This bypasses the stored procedure and is useful for custom queries
   * @param query Text query to search for
   * @param tableName Database table to search in
   * @param embeddingColumn Column containing the embedding vector
   * @param options Search configuration options
   * @returns Promise resolving to search results
   */
  async rawVectorSearch<T>(
    query: string,
    tableName: string,
    embeddingColumn: string = 'embedding',
    options?: SearchOptions
  ): Promise<SearchResult<T>[]> {
    try {
      // Generate embedding for the query
      const embedding = await this.generateQueryEmbedding(query);
      
      // Set default options
      const limit = options?.limit || 10;
      const threshold = options?.threshold || 0.7;
      
      // Use direct SQL query with vector operations for more flexibility
      const { data, error } = await this.supabase.rpc('vector_search', {
        table_name: tableName,
        embedding_column: embeddingColumn,
        query_vector: embedding,
        threshold: threshold,
        limit_count: limit,
        filter_conditions: options?.filters ? JSON.stringify(options.filters) : null
      });
      
      if (error) {
        console.error(`Error in raw vector search for ${tableName}:`, error);
        throw new Error(`Raw vector search failed: ${error.message}`);
      }
      
      // Transform results to standard format
      return (data || []).map(row => this.transformToSearchResult<T>(row));
    } catch (error) {
      console.error('Raw vector search error:', error);
      throw new Error(`Raw vector search failed: ${(error as Error).message}`);
    }
  }
} 