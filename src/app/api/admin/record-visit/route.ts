import { NextResponse } from 'next/server'
import { analyticsStore } from '@/lib/analytics-store'

export async function POST() {
  try {
    analyticsStore.recordVisit()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error recording visit:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
