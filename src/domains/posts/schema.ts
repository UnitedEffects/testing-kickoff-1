import { commonSchemas, commonResponses } from '@/shared/schemas/api'

/**
 * OpenAPI schemas for Posts domain
 */
export const postSchemas = {
  /**
   * Generated post object for a specific platform
   */
  GeneratedPost: {
    type: 'object',
    properties: {
      platform: {
        type: 'string',
        enum: ['twitter', 'linkedin', 'facebook', 'instagram'],
        description: 'Social media platform',
      },
      content: {
        type: 'string',
        description: 'Generated post content',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'When the post was generated',
      },
    },
    required: ['platform', 'content', 'createdAt'],
  },

  /**
   * Post entity with all fields
   */
  Post: {
    allOf: [
      { $ref: '#/components/schemas/CommonObjectMeta' },
      {
        type: 'object',
        properties: {
          source: {
            type: 'string',
            description: 'URL or topic text used for post generation',
          },
          sourceType: {
            type: 'string',
            enum: ['url', 'topic'],
            description: 'Type of source',
          },
          scrapedData: {
            type: 'object',
            description: 'Scraped data from URL (if sourceType is url)',
            additionalProperties: true,
            nullable: true,
          },
          generatedPosts: {
            type: 'array',
            items: { $ref: '#/components/schemas/GeneratedPost' },
            description: 'Array of generated posts for different platforms',
          },
        },
        required: ['source', 'sourceType', 'generatedPosts'],
      },
    ],
  },

  /**
   * Request body for creating a post
   */
  CreatePostRequest: {
    type: 'object',
    properties: {
      source: {
        type: 'string',
        description: 'URL or topic text',
        minLength: 1,
      },
      sourceType: {
        type: 'string',
        enum: ['url', 'topic'],
        description: 'Type of source',
      },
      scrapedData: {
        type: 'object',
        description: 'Optional scraped data from URL',
        additionalProperties: true,
        properties: {
          title: { type: 'string', description: 'Page title' },
          description: { type: 'string', description: 'Page description' },
          content: { type: 'string', description: 'Page content' },
        },
      },
    },
    required: ['source', 'sourceType'],
  },
}

/**
 * OpenAPI path definitions for Posts endpoints
 */
export const postPaths = {
  '/api/posts': {
    get: {
      tags: ['Posts'],
      summary: 'List all posts',
      description: 'Retrieve all generated posts, sorted by creation date (newest first)',
      responses: {
        200: {
          description: 'List of posts',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Post' },
              },
            },
          },
        },
        ...commonResponses[500],
      },
    },
    post: {
      tags: ['Posts'],
      summary: 'Create a post',
      description: 'Generate social media posts from a URL or topic using AI',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreatePostRequest' },
          },
        },
      },
      responses: {
        201: {
          description: 'Post created successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Post' },
            },
          },
        },
        ...commonResponses[400],
        ...commonResponses[500],
      },
    },
  },
  '/api/posts/{id}': {
    get: {
      tags: ['Posts'],
      summary: 'Get a post by ID',
      description: 'Retrieve a specific post by its unique identifier',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Post ID',
        },
      ],
      responses: {
        200: {
          description: 'Post found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Post' },
            },
          },
        },
        ...commonResponses[404],
        ...commonResponses[500],
      },
    },
  },
  '/api/posts/{id}/regenerate': {
    post: {
      tags: ['Posts'],
      summary: 'Regenerate posts',
      description: 'Regenerate social media posts for an existing post using the same source',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Post ID',
        },
      ],
      responses: {
        200: {
          description: 'Posts regenerated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Post' },
            },
          },
        },
        ...commonResponses[404],
        ...commonResponses[500],
      },
    },
  },
}
