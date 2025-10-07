'use client'

import { useState, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import { PageLoader } from '@/shared/components/PageLoader'
import { useHomePage } from '../hooks/useHomePage'

export function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const { posts, loading: dataLoading, error, submitPost, submitting } = useHomePage()

  useEffect(() => {
    if (!dataLoading) {
      setIsLoading(false)
    }
  }, [dataLoading])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!inputValue.trim()) {
      return
    }

    try {
      await submitPost(inputValue)
      setInputValue('')
    } catch (err) {
      // Error is handled in the hook
      console.error('Failed to submit:', err)
    }
  }

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Create Your Post
          </h1>
          <p className="text-lg text-gray-600">
            Enter a URL or topic to get started
          </p>
        </div>

        {/* Submit Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="urlOrTopic"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                URL or Topic
              </label>
              <input
                id="urlOrTopic"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="https://example.com or Your topic here"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                disabled={submitting}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !inputValue.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>

        {/* Previous Posts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Previous Posts
          </h2>

          {posts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No posts yet. Create your first post above!
            </p>
          ) : (
            <ul className="space-y-4">
              {posts.map((post) => (
                <li
                  key={post.id}
                  className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition"
                >
                  <Link
                    href={`/posts/${post.id}`}
                    className="block"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium text-blue-600 hover:text-blue-800">
                        {post.source}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          post.generatedPosts?.length > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {post.generatedPosts?.length > 0 ? 'completed' : 'processing'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
