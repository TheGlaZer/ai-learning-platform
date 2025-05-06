/**
 * Interface for vector embedding generation services
 * This defines the contract for generating embeddings from text content
 */
export interface VectorEmbeddingService {
  /**
   * Generate an embedding vector for a single text input
   * @param text The text to generate an embedding for
   * @returns Promise resolving to an array of numbers representing the embedding vector
   */
  generateEmbedding(text: string): Promise<number[]>;
  
  /**
   * Generate embedding vectors for multiple text inputs in batch
   * @param texts Array of text strings to generate embeddings for
   * @returns Promise resolving to a 2D array of embedding vectors
   */
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
  
  /**
   * Get the embedding dimension (vector size) for this service
   * @returns The dimension of generated embedding vectors
   */
  getEmbeddingDimension(): number;
} 