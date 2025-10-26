const config = require('../config/environment');
const { UnauthorizedError } = require('../utils/errors');

/**
 * API Key authentication middleware
 */
async function authMiddleware(request, reply) {
  const apiKey = request.headers['x-api-key'];

  if (!apiKey) {
    throw new UnauthorizedError('Missing API key');
  }

  if (apiKey !== config.apiKey) {
    throw new UnauthorizedError('Invalid API key');
  }

  // API key is valid, continue
}

module.exports = authMiddleware;