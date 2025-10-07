/**
 * Posts domain exports
 * Public API for the posts domain
 */

// API handlers
export { postsApi } from './api'

// Business logic
export { PostsLogic } from './logic'

// Data access layer
export { PostsDal } from './dal'

// Models and types
export { PostModel } from './models'
export type { Post, PostDocument, GeneratedPost, SourceType, Platform } from './models'
export type { CreatePostData, UpdatePostData } from './dal'
export type { CreatePostInput } from './logic'

// OpenAPI schemas
export { postSchemas, postPaths } from './schema'
