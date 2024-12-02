import { NextRequest, NextResponse } from 'next/server'
import { recordApiCall, incrementApiCalls, incrementErrors } from './analytics-store'

export function withApiTracking(
  handler: (req: NextRequest) => Promise<NextResponse>,
  endpoint: string
) {
  return async (req: NextRequest) => {
    const startTime = performance.now()
    
    try {
      const response = await handler(req)
      const duration = performance.now() - startTime
      
      recordApiCall(
        endpoint,
        duration,
        response.status >= 200 && response.status < 300
      )
      
      return response
    } catch (error) {
      const duration = performance.now() - startTime
      recordApiCall(endpoint, duration, false)
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

export const trackApiCall = async <T>(
  endpoint: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now()
  try {
    incrementApiCalls()
    const result = await apiCall()
    const duration = performance.now() - startTime
    recordApiCall(endpoint, duration, true)
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    recordApiCall(endpoint, duration, false)
    incrementErrors()
    throw error
  }
}
