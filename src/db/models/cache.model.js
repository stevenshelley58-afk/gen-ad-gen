const db = require('../../config/database');
const { generateUrlHash } = require('../../utils/helpers');

/**
 * Get cached scraping result
 * @param {string} url - URL to check
 * @returns {Promise<Object|null>} - Cached data or null
 */
async function getCachedScraping(url) {
  const urlHash = generateUrlHash(url);
  
  const query = `
    SELECT content, scraped_at, expires_at
    FROM scraping_cache
    WHERE url_hash = $1 AND expires_at > NOW()
  `;
  
  const result = await db.query(query, [urlHash]);
  
  if (result.rows.length > 0) {
    // Update access count and last accessed time
    await db.query(
      `UPDATE scraping_cache 
       SET access_count = access_count + 1, 
           last_accessed_at = NOW()
       WHERE url_hash = $1`,
      [urlHash]
    );
    
    return result.rows[0].content;
  }
  
  return null;
}

/**
 * Save scraping result to cache
 * @param {string} url - URL scraped
 * @param {Object} data - Scraped data
 * @param {number} ttl - TTL in seconds (default 24 hours)
 * @returns {Promise<void>}
 */
async function setCachedScraping(url, data, ttl = 86400) {
  const urlHash = generateUrlHash(url);
  const pageCount = data.pages?.length || 0;
  const totalTokens = data.metadata?.totalTokens || 0;
  
  const query = `
    INSERT INTO scraping_cache 
      (url_hash, url, content, page_count, total_tokens, expires_at)
    VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '${ttl} seconds')
    ON CONFLICT (url_hash) 
    DO UPDATE SET
      content = EXCLUDED.content,
      scraped_at = NOW(),
      expires_at = NOW() + INTERVAL '${ttl} seconds',
      page_count = EXCLUDED.page_count,
      total_tokens = EXCLUDED.total_tokens,
      access_count = scraping_cache.access_count + 1
  `;
  
  await db.query(query, [
    urlHash,
    url,
    JSON.stringify(data),
    pageCount,
    totalTokens
  ]);
}

/**
 * Invalidate cache for URL
 * @param {string} url - URL to invalidate
 * @returns {Promise<boolean>} - Success
 */
async function invalidateCache(url) {
  const urlHash = generateUrlHash(url);
  
  const query = `
    DELETE FROM scraping_cache
    WHERE url_hash = $1
  `;
  
  const result = await db.query(query, [urlHash]);
  return result.rowCount > 0;
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} - Cache stats
 */
async function getStats() {
  const query = `
    SELECT * FROM cache_statistics
  `;
  
  const result = await db.query(query);
  return result.rows[0] || {};
}

/**
 * Clean expired cache entries
 * @returns {Promise<number>} - Number of entries deleted
 */
async function cleanExpired() {
  const query = `
    DELETE FROM scraping_cache
    WHERE expires_at < NOW()
  `;
  
  const result = await db.query(query);
  return result.rowCount;
}

module.exports = {
  getCachedScraping,
  setCachedScraping,
  invalidateCache,
  getStats,
  cleanExpired
};
