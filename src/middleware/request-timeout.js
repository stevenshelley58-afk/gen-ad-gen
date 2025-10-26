const config = require('../config/environment');

/**
 * Request timeout middleware
 */
function requestTimeoutMiddleware(request, reply, done) {
  const timeout = setTimeout(() => {
    reply.code(504).send({
      error: 'REQUEST_TIMEOUT',
      message: 'Request timeout exceeded'
    });
  }, config.request.timeout);

  reply.addHook('onSend', () => {
    clearTimeout(timeout);
  });

  done();
}

module.exports = requestTimeoutMiddleware;