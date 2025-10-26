const Ajv = require('ajv');
const { ValidationError } = require('./errors');

const ajv = new Ajv({ allErrors: true, removeAdditional: true });

/**
 * Brand summary request schema
 */
const brandSummarySchema = {
  type: 'object',
  properties: {
    brand_url: {
      type: 'string',
      format: 'uri',
      pattern: '^https?://'
    }
  },
  required: ['brand_url'],
  additionalProperties: false
};

/**
 * Competitors discovery request schema
 */
const competitorsSchema = {
  type: 'object',
  properties: {
    brand_domain: {
      type: 'string',
      minLength: 3
    },
    run_id: {
      type: 'string',
      pattern: '^run_[a-f0-9-]+$'
    }
  },
  required: ['brand_domain', 'run_id'],
  additionalProperties: false
};

/**
 * Competitors analyze request schema
 */
const competitorsAnalyzeSchema = {
  type: 'object',
  properties: {
    run_id: {
      type: 'string',
      pattern: '^run_[a-f0-9-]+$'
    },
    domains: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 3
      },
      minItems: 1,
      maxItems: 10
    }
  },
  required: ['run_id', 'domains'],
  additionalProperties: false
};

/**
 * Kernel assembly request schema
 */
const kernelSchema = {
  type: 'object',
  properties: {
    run_id: {
      type: 'string',
      pattern: '^run_[a-f0-9-]+$'
    }
  },
  required: ['run_id'],
  additionalProperties: false
};

// Compile schemas
const validateBrandSummary = ajv.compile(brandSummarySchema);
const validateCompetitors = ajv.compile(competitorsSchema);
const validateCompetitorsAnalyze = ajv.compile(competitorsAnalyzeSchema);
const validateKernel = ajv.compile(kernelSchema);

/**
 * Validate request body against schema
 * @param {Object} data - Data to validate
 * @param {Function} validator - AJV validator function
 * @param {string} schemaName - Schema name for error messages
 * @throws {ValidationError} - If validation fails
 */
function validate(data, validator, schemaName = 'Request') {
  const valid = validator(data);
  
  if (!valid) {
    const errors = validator.errors.map(err => ({
      field: err.instancePath || err.params.missingProperty,
      message: err.message
    }));
    
    throw new ValidationError(`${schemaName} validation failed`, {
      errors
    });
  }
  
  return data;
}

/**
 * Validation middleware factory
 * @param {Function} validator - AJV validator function
 * @param {string} schemaName - Schema name
 * @returns {Function} - Fastify middleware
 */
function validationMiddleware(validator, schemaName) {
  return async (request, reply) => {
    try {
      validate(request.body, validator, schemaName);
    } catch (error) {
      return reply.status(error.statusCode).send({
        error: error.code,
        message: error.message,
        details: error.details
      });
    }
  };
}

module.exports = {
  validateBrandSummary,
  validateCompetitors,
  validateCompetitorsAnalyze,
  validateKernel,
  validate,
  validationMiddleware,
  
  // Export schemas for testing
  schemas: {
    brandSummarySchema,
    competitorsSchema,
    competitorsAnalyzeSchema,
    kernelSchema
  }
};
