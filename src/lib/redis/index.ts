import { kv } from '@vercel/kv';

/**
 * Redis Cache Utility
 * Provides caching functionality using Vercel KV (Redis)
 *
 * Usage:
 * - cache.get(key) - Get value from cache
 * - cache.set(key, value, ttl) - Set value in cache with TTL
 * - cache.del(key) - Delete key from cache
 * - cache.delPattern(pattern) - Delete all keys matching pattern
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
  totalOperations: number;
  connectionStatus: 'connected' | 'disconnected' | 'unknown';
  lastError: string | null;
  lastErrorTime: number | null;
}

class RedisCache {
  private enabled: boolean;
  private metrics: CacheMetrics;

  constructor() {
    // Check if Redis is configured
    this.enabled = !!process.env.KV_REST_API_URL;

    // Initialize metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      hitRate: 0,
      totalOperations: 0,
      connectionStatus: this.enabled ? 'unknown' : 'disconnected',
      lastError: null,
      lastErrorTime: null,
    };

    if (!this.enabled) {
      console.warn('Redis cache is not configured. Caching will be disabled.');
    }
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    this.metrics.totalOperations = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = this.metrics.totalOperations > 0
      ? (this.metrics.hits / this.metrics.totalOperations) * 100
      : 0;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) return null;

    try {
      const value = await kv.get<T>(key);

      // Track metrics
      if (value !== null) {
        this.metrics.hits++;
        this.metrics.connectionStatus = 'connected';
      } else {
        this.metrics.misses++;
      }
      this.updateHitRate();

      return value;
    } catch (error) {
      this.metrics.errors++;
      this.metrics.connectionStatus = 'disconnected';
      this.metrics.lastError = error instanceof Error ? error.message : 'Unknown error';
      this.metrics.lastErrorTime = Date.now();
      console.error('Redis GET error for key:', key, error);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      if (options?.ttl) {
        // Set with expiration in seconds
        await kv.set(key, value, { ex: options.ttl });
      } else {
        // Set without expiration
        await kv.set(key, value);
      }

      // Track metrics
      this.metrics.sets++;
      this.metrics.connectionStatus = 'connected';

      return true;
    } catch (error) {
      this.metrics.errors++;
      this.metrics.connectionStatus = 'disconnected';
      this.metrics.lastError = error instanceof Error ? error.message : 'Unknown error';
      this.metrics.lastErrorTime = Date.now();
      console.error('Redis SET error for key:', key, error);
      return false;
    }
  }

  /**
   * Delete a key from cache
   */
  async del(key: string): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      await kv.del(key);

      // Track metrics
      this.metrics.deletes++;
      this.metrics.connectionStatus = 'connected';

      return true;
    } catch (error) {
      this.metrics.errors++;
      this.metrics.connectionStatus = 'disconnected';
      this.metrics.lastError = error instanceof Error ? error.message : 'Unknown error';
      this.metrics.lastErrorTime = Date.now();
      console.error('Redis DEL error for key:', key, error);
      return false;
    }
  }

  /**
   * Delete multiple keys from cache
   */
  async delMultiple(keys: string[]): Promise<boolean> {
    if (!this.enabled || keys.length === 0) return false;

    try {
      await kv.del(...keys);
      return true;
    } catch (error) {
      console.error('Redis DEL error for keys:', error);
      return false;
    }
  }

  /**
   * Delete all keys matching a pattern
   * Note: This uses SCAN which is safe for production
   */
  async delPattern(pattern: string): Promise<number> {
    if (!this.enabled) return 0;

    try {
      const keys: string[] = [];
      let cursor: string | number = 0;

      // Use SCAN to find all matching keys
      do {
        const result: [string | number, string[]] = await kv.scan(cursor, { match: pattern, count: 100 });
        cursor = result[0];
        keys.push(...result[1]);
      } while (cursor !== 0 && cursor !== '0');

      if (keys.length > 0) {
        await kv.del(...keys);
      }

      return keys.length;
    } catch (error) {
      console.error('Redis DEL pattern error for pattern:', pattern, error);
      return 0;
    }
  }

  /**
   * Check if cache is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch data
    const data = await fetcher();

    // Store in cache (fire and forget - don't block response)
    this.set(key, data, options).catch((error) => {
      console.error('Failed to cache key:', key, error);
    });

    return data;
  }

  /**
   * Get current cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset cache metrics
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      hitRate: 0,
      totalOperations: 0,
      connectionStatus: this.enabled ? 'unknown' : 'disconnected',
      lastError: null,
      lastErrorTime: null,
    };
  }

  /**
   * Check Redis connection health
   */
  async checkHealth(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    if (!this.enabled) {
      return { healthy: false, latency: 0, error: 'Redis not configured' };
    }

    const startTime = performance.now();
    try {
      const testKey = '__health_check__';
      await kv.set(testKey, 'ping', { ex: 5 });
      const value = await kv.get(testKey);
      await kv.del(testKey);

      const latency = performance.now() - startTime;
      this.metrics.connectionStatus = 'connected';

      return {
        healthy: value === 'ping',
        latency: Math.round(latency * 100) / 100,
      };
    } catch (error) {
      const latency = performance.now() - startTime;
      this.metrics.connectionStatus = 'disconnected';
      this.metrics.lastError = error instanceof Error ? error.message : 'Unknown error';
      this.metrics.lastErrorTime = Date.now();

      return {
        healthy: false,
        latency: Math.round(latency * 100) / 100,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const cache = new RedisCache();
