'use client'

import { useState, useEffect } from 'react'

interface Post {
  id: string
  source: string
  sourceType: 'url' | 'topic'
  generatedPosts: Array<{
    platform: string
    content: string
    createdAt: string
  }>
  scrapedData?: any
  createdAt: string
  updatedAt: string
}

interface UseHomePageReturn {
  posts: Post[]
  loading: boolean
  error: string | null
  submitPost: (urlOrTopic: string) => Promise<void>
  submitting: boolean
}

export function useHomePage(): UseHomePageReturn {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true)
        const response = await fetch('/api/posts')

        if (!response.ok) {
          throw new Error('Failed to fetch posts')
        }

        const data = await response.json()
        setPosts(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  const submitPost = async (urlOrTopic: string) => {
    try {
      setSubmitting(true)
      setError(null)

      // Determine if input is a URL or topic
      const isUrl = urlOrTopic.startsWith('http://') || urlOrTopic.startsWith('https://')

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: urlOrTopic,
          sourceType: isUrl ? 'url' : 'topic'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit post')
      }

      const newPost = await response.json()

      // Add new post to the beginning of the list
      setPosts((prevPosts) => [newPost, ...prevPosts])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit post')
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  return {
    posts,
    loading,
    error,
    submitPost,
    submitting,
  }
}
