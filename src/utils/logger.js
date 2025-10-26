const pino = require('pino');

const isDevelopment = process.env.NODE_ENV === 'development';
const logLevel = process.env.LOG_LEVEL || 'info';
const logPretty = process.env.LOG_PRETTY === 'true' || isDevelopment;

/**
 * Pino logger configuration with structured logging
 */
const logger = pino({
  level: logLevel,
  
  // Redact sensitive fields
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers["x-api-key"]',
      'req.headers.cookie',
      '*.apiKey',
      '*.password',
      '*.token'
    ],
    censor: '[REDACTED]'
  },
  
  // Base configuration
  base: {
    pid: process.pid,
    hostname: process.env.HOSTNAME || 'localhost'
  },
  
  // Timestamp formatting
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  
  // Serializers for common objects
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      headers: req.headers,
      remoteAddress: req.ip,
      remotePort: req.socket?.remotePort
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: res.getHeaders ? res.getHeaders() : res.headers
    }),
    err: pino.stdSerializers.err
  },
  
  // Pretty print in development
  transport: logPretty ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname'
    }
  } : undefined
});

/**
 * Create a child logger with additional context
 * @param {Object} bindings - Additional fields to include in all logs
 * @returns {Object} - Child logger instance
 */
function createChildLogger(bindings) {
  return logger.child(bindings);
}

/**
 * Log request with correlation ID
 * @param {Object} req - Fastify request object
 * @param {string} message - Log message
 * @param {Object} extra - Additional fields
 */
function logRequest(req, message, extra = {}) {
  logger.info({
    correlationId: req.id,
    method: req.method,
    url: req.url,
    ip: req.ip,
    ...extra
  }, message);
}

/**
 * Log error with correlation ID
 * @param {Object} req - Fastify request object
 * @param {Error} error - Error object
 * @param {string} message - Log message
 */
function logError(req, error, message) {
  logger.error({
    correlationId: req?.id,
    err: error,
    stack: error.stack
  }, message);
}

module.exports = {
  logger,
  createChildLogger,
  logRequest,
  logError
};
