import { NextResponse } from 'next/server'
import { analyticsStore } from '@/lib/analytics-store'

export async function POST() {
  try {
    analyticsStore.recordVisit()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to record visit:', error)
    return NextResponse.json(
      { error: 'Failed to record visit' },
      { status: 500 }
    )
  }
}
