require('dotenv').config();

const Fastify = require('fastify');
const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const rateLimit = require('@fastify/rate-limit');

const config = require('./config/environment');
const db = require('./config/database');
const redis = require('./config/redis');
const browserPool = require('./services/browser-pool.service');
const { logger } = require('./utils/logger');
const { updateActiveRuns } = require('./utils/metrics');

// Middleware
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/error-handler');
const loggerMiddleware = require('./middleware/logger');
const requestTimeoutMiddleware = require('./middleware/request-timeout');

// Routes
const healthRoutes = require('./routes/health.routes');
const metricsRoutes = require('./routes/metrics.routes');
const stage1Routes = require('./routes/stage1.routes');

/**
 * Create and configure Fastify server
 */
async function createServer() {
  const fastify = Fastify({
    logger: false, // We use Pino directly
    genReqId: (req) => req.headers['x-request-id'] || require('crypto').randomUUID(),
    trustProxy: true
  });

  // Register plugins
  await fastify.register(cors, {
    origin: config.isDevelopment() ? '*' : false
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: false
  });

  await fastify.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.window,
    keyGenerator: (req) => {
      const apiKey = req.headers['x-api-key'] || 'anonymous';
      return `${req.ip}:${apiKey}`;
    }
  });

  // Register middleware
  fastify.addHook('onRequest', loggerMiddleware);
  fastify.addHook('onRequest', requestTimeoutMiddleware);

  // Register routes
  await fastify.register(healthRoutes);
  await fastify.register(metricsRoutes);

  // Protected routes (require authentication)
  await fastify.register(async function protectedRoutes(fastify) {
    fastify.addHook('onRequest', authMiddleware);
    await fastify.register(stage1Routes);
  });

  // Error handler (must be last)
  fastify.setErrorHandler(errorHandler);

  return fastify;
}

/**
 * Start the server
 */
async function start() {
  let fastify;

  try {
    logger.info('Starting Brand Intelligence API v3.0');

    // Initialize connections
    logger.info('Connecting to PostgreSQL...');
    await db.healthCheck();
    logger.info('PostgreSQL connected');

    logger.info('Connecting to Redis...');
    redis.createClient();
    await redis.healthCheck();
    logger.info('Redis connected');

    // Initialize browser pool
    logger.info('Initializing browser pool...');
    await browserPool.init();
    logger.info('Browser pool initialized');

    // Create and start server
    fastify = await createServer();

    await fastify.listen({
      port: config.port,
      host: config.host
    });

    logger.info({
      port: config.port,
      host: config.host,
      env: config.nodeEnv
    }, 'Server listening');

    // Update metrics periodically
    setInterval(async () => {
      try {
        const count = await require('./services/storage.service').getActiveRunsCount();
        updateActiveRuns(count);
      } catch (error) {
        logger.error({ err: error }, 'Failed to update active runs metric');
      }
    }, 60000); // Every minute

  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }

  // Graceful shutdown
  const signals = ['SIGINT', 'SIGTERM'];

  signals.forEach(signal => {
    process.on(signal, async () => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      try {
        // Close server
        if (fastify) {
          await fastify.close();
          logger.info('Server closed');
        }

        // Close browser pool
        await browserPool.close();
        logger.info('Browser pool closed');

        // Close database
        await db.close();
        logger.info('Database pool closed');

        // Close Redis
        await redis.close();
        logger.info('Redis connection closed');

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error({ err: error }, 'Error during shutdown');
        process.exit(1);
      }
    });
  });

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error({ err: error }, 'Uncaught exception');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason, promise }, 'Unhandled rejection');
    process.exit(1);
  });
}

// Start server if run directly
if (require.main === module) {
  start();
}

module.exports = { createServer, start };
