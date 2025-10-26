const redis = require('../config/redis');
const cacheModel = require('../db/models/cache.model');
const config = require('../config/environment');
const { logger } = require('../utils/logger');
const { recordCacheHit, recordCacheMiss } = require('../utils/metrics');
const { generateUrlHash } = require('../utils/helpers');

/**
 * Two-tier caching service (Redis + PostgreSQL)
 */
class CacheService {
  /**
   * Get scraped content from cache
   * @param {string} url - URL to check
   * @returns {Promise<Object|null>} - Cached data or null
   */
  async getScrapedContent(url) {
    const cacheKey = `scrape:${generateUrlHash(url)}`;

    try {
      // Try Redis first (fast)
      const redisData = await redis.get(cacheKey);
      if (redisData) {
        logger.debug({ url }, 'Cache hit: Redis');
        recordCacheHit('redis');
        return redisData;
      }
      recordCacheMiss('redis');

      // Fallback to PostgreSQL (persistent)
      const dbData = await cacheModel.getCachedScraping(url);
      if (dbData) {
        logger.debug({ url }, 'Cache hit: PostgreSQL');
        recordCacheHit('postgres');

        // Backfill Redis
        await redis.set(cacheKey, dbData, config.cache.scrapingTTL);

        return dbData;
      }
      recordCacheMiss('postgres');

      logger.debug({ url }, 'Cache miss: both tiers');
      return null;
    } catch (error) {
      logger.error({ err: error, url }, 'Cache retrieval error');
      return null;
    }
  }

  /**
   * Cache scraped content
   * @param {string} url - URL scraped
   * @param {Object} data - Scraped data
   * @param {number} ttl - TTL in seconds
   * @returns {Promise<void>}
   */
  async cacheScrapedContent(url, data, ttl = null) {
    const actualTtl = ttl || config.cache.scrapingTTL;
    const cacheKey = `scrape:${generateUrlHash(url)}`;

    try {
      // Save to both tiers
      await Promise.all([
        redis.set(cacheKey, data, actualTtl),
        cacheModel.setCachedScraping(url, data, actualTtl)
      ]);

      logger.debug({ url, ttl: actualTtl }, 'Content cached in both tiers');
    } catch (error) {
      logger.error({ err: error, url }, 'Cache save error');
      // Don't throw - caching failure shouldn't break the request
    }
  }

  /**
   * Invalidate cache for URL
   * @param {string} url - URL to invalidate
   * @returns {Promise<void>}
   */
  async invalidate(url) {
    const cacheKey = `scrape:${generateUrlHash(url)}`;

    try {
      await Promise.all([
        redis.del(cacheKey),
        cacheModel.invalidateCache(url)
      ]);

      logger.info({ url }, 'Cache invalidated');
    } catch (error) {
      logger.error({ err: error, url }, 'Cache invalidation error');
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} - Cache stats
   */
  async getStats() {
    try {
      const dbStats = await cacheModel.getStats();
      return {
        database: dbStats,
        redis: {
          connected: true
        }
      };
    } catch (error) {
      logger.error({ err: error }, 'Error getting cache stats');
      return {
        error: error.message
      };
    }
  }
}

module.exports = new CacheService();
