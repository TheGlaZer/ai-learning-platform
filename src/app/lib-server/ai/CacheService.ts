import { AIModelResponse } from './AIService';

// Cache item interface
interface CacheItem {
  response: AIModelResponse;
  timestamp: number;
}

/**
 * Service for caching AI responses to reduce API calls
 */
export class CacheService {
  private cache: Map<string, CacheItem> = new Map();
  private cacheTTL: number = 1000 * 60 * 60; // 1 hour cache lifetime by default

  /**
   * Sets the cache time-to-live
   * @param ttlMs Time-to-live in milliseconds
   */
  setCacheTTL(ttlMs: number): void {
    this.cacheTTL = ttlMs;
  }

  /**
   * Retrieves a cached response if available and not expired
   * @param key Cache key
   * @returns Cached response or null if not found or expired
   */
  get(key: string): AIModelResponse | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log('Cache hit: Returning cached response');
      return cached.response;
    }
    return null;
  }

  /**
   * Adds a response to the cache
   * @param key Cache key
   * @param response Response to cache
   */
  set(key: string, response: AIModelResponse): void {
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
  }

  /**
   * Clears the entire cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Gets the current cache size
   * @returns Number of items in the cache
   */
  size(): number {
    return this.cache.size;
  }
}

export default new CacheService(); 