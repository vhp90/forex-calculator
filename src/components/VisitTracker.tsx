'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { recordVisit } from '@/lib/analytics-store'

export default function VisitTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Use try-catch to handle any potential errors silently
    const track = async () => {
      try {
        await recordVisit(pathname)
      } catch (error) {
        console.error('Failed to record visit:', error)
      }
    }
    track()
  }, [pathname])

  return null
}
