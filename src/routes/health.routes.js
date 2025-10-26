const db = require('../config/database');
const redis = require('../config/redis');
const browserPool = require('../services/browser-pool.service');
const config = require('../config/environment');

/**
 * Health check routes
 */
async function healthRoutes(fastify) {
  // Full health check
  fastify.get('/health', async (request, reply) => {
    const checks = {
      openai: { status: config.openai.apiKey ? 'ok' : 'error' },
      browser: {
        status: browserPool.initialized ? 'ok' : 'error',
        pool: browserPool.getStats()
      },
      database: await db.healthCheck(),
      redis: await redis.healthCheck()
    };

    const isHealthy = Object.values(checks).every(
      check => check.status === 'ok'
    );

    return reply.status(isHealthy ? 200 : 503).send({
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // Readiness check
  fastify.get('/health/ready', async (request, reply) => {
    const ready = browserPool.initialized &&
      (await db.healthCheck()).status === 'ok';

    return reply.status(ready ? 200 : 503).send({
      status: ready ? 'ready' : 'not_ready'
    });
  });

  // Liveness check
  fastify.get('/health/live', async (request, reply) => {
    return reply.send({ status: 'alive' });
  });
}

module.exports = healthRoutes;
