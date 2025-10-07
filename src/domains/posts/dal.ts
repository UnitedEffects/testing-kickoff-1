import { notFound } from '@hapi/boom'
import connectDB from '@/lib/db'
import { PostModel, Post } from './models'

/**
 * Data for creating a new post
 */
export interface CreatePostData {
  source: string
  sourceType: 'url' | 'topic'
  scrapedData?: Record<string, any>
  generatedPosts?: Array<{
    platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram'
    content: string
  }>
}

/**
 * Data for updating a post
 */
export interface UpdatePostData {
  generatedPosts?: Array<{
    platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram'
    content: string
  }>
}

/**
 * Data Access Layer for Posts domain
 * Handles all database operations for posts
 */
export const PostsDal = {
  /**
   * Create a new post
   */
  async create(data: CreatePostData): Promise<Post> {
    await connectDB()
    const post = new PostModel(data)
    return post.save()
  },

  /**
   * Get all posts (sorted by creation date, newest first)
   */
  async getAll(): Promise<Post[]> {
    await connectDB()
    return PostModel.find().sort({ createdAt: -1 })
  },

  /**
   * Get a post by ID
   */
  async getById(id: string): Promise<Post | null> {
    await connectDB()
    const post = await PostModel.findOne({ _id: id })
    return post
  },

  /**
   * Update a post by ID
   */
  async update(id: string, data: UpdatePostData): Promise<Post> {
    await connectDB()
    const post = await PostModel.findOneAndUpdate(
      { _id: id },
      { $set: data },
      { new: true, runValidators: true }
    )

    if (!post) {
      throw notFound('Post not found')
    }

    return post
  },

  /**
   * Delete a post by ID
   */
  async delete(id: string): Promise<void> {
    await connectDB()
    const result = await PostModel.deleteOne({ _id: id })

    if (result.deletedCount === 0) {
      throw notFound('Post not found')
    }
  },

  /**
   * Get posts by source type
   */
  async getBySourceType(sourceType: 'url' | 'topic'): Promise<Post[]> {
    await connectDB()
    return PostModel.find({ sourceType }).sort({ createdAt: -1 })
  },
}
