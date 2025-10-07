'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageLoader } from '@/shared/components/PageLoader'
import { usePostDetail } from '../hooks/usePostDetail'

/**
 * PostDetailPage Component Props
 */
interface PostDetailPageProps {
  id: string
}

/**
 * PostDetailPage Component
 *
 * Displays detailed information about a generated post including:
 * - Source (URL or topic)
 * - Scraped data summary
 * - List of generated social media posts for different platforms
 *
 * Uses PageLoader pattern to prevent FOUC.
 *
 * @param props - Component props
 * @param props.id - The post ID to display
 *
 * @example
 * ```tsx
 * <PostDetailPage id="123e4567-e89b-12d3-a456-426614174000" />
 * ```
 */
export function PostDetailPage({ id }: PostDetailPageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const { post, loading: dataLoading, error } = usePostDetail(id)

  useEffect(() => {
    if (!dataLoading) {
      setIsLoading(false)
    }
  }, [dataLoading])

  if (isLoading) {
    return <PageLoader />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Post Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              The post you are looking for does not exist.
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Source Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Post Details
          </h1>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Type
              </label>
              <div className="flex items-center">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    post.sourceType === 'url'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {post.sourceType === 'url' ? 'URL' : 'Topic'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source
              </label>
              {post.sourceType === 'url' ? (
                <a
                  href={post.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline break-all"
                >
                  {post.source}
                </a>
              ) : (
                <p className="text-gray-900">{post.source}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created
                </label>
                <p className="text-gray-900">
                  {new Date(post.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Updated
                </label>
                <p className="text-gray-900">
                  {new Date(post.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sources */}
        {post.scrapedData && Object.keys(post.scrapedData).length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Sources
            </h2>

            {post.sourceType === 'url' ? (
              /* URL Source Display */
              <div className="space-y-4">
                {post.scrapedData.title && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {post.scrapedData.title}
                    </p>
                  </div>
                )}

                {post.scrapedData.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <p className="text-gray-800">
                      {post.scrapedData.description}
                    </p>
                  </div>
                )}

                {post.scrapedData.content && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content Preview
                    </label>
                    <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {post.scrapedData.content.substring(0, 2000)}
                        {post.scrapedData.content.length > 2000 && '...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Topic Search Results Display */
              <div>
                {post.scrapedData.results && post.scrapedData.results.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-3">
                      Found {post.scrapedData.results.length} search results for this topic:
                    </p>
                    {post.scrapedData.results.map((result: any, index: number) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                      >
                        <div className="flex items-start">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mr-3 mt-0.5 flex-shrink-0">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-gray-900 mb-1">
                              {result.title}
                            </h3>
                            {result.snippet && (
                              <p className="text-sm text-gray-700 mb-2">
                                {result.snippet}
                              </p>
                            )}
                            {result.url && (
                              <a
                                href={result.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline break-all"
                              >
                                {result.url}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No search results available
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Generated Posts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Generated Social Media Posts
          </h2>

          {post.generatedPosts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No posts have been generated yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {post.generatedPosts.map((generatedPost, index) => (
                <div
                  key={`${generatedPost.platform}-${index}`}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          generatedPost.platform === 'twitter'
                            ? 'bg-sky-100 text-sky-800'
                            : generatedPost.platform === 'linkedin'
                            ? 'bg-blue-100 text-blue-800'
                            : generatedPost.platform === 'facebook'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-pink-100 text-pink-800'
                        }`}
                      >
                        {generatedPost.platform.charAt(0).toUpperCase() +
                          generatedPost.platform.slice(1)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(generatedPost.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-md p-4">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {generatedPost.content}
                    </p>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedPost.content)
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium transition"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
