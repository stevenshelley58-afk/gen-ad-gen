const { chromium } = require('playwright');
const config = require('../config/environment');
const { logger } = require('../utils/logger');
const { updateBrowserPool } = require('../utils/metrics');

/**
 * Browser pool for managing reusable Playwright browsers
 */
class BrowserPool {
  constructor(poolSize = 3) {
    this.poolSize = poolSize;
    this.browsers = [];
    this.availableBrowsers = [];
    this.initialized = false;
  }

  /**
   * Initialize browser pool
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initialized) {
      logger.warn('Browser pool already initialized');
      return;
    }

    logger.info(`Initializing browser pool with ${this.poolSize} browsers`);

    try {
      for (let i = 0; i < this.poolSize; i++) {
        const browser = await chromium.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
          ]
        });

        this.browsers.push({
          id: i,
          browser,
          inUse: false
        });

        this.availableBrowsers.push(i);

        logger.debug(`Browser ${i} launched`);
      }

      this.initialized = true;
      this.updateMetrics();
      logger.info('Browser pool initialized successfully');
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize browser pool');
      throw error;
    }
  }

  /**
   * Get an available browser
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Object>} - Browser object with ID
   */
  async getBrowser(timeout = 30000) {
    if (!this.initialized) {
      throw new Error('Browser pool not initialized');
    }

    const start = Date.now();

    while (this.availableBrowsers.length === 0) {
      if (Date.now() - start > timeout) {
        throw new Error('Timeout waiting for available browser');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const browserId = this.availableBrowsers.shift();
    const browserObj = this.browsers[browserId];
    browserObj.inUse = true;

    this.updateMetrics();
    logger.debug(`Browser ${browserId} acquired`);

    return browserObj;
  }

  /**
   * Release a browser back to the pool
   * @param {Object} browserObj - Browser object to release
   */
  releaseBrowser(browserObj) {
    if (!browserObj || browserObj.inUse === false) {
      return;
    }

    browserObj.inUse = false;
    this.availableBrowsers.push(browserObj.id);
    this.updateMetrics();

    logger.debug(`Browser ${browserObj.id} released`);
  }

  /**
   * Create a new browser context
   * @param {Object} browserObj - Browser object
   * @returns {Promise<Object>} - Browser context
   */
  async getContext(browserObj) {
    const context = await browserObj.browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    return context;
  }

  /**
   * Close context and release browser
   * @param {Object} context - Browser context
   * @param {Object} browserObj - Browser object
   */
  async releaseContext(context, browserObj) {
    try {
      await context.close();
    } catch (error) {
      logger.error({ err: error }, 'Error closing context');
    }
    this.releaseBrowser(browserObj);
  }

  /**
   * Get pool statistics
   * @returns {Object} - Pool stats
   */
  getStats() {
    return {
      total: this.poolSize,
      inUse: this.poolSize - this.availableBrowsers.length,
      available: this.availableBrowsers.length,
      initialized: this.initialized
    };
  }

  /**
   * Update Prometheus metrics
   */
  updateMetrics() {
    const stats = this.getStats();
    updateBrowserPool(stats.total, stats.inUse);
  }

  /**
   * Close all browsers
   * @returns {Promise<void>}
   */
  async close() {
    if (!this.initialized) {
      return;
    }

    logger.info('Closing browser pool');

    for (const browserObj of this.browsers) {
      try {
        await browserObj.browser.close();
        logger.debug(`Browser ${browserObj.id} closed`);
      } catch (error) {
        logger.error({ err: error, browserId: browserObj.id }, 'Error closing browser');
      }
    }

    this.browsers = [];
    this.availableBrowsers = [];
    this.initialized = false;

    logger.info('Browser pool closed');
  }
}

// Create singleton instance
const browserPool = new BrowserPool(config.scraping.browserPoolSize);

module.exports = browserPool;
