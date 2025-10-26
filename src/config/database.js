const { Pool } = require('pg');
const config = require('./environment');
const { logger } = require('../utils/logger');

/**
 * PostgreSQL connection pool
 */
const pool = new Pool({
  connectionString: config.database.url,
  min: config.database.poolMin,
  max: config.database.poolMax,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  
  // SSL configuration for production
  ssl: config.isProduction() ? {
    rejectUnauthorized: false
  } : false
});

// Handle pool errors
pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database pool error');
});

// Log successful connection
pool.on('connect', () => {
  logger.debug('New database connection established');
});

/**
 * Execute a query with error handling
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} - Query result
 */
async function query(text, params = []) {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug({
      query: text,
      duration,
      rows: result.rowCount
    }, 'Database query executed');
    
    return result;
  } catch (error) {
    logger.error({
      err: error,
      query: text,
      params
    }, 'Database query failed');
    throw error;
  }
}

/**
 * Execute a transaction
 * @param {Function} callback - Callback function with client parameter
 * @returns {Promise<any>} - Transaction result
 */
async function transaction(callback) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ err: error }, 'Transaction rolled back');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get a client from the pool
 * @returns {Promise<Object>} - Database client
 */
async function getClient() {
  return pool.connect();
}

/**
 * Health check for database connection
 * @returns {Promise<Object>} - Health status
 */
async function healthCheck() {
  try {
    const result = await query('SELECT NOW() as timestamp');
    return {
      status: 'ok',
      timestamp: result.rows[0].timestamp
    };
  } catch (error) {
    logger.error({ err: error }, 'Database health check failed');
    return {
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Close all connections
 * @returns {Promise<void>}
 */
async function close() {
  try {
    await pool.end();
    logger.info('Database pool closed');
  } catch (error) {
    logger.error({ err: error }, 'Error closing database pool');
    throw error;
  }
}

/**
 * Get pool statistics
 * @returns {Object} - Pool statistics
 */
function getStats() {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  };
}

module.exports = {
  pool,
  query,
  transaction,
  getClient,
  healthCheck,
  close,
  getStats
};
