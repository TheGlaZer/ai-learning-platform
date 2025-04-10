/**
 * Service with utility functions for AI operations
 */
export class AIUtilsService {
  /**
   * Simple token counting estimation function
   * @param text Text to estimate tokens for
   * @returns Estimated token count
   */
  estimateTokenCount(text: string): number {
    // Rough estimate: 4 chars ~ 1 token for English (GPT models)
    // For other languages or more precise counting, use a proper tokenizer
    return Math.ceil(text.length / 4);
  }
  
  /**
   * Get max context length for various models
   * @param model Model name
   * @returns Maximum token limit for the model
   */
  getModelMaxTokens(model: string): number {
    const modelLimits: Record<string, number> = {
      'gpt-4o': 128000,      // GPT-4o context window
      'gpt-4o-mini': 128000, // GPT-4o-mini context window
      'gpt-4-turbo': 128000, // GPT-4 Turbo context window
      'gpt-4': 8192,         // Regular GPT-4 context window
      'gpt-3.5-turbo': 16385 // GPT-3.5 Turbo context window
    };
    
    // Use model-specific limit or default to 8000 if unknown
    return modelLimits[model] || 8000;
  }

  /**
   * Splits content into chunks of approximately equal size
   * @param content Content to split
   * @param chunkSize Maximum size of each chunk
   * @returns Array of content chunks
   */
  splitContentIntoChunks(content: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    
    if (content.length <= chunkSize) {
      return [content];
    }
    
    // Split by paragraphs to try to maintain logical sections
    const paragraphs = content.split(/\n\s*\n/);
    
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      // If adding this paragraph would exceed the chunk size, start a new chunk
      if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = paragraph;
      } else {
        // Otherwise, add to the current chunk
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
    
    // Add the last chunk if it has content
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }
  
  /**
   * Deduplicate subjects by name (case insensitive)
   * @param subjects Array of subject objects
   * @returns Array of unique subjects
   */
  deduplicateSubjects(subjects: any[]): any[] {
    const seen = new Set<string>();
    return subjects.filter(subject => {
      const lowerName = subject.name.toLowerCase().trim();
      if (seen.has(lowerName)) {
        return false;
      }
      seen.add(lowerName);
      return true;
    });
  }

  /**
   * Generates a cache key based on a prompt and options
   * @param prompt The prompt text
   * @param model Model name
   * @param temperature Temperature setting
   * @param maxTokens Maximum tokens
   * @returns Generated cache key
   */
  generateCacheKey(prompt: string, model: string, temperature: number, maxTokens: number): string {
    return `${prompt}-${model}-${temperature}-${maxTokens}`;
  }
}

export default new AIUtilsService(); 