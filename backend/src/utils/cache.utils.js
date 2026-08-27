import redisClient from "../config/redis.js";

const DEFAULT_TTL = 600; // 10 minutes

/**
 * Get value from cache or execute async function if cache miss
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in seconds
 * @param {Function} asyncFn - Async function to execute on cache miss
 * @returns {Promise} Cached or computed value
 */
export async function getCacheOrExecute(key, ttl = DEFAULT_TTL, asyncFn) {
  try {
    // Try to get from cache
    const cached = await redisClient.get(key);
    if (cached) {
      console.log(`✅ Cache HIT: ${key}`);
      return JSON.parse(cached);
    }

    console.log(`⏳ Cache MISS: ${key}, executing function...`);
    // Execute function if cache miss
    const result = await asyncFn();

    // Store in cache
    await redisClient.setEx(key, ttl, JSON.stringify(result));
    console.log(`💾 Cached: ${key} (TTL: ${ttl}s)`);
    return result;
  } catch (error) {
    console.error(`❌ Cache error for key ${key}:`, error.message);
    // Fallback to direct execution if Redis fails
    console.log(`⚠️  Falling back to direct execution for: ${key}`);
    return await asyncFn();
  }
}

/**
 * Invalidate specific cache keys
 * @param {string|Array<string>} keys - Single key or array of keys to invalidate
 */
export async function invalidateCache(keys) {
  try {
    if (Array.isArray(keys)) {
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`🗑️  Invalidated ${keys.length} cache keys`);
      }
    } else {
      await redisClient.del(keys);
      console.log(`🗑️  Invalidated cache key: ${keys}`);
    }
  } catch (error) {
    console.error(`❌ Error invalidating cache:`, error.message);
  }
}

/**
 * Invalidate cache by pattern (useful for user-specific or repo-specific caches)
 * @param {string} pattern - Glob pattern (e.g., "ai_summary:*")
 */
export async function invalidateCachePattern(pattern) {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(
        `🗑️  Invalidated ${keys.length} keys matching pattern: ${pattern}`,
      );
    } else {
      console.log(`ℹ️  No cache keys found for pattern: ${pattern}`);
    }
  } catch (error) {
    console.error(`❌ Error invalidating cache pattern:`, error.message);
  }
}

/**
 * Set cache value directly
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 */
export async function setCacheValue(key, value, ttl = DEFAULT_TTL) {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    console.log(`💾 Set cache: ${key} (TTL: ${ttl}s)`);
  } catch (error) {
    console.error(`❌ Error setting cache key ${key}:`, error.message);
  }
}

/**
 * Get cache value directly
 * @param {string} key - Cache key
 * @returns {Promise} Cached value or null
 */
export async function getCacheValue(key) {
  try {
    const cached = await redisClient.get(key);
    if (cached) {
      console.log(`✅ Cache HIT: ${key}`);
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    console.error(`❌ Error getting cache key ${key}:`, error.message);
    return null;
  }
}
