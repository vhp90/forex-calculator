'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Admin Dashboard Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Something went wrong!</h2>
        <p className="text-gray-300 mb-6">
          {error.message || 'An unexpected error occurred while loading the dashboard.'}
        </p>
        <div className="flex gap-4">
          <button
            onClick={reset}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  )
}
