const OpenAI = require('openai');
const config = require('../config/environment');
const { logger } = require('../utils/logger');
const { recordOpenAITokens, recordOpenAICall } = require('../utils/metrics');
const { retry } = require('../utils/helpers');
const { OpenAIError, OpenAITimeoutError, LowConfidenceError } = require('../utils/errors');

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
  timeout: config.openai.timeout
});

/**
 * OpenAI service with retry logic
 */
class OpenAIService {
  /**
   * Analyze brand from scraped data
   * @param {Object} scrapedData - Scraped website data
   * @returns {Promise<Object>} - Brand analysis
   */
  async analyzeBrand(scrapedData) {
    const prompt = this.buildBrandPrompt(scrapedData);

    try {
      const result = await retry(async () => {
        return await this.callOpenAI('brand-analysis', prompt);
      }, 3, 2000);

      recordOpenAICall(config.openai.model, 'brand-analysis', 'success');
      return result;
    } catch (error) {
      recordOpenAICall(config.openai.model, 'brand-analysis', 'error');
      throw error;
    }
  }

  /**
   * Find competitors
   * @param {Object} brandData - Brand analysis data
   * @returns {Promise<Array>} - List of 10 competitors
   */
  async findCompetitors(brandData) {
    const prompt = this.buildCompetitorsPrompt(brandData);

    try {
      const result = await retry(async () => {
        return await this.callOpenAI('competitors-discovery', prompt);
      }, 3, 2000);

      recordOpenAICall(config.openai.model, 'competitors-discovery', 'success');
      return result;
    } catch (error) {
      recordOpenAICall(config.openai.model, 'competitors-discovery', 'error');
      throw error;
    }
  }

  /**
   * Analyze a competitor
   * @param {string} domain - Competitor domain
   * @param {Object} scrapedData - Scraped competitor data
   * @returns {Promise<Object>} - Competitor analysis
   */
  async analyzeCompetitor(domain, scrapedData) {
    const prompt = this.buildCompetitorAnalysisPrompt(domain, scrapedData);

    try {
      const result = await retry(async () => {
        return await this.callOpenAI('competitor-analysis', prompt);
      }, 3, 2000);

      recordOpenAICall(config.openai.model, 'competitor-analysis', 'success');
      return result;
    } catch (error) {
      recordOpenAICall(config.openai.model, 'competitor-analysis', 'error');
      throw error;
    }
  }

  /**
   * Assemble kernel
   * @param {Object} brand - Brand data
   * @param {Array} competitors - Analyzed competitors
   * @returns {Promise<Object>} - Kernel assembly
   */
  async assembleKernel(brand, competitors) {
    const prompt = this.buildKernelPrompt(brand, competitors);

    try {
      const result = await retry(async () => {
        return await this.callOpenAI('kernel-assembly', prompt);
      }, 3, 2000);

      recordOpenAICall(config.openai.model, 'kernel-assembly', 'success');
      return result;
    } catch (error) {
      recordOpenAICall(config.openai.model, 'kernel-assembly', 'error');
      throw error;
    }
  }

