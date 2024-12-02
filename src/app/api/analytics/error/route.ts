import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/analytics-store'

export async function POST(request: NextRequest) {
  try {
    const { message, stack, path } = await request.json()
    
    const error = new Error(message)
    error.stack = stack
    
    logError(path, error.message)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to record error:', error)
    return NextResponse.json(
      { error: 'Failed to record error' },
      { status: 500 }
    )
  }
}
