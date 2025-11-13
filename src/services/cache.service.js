import { CACHE_TTL, CACHE_CONFIG } from '../constants/index.js';

class CacheService {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = CACHE_TTL.DEFAULT;
    this.cleanupInterval = setInterval(() => this.cleanup(), CACHE_CONFIG.CLEANUP_INTERVAL_MS);
    this.hits = 0;
    this.misses = 0;
  }

  set(key, value, ttl) {
    this.cache.set(key, { 
      data: value, 
      expiresAt: Date.now() + (ttl || this.defaultTTL) 
    });
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return entry.data;
  }

  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  size() {
    return this.cache.size;
  }

  getStats() {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests * 100).toFixed(2) : 0;
    
    return {
      size: this.cache.size,
      defaultTTL: this.defaultTTL,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`,
      totalRequests: totalRequests,
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

export const cacheService = new CacheService();

export function destroyCacheService() {
  cacheService.destroy();
}
