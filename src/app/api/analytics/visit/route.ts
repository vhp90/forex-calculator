import { NextRequest, NextResponse } from 'next/server'
import { AnalyticsStore } from '@/lib/analytics-store'

const analyticsStore = AnalyticsStore.getInstance();

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json()
    await analyticsStore.recordVisit(path)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to record visit:', error)
    return NextResponse.json(
      { error: 'Failed to record visit' },
      { status: 500 }
    )
  }
}
