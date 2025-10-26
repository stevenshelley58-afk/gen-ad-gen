const browserPool = require('./browser-pool.service');
const cacheService = require('./cache.service');
const config = require('../config/environment');
const { logger } = require('../utils/logger');
const { recordScraping } = require('../utils/metrics');
const { extractDomain, jaccardSimilarity, sanitizeUrl } = require('../utils/helpers');
const { InsufficientDataError } = require('../utils/errors');

/**
 * Web scraping service with Playwright
 */
class ScraperService {
  /**
   * Scrape a website (main orchestrator)
   * @param {string} url - Website URL
   * @returns {Promise<Object>} - Scraped data
   */
  async scrapeWebsite(url) {
    const sanitized = sanitizeUrl(url);
    const domain = extractDomain(sanitized);
    const startPerformance = Date.now();

    logger.info({ url: sanitized, domain }, 'Starting website scrape');

    // Check cache first
    const cached = await cacheService.getScrapedContent(sanitized);
    if (cached) {
      logger.info({ url: sanitized, source: 'cache' }, 'Using cached scraping result');
      return cached;
    }

    try {
      // Discover candidate URLs
      const candidateUrls = await this.discoverPages(sanitized);
      logger.debug({ count: candidateUrls.length }, 'Discovered candidate URLs');

      // Validate URLs (parallel HEAD requests)
      const validUrls = await this.validateUrls(candidateUrls);
      logger.debug({ count: validUrls.length }, 'Validated URLs');

      if (validUrls.length === 0) {
        throw new InsufficientDataError('No accessible pages found');
      }

      // Scrape pages in parallel
      const pages = await this.scrapePages(validUrls);
      logger.debug({ count: pages.length }, 'Scraped pages');

      // Deduplicate similar content
      const uniquePages = this.deduplicateContent(pages);
      logger.debug({ count: uniquePages.length }, 'Unique pages after deduplication');

      const duration = Date.now() - startPerformance;
      recordScraping(domain, duration);

      const result = {
        pages: uniquePages,
        metadata: {
          url: sanitized,
          domain,
          totalCandidates: candidateUrls.length,
          validUrls: validUrls.length,
          scrapedPages: pages.length,
          uniquePages: uniquePages.length,
          durationMs: duration,
          scrapedAt: new Date().toISOString()
        }
      };

      // Cache the result
      await cacheService.cacheScrapedContent(sanitized, result);

      logger.info({ domain, duration, pages: uniquePages.length }, 'Website scrape completed');
      return result;
    } catch (error) {
      logger.error({ err: error, url: sanitized }, 'Website scrape failed');
      throw error;
    }
  }

  /**
   * Discover pages to scrape
   * @param {string} baseUrl - Base website URL
   * @returns {Promise<Array>} - List of URLs to scrape
   */
  async discoverPages(baseUrl) {
    const domain = extractDomain(baseUrl);
    const protocol = baseUrl.startsWith('https') ? 'https' : 'http';
    const baseWithoutProtocol = `${protocol}://${domain}`;

    const commonPaths = [
      '/',
      '/about',
      '/about-us',
      '/company',
      '/our-story',
      '/products',
      '/services',
      '/solutions',
      '/features',
      '/how-it-works',
      '/mission',
      '/vision',
      '/values',
      '/team',
      '/careers',
      '/blog',
      '/news',
      '/press',
      '/contact',
      '/faq',
      '/help'
    ];

    const urls = commonPaths.map(path => `${baseWithoutProtocol}${path}`);
    return [...new Set(urls)]; // Remove duplicates
  }

  /**
   * Validate which URLs are accessible
   * @param {Array} urls - URLs to validate
   * @returns {Promise<Array>} - Valid URLs
   */
  async validateUrls(urls) {
    const validationPromises = urls.map(async url => {
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          redirect: 'follow',
          signal: AbortSignal.timeout(5000)
        });
        return response.ok ? url : null;
      } catch (error) {
        return null;
      }
    });

    const results = await Promise.all(validationPromises);
    return results.filter(url => url !== null);
  }

  /**
   * Scrape multiple pages in parallel
   * @param {Array} urls - URLs to scrape
   * @returns {Promise<Array>} - Scraped pages
   */
  async scrapePages(urls) {
    const concurrency = config.scraping.concurrency;
    const pages = [];

    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(url => this.scrapePage(url))
      );
      pages.push(...batchResults.filter(p => p !== null));
    }

    return pages;
  }

  /**
   * Scrape a single page
   * @param {string} url - Page URL
   * @returns {Promise<Object|null>} - Page data
   */
  async scrapePage(url) {
    let browserObj = null;
    let context = null;

    try {
      browserObj = await browserPool.getBrowser();
      context = await browserPool.getContext(browserObj);
      const page = await context.newPage();

      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: config.scraping.pageLoadTimeout
      });

      // Extract text content
      const textContent = await page.evaluate(() => {
        // Remove script, style, and other non-content elements
        const elementsToRemove = document.querySelectorAll('script, style, nav, footer, header');
        elementsToRemove.forEach(el => el.remove());

        return document.body.innerText || '';
      });

      // Extract title
      const title = await page.title();

      await page.close();

      return {
        url,
        title,
        content: textContent.trim(),
        scrapedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.warn({ err: error, url }, 'Failed to scrape page');
      return null;
    } finally {
      if (context && browserObj) {
        await browserPool.releaseContext(context, browserObj);
      }
    }
  }

  /**
   * Deduplicate scraped content using Jaccard similarity
   * @param {Array} pages - Scraped pages
   * @returns {Array} - Unique pages
   */
  deduplicateContent(pages) {
    if (pages.length === 0) return [];

    const unique = [pages[0]];
    const threshold = 0.8; // 80% similarity threshold

    for (let i = 1; i < pages.length; i++) {
      const currentPage = pages[i];
      const currentWords = new Set(currentPage.content.toLowerCase().split(/\s+/));

      let isDuplicate = false;

      for (const uniquePage of unique) {
        const uniqueWords = new Set(uniquePage.content.toLowerCase().split(/\s+/));
        const similarity = jaccardSimilarity(currentWords, uniqueWords);

        if (similarity > threshold) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        unique.push(currentPage);
      }
    }

    return unique;
  }

  /**
   * Scrape specific pages (for evidence validation)
   * @param {Array} urls - Specific URLs to scrape
   * @returns {Promise<Array>} - Scraped pages
   */
  async scrapeSpecificPages(urls) {
    const validUrls = await this.validateUrls(urls);
    return this.scrapePages(validUrls);
  }
}

module.exports = new ScraperService();
