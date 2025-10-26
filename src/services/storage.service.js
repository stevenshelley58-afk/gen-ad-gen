const runsModel = require('../db/models/runs.model');
const { logger } = require('../utils/logger');
const { generateRunId } = require('../utils/helpers');
const { UpstreamArtifactMissingError } = require('../utils/errors');

/**
 * Storage service for run data
 */
class StorageService {
  /**
   * Create a new run
   * @param {Object} options - Run options
   * @returns {Promise<Object>} - Created run
   */
  async createRun(options = {}) {
    const run = await runsModel.createRun(options);
    logger.info({ runId: run.run_id }, 'Run created');
    return run;
  }

  /**
   * Get run by ID
   * @param {string} runId - Run ID
   * @param {boolean} throwIfNotFound - Throw error if not found
   * @returns {Promise<Object>} - Run data
   */
  async getRun(runId, throwIfNotFound = true) {
    const run = await runsModel.getRun(runId);
    
    if (!run && throwIfNotFound) {
      throw new UpstreamArtifactMissingError(`Run not found: ${runId}`);
    }
    
    return run;
  }

  /**
   * Save brand analysis
   * @param {string} runId - Run ID
   * @param {Object} brandData - Brand analysis data
   * @returns {Promise<Object>} - Updated run
   */
  async saveBrand(runId, brandData) {
    const run = await runsModel.saveBrand(runId, brandData);
    logger.info({ runId, brandName: brandData.name }, 'Brand saved');
    return run;
  }

  /**
   * Save competitor discovery
   * @param {string} runId - Run ID
   * @param {Array} competitors - Competitors array
   * @returns {Promise<Object>} - Updated run
   */
  async saveCompetitors(runId, competitors) {
    const run = await runsModel.saveCompetitors(runId, competitors);
    logger.info({ runId, count: competitors.length }, 'Competitors saved');
    return run;
  }

  /**
   * Save analyzed competitors
   * @param {string} runId - Run ID
   * @param {Array} competitors - Analyzed competitors
   * @returns {Promise<Object>} - Updated run
   */
  async saveAnalyzedCompetitors(runId, competitors) {
    const run = await runsModel.saveAnalyzedCompetitors(runId, competitors);
    logger.info({ runId, count: competitors.length }, 'Analyzed competitors saved');
    return run;
  }

  /**
   * Save kernel assembly
   * @param {string} runId - Run ID
   * @param {Object} kernelData - Kernel data
   * @returns {Promise<Object>} - Updated run
   */
  async saveKernel(runId, kernelData) {
    const run = await runsModel.saveKernel(runId, kernelData);
    logger.info({ runId }, 'Kernel saved');
    return run;
  }

  /**
   * Update run metadata
   * @param {string} runId - Run ID
   * @param {Object} metadata - Metadata to add
   * @returns {Promise<Object>} - Updated run
   */
  async updateMetadata(runId, metadata) {
    return runsModel.updateMetadata(runId, metadata);
  }

  /**
   * Get active runs count
   * @returns {Promise<number>} - Count
   */
  async getActiveRunsCount() {
    return runsModel.getActiveRunsCount();
  }
}

module.exports = new StorageService();
