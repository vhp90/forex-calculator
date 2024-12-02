import { NextResponse } from 'next/server'
import { getStats } from '@/lib/analytics-store'
import { cookies } from 'next/headers'
import { unstable_cache } from 'next/cache'
import { withApiTracking } from '@/lib/api-tracker'
import type { VisitMetric, CalcMetric, ApiMetric, ErrorMetric } from '@/lib/analytics-store'

// Reuse the same cache key as the exchange rates route
const getExchangeRateStats = unstable_cache(
  async () => {
    const defaultStats = {
      lastWeekFetches: [],
      totalFetches: 0,
      lastUpdate: null,
      cacheHits: 0,
      apiCalls: 0
    };
    return defaultStats;
  },
  ['exchange-rate-stats'],
  {
    revalidate: 604800, // 1 week in seconds
    tags: ['exchange-rate-stats']
  }
);

async function handler(request: Request) {
  try {
    // Check for admin session cookie
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('admin_session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get analytics stats
    const stats = await getStats();
    const exchangeRateStats = await getExchangeRateStats();

    return NextResponse.json({
      visits: {
        total: stats.visits.length,
        unique: new Set(stats.visits.map((v: VisitMetric) => v.path)).size,
        byPath: stats.visits.reduce((acc: Record<string, number>, curr: VisitMetric) => {
          acc[curr.path] = (acc[curr.path] || 0) + 1;
          return acc;
        }, {})
      },
      calculations: {
        total: stats.totalCalculations,
        byPair: stats.calculations.reduce((acc: Record<string, number>, curr: CalcMetric) => {
          acc[curr.currencyPair] = (acc[curr.currencyPair] || 0) + 1;
          return acc;
        }, {}),
        avgDuration: stats.calculations.length > 0 
          ? stats.calculations.reduce((acc: number, curr: CalcMetric) => acc + curr.duration, 0) / stats.calculations.length 
          : 0,
        fallbackRates: stats.totalFallbackRates
      },
      api: {
        total: stats.totalApiCalls,
        byEndpoint: stats.api.reduce((acc: Record<string, number>, curr: ApiMetric) => {
          acc[curr.endpoint] = (acc[curr.endpoint] || 0) + 1;
          return acc;
        }, {}),
        avgDuration: stats.api.length > 0 
          ? stats.api.reduce((acc: number, curr: ApiMetric) => acc + curr.duration, 0) / stats.api.length 
          : 0,
        success: stats.api.filter((a: ApiMetric) => a.success).length,
        errors: stats.api.filter((a: ApiMetric) => !a.success).length
      },
      errors: {
        total: stats.totalErrors,
        byEndpoint: stats.errors.reduce((acc: Record<string, number>, curr: ErrorMetric) => {
          acc[curr.endpoint] = (acc[curr.endpoint] || 0) + 1;
          return acc;
        }, {})
      },
      exchangeRates: {
        totalFetches: exchangeRateStats.totalFetches,
        cacheHits: exchangeRateStats.cacheHits,
        apiCalls: exchangeRateStats.apiCalls,
        lastUpdate: exchangeRateStats.lastUpdate,
        lastWeekActivity: exchangeRateStats.lastWeekFetches
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

export const GET = withApiTracking('/api/admin/stats', handler);
