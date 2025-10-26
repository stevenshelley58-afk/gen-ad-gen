const { getMetrics } = require('../utils/metrics');

/**
 * Metrics routes
 */
async function metricsRoutes(fastify) {
  fastify.get('/metrics', async (request, reply) => {
    const metrics = await getMetrics();
    return reply
      .header('Content-Type', 'text/plain; version=0.0.4')
      .send(metrics);
  });
}

module.exports = metricsRoutes;
