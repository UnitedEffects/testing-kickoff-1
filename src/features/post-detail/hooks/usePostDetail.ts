'use client'

import { useState, useEffect } from 'react'

/**
 * Platform type for social media posts
 */
type Platform = 'twitter' | 'linkedin' | 'facebook' | 'instagram'

/**
 * Source type for the post generation
 */
type SourceType = 'url' | 'topic'

/**
 * Individual generated post for a specific platform
 */
interface GeneratedPost {
  platform: Platform
  content: string
  createdAt: Date
}

/**
 * Post detail interface matching the domain model
 */
interface Post {
  id: string
  source: string
  sourceType: SourceType
  scrapedData?: Record<string, any>
  generatedPosts: GeneratedPost[]
  createdAt: Date
  updatedAt: Date
}

/**
 * Return type for usePostDetail hook
 */
interface UsePostDetailReturn {
  post: Post | null
  loading: boolean
  error: string | null
}

/**
 * Hook to fetch and manage a single post by ID
 *
 * @param id - The post ID to fetch
 * @returns Post data, loading state, and error state
 *
 * @example
 * ```tsx
 * function PostDetailPage({ id }: { id: string }) {
 *   const { post, loading, error } = usePostDetail(id)
 *
 *   if (loading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error}</div>
 *   if (!post) return <div>Post not found</div>
 *
 *   return <div>{post.source}</div>
 * }
 * ```
 */
export function usePostDetail(id: string): UsePostDetailReturn {
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/posts/${id}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Post not found')
          }
          throw new Error('Failed to fetch post')
        }

        const data = await response.json()
        setPost(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setPost(null)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchPost()
    }
  }, [id])

  return {
    post,
    loading,
    error,
  }
}
