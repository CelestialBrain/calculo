import { MathProblemState, CacheEntry } from '../types';

const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

/**
 * Simple in-memory cache for generated problems
 */
class ProblemCache {
  private cache: Map<string, CacheEntry> = new Map();

  /**
   * Generate a cache key from generation parameters
   */
  private generateKey(topic: string, difficulty: number, mode: string): string {
    return `${mode}:${difficulty}:${topic.toLowerCase().trim()}`;
  }

  /**
   * Get cached problem if available and not expired
   */
  get(topic: string, difficulty: number, mode: string): MathProblemState | null {
    const key = this.generateKey(topic, difficulty, mode);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Store problem in cache
   */
  set(topic: string, difficulty: number, mode: string, data: MathProblemState): void {
    const key = this.generateKey(topic, difficulty, mode);
    this.cache.set(key, {
      key,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const problemCache = new ProblemCache();

// Run cleanup periodically
if (typeof window !== 'undefined') {
  setInterval(() => problemCache.cleanup(), 1000 * 60 * 5); // Every 5 minutes
}
