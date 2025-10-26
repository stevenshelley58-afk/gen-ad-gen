const scraperService = require('../services/scraper.service');
const openaiService = require('../services/openai.service');
const evidenceService = require('../services/evidence.service');
const storageService = require('../services/storage.service');
const cardService = require('../services/card.service');
const { validate, validateBrandSummary, validateCompetitors, validateCompetitorsAnalyze, validateKernel } = require('../utils/validation');
const { extractDomain } = require('../utils/helpers');
const { logger } = require('../utils/logger');
const { LowConfidenceError, InsufficientDataError, UpstreamArtifactMissingError } = require('../utils/errors');

/**
 * Stage 1 API routes
 */
async function stage1Routes(fastify) {
  /**
   * POST /v1/brand-summary
   * Analyze a brand from their website
   */
  fastify.post('/v1/brand-summary', async (request, reply) => {
    const start = Date.now();
    validate(request.body, validateBrandSummary, 'Brand Summary Request');

    const { brand_url } = request.body;
    const domain = extractDomain(brand_url);

    logger.info({ correlationId: request.id, brandUrl: brand_url }, 'Brand summary requested');

    // Create run
    const run = await storageService.createRun();

    // Scrape website
    const scrapedData = await scraperService.scrapeWebsite(brand_url);

    if (scrapedData.pages.length < 3) {
      throw new InsufficientDataError('Insufficient pages scraped (minimum 3 required)');
    }

    // Analyze brand with OpenAI
    const brandAnalysis = await openaiService.analyzeBrand(scrapedData);

    // Validate evidence
    const evidenceCheck = await evidenceService.checkEvidenceRefs(
      brandAnalysis.evidence_refs || [],
      [domain]
    );

    // Adjust confidence
    const adjustedConfidence = Math.max(
      0,
      brandAnalysis.confidence_0_1 - evidenceCheck.confidence_penalty
    );

    if (adjustedConfidence < 0.6) {
      throw new LowConfidenceError('Analysis confidence too low', {
        confidence: adjustedConfidence,
        invalidEvidence: evidenceCheck.invalid
      });
    }

    const brandData = {
      ...brandAnalysis,
      confidence_0_1: adjustedConfidence,
      evidence_validation: evidenceCheck
    };

    // Save to database
    await storageService.saveBrand(run.run_id, brandData);

    // Generate card
    const brandCard = cardService.generateBrandCard(brandData);

    const duration = Date.now() - start;

    logger.info({
      correlationId: request.id,
      runId: run.run_id,
      duration,
      brandName: brandData.name
    }, 'Brand summary completed');

    return reply.send({
      run_id: run.run_id,
      brand: brandData,
      brand_card: brandCard,
      files: {
        brand_json: `/v1/runs/${run.run_id}/brand.json`
      },
      meta: {
        duration_ms: duration,
        pages_scraped: scrapedData.pages.length,
        timestamp: new Date().toISOString()
      }
    });
  });

  /**
   * POST /v1/competitors
   * Discover 10 competitors for a brand
   */
  fastify.post('/v1/competitors', async (request, reply) => {
    const start = Date.now();
    validate(request.body, validateCompetitors, 'Competitors Request');

    const { brand_domain, run_id } = request.body;

    logger.info({ correlationId: request.id, runId: run_id }, 'Competitors discovery requested');

    // Get run
    const run = await storageService.getRun(run_id);

    if (!run.brand_data) {
      throw new UpstreamArtifactMissingError('Brand analysis not found for this run');
    }

    // Discover competitors with OpenAI
    const competitorsResult = await openaiService.findCompetitors(run.brand_data);
    const competitors = competitorsResult.competitors || [];

    if (competitors.length !== 10) {
      logger.warn({ count: competitors.length }, 'Expected 10 competitors');
    }

    // Filter low confidence
    const filteredCompetitors = competitors.filter(c => c.confidence_0_1 >= 0.6);

    // Save to database
    await storageService.saveCompetitors(run_id, filteredCompetitors);

    // Generate cards
    const competitorCards = filteredCompetitors.map((c, i) =>
      cardService.generateCompetitorCard(c, i + 1)
    );

    const duration = Date.now() - start;

    logger.info({
      correlationId: request.id,
      runId: run_id,
      duration,
      count: filteredCompetitors.length
    }, 'Competitors discovery completed');

    return reply.send({
      run_id,
      competitors: filteredCompetitors,
      competitor_cards: competitorCards,
      meta: {
        duration_ms: duration,
        competitors_found: filteredCompetitors.length,
        timestamp: new Date().toISOString()
      }
    });
  });

  /**
   * POST /v1/competitors/analyze
   * Analyze selected competitors in parallel
   */
  fastify.post('/v1/competitors/analyze', async (request, reply) => {
    const start = Date.now();
    validate(request.body, validateCompetitorsAnalyze, 'Competitors Analyze Request');

    const { run_id, domains } = request.body;

    logger.info({ correlationId: request.id, runId: run_id, domains }, 'Competitor analysis requested');

    // Get run
    const run = await storageService.getRun(run_id);

    if (!run.competitors_10) {
      throw new UpstreamArtifactMissingError('Competitors not discovered yet');
    }

    // Analyze competitors in parallel
    const analyses = await Promise.all(
      domains.map(async domain => {
        // Scrape competitor website
        const scrapedData = await scraperService.scrapeWebsite(`https://${domain}`);

        // Analyze with OpenAI
        const analysis = await openaiService.analyzeCompetitor(domain, scrapedData);

        // Validate evidence
        const evidenceCheck = await evidenceService.checkEvidenceRefs(
          analysis.evidence_refs || [],
          [domain]
        );

        const adjustedConfidence = Math.max(
          0,
          analysis.confidence_0_1 - evidenceCheck.confidence_penalty
        );

        return {
          ...analysis,
          confidence_0_1: adjustedConfidence,
          evidence_validation: evidenceCheck
        };
      })
    );

    // Save to database
    await storageService.saveAnalyzedCompetitors(run_id, analyses);

    // Generate cards
    const competitorCards = analyses.map((c, i) =>
      cardService.generateCompetitorCard(c, i + 1)
    );

    const duration = Date.now() - start;

    logger.info({
      correlationId: request.id,
      runId: run_id,
      duration,
      analyzed: analyses.length
    }, 'Competitor analysis completed');

    return reply.send({
      run_id,
      competitors: analyses,
      competitor_cards: competitorCards,
      meta: {
        duration_ms: duration,
        competitors_analyzed: analyses.length,
        timestamp: new Date().toISOString()
      }
    });
  });

  /**
   * POST /v1/kernel
   * Assemble final kernel with all insights
   */
  fastify.post('/v1/kernel', async (request, reply) => {
    const start = Date.now();
    validate(request.body, validateKernel, 'Kernel Request');

    const { run_id } = request.body;

    logger.info({ correlationId: request.id, runId: run_id }, 'Kernel assembly requested');

    // Get run
    const run = await storageService.getRun(run_id);

    if (!run.brand_data) {
      throw new UpstreamArtifactMissingError('Brand analysis not found');
    }

    if (!run.competitors_selected || run.competitors_selected.length === 0) {
      throw new UpstreamArtifactMissingError('No analyzed competitors found');
    }

    // Assemble kernel with OpenAI
    const kernel = await openaiService.assembleKernel(
      run.brand_data,
      run.competitors_selected
    );

    // Save to database
    await storageService.saveKernel(run_id, kernel);

    // Generate kernel card
    const kernelCard = cardService.generateKernelCard(
      kernel,
      run.brand_data,
      run.competitors_selected
    );

    const duration = Date.now() - start;

    logger.info({
      correlationId: request.id,
      runId: run_id,
      duration
    }, 'Kernel assembly completed');

    return reply.send({
      run_id,
      kernel: {
        brand: run.brand_data,
        competitors: run.competitors_selected,
        ...kernel
      },
      kernel_card: kernelCard,
      files: {
        brand_json: `/v1/runs/${run_id}/brand.json`,
        competitors_json: `/v1/runs/${run_id}/competitors.json`,
        kernel_json: `/v1/runs/${run_id}/kernel.json`,
        report_md: `/v1/runs/${run_id}/report.md`
      },
      meta: {
        duration_ms: duration,
        timestamp: new Date().toISOString()
      }
    });
  });
}

module.exports = stage1Routes;
