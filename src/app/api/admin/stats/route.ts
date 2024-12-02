import { NextResponse } from 'next/server'
import { getStats } from '@/lib/analytics-store'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    // Check for admin session cookie
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('admin_session')
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rawStats = getStats()
    
    // Ensure all fields have valid values
    const stats = {
      // Numeric values
      totalVisits: Math.max(0, Math.floor(Number(rawStats.totalVisits) || 0)),
      totalCalculations: Math.max(0, Math.floor(Number(rawStats.totalCalculations) || 0)),
      
      // String values with defaults
      apiSuccessRate: typeof rawStats.apiSuccessRate === 'string' ? rawStats.apiSuccessRate : '0%',
      avgResponseTime: typeof rawStats.avgResponseTime === 'string' ? rawStats.avgResponseTime : '0ms',
      avgCalculationTime: typeof rawStats.avgCalculationTime === 'string' ? rawStats.avgCalculationTime : '0ms',
      memoryUsage: typeof rawStats.memoryUsage === 'string' ? rawStats.memoryUsage : '0 MB',
      
      // Array values
      hourlyVisits: Array.isArray(rawStats.hourlyVisits) && rawStats.hourlyVisits.length === 24
        ? rawStats.hourlyVisits.map(v => Math.max(0, Math.floor(Number(v) || 0)))
        : new Array(24).fill(0),
      
      // Object values
      apiEndpoints: typeof rawStats.apiEndpoints === 'object' && rawStats.apiEndpoints !== null
        ? Object.fromEntries(
            Object.entries(rawStats.apiEndpoints)
              .map(([k, v]) => [k, Math.max(0, Math.floor(Number(v) || 0))])
          )
        : {},
      
      currencyPairs: typeof rawStats.currencyPairs === 'object' && rawStats.currencyPairs !== null
        ? Object.fromEntries(
            Object.entries(rawStats.currencyPairs)
              .map(([k, v]) => [k, Math.max(0, Math.floor(Number(v) || 0))])
          )
        : {},
      
      // Nested object values
      fallbackRateUsage: {
        count: Math.max(0, Math.floor(Number(rawStats.fallbackRateUsage?.count) || 0)),
        percentage: typeof rawStats.fallbackRateUsage?.percentage === 'string' 
          ? rawStats.fallbackRateUsage.percentage 
          : '0'
      }
    }

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-store'
      }
    })
  } catch (error) {
    console.error('Stats error:', error)
    // Return safe default values on error
    return NextResponse.json({
      totalVisits: 0,
      totalCalculations: 0,
      apiSuccessRate: '0%',
      avgResponseTime: '0ms',
      avgCalculationTime: '0ms',
      memoryUsage: '0 MB',
      hourlyVisits: new Array(24).fill(0),
      apiEndpoints: {},
      currencyPairs: {},
      fallbackRateUsage: {
        count: 0,
        percentage: '0'
      }
    }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    })
  }
}
