const fs = require('fs').promises;
const path = require('path');
const db = require('../config/database');
const { logger } = require('../utils/logger');

/**
 * Run database migrations
 */
async function migrate() {
  try {
    logger.info('🚀 Running database migrations...');
    
    const migrationFile = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    const sql = await fs.readFile(migrationFile, 'utf8');
    
    await db.query(sql);
    
    logger.info('✅ Migration completed successfully');
    logger.info('📊 Tables created: runs, scraping_cache, api_metrics');
    
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, '❌ Migration failed');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  migrate();
}

module.exports = migrate;
