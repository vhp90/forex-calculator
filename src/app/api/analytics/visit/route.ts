import { NextRequest, NextResponse } from 'next/server'
import { recordVisit } from '@/lib/analytics-store'

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json()
    await recordVisit(path)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to record visit:', error)
    return NextResponse.json(
      { error: 'Failed to record visit' },
      { status: 500 }
    )
  }
}
