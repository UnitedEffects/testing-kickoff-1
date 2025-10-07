# Database & Data Models

This document outlines the database patterns and conventions used in this project, including connection management, Mongoose setup, schema patterns, and data model conventions.

**IMPORTANT**: This section demonstrates database patterns using **Mongoose + MongoDB/Firestore** as a reference implementation. If the user wants a different database solution (PostgreSQL + Prisma, Supabase, Drizzle, raw SQL, etc.), use the patterns shown here as a guide:

- **Connection management**: Implement caching and pooling similar to the Mongoose example
- **Schema patterns**: Apply the same validation, typing, and field conventions
- **Data access layer**: Maintain the same separation between logic and data access
- **Type safety**: Use TypeScript interfaces/types with your chosen ORM/query builder

The architectural principles (connection caching, schema validation, DAL pattern, UUID keys, timestamps) apply universally.

## Connection Management with Caching

```typescript
// src/lib/db.ts
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI environment variable')
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

let cached: MongooseCache = (global as any).mongoose

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null }
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 50,
      minPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    }

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log('Connected to MongoDB')
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default connectDB
```

**Key patterns:**
- Global caching prevents multiple connections in serverless
- Connection pooling (maxPoolSize, minPoolSize)
- Retry logic with timeouts
- Lazy initialization (only connects when needed)

## Connection Pooling and Retry Logic

```typescript
const opts = {
  bufferCommands: false,           // Fail fast if not connected
  maxPoolSize: 50,                 // Max concurrent connections
  minPoolSize: 10,                 // Min connections in pool
  serverSelectionTimeoutMS: 10000, // 10s to select server
  socketTimeoutMS: 45000,          // 45s socket timeout
  retryWrites: true,               // Retry failed writes
  retryReads: true,                // Retry failed reads
}
```

## Mongoose Schema Patterns

**Note**: This example uses a "posts" domain with fields like `title`, `slug`, `content`, `authorId`, `status`, and `tags` to demonstrate schema patterns. This is NOT a requirement to build a posts/blog system - it's illustrating the architectural patterns. Replace with your actual domain entities.

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
  status: 'draft' | 'published' | 'archived'
  tags: string[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
  modifiedBy: string
}

export interface PostDocument extends Omit<Post, 'id'>, Document {
  _id: string
}

const PostSchema = new Schema<PostDocument>({
  _id: { type: String, default: uuidv4 },
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  content: { type: String, required: true },
  authorId: { type: String, required: true, index: true },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  tags: [{ type: String, lowercase: true }],
  createdBy: { type: String, required: true },
  modifiedBy: { type: String, required: true },
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

// Indexes
PostSchema.index({ slug: 1 })
PostSchema.index({ authorId: 1, status: 1 })
PostSchema.index({ tags: 1 })

export const PostModel = mongoose.models.Post || mongoose.model<PostDocument>('Post', PostSchema)
```

**Key patterns:**
- UUID primary keys (`_id: String, default: uuidv4`)
- Transform `_id` to `id` in JSON responses
- Timestamps (createdAt, updatedAt) automatic
- System fields (createdBy, modifiedBy)
- Enums for constrained values
- Indexes for common queries
- Trim and lowercase for strings

## UUID Primary Keys

```typescript
_id: { type: String, default: uuidv4 }
```

**Benefits:**
- Globally unique across collections
- No auto-increment issues in distributed systems
- Can generate IDs client-side if needed
- Compatible with external systems

## _id to id Transform

```typescript
toJSON: {
  transform: (_doc, ret) => {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    return ret
  },
}
```

**Why?**
- MongoDB uses `_id` internally
- APIs expose `id` (cleaner, more standard)
- Removes `__v` (Mongoose version key)
- Automatic on all `.toJSON()` calls

## Timestamps and System Fields

```typescript
// Automatic timestamps
{
  timestamps: true  // Adds createdAt, updatedAt
}

// Manual system fields
{
  createdBy: { type: String, required: true },
  modifiedBy: { type: String, required: true },
}
```

**Population pattern:**
```typescript
// src/domains/posts/api.ts
async function createHandler(req: NextRequest) {
  const userId = req.headers.get('x-user-id')!  // From auth middleware
  const body = await req.json()

  const post = await PostsLogic.create({
    ...body,
    createdBy: userId,
    modifiedBy: userId,
  })

  return say(post, 201)
}
```

## Enum Patterns and Validation

```typescript
status: {
  type: String,
  enum: ['draft', 'published', 'archived'],
  default: 'draft',
}
```

**TypeScript type:**
```typescript
export type PostStatus = 'draft' | 'published' | 'archived'

export interface Post {
  status: PostStatus
  // ...
}
```
