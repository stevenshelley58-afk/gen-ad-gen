const db = require('../config/database');
const { logger } = require('../utils/logger');

/**
 * Run cleanup for expired data
 */
async function cleanup() {
  try {
    logger.info('🧹 Running database cleanup...');
    
    const result = await db.query('SELECT * FROM cleanup_expired_data()');
    const stats = result.rows[0];
    
    logger.info({
      deletedRuns: stats.deleted_runs,
      deletedCache: stats.deleted_cache,
      deletedMetrics: stats.deleted_metrics
    }, '✅ Cleanup completed');
    
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, '❌ Cleanup failed');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  cleanup();
}

module.exports = cleanup;
