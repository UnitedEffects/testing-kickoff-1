# Domain-Driven Design Patterns

Domains contain **business logic and data access**. They are UI-agnostic and testable in isolation.

**Note**: Examples use "posts" as an illustrative domain with fields like `title`, `slug`, `content`, `authorId`, and `published`. This is NOT a requirement—it demonstrates the domain architecture pattern.

## Domain Directory Structure

```
src/domains/[domain]/
├── api.ts               # HTTP handlers (exported for App Router)
├── logic.ts             # Business logic (validation, orchestration)
├── dal.ts               # Data access layer (database queries)
├── models.ts            # Database schemas + TypeScript types
├── schema.ts            # OpenAPI schemas (request/response DTOs)
├── __tests__/           # Domain tests
│   ├── logic.test.ts
│   ├── dal.test.ts
│   └── api.test.ts
└── index.ts             # Public exports
```

## Domain File Architecture

### api.ts - HTTP Handlers

```typescript
// Example using "posts" domain - not a requirement
// src/domains/[domain]/api.ts
import { NextRequest } from 'next/server'
import { withAuth, withRole } from '@/lib/auth'
import { say, sayError } from '@/lib/responses/say'
import { PostsLogic } from './logic'

async function listHandler(req: NextRequest) {
  try {
    const posts = await PostsLogic.getAll()
    return say(posts)
  } catch (error) {
    return sayError(error.message, 500)
  }
}

async function createHandler(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!
  const body = await req.json()

  try {
    const post = await PostsLogic.create({ ...body, authorId: userId })
    return say(post, 201)
  } catch (error) {
    return sayError(error.message, 400)
  }
}

// Export handlers for App Router
export const postsApi = {
  list: withAuth(listHandler),
  create: withRole(['admin'], createHandler),
}
```

### logic.ts - Business Logic

```typescript
// src/domains/posts/logic.ts
import { PostsDal } from './dal'
import { Post } from './models'

export const PostsLogic = {
  async getAll(): Promise<Post[]> {
    return PostsDal.getAll()
  },

  async create(data: CreatePostDto): Promise<Post> {
    // Validation
    if (!data.title || data.title.length < 3) {
      throw new Error('Title must be at least 3 characters')
    }

    // Generate slug
    const slug = data.title.toLowerCase().replace(/\s+/g, '-')

    // Create post
    return PostsDal.create({ ...data, slug })
  },

  async getBySlug(slug: string): Promise<Post | null> {
    return PostsDal.getBySlug(slug)
  },
}
```

### dal.ts - Data Access Layer

```typescript
// src/domains/posts/dal.ts
import { PostModel, Post } from './models'
import connectDB from '@/lib/db'

export const PostsDal = {
  async getAll(): Promise<Post[]> {
    await connectDB()
    return PostModel.find({ published: true }).sort({ createdAt: -1 })
  },

  async create(data: CreatePostData): Promise<Post> {
    await connectDB()
    const post = new PostModel(data)
    return post.save()
  },

  async getBySlug(slug: string): Promise<Post | null> {
    await connectDB()
    return PostModel.findOne({ slug })
  },

  async getById(id: string): Promise<Post | null> {
    await connectDB()
    return PostModel.findOne({ id })
  },
}
```

### models.ts - Mongoose Schemas

```typescript
// src/domains/posts/models.ts
import mongoose, { Schema, Document } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

export interface Post {
  id: string
  title: string
  slug: string
  content: string
  authorId: string
  published: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PostDocument extends Omit<Post, 'id'>, Document {
  _id: string
}

const PostSchema = new Schema<PostDocument>({
  _id: { type: String, default: uuidv4 },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  authorId: { type: String, required: true },
  published: { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      ret.id = ret._id
      delete ret._id
      delete ret.__v
      return ret
    },
  },
})

export const PostModel = mongoose.models.Post || mongoose.model<PostDocument>('Post', PostSchema)
```

