/**
 * List query options for paginated endpoints
 */
export interface ListOptions {
  /** Number of records to skip (for pagination) */
  skip?: number
  /** Maximum number of records to return (default: 20) */
  top?: number
  /** Filter expression (OData-style) */
  filter?: string
  /** Order by expression (e.g., 'createdAt desc') */
  orderby?: string
  /** Search query */
  search?: string
}

/**
 * Pagination metadata for list responses
 */
export interface PaginationInfo {
  /** Total number of records matching the query */
  total: number
  /** Number of records skipped */
  skip: number
  /** Maximum number of records returned */
  top: number
  /** Whether there are more records available */
  hasMore: boolean
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /** Array of data items */
  data: T[]
  /** Pagination metadata */
  pagination: PaginationInfo
}

/**
 * JSON Patch operation types
 */
export type JsonPatchOp = 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test'

/**
 * JSON Patch operation
 */
export interface JsonPatchOperation {
  op: JsonPatchOp
  path: string
  value?: any
  from?: string
}

/**
 * Common metadata fields for all database entities
 */
export interface CommonObjectMeta {
  /** Unique identifier (UUID) */
  id: string
  /** Creation timestamp */
  createdAt: Date
  /** Last update timestamp */
  updatedAt: Date
  /** User ID who created the record */
  createdBy?: string
  /** User ID who last modified the record */
  modifiedBy?: string
}
