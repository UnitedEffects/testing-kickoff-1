import { badRequest, internal, notFound } from '@hapi/boom'
import OpenAI from 'openai'
import { PostsDal, CreatePostData } from './dal'
import { Post, Platform } from './models'
import { ScraperLogic } from '@/domains/scraper'

/**
 * Initialize OpenAI client
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Input data for creating a post
 */
export interface CreatePostInput {
  source: string
  sourceType: 'url' | 'topic'
  scrapedData?: Record<string, any>
}

/**
 * Platform configuration for post generation
 */
interface PlatformConfig {
  platform: Platform
  maxLength: number
  style: string
}

/**
 * Platform-specific configurations
 */
const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    platform: 'twitter',
    maxLength: 280,
    style: 'concise and engaging with hashtags',
  },
  {
    platform: 'linkedin',
    maxLength: 3000,
    style: 'professional and insightful',
  },
  {
    platform: 'facebook',
    maxLength: 2000,
    style: 'conversational and engaging',
  },
  {
    platform: 'instagram',
    maxLength: 2200,
    style: 'visual-focused with emojis and hashtags',
  },
]

/**
 * Business Logic Layer for Posts domain
 * Handles validation, orchestration, and AI generation
 */
export const PostsLogic = {
  /**
   * Generate social media posts using OpenAI
   */
  async generatePosts(
    source: string,
    sourceType: 'url' | 'topic',
    scrapedData?: Record<string, any>
  ): Promise<Array<{ platform: Platform; content: string }>> {
    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      throw internal('OpenAI API key is not configured')
    }

    // Prepare context for AI
    let context = ''
    if (sourceType === 'url') {
      context = `URL: ${source}\n\n`
      if (scrapedData) {
        if (scrapedData.title) context += `Title: ${scrapedData.title}\n`
        if (scrapedData.description) context += `Description: ${scrapedData.description}\n`
        if (scrapedData.content) context += `Content: ${scrapedData.content}\n`
      }
    } else {
      context = `Topic: ${source}\n\n`
      if (scrapedData && scrapedData.results) {
        context += `Research Results:\n`
        scrapedData.results.slice(0, 5).forEach((result: any, index: number) => {
          context += `${index + 1}. ${result.title}\n   ${result.snippet}\n\n`
        })
      }
    }

    // Generate posts for each platform
    const generatedPosts = await Promise.all(
      PLATFORM_CONFIGS.map(async (config) => {
        try {
          const prompt = `Create a social media post for ${config.platform} based on the following ${sourceType}:

${context}

Requirements:
- Style: ${config.style}
- Maximum length: ${config.maxLength} characters
- Make it engaging and shareable
- ${config.platform === 'twitter' || config.platform === 'instagram' ? 'Include relevant hashtags' : ''}

Generate only the post content, no explanations or additional text.`

          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are a professional social media content creator specializing in ${config.platform}.`,
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 500,
          })

          const content = completion.choices[0]?.message?.content?.trim() || ''

          // Validate that content doesn't exceed platform limits
          if (content.length > config.maxLength) {
            return {
              platform: config.platform,
              content: content.substring(0, config.maxLength - 3) + '...',
            }
          }

          return {
            platform: config.platform,
            content,
          }
        } catch (error) {
          console.error(`Error generating post for ${config.platform}:`, error)
          throw internal(`Failed to generate post for ${config.platform}`)
        }
      })
    )

    return generatedPosts
  },

  /**
   * Create a new post with AI-generated content
   */
  async create(input: CreatePostInput): Promise<Post> {
    // Validate input
    if (!input.source || input.source.trim().length === 0) {
      throw badRequest('Source is required')
    }

    if (input.sourceType === 'url') {
      // Basic URL validation
      try {
        new URL(input.source)
      } catch {
        throw badRequest('Invalid URL provided')
      }
    }

    // Scrape or search for content
    let scrapedData: any
    try {
      if (input.sourceType === 'url') {
        scrapedData = await ScraperLogic.scrapeUrl(input.source)
      } else {
        scrapedData = await ScraperLogic.searchTopic(input.source)
      }
    } catch (error) {
      console.error('Error scraping/searching:', error)
      throw badRequest(
        `Failed to ${input.sourceType === 'url' ? 'scrape URL' : 'search topic'}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }

    // Generate posts using AI with the scraped data
    const generatedPosts = await this.generatePosts(
      input.source,
      input.sourceType,
      scrapedData
    )

    // Create post in database
    const postData: CreatePostData = {
      source: input.source,
      sourceType: input.sourceType,
      scrapedData,
      generatedPosts,
    }

    return PostsDal.create(postData)
  },

  /**
   * List all posts
   */
  async list(): Promise<Post[]> {
    return PostsDal.getAll()
  },

  /**
   * Get a post by ID
   */
  async getById(id: string): Promise<Post> {
    if (!id || id.trim().length === 0) {
      throw badRequest('Post ID is required')
    }

    const post = await PostsDal.getById(id)

    if (!post) {
      throw notFound('Post not found')
    }

    return post
  },

  /**
   * Regenerate posts for an existing post
   */
  async regenerate(id: string): Promise<Post> {
    if (!id || id.trim().length === 0) {
      throw badRequest('Post ID is required')
    }

    const post = await PostsDal.getById(id)

    if (!post) {
      throw notFound('Post not found')
    }

    // Generate new posts
    const generatedPosts = await this.generatePosts(
      post.source,
      post.sourceType,
      post.scrapedData
    )

    // Update post with new generated posts
    return PostsDal.update(id, { generatedPosts })
  },

  /**
   * Get posts by source type
   */
  async getBySourceType(sourceType: 'url' | 'topic'): Promise<Post[]> {
    return PostsDal.getBySourceType(sourceType)
  },
}
