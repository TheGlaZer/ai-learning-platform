/**
 * Options for content processing operations
 */
export interface ProcessingOptions {
  /**
   * Whether to generate embeddings for the content
   */
  generateEmbedding?: boolean;
  
  /**
   * Custom model to use for embedding generation
   */
  embeddingModel?: string;
}

/**
 * Result of content processing operations
 */
export interface ProcessingResult<T> {
  /**
   * Processed content data
   */
  data: T;
  
  /**
   * Generated embedding vector (if requested)
   */
  embedding?: number[];
  
  /**
   * Additional metadata from processing
   */
  metadata?: Record<string, any>;
}

/**
 * Base interface for content processors
 * Defines standard methods for processing different types of content
 */
export interface ContentProcessor<T> {
  /**
   * Process content data
   * @param content Content to process
   * @param options Processing options
   * @returns Promise resolving to processing result
   */
  process(content: T, options?: ProcessingOptions): Promise<ProcessingResult<T>>;
  
  /**
   * Generate embedding for content
   * @param content Content to generate embedding for
   * @param options Processing options
   * @returns Promise resolving to embedding vector
   */
  generateEmbedding(content: T, options?: ProcessingOptions): Promise<number[]>;
} 