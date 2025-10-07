import mongoose, { Schema, Document } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

/**
 * Source type for the post generation
 */
export type SourceType = 'url' | 'topic'

/**
 * Platform type for social media posts
 */
export type Platform = 'twitter' | 'linkedin' | 'facebook' | 'instagram'

/**
 * Individual generated post for a specific platform
 */
export interface GeneratedPost {
  platform: Platform
  content: string
  createdAt: Date
}

/**
 * Post entity interface
 */
export interface Post {
  id: string
  source: string
  sourceType: SourceType
  scrapedData?: Record<string, any>
  generatedPosts: GeneratedPost[]
  createdAt: Date
  updatedAt: Date
}

/**
 * Mongoose document interface
 */
export interface PostDocument extends Omit<Post, 'id'>, Document {
  _id: string
}

/**
 * Generated post sub-schema
 */
const GeneratedPostSchema = new Schema<GeneratedPost>(
  {
    platform: {
      type: String,
      required: true,
      enum: ['twitter', 'linkedin', 'facebook', 'instagram'],
    },
    content: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
)

/**
 * Post schema
 */
const PostSchema = new Schema<PostDocument>(
  {
    _id: {
      type: String,
      default: uuidv4,
    },
    source: {
      type: String,
      required: true,
    },
    sourceType: {
      type: String,
      required: true,
      enum: ['url', 'topic'],
    },
    scrapedData: {
      type: Schema.Types.Mixed,
      default: null,
    },
    generatedPosts: {
      type: [GeneratedPostSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret.id = ret._id
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  }
)

// Indexes for better query performance
PostSchema.index({ sourceType: 1 })
PostSchema.index({ createdAt: -1 })

export const PostModel = mongoose.models.Post || mongoose.model<PostDocument>('Post', PostSchema)
