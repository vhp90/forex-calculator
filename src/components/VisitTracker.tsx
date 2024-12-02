'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { recordVisit } from '@/lib/analytics-store'

export default function VisitTracker() {
  const pathname = usePathname()

  useEffect(() => {
    recordVisit(pathname)
  }, [pathname])

  return null
}
