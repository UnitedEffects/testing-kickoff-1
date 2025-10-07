/**
 * PageLoader Component
 *
 * Full-screen loading spinner used to prevent FOUC (Flash of Unstyled Content)
 * on client-side pages while data is being fetched.
 *
 * Required pattern for all client-side pages with data loading.
 *
 * @example
 * ```tsx
 * 'use client'
 *
 * import { useState, useEffect } from 'react'
 * import { PageLoader } from '@/shared/components/PageLoader'
 *
 * export function FeaturePage() {
 *   const [isLoading, setIsLoading] = useState(true)
 *   const { data, loading: dataLoading } = useFeaturePage()
 *
 *   useEffect(() => {
 *     if (!dataLoading) {
 *       setIsLoading(false)
 *     }
 *   }, [dataLoading])
 *
 *   if (isLoading) {
 *     return <PageLoader />
 *   }
 *
 *   return <div>{/* Page content *\/}</div>
 * }
 * ```
 */
export function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  )
}