  /**
   * Call OpenAI API
   * @param {string} endpoint - Endpoint name for logging
   * @param {string} prompt - Prompt text
   * @returns {Promise<Object>} - Parsed response
   */
  async callOpenAI(endpoint, prompt) {
    const start = Date.now();

    try {
      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are a brand intelligence analyst. Always respond with valid JSON only, no markdown formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const duration = Date.now() - start;
      const usage = response.usage;

      recordOpenAITokens(config.openai.model, endpoint, usage.total_tokens);

      logger.info({
        endpoint,
        duration,
        tokens: usage.total_tokens,
        model: response.model
      }, 'OpenAI API call completed');

      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      const duration = Date.now() - start;

      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new OpenAITimeoutError('OpenAI request timeout');
      }

      if (error.status === 401) {
        throw new OpenAIError('Invalid OpenAI API key', { status: 401 });
      }

      if (error.status === 429) {
        throw new OpenAIError('OpenAI rate limit exceeded', { status: 429 });
      }

      logger.error({
        err: error,
        endpoint,
        duration
      }, 'OpenAI API call failed');

      throw new OpenAIError(error.message, { originalError: error });
    }
  }

  /**
   * Build brand analysis prompt
   */
  buildBrandPrompt(scrapedData) {
    const pagesText = scrapedData.pages
      .map(p => `URL: ${p.url}\nTitle: ${p.title}\nContent: ${p.content.substring(0, 2000)}`)
      .join('\n\n---\n\n');

    return `Analyze this brand based on their website content:

${pagesText}

Provide a JSON response with:
{
  "name": "Brand name",
  "domain": "brand.com",
  "tagline": "Main tagline or slogan",
  "category": "Industry category",
  "value_propositions": ["value prop 1", "value prop 2", ...],
  "target_audience": "Description of target customers",
  "positioning": "How they position themselves",
  "key_features": ["feature 1", "feature 2", ...],
  "summary": "2-3 sentence summary",
  "evidence_refs": ["https://brand.com/about", "https://brand.com/products", ...],
  "confidence_0_1": 0.85
}

Include 5-15 evidence_refs URLs that support your analysis.`;
  }

  /**
   * Build competitors discovery prompt
   */
  buildCompetitorsPrompt(brandData) {
    return `Based on this brand analysis, identify 10 direct competitors:

Brand: ${brandData.name}
Category: ${brandData.category}
Positioning: ${brandData.positioning}
Value Props: ${brandData.value_propositions.join(', ')}

Provide a JSON response with:
{
  "competitors": [
    {
      "name": "Competitor name",
      "domain": "competitor.com",
      "confidence_0_1": 0.9,
      "reason": "Why they're a competitor"
    },
    ...
  ]
}

List exactly 10 competitors, ordered by relevance.`;
  }

  /**
   * Build competitor analysis prompt
   */
  buildCompetitorAnalysisPrompt(domain, scrapedData) {
    const pagesText = scrapedData.pages
      .map(p => `URL: ${p.url}\nTitle: ${p.title}\nContent: ${p.content.substring(0, 2000)}`)
      .join('\n\n---\n\n');

    return `Analyze this competitor (${domain}) based on their website:

${pagesText}

Provide detailed JSON analysis:
{
  "name": "Company name",
  "domain": "${domain}",
  "tagline": "Their tagline",
  "value_propositions": ["value prop 1", ...],
  "target_audience": "Their target customers",
  "positioning": "How they position themselves",
  "key_features": ["feature 1", ...],
  "pricing_approach": "Their pricing strategy",
  "strengths": ["strength 1", ...],
  "weaknesses": ["weakness 1", ...],
  "differentiation": "How they differentiate",
  "evidence_refs": ["url 1", ...],
  "confidence_0_1": 0.85
}`;
  }

  /**
   * Build kernel assembly prompt
   */
  buildKernelPrompt(brand, competitors) {
    return `Assemble a competitive intelligence kernel:

Brand: ${JSON.stringify(brand, null, 2)}

Competitors: ${JSON.stringify(competitors, null, 2)}

Provide comprehensive JSON analysis:
{
  "keyword_map": {
    "brand_unique": ["keyword 1", ...],
    "shared": ["keyword 1", ...],
    "white_space": ["keyword 1", ...]
  },
  "gap_map": [
    {
      "area": "Product feature",
      "brand_coverage": "low/medium/high",
      "competitor_coverage": "low/medium/high",
      "opportunity": "Description"
    },
    ...
  ],
  "insights": {
    "strengths": ["strength 1", ...],
    "opportunities": ["opportunity 1", ...],
    "risks": ["risk 1", ...]
  },
  "recommendations": ["recommendation 1", ...]
}`;
  }
}

module.exports = new OpenAIService();
