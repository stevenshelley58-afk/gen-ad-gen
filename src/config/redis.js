const Redis = require('ioredis');
const config = require('./environment');
const { logger } = require('../utils/logger');

/**
 * Redis client singleton
 */
let redisClient = null;

/**
 * Create and configure Redis client
 * @returns {Redis} - Redis client instance
 */
function createClient() {
  if (redisClient) {
    return redisClient;
  }
  
  const options = {
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError(err) {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    }
  };
  
  // Parse Redis URL
  if (config.redis.password) {
    options.password = config.redis.password;
  }
  
  if (config.redis.db) {
    options.db = config.redis.db;
  }
  
  redisClient = new Redis(config.redis.url, options);
  
  // Event handlers
  redisClient.on('connect', () => {
    logger.info('Redis client connecting');
  });
  
  redisClient.on('ready', () => {
    logger.info('Redis client ready');
  });
  
  redisClient.on('error', (err) => {
    logger.error({ err }, 'Redis client error');
  });
  
  redisClient.on('close', () => {
    logger.info('Redis client connection closed');
  });
  
  redisClient.on('reconnecting', () => {
    logger.warn('Redis client reconnecting');
  });
  
  return redisClient;
}

/**
 * Get Redis client instance
 * @returns {Redis} - Redis client
 */
function getClient() {
  if (!redisClient) {
    return createClient();
  }
  return redisClient;
}

/**
 * Set value with optional TTL
 * @param {string} key - Redis key
 * @param {any} value - Value to store (will be JSON stringified)
 * @param {number} ttl - TTL in seconds (optional)
 * @returns {Promise<string>} - OK if successful
 */
async function set(key, value, ttl = null) {
  const client = getClient();
  const serialized = JSON.stringify(value);
  
  try {
    if (ttl) {
      return await client.setex(key, ttl, serialized);
    }
    return await client.set(key, serialized);
  } catch (error) {
    logger.error({ err: error, key }, 'Redis SET failed');
    throw error;
  }
}

/**
 * Get value
 * @param {string} key - Redis key
 * @returns {Promise<any>} - Parsed value or null
 */
async function get(key) {
  const client = getClient();
  
  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error({ err: error, key }, 'Redis GET failed');
    // Return null on error to allow fallback to database
    return null;
  }
}

/**
 * Delete key
 * @param {string} key - Redis key
 * @returns {Promise<number>} - Number of keys deleted
 */
async function del(key) {
  const client = getClient();
  
  try {
    return await client.del(key);
  } catch (error) {
    logger.error({ err: error, key }, 'Redis DEL failed');
    throw error;
  }
}

/**
 * Check if key exists
 * @param {string} key - Redis key
 * @returns {Promise<boolean>} - True if exists
 */
async function exists(key) {
  const client = getClient();
  
  try {
    const result = await client.exists(key);
    return result === 1;
  } catch (error) {
    logger.error({ err: error, key }, 'Redis EXISTS failed');
    return false;
  }
}

/**
 * Get TTL for key
 * @param {string} key - Redis key
 * @returns {Promise<number>} - TTL in seconds (-1 if no expiry, -2 if not exists)
 */
async function ttl(key) {
  const client = getClient();
  
  try {
    return await client.ttl(key);
  } catch (error) {
    logger.error({ err: error, key }, 'Redis TTL failed');
    return -2;
  }
}

/**
 * Increment counter
 * @param {string} key - Redis key
 * @param {number} amount - Amount to increment (default 1)
 * @returns {Promise<number>} - New value
 */
async function incr(key, amount = 1) {
  const client = getClient();
  
  try {
    if (amount === 1) {
      return await client.incr(key);
    }
    return await client.incrby(key, amount);
  } catch (error) {
    logger.error({ err: error, key }, 'Redis INCR failed');
    throw error;
  }
}

/**
 * Health check
 * @returns {Promise<Object>} - Health status
 */
async function healthCheck() {
  const client = getClient();
  
  try {
    const result = await client.ping();
    return {
      status: result === 'PONG' ? 'ok' : 'error'
    };
  } catch (error) {
    logger.error({ err: error }, 'Redis health check failed');
    return {
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Close connection
 * @returns {Promise<void>}
 */
async function close() {
  if (redisClient) {
    try {
      await redisClient.quit();
      redisClient = null;
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error({ err: error }, 'Error closing Redis connection');
      throw error;
    }
  }
}

module.exports = {
  createClient,
  getClient,
  set,
  get,
  del,
  exists,
  ttl,
  incr,
  healthCheck,
  close
};
