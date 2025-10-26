/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, code, statusCode = 500, details = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Pre-defined error types
 */
class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details = {}) {
    super(message, 'UNAUTHORIZED', 401, details);
    this.name = 'UnauthorizedError';
  }
}

class EvidenceViolationError extends AppError {
  constructor(message, details = {}) {
    super(message, 'EVIDENCE_VIOLATION', 409, details);
    this.name = 'EvidenceViolationError';
  }
}

class LowConfidenceError extends AppError {
  constructor(message, details = {}) {
    super(message, 'LOW_CONFIDENCE', 422, details);
    this.name = 'LowConfidenceError';
  }
}

class InsufficientDataError extends AppError {
  constructor(message, details = {}) {
    super(message, 'INSUFFICIENT_DATA', 424, details);
    this.name = 'InsufficientDataError';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', details = {}) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, details);
    this.name = 'RateLimitError';
  }
}

class OpenAIError extends AppError {
  constructor(message, details = {}) {
    super(message, 'OPENAI_ERROR', 503, details);
    this.name = 'OpenAIError';
  }
}

class OpenAITimeoutError extends AppError {
  constructor(message = 'OpenAI request timeout', details = {}) {
    super(message, 'OPENAI_TIMEOUT', 504, details);
    this.name = 'OpenAITimeoutError';
  }
}

class UpstreamArtifactMissingError extends AppError {
  constructor(message, details = {}) {
    super(message, 'UPSTREAM_ARTIFACT_MISSING', 424, details);
    this.name = 'UpstreamArtifactMissingError';
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  EvidenceViolationError,
  LowConfidenceError,
  InsufficientDataError,
  RateLimitError,
  OpenAIError,
  OpenAITimeoutError,
  UpstreamArtifactMissingError
};
