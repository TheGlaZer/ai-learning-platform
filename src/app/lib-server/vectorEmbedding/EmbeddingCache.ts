/**
 * Simple in-memory cache for embeddings to reduce API calls
 * More sophisticated implementations could use Redis or other caching solutions
 */
export class EmbeddingCache {
  private static instance: EmbeddingCache;
  private cache: Map<string, number[]>;
  private maxSize: number;
  
  /**
   * Private constructor for singleton pattern
   * @param maxSize Maximum number of embeddings to cache (defaults to 1000)
   */
  private constructor(maxSize: number = 1000) {
    this.cache = new Map<string, number[]>();
    this.maxSize = maxSize;
  }
  
  /**
   * Get the singleton instance
   * @param maxSize Optional maximum cache size
   * @returns The singleton instance
   */
  public static getInstance(maxSize?: number): EmbeddingCache {
    if (!EmbeddingCache.instance) {
      EmbeddingCache.instance = new EmbeddingCache(maxSize);
    }
    return EmbeddingCache.instance;
  }
  
  /**
   * Generate a cache key for the text
   * @param text Text to generate key for
   * @returns Cache key
   */
  private generateKey(text: string): string {
    // Simple hashing for cache key
    // For production, consider a more robust hashing algorithm
    return Buffer.from(text).toString('base64').substring(0, 100);
  }
  
  /**
   * Get an embedding from the cache
   * @param text Text to get embedding for
   * @returns Embedding vector if cached, null otherwise
   */
  public get(text: string): number[] | null {
    const key = this.generateKey(text);
    return this.cache.get(key) || null;
  }
  
  /**
   * Add an embedding to the cache
   * @param text Text associated with the embedding
   * @param embedding Embedding vector to cache
   */
  public set(text: string, embedding: number[]): void {
    const key = this.generateKey(text);
    
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, embedding);
  }
  
  /**
   * Clear the cache
   */
  public clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get the current cache size
   * @returns Number of cached embeddings
   */
  public size(): number {
    return this.cache.size;
  }
} 