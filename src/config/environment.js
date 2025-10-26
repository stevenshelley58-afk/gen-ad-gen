require('dotenv').config();
const { parseBoolean } = require('../utils/helpers');

/**
 * Validate required environment variables
 * @throws {Error} - If required variables are missing
 */
function validateEnvironment() {
  const required = [
    'OPENAI_API_KEY',
    'API_KEY',
    'DATABASE_URL',
    'REDIS_URL'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Validate on load
validateEnvironment();

/**
 * Environment configuration object
 */
const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || '0.0.0.0',
  
  // API Security
  apiKey: process.env.API_KEY,
  
  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    timeout: parseInt(process.env.OPENAI_TIMEOUT, 10) || 60000
  },
  
  // Database
  database: {
    url: process.env.DATABASE_URL,
    poolMin: parseInt(process.env.DATABASE_POOL_MIN, 10) || 2,
    poolMax: parseInt(process.env.DATABASE_POOL_MAX, 10) || 20
  },
  
  // Redis
  redis: {
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0
  },
  
  // Cache
  cache: {
    scrapingTTL: parseInt(process.env.CACHE_TTL_SCRAPING, 10) || 86400, // 24 hours
    responseTTL: parseInt(process.env.CACHE_TTL_RESPONSE, 10) || 3600   // 1 hour
  },
  
  // Scraping
  scraping: {
    concurrency: parseInt(process.env.SCRAPE_CONCURRENCY, 10) || 5,
    browserPoolSize: parseInt(process.env.BROWSER_POOL_SIZE, 10) || 3,
    scrapeTimeout: parseInt(process.env.SCRAPE_TIMEOUT, 10) || 30000,
    pageLoadTimeout: parseInt(process.env.PAGE_LOAD_TIMEOUT, 10) || 15000
  },
  
  // Rate Limiting
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 20,
    window: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 60000 // 1 minute
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    pretty: parseBoolean(process.env.LOG_PRETTY, true)
  },
  
  // Request
  request: {
    timeout: parseInt(process.env.REQUEST_TIMEOUT, 10) || 120000 // 2 minutes
  },
  
  // Run Expiration
  runExpirationDays: parseInt(process.env.RUN_EXPIRATION_DAYS, 10) || 7,
  
  // Helpers
  isDevelopment() {
    return this.nodeEnv === 'development';
  },
  
  isProduction() {
    return this.nodeEnv === 'production';
  },
  
  isTest() {
    return this.nodeEnv === 'test';
  }
};

module.exports = config;
