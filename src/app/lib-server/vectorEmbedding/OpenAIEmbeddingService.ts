import OpenAI from 'openai';
import { VectorEmbeddingService } from './VectorEmbeddingService';

/**
 * OpenAI implementation of the VectorEmbeddingService
 * Uses OpenAI's embedding models to generate vector representations of text
 */
export class OpenAIEmbeddingService implements VectorEmbeddingService {
  private openai: OpenAI;
  private model: string;
  private dimension: number;
  
  /**
   * Create a new OpenAIEmbeddingService instance
   * @param apiKey Optional API key (uses environment variable if not provided)
   * @param model Optional model name (defaults to text-embedding-3-small)
   */
  constructor(apiKey?: string, model?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY
    });
    
    // Default to the latest efficient model
    this.model = model || 'text-embedding-3-small';
    
    // Set dimension based on the model
    // https://platform.openai.com/docs/guides/embeddings
    if (this.model === 'text-embedding-3-small') {
      this.dimension = 1536;
    } else if (this.model === 'text-embedding-3-large') {
      this.dimension = 3072;
    } else if (this.model === 'text-embedding-ada-002') {
      this.dimension = 1536;
    } else {
      // Default dimension if model is unknown
      this.dimension = 1536;
    }
  }
  
  /**
   * Get the embedding dimension for the current model
   * @returns The dimension of the embedding vectors
   */
  getEmbeddingDimension(): number {
    return this.dimension;
  }
  
  /**
   * Generate an embedding for a single text input
   * @param text The text to generate an embedding for
   * @returns Promise resolving to the embedding vector
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Truncate text if it's too long (OpenAI has token limits)
      const truncatedText = this.truncateIfNeeded(text);
      
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: truncatedText
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${(error as Error).message}`);
    }
  }
  
  /**
   * Generate embeddings for multiple text inputs in batch
   * @param texts Array of text strings to generate embeddings for
   * @returns Promise resolving to array of embedding vectors
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      // Truncate texts if needed
      const truncatedTexts = texts.map(text => this.truncateIfNeeded(text));
      
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: truncatedTexts
      });
      
      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      throw new Error(`Failed to generate batch embeddings: ${(error as Error).message}`);
    }
  }
  
  /**
   * Truncate text if it exceeds the token limit for the model
   * @param text Text to truncate
   * @returns Truncated text
   */
  private truncateIfNeeded(text: string): string {
    // Simple truncation based on character count
    // A more sophisticated approach would use a tokenizer
    const MAX_CHARS = 8000;
    
    if (text.length <= MAX_CHARS) {
      return text;
    }
    
    return text.substring(0, MAX_CHARS);
  }
} 