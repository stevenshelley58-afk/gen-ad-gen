const { logger } = require('../utils/logger');
const { AppError } = require('../utils/errors');

/**
 * Global error handler middleware
 */
function errorHandler(error, request, reply) {
  const correlationId = request.id;

  // Log error
  logger.error({
    correlationId,
    err: error,
    url: request.url,
    method: request.method
  }, 'Request error');

  // Handle known AppError
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: error.code,
      message: error.message,
      details: error.details,
      correlationId
    });
  }

  // Handle Fastify validation errors
  if (error.validation) {
    return reply.status(400).send({
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: error.validation,
      correlationId
    });
  }

  // Handle unknown errors
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : error.message;

  return reply.status(statusCode).send({
    error: 'INTERNAL_ERROR',
    message,
    correlationId
  });
}

module.exports = errorHandler;