const promClient = require('prom-client');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

/**
 * HTTP request duration histogram
 */
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [10, 50, 100, 500, 1000, 2000, 5000, 10000, 30000, 60000]
});

/**
 * Scraping duration histogram
 */
const scrapingDuration = new promClient.Histogram({
  name: 'scraping_duration_ms',
  help: 'Duration of web scraping operations in milliseconds',
  labelNames: ['domain'],
  buckets: [1000, 5000, 10000, 20000, 30000, 40000, 50000, 60000]
});

/**
 * Cache hit rate counter
 */
const cacheHits = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type']
});

const cacheMisses = new promClient.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type']
});

/**
 * OpenAI token usage counter
 */
const openaiTokens = new promClient.Counter({
  name: 'openai_tokens_used_total',
  help: 'Total number of OpenAI tokens used',
  labelNames: ['model', 'endpoint']
});

/**
 * OpenAI API calls counter
 */
const openaiCalls = new promClient.Counter({
  name: 'openai_api_calls_total',
  help: 'Total number of OpenAI API calls',
  labelNames: ['model', 'endpoint', 'status']
});

/**
 * Browser pool gauge
 */
const browserPoolSize = new promClient.Gauge({
  name: 'browser_pool_size',
  help: 'Current browser pool size',
  labelNames: ['status']
});

/**
 * Active runs gauge
 */
const activeRuns = new promClient.Gauge({
  name: 'active_runs_total',
  help: 'Number of active analysis runs'
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(scrapingDuration);
register.registerMetric(cacheHits);
register.registerMetric(cacheMisses);
register.registerMetric(openaiTokens);
register.registerMetric(openaiCalls);
register.registerMetric(browserPoolSize);
register.registerMetric(activeRuns);

/**
 * Record HTTP request metrics
 * @param {string} method - HTTP method
 * @param {string} route - Route path
 * @param {number} statusCode - HTTP status code
 * @param {number} durationMs - Request duration in milliseconds
 */
function recordHttpRequest(method, route, statusCode, durationMs) {
  httpRequestDuration
    .labels(method, route, statusCode.toString())
    .observe(durationMs);
}

/**
 * Record scraping metrics
 * @param {string} domain - Domain scraped
 * @param {number} durationMs - Scraping duration in milliseconds
 */
function recordScraping(domain, durationMs) {
  scrapingDuration
    .labels(domain)
    .observe(durationMs);
}

/**
 * Record cache hit
 * @param {string} cacheType - Type of cache (redis, postgres)
 */
function recordCacheHit(cacheType) {
  cacheHits.labels(cacheType).inc();
}

/**
 * Record cache miss
 * @param {string} cacheType - Type of cache (redis, postgres)
 */
function recordCacheMiss(cacheType) {
  cacheMisses.labels(cacheType).inc();
}

/**
 * Record OpenAI token usage
 * @param {string} model - Model name
 * @param {string} endpoint - Endpoint name
 * @param {number} tokens - Number of tokens used
 */
function recordOpenAITokens(model, endpoint, tokens) {
  openaiTokens.labels(model, endpoint).inc(tokens);
}

/**
 * Record OpenAI API call
 * @param {string} model - Model name
 * @param {string} endpoint - Endpoint name
 * @param {string} status - Status (success, error)
 */
function recordOpenAICall(model, endpoint, status) {
  openaiCalls.labels(model, endpoint, status).inc();
}

/**
 * Update browser pool metrics
 * @param {number} total - Total browsers
 * @param {number} inUse - Browsers in use
 */
function updateBrowserPool(total, inUse) {
  browserPoolSize.labels('total').set(total);
  browserPoolSize.labels('in_use').set(inUse);
  browserPoolSize.labels('available').set(total - inUse);
}

/**
 * Update active runs count
 * @param {number} count - Number of active runs
 */
function updateActiveRuns(count) {
  activeRuns.set(count);
}

/**
 * Get metrics in Prometheus format
 * @returns {Promise<string>} - Metrics string
 */
async function getMetrics() {
  return register.metrics();
}

module.exports = {
  recordHttpRequest,
  recordScraping,
  recordCacheHit,
  recordCacheMiss,
  recordOpenAITokens,
  recordOpenAICall,
  updateBrowserPool,
  updateActiveRuns,
  getMetrics
};
