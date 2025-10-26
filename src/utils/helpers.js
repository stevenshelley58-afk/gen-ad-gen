const { v4: uuidv4 } = require('uuid');
const { URL } = require('url');
const crypto = require('crypto');

/**
 * Generate a unique run ID
 * @returns {string} - UUID with 'run_' prefix
 */
function generateRunId() {
  return `run_${uuidv4()}`;
}

/**
 * Estimate token count for text
 * Rough estimate: 1 token ≈ 4 characters
 * @param {string} text - Text to estimate
 * @returns {number} - Estimated token count
 */
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Sanitize and validate URL
 * @param {string} url - URL to sanitize
 * @returns {string} - Sanitized URL
 * @throws {Error} - If URL is invalid
 */
function sanitizeUrl(url) {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only HTTP and HTTPS protocols are allowed');
    }
    
    // Remove fragments
    parsed.hash = '';
    
    return parsed.toString();
  } catch (error) {
    throw new Error(`Invalid URL: ${error.message}`);
  }
}

/**
 * Extract domain from URL
 * @param {string} url - URL to parse
 * @returns {string} - Domain (hostname)
 */
function extractDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch (error) {
    return null;
  }
}

/**
 * Generate URL hash for caching
 * @param {string} url - URL to hash
 * @returns {string} - SHA-256 hash
 */
function generateUrlHash(url) {
  return crypto.createHash('sha256').update(url).digest('hex');
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxAttempts - Maximum retry attempts
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise<any>} - Result of function
 */
async function retry(fn, maxAttempts = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }
      
      if (attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

/**
 * Truncate text to maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
function truncate(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Calculate Jaccard similarity between two sets
 * @param {Set} set1 - First set
 * @param {Set} set2 - Second set
 * @returns {number} - Similarity score (0-1)
 */
function jaccardSimilarity(set1, set2) {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

/**
 * Parse boolean from string
 * @param {string|boolean} value - Value to parse
 * @param {boolean} defaultValue - Default value if undefined
 * @returns {boolean}
 */
function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
}

/**
 * Format duration in milliseconds to human-readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} - Formatted duration
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

/**
 * Deep clone object (simple implementation)
 * @param {Object} obj - Object to clone
 * @returns {Object} - Cloned object
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

module.exports = {
  generateRunId,
  estimateTokens,
  sanitizeUrl,
  extractDomain,
  generateUrlHash,
  sleep,
  retry,
  truncate,
  jaccardSimilarity,
  parseBoolean,
  formatDuration,
  deepClone
};
