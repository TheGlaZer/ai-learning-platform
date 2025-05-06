import { ContentProcessor, ProcessingOptions, ProcessingResult } from './ContentProcessor';
import EmbeddingManager from '../vectorEmbedding';

/**
 * Text specific processing options
 */
export interface TextProcessingOptions extends ProcessingOptions {
  /**
   * Language of the text
   */
  language?: string;
  
  /**
   * Whether to clean and normalize the text
   */
  normalize?: boolean;
  
  /**
   * Maximum text length to process
   */
  maxLength?: number;
}

/**
 * Processor for text content
 * Handles text normalization and embedding generation
 */
export class TextProcessor implements ContentProcessor<string> {
  /**
   * Process text content
   * @param text Text to process
   * @param options Processing options
   * @returns Promise resolving to processing result
   */
  async process(text: string, options?: TextProcessingOptions): Promise<ProcessingResult<string>> {
    // Initialize result
    const result: ProcessingResult<string> = {
      data: text,
      metadata: {}
    };
    
    // Clean and normalize text if requested
    if (options?.normalize) {
      result.data = this.normalizeText(text);
      result.metadata!.normalized = true;
    }
    
    // Truncate text if maxLength is specified
    if (options?.maxLength && result.data.length > options.maxLength) {
      result.data = result.data.substring(0, options.maxLength);
      result.metadata!.truncated = true;
    }
    
    // Generate embedding if requested
    if (options?.generateEmbedding) {
      result.embedding = await this.generateEmbedding(result.data, options);
      result.metadata!.embeddingModel = options.embeddingModel || 'default';
    }
    
    return result;
  }
  
  /**
   * Generate embedding for text
   * @param text Text to generate embedding for
   * @param options Processing options
   * @returns Promise resolving to embedding vector
   */
  async generateEmbedding(text: string, options?: TextProcessingOptions): Promise<number[]> {
    // Apply normalization before embedding if requested
    let processedText = options?.normalize ? this.normalizeText(text) : text;
    
    // Truncate if needed
    if (options?.maxLength && processedText.length > options.maxLength) {
      processedText = processedText.substring(0, options.maxLength);
    }
    
    // Generate embedding
    return await EmbeddingManager.generateEmbedding(processedText, {
      model: options?.embeddingModel
    });
  }
  
  /**
   * Normalize text for better processing
   * @param text Text to normalize
   * @returns Normalized text
   */
  private normalizeText(text: string): string {
    if (!text) return '';
    
    // Remove extra whitespace
    let normalized = text.replace(/\s+/g, ' ').trim();
    
    // Convert to lowercase for better consistency
    normalized = normalized.toLowerCase();
    
    // Remove special characters that don't add semantic meaning
    normalized = normalized.replace(/[^\w\s.,;:!?'"-]/g, ' ');
    
    // Replace multiple spaces with single space
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
  }
} 