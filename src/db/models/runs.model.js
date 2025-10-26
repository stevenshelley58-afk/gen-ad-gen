const db = require('../../config/database');
const { generateRunId } = require('../../utils/helpers');

/**
 * Create a new run
 * @param {Object} data - Initial run data
 * @returns {Promise<Object>} - Created run
 */
async function createRun(data = {}) {
  const runId = data.run_id || generateRunId();
  const expiresAt = new Date(Date.now() + (data.expirationDays || 7) * 24 * 60 * 60 * 1000);
  
  const query = `
    INSERT INTO runs (run_id, expires_at, metadata)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  
  const result = await db.query(query, [
    runId,
    expiresAt,
    JSON.stringify(data.metadata || {})
  ]);
  
  return result.rows[0];
}

/**
 * Get run by ID
 * @param {string} runId - Run ID
 * @returns {Promise<Object|null>} - Run data or null
 */
async function getRun(runId) {
  const query = `
    SELECT * FROM runs
    WHERE run_id = $1 AND status = 'active'
  `;
  
  const result = await db.query(query, [runId]);
  return result.rows[0] || null;
}

/**
 * Update run data
 * @param {string} runId - Run ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated run
 */
async function updateRun(runId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  // Build dynamic UPDATE query
  Object.keys(updates).forEach(key => {
    if (key === 'run_id') return; // Don't update ID
    
    fields.push(`${key} = $${paramIndex}`);
    values.push(typeof updates[key] === 'object' ? JSON.stringify(updates[key]) : updates[key]);
    paramIndex++;
  });
  
  if (fields.length === 0) {
    return getRun(runId);
  }
  
  values.push(runId);
  
  const query = `
    UPDATE runs
    SET ${fields.join(', ')}
    WHERE run_id = $${paramIndex}
    RETURNING *
  `;
  
  const result = await db.query(query, values);
  return result.rows[0];
}

/**
 * Save brand data
 * @param {string} runId - Run ID
 * @param {Object} brandData - Brand analysis data
 * @returns {Promise<Object>} - Updated run
 */
async function saveBrand(runId, brandData) {
  return updateRun(runId, {
    brand_data: brandData,
    brand_summary: brandData.summary || null
  });
}

/**
 * Save competitor discovery data
 * @param {string} runId - Run ID
 * @param {Array} competitors - Array of 10 competitors
 * @returns {Promise<Object>} - Updated run
 */
async function saveCompetitors(runId, competitors) {
  return updateRun(runId, {
    competitors_10: competitors
  });
}

/**
 * Save analyzed competitors
 * @param {string} runId - Run ID
 * @param {Array} competitors - Array of analyzed competitors
 * @returns {Promise<Object>} - Updated run
 */
async function saveAnalyzedCompetitors(runId, competitors) {
  return updateRun(runId, {
    competitors_selected: competitors
  });
}

/**
 * Save kernel data
 * @param {string} runId - Run ID
 * @param {Object} kernelData - Kernel assembly data
 * @returns {Promise<Object>} - Updated run
 */
async function saveKernel(runId, kernelData) {
  return updateRun(runId, {
    kernel_data: kernelData,
    report_md: kernelData.report_md || null
  });
}

/**
 * Update metadata
 * @param {string} runId - Run ID
 * @param {Object} metadata - Metadata to merge
 * @returns {Promise<Object>} - Updated run
 */
async function updateMetadata(runId, metadata) {
  const query = `
    UPDATE runs
    SET metadata = metadata || $1::jsonb
    WHERE run_id = $2
    RETURNING *
  `;
  
  const result = await db.query(query, [JSON.stringify(metadata), runId]);
  return result.rows[0];
}

/**
 * Delete run (soft delete)
 * @param {string} runId - Run ID
 * @returns {Promise<boolean>} - Success
 */
async function deleteRun(runId) {
  const query = `
    UPDATE runs
    SET status = 'deleted'
    WHERE run_id = $1
  `;
  
  const result = await db.query(query, [runId]);
  return result.rowCount > 0;
}

/**
 * List runs with filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} - List of runs
 */
async function listRuns(filters = {}) {
  const { limit = 50, offset = 0, status = 'active' } = filters;
  
  const query = `
    SELECT * FROM runs
    WHERE status = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;
  
  const result = await db.query(query, [status, limit, offset]);
  return result.rows;
}

/**
 * Get active runs count
 * @returns {Promise<number>} - Count of active runs
 */
async function getActiveRunsCount() {
  const query = `
    SELECT COUNT(*) as count
    FROM runs
    WHERE status = 'active' AND expires_at > NOW()
  `;
  
  const result = await db.query(query);
  return parseInt(result.rows[0].count, 10);
}

module.exports = {
  createRun,
  getRun,
  updateRun,
  saveBrand,
  saveCompetitors,
  saveAnalyzedCompetitors,
  saveKernel,
  updateMetadata,
  deleteRun,
  listRuns,
  getActiveRunsCount
};
