import { AIService, AIServiceOptions, AIModelResponse } from './AIService';
import EmbeddingManager from '../vectorEmbedding';
import { textProcessor } from '../contentProcessing';
import { PostgresVectorSearch } from '../vectorSearch/PostgresVectorSearch';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

/**
 * Service to enhance AI features with vector embeddings
 * Provides utilities for integrating vector search and embedding capabilities
 */
export class AIEmbeddingService {
  private embeddingManager = EmbeddingManager;
  private vectorSearch: PostgresVectorSearch;
  
  /**
   * Create a new AIEmbeddingService instance
   * @param supabaseClient Optional Supabase client (defaults to shared instance)
   */
  constructor(supabaseClient?: SupabaseClient) {
    this.vectorSearch = new PostgresVectorSearch(supabaseClient || supabase);
  }
  
  /**
   * Generate an embedding for text
   * @param text Text to embed
   * @param options Optional parameters
   * @returns Promise resolving to the embedding vector
   */
  async generateEmbedding(text: string, options?: { normalize?: boolean }): Promise<number[]> {
    // Use text processor for normalization if needed
    if (options?.normalize) {
      const processed = await textProcessor.process(text, { normalize: true });
      return this.embeddingManager.generateEmbedding(processed.data);
    }
    return this.embeddingManager.generateEmbedding(text);
  }
  
  /**
   * Find similar subjects based on a query
   * @param query Text query to search for
   * @param options Search options
   * @returns Promise resolving to search results
   */
  async findSimilarSubjects(query: string, options?: { 
    limit?: number; 
    threshold?: number;
    workspaceId?: string;
  }): Promise<any[]> {
    try {
      // Apply filters if workspace ID is provided
      let searchOptions = { 
        limit: options?.limit || 10,
        threshold: options?.threshold || 0.7
      };
      
      if (options?.workspaceId) {
        searchOptions = {
          ...searchOptions,
          filters: { workspace_id: options.workspaceId }
        };
      }
      
      // Search for similar subjects
      const results = await this.vectorSearch.searchSubjects(query, searchOptions);
      return results.map(result => result.item);
    } catch (error) {
      console.error('Error finding similar subjects:', error);
      return [];
    }
  }
  
  /**
   * Find similar quiz questions based on a query
   * @param query Text query to search for
   * @param options Search options
   * @returns Promise resolving to search results
   */
  async findSimilarQuizQuestions(query: string, options?: {
    limit?: number;
    threshold?: number;
    quizId?: string;
  }): Promise<any[]> {
    try {
      // Apply filters if quiz ID is provided
      let searchOptions = {
        limit: options?.limit || 10,
        threshold: options?.threshold || 0.7
      };
      
      if (options?.quizId) {
        searchOptions = {
          ...searchOptions,
          filters: { quiz_id: options.quizId }
        };
      }
      
      // Search for similar questions
      const results = await this.vectorSearch.searchQuizQuestions(query, searchOptions);
      return results.map(result => result.item);
    } catch (error) {
      console.error('Error finding similar quiz questions:', error);
      return [];
    }
  }
  
  /**
   * Store embeddings for a generated item
   * @param item Item to store embedding for
   * @param table Database table name
   * @param itemId ID of the item
   * @param textField Field containing text to generate embedding from
   */
  async storeEmbedding(item: any, table: string, itemId: string, textField: string): Promise<void> {
    try {
      if (!item || !item[textField]) return;
      
      // Generate embedding for the item text
      const embedding = await this.generateEmbedding(item[textField], { normalize: true });
      
      // Update the item with the embedding
      const { error } = await supabase
        .from(table)
        .update({ embedding })
        .eq('id', itemId);
      
      if (error) {
        console.error(`Error storing embedding for ${table}:`, error);
      }
    } catch (error) {
      console.error(`Error in storeEmbedding for ${table}:`, error);
    }
  }
  
  /**
   * Create a quiz question with embedding
   * @param question Question data
   * @param quizId ID of the quiz
   */
  async createQuizQuestionWithEmbedding(question: any, quizId: string): Promise<string | null> {
    try {
      // Prepare question text for embedding
      const questionText = question.question;
      if (!questionText) return null;
      
      // Generate embedding
      const embedding = await this.generateEmbedding(questionText, { normalize: true });
      
      // Insert question with embedding
      const { data, error } = await supabase
        .from('quiz_questions')
        .insert({
          quiz_id: quizId,
          question: question.question,
          explanation: question.explanation,
          options: question.options,
          correct_option_index: question.correct_option_index,
          difficulty_level: question.difficulty_level,
          embedding
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Error creating quiz question with embedding:', error);
        return null;
      }
      
      return data?.id || null;
    } catch (error) {
      console.error('Error in createQuizQuestionWithEmbedding:', error);
      return null;
    }
  }
  
  /**
   * Find similar exam patterns
   * @param examContent Exam content to find similar patterns for
   * @param options Search options
   * @returns Promise resolving to search results
   */
  async findSimilarPatterns(examContent: string, options?: {
    limit?: number;
    threshold?: number;
    workspaceId?: string;
  }): Promise<any[]> {
    try {
      // Generate embedding for exam content first
      const embedding = await this.generateEmbedding(examContent, { normalize: true });
      
      // Perform a custom search directly with SQL for patterns
      // This is needed because patterns store their content in a JSONB field
      const { data, error } = await supabase.rpc('search_patterns_by_similarity', {
        query_embedding: embedding,
        match_threshold: options?.threshold || 0.7,
        match_count: options?.limit || 5,
        workspace_filter: options?.workspaceId || null
      });
      
      if (error) {
        console.error('Error searching for similar patterns:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error finding similar patterns:', error);
      return [];
    }
  }
} 