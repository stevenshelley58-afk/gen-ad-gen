const { logger } = require('../utils/logger');
const { extractDomain } = require('../utils/helpers');
const { EvidenceViolationError } = require('../utils/errors');

/**
 * Evidence validation service
 */
class EvidenceService {
  /**
   * Check evidence references
   * @param {Array} urls - URLs to validate
   * @param {Array} allowedDomains - Allowed domains
   * @returns {Promise<Object>} - Validation result
   */
  async checkEvidenceRefs(urls, allowedDomains) {
    if (!urls || urls.length === 0) {
      return {
        valid: [],
        invalid: [],
        confidence_penalty: 0
      };
    }

    const results = await Promise.all(
      urls.map(url => this.validateUrl(url, allowedDomains))
    );

    const valid = results.filter(r => r.valid).map(r => r.url);
    const invalid = results.filter(r => !r.valid).map(r => ({
      url: r.url,
      reason: r.reason
    }));

    const confidencePenalty = this.calculateConfidencePenalty(invalid.length, urls.length);

    logger.info({
      total: urls.length,
      valid: valid.length,
      invalid: invalid.length,
      penalty: confidencePenalty
    }, 'Evidence validation completed');

    return {
      valid,
      invalid,
      confidence_penalty: confidencePenalty
    };
  }

  /**
   * Validate a single URL
   * @param {string} url - URL to validate
   * @param {Array} allowedDomains - Allowed domains
   * @returns {Promise<Object>} - Validation result
   */
  async validateUrl(url, allowedDomains) {
    try {
      // Check domain
      const domain = extractDomain(url);
      if (!allowedDomains.includes(domain)) {
        return {
          valid: false,
          url,
          reason: 'Domain not in allowed list'
        };
      }

      // HTTP HEAD request with timeout
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(5000)
      });

      // Check final URL after redirects
      const finalDomain = extractDomain(response.url);
      if (!allowedDomains.includes(finalDomain)) {
        return {
          valid: false,
          url,
          reason: 'Redirected to different domain'
        };
      }

      // Check status code
      if (!response.ok) {
        return {
          valid: false,
          url,
          reason: `HTTP ${response.status}`
        };
      }

      return {
        valid: true,
        url
      };
    } catch (error) {
      return {
        valid: false,
        url,
        reason: error.message
      };
    }
  }

  /**
   * Calculate confidence penalty based on invalid evidence
   * @param {number} invalidCount - Number of invalid URLs
   * @param {number} totalCount - Total number of URLs
   * @returns {number} - Confidence penalty (0-1)
   */
  calculateConfidencePenalty(invalidCount, totalCount) {
    if (totalCount === 0) return 0;
    const invalidRatio = invalidCount / totalCount;
    return Math.min(invalidRatio * 0.3, 0.3); // Max 30% penalty
  }
}

module.exports = new EvidenceService();
