/**
 * Common OpenAPI schemas for reuse across domain schemas
 * These schemas are referenced using $ref in domain-specific schemas
 */

export const commonSchemas = {
  /**
   * Common metadata fields for all entities
   * Use with allOf to extend domain-specific schemas
   */
  CommonObjectMeta: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', description: 'Unique identifier' },
      createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
      updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' },
      createdBy: { type: 'string', description: 'User ID who created the record' },
      modifiedBy: { type: 'string', description: 'User ID who last modified the record' },
    },
    required: ['id', 'createdAt', 'updatedAt'],
  },

  /**
   * Pagination metadata for list responses
   */
  PaginationInfo: {
    type: 'object',
    properties: {
      total: { type: 'integer', description: 'Total number of records matching the query' },
      skip: { type: 'integer', description: 'Number of records skipped' },
      top: { type: 'integer', description: 'Maximum number of records returned' },
      hasMore: { type: 'boolean', description: 'Whether there are more records available' },
    },
    required: ['total', 'skip', 'top', 'hasMore'],
  },

  /**
   * JSON Patch operation
   */
  JsonPatchOperation: {
    type: 'object',
    properties: {
      op: {
        type: 'string',
        enum: ['add', 'remove', 'replace', 'move', 'copy', 'test'],
        description: 'Operation type',
      },
      path: { type: 'string', description: 'JSON Pointer path' },
      value: { description: 'Value for add/replace/test operations' },
      from: { type: 'string', description: 'Source path for move/copy operations' },
    },
    required: ['op', 'path'],
  },

  /**
   * JSON Patch document (array of operations)
   */
  JsonPatchDocument: {
    type: 'array',
    items: { $ref: '#/components/schemas/JsonPatchOperation' },
  },

  /**
   * Standard error response
   */
  Error: {
    type: 'object',
    properties: {
      error: { type: 'string', description: 'Error message' },
      details: { description: 'Additional error details' },
    },
    required: ['error'],
  },

  /**
   * Success response with message
   */
  SuccessResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', description: 'Success flag' },
      message: { type: 'string', description: 'Success message' },
      data: { description: 'Optional data payload' },
    },
    required: ['success', 'message'],
  },
}

/**
 * Common response definitions for OpenAPI
 */
export const commonResponses = {
  400: {
    description: 'Bad Request',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
      },
    },
  },
  401: {
    description: 'Unauthorized',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
      },
    },
  },
  403: {
    description: 'Forbidden',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
      },
    },
  },
  404: {
    description: 'Not Found',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
      },
    },
  },
  500: {
    description: 'Internal Server Error',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
      },
    },
  },
}

/**
 * Common query parameters for list endpoints
 */
export const commonParameters = {
  skip: {
    in: 'query',
    name: '$skip',
    schema: { type: 'integer', minimum: 0, default: 0 },
    description: 'Number of records to skip for pagination',
  },
  top: {
    in: 'query',
    name: '$top',
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    description: 'Maximum number of records to return',
  },
  filter: {
    in: 'query',
    name: '$filter',
    schema: { type: 'string' },
    description: 'OData-style filter expression',
  },
  orderby: {
    in: 'query',
    name: '$orderby',
    schema: { type: 'string' },
    description: 'Order by expression (e.g., "createdAt desc")',
  },
  search: {
    in: 'query',
    name: '$search',
    schema: { type: 'string' },
    description: 'Search query',
  },
}
