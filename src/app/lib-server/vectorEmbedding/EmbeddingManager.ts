import { VectorEmbeddingService } from './VectorEmbeddingService';
import { OpenAIEmbeddingService } from './OpenAIEmbeddingService';
import { EmbeddingCache } from './EmbeddingCache';

/**
 * Configuration options for embedding generation
 */
export interface EmbeddingOptions {
  /**
   * Whether to use caching for embeddings
   */
  useCache?: boolean;
  
  /**
   * Model to use for embeddings (service-specific)
   */
  model?: string;
  
  /**
   * Custom API key to use
   */
  apiKey?: string;
}

/**
 * Type of embedding service provider
 */
export type EmbeddingProviderType = 'openai' | 'other';

/**
 * Centralized manager for embedding operations
 * Handles provider selection, caching, and configuration
 */
export class EmbeddingManager {
  private static instance: EmbeddingManager;
  private services: Map<EmbeddingProviderType, VectorEmbeddingService>;
  private cache: EmbeddingCache;
  private defaultProvider: EmbeddingProviderType = 'openai';
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.services = new Map<EmbeddingProviderType, VectorEmbeddingService>();
    this.cache = EmbeddingCache.getInstance();
    this.initializeDefaultServices();
  }
  
  /**
   * Get the singleton instance
   * @returns The singleton instance
   */
  public static getInstance(): EmbeddingManager {
    if (!EmbeddingManager.instance) {
      EmbeddingManager.instance = new EmbeddingManager();
    }
    return EmbeddingManager.instance;
  }
  
  /**
   * Initialize default services
   */
  private initializeDefaultServices(): void {
    // Initialize OpenAI service by default
    this.services.set('openai', new OpenAIEmbeddingService());
  }
  
  /**
   * Get the embedding service for a provider
   * @param provider The provider to get the service for
   * @param options Configuration options
   * @returns The embedding service
   */
  public getService(
    provider: EmbeddingProviderType = this.defaultProvider,
    options?: EmbeddingOptions
  ): VectorEmbeddingService {
    // If service doesn't exist or options require a new instance, create it
    if (!this.services.has(provider) || (options && (options.apiKey || options.model))) {
      this.createService(provider, options);
    }
    
    return this.services.get(provider)!;
  }
  
  /**
   * Create a new embedding service
   * @param provider The provider to create the service for
   * @param options Configuration options
   */
  private createService(
    provider: EmbeddingProviderType,
    options?: EmbeddingOptions
  ): void {
    switch (provider) {
      case 'openai':
        this.services.set(
          provider,
          new OpenAIEmbeddingService(options?.apiKey, options?.model)
        );
        break;
      
      // Add cases for other providers as needed
      
      default:
        throw new Error(`Unsupported embedding provider: ${provider}`);
    }
  }
  
  /**
   * Generate an embedding for text
   * @param text Text to generate embedding for
   * @param options Configuration options
   * @returns The embedding vector
   */
  public async generateEmbedding(
    text: string,
    options?: EmbeddingOptions
  ): Promise<number[]> {
    const useCache = options?.useCache !== false;
    
    // Check cache first if enabled
    if (useCache) {
      const cachedEmbedding = this.cache.get(text);
      if (cachedEmbedding) {
        return cachedEmbedding;
      }
    }
    
    // Get service and generate embedding
    const service = this.getService(
      options?.apiKey || options?.model ? this.defaultProvider : undefined,
      options
    );
    
    const embedding = await service.generateEmbedding(text);
    
    // Cache the result if caching is enabled
    if (useCache) {
      this.cache.set(text, embedding);
    }
    
    return embedding;
  }
  
  /**
   * Generate embeddings for multiple texts
   * @param texts Texts to generate embeddings for
   * @param options Configuration options
   * @returns Array of embedding vectors
   */
  public async generateBatchEmbeddings(
    texts: string[],
    options?: EmbeddingOptions
  ): Promise<number[][]> {
    const useCache = options?.useCache !== false;
    const uncachedTexts: string[] = [];
    const results: number[][] = new Array(texts.length);
    
    // If caching is enabled, check which texts are already cached
    if (useCache) {
      texts.forEach((text, index) => {
        const cachedEmbedding = this.cache.get(text);
        if (cachedEmbedding) {
          results[index] = cachedEmbedding;
        } else {
          uncachedTexts.push(text);
        }
      });
    } else {
      uncachedTexts.push(...texts);
    }
    
    // If all texts were cached, return results
    if (uncachedTexts.length === 0) {
      return results.filter(Boolean) as number[][];
    }
    
    // Generate embeddings for uncached texts
    const service = this.getService(
      options?.apiKey || options?.model ? this.defaultProvider : undefined,
      options
    );
    
    const newEmbeddings = await service.generateBatchEmbeddings(uncachedTexts);
    
    // Cache new embeddings if caching is enabled
    if (useCache) {
      uncachedTexts.forEach((text, index) => {
        this.cache.set(text, newEmbeddings[index]);
      });
    }
    
    // Merge cached and new embeddings
    if (useCache) {
      let newEmbeddingIndex = 0;
      texts.forEach((text, index) => {
        if (!results[index]) {
          results[index] = newEmbeddings[newEmbeddingIndex++];
        }
      });
      return results;
    }
    
    return newEmbeddings;
  }
  
  /**
   * Get the dimension of embeddings for a provider
   * @param provider The provider to get the dimension for
   * @param options Configuration options
   * @returns The embedding dimension
   */
  public getEmbeddingDimension(
    provider: EmbeddingProviderType = this.defaultProvider,
    options?: EmbeddingOptions
  ): number {
    const service = this.getService(provider, options);
    return service.getEmbeddingDimension();
  }
  
  /**
   * Clear the embedding cache
   */
  public clearCache(): void {
    this.cache.clear();
  }
} 