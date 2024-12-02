'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/admin/login') {
      setIsLoading(false)
      return
    }

    let mounted = true

    // Check for admin session
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/auth', {
          cache: 'no-store'
        })
        if (!response.ok) {
          router.push('/admin/login')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/admin/login')
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    checkAuth()
    return () => { mounted = false }
  }, [router, pathname])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-gray-300">Loading...</div>
      </div>
    )
  }

  // Skip layout for login page
  if (pathname === '/admin/login') {
    return children
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-blue-400">Admin Dashboard</span>
            </div>
            <div className="flex items-center">
              <button
                onClick={async () => {
                  try {
                    await fetch('/api/admin/auth', { 
                      method: 'DELETE',
                      cache: 'no-store'
                    })
                  } catch (error) {
                    console.error('Logout failed:', error)
                  }
                  router.push('/admin/login')
                }}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
