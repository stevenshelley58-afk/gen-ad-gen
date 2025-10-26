const { logger } = require('../utils/logger');
const { recordHttpRequest } = require('../utils/metrics');

/**
 * Request logging middleware
 */
function loggerMiddleware(request, reply, done) {
  const start = Date.now();

  reply.addHook('onSend', (request, reply, payload, done) => {
    const duration = Date.now() - start;

    logger.info({
      correlationId: request.id,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration,
      ip: request.ip
    }, 'Request completed');

    recordHttpRequest(
      request.method,
      request.routerPath || request.url,
      reply.statusCode,
      duration
    );

    done();
  });

  done();
}

module.exports = loggerMiddleware;