import { NextRequest } from 'next/server'
import { isBoom } from '@hapi/boom'
import { say, sayError } from '@/lib/responses/say'
import { PostsLogic } from './logic'

/**
 * HTTP handler for listing all posts
 * GET /api/posts
 */
async function listHandler(_req: NextRequest) {
  try {
    const posts = await PostsLogic.list()
    return say(posts)
  } catch (error) {
    console.error('Error listing posts:', error)
    if (isBoom(error)) {
      return sayError(error.message, error.output.statusCode)
    }
    return sayError('Failed to list posts', 500)
  }
}

/**
 * HTTP handler for creating a new post
 * POST /api/posts
 *
 * Request body:
 * {
 *   source: string (URL or topic text)
 *   sourceType: 'url' | 'topic'
 *   scrapedData?: object (optional, for URLs)
 * }
 */
async function createHandler(req: NextRequest) {
  try {
    const body = await req.json()

    const post = await PostsLogic.create({
      source: body.source,
      sourceType: body.sourceType,
      scrapedData: body.scrapedData,
    })

    return say(post, 201)
  } catch (error) {
    console.error('Error creating post:', error)
    if (isBoom(error)) {
      return sayError(error.message, error.output.statusCode)
    }
    return sayError('Failed to create post', 500)
  }
}

/**
 * HTTP handler for getting a post by ID
 * GET /api/posts/:id
 */
async function getByIdHandler(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const post = await PostsLogic.getById(params.id)
    return say(post)
  } catch (error) {
    console.error('Error getting post:', error)
    if (isBoom(error)) {
      return sayError(error.message, error.output.statusCode)
    }
    return sayError('Failed to get post', 500)
  }
}

/**
 * HTTP handler for regenerating posts
 * POST /api/posts/:id/regenerate
 */
async function regenerateHandler(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const post = await PostsLogic.regenerate(params.id)
    return say(post)
  } catch (error) {
    console.error('Error regenerating post:', error)
    if (isBoom(error)) {
      return sayError(error.message, error.output.statusCode)
    }
    return sayError('Failed to regenerate post', 500)
  }
}

/**
 * Exported API handlers for App Router
 */
export const postsApi = {
  list: listHandler,
  create: createHandler,
  getById: getByIdHandler,
  regenerate: regenerateHandler,
}