### schema.ts - OpenAPI Schemas

```typescript
// src/domains/posts/schema.ts
import { commonSchemas } from '@/shared/schemas/api'

export const postSchemas = {
  Post: {
    allOf: [
      { $ref: '#/components/schemas/CommonObjectMeta' },
      {
        type: 'object',
        properties: {
          title: { type: 'string' },
          slug: { type: 'string' },
          content: { type: 'string' },
          authorId: { type: 'string' },
          published: { type: 'boolean' },
        },
        required: ['title', 'slug', 'content', 'authorId'],
      },
    ],
  },
  CreatePostRequest: {
    type: 'object',
    properties: {
      title: { type: 'string', minLength: 3 },
      content: { type: 'string' },
      published: { type: 'boolean', default: false },
    },
    required: ['title', 'content'],
  },
}

export const postPaths = {
  '/api/posts': {
    get: {
      tags: ['Posts'],
      summary: 'List all posts',
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
      },
      security: [{ bearerAuth: [] }],
    },
    post: {
      tags: ['Posts'],
      summary: 'Create a post',
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
          description: 'Post created',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Post' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },
}
```

## Domain Exports (index.ts)

```typescript
// src/domains/posts/index.ts
export { postsApi } from './api'
export { PostsLogic } from './logic'
export { PostsDal } from './dal'
export { PostModel } from './models'
export type { Post, PostDocument } from './models'
```

## Single-Record Pattern

For app-wide configuration domains (e.g., site settings):

```typescript
// src/domains/site/dal.ts
export const SiteDal = {
  async get(): Promise<SiteConfig | null> {
    await connectDB()
    return SiteConfigModel.findOne({}) // Empty filter - only one document
  },

  async update(data: Partial<SiteConfig>): Promise<SiteConfig> {
    await connectDB()
    return SiteConfigModel.findOneAndUpdate(
      {},  // Empty filter
      { $set: data },
      { new: true, upsert: true }
    )
  },
}
```

## Multi-Record Pattern with Pagination

```typescript
// src/domains/posts/logic.ts
export const PostsLogic = {
  async list(options: ListOptions): Promise<PaginatedResponse<Post>> {
    const { skip = 0, top = 20, filter, orderby, search } = options

    const posts = await PostsDal.list({ skip, top, filter, orderby, search })
    const total = await PostsDal.count({ filter, search })

    return {
      data: posts,
      pagination: {
        total,
        skip,
        top,
        hasMore: skip + posts.length < total,
      },
    }
  },
}
```

## Data Access Layer Patterns

### Pattern: Connection per operation
```typescript
export const PostsDal = {
  async getAll(): Promise<Post[]> {
    await connectDB()  // Establish connection (cached)
    return PostModel.find()
  },
}
```

### Pattern: Error handling
```typescript
export const PostsDal = {
  async getById(id: string): Promise<Post> {
    await connectDB()
    const post = await PostModel.findOne({ id })
    if (!post) {
      throw Boom.notFound('Post not found')
    }
    return post
  },
}
```

## App Router Integration

API routes import domain handlers:

```typescript
// src/app/api/[domain]/route.ts
import { domainApi } from '@/domains/[domain]/api'

export const GET = domainApi.list
export const POST = domainApi.create
```

Dynamic routes:
```typescript
// src/app/api/[domain]/[id]/route.ts
import { domainApi } from '@/domains/[domain]/api'

export const GET = domainApi.getById
export const PATCH = domainApi.update
export const DELETE = domainApi.delete
```

## Key Principles

1. **UI-agnostic** - No React, no Next.js dependencies
2. **Business logic lives here** - Validation, orchestration, transformations
3. **Testable in isolation** - Unit tests without UI
4. **Consistent structure** - api → logic → dal → database
5. **Clear separation** - Each file has a specific purpose
6. **Type safety** - TypeScript types from models, OpenAPI schemas for API
