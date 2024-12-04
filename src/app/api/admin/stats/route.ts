import { NextResponse } from 'next/server'
import { getStats } from '@/lib/analytics-store'
import { cookies } from 'next/headers'
import { unstable_cache } from 'next/cache'
import { withApiTracking } from '@/lib/api-tracker'
import type { VisitMetric, CalcMetric, ApiMetric, ErrorMetric } from '@/lib/analytics-store'
import { validateAdminRequest } from '@/app/api/auth/validate';

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
    const isAdmin = await validateAdminRequest();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getStats();
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;

    // Calculate API success rate
    const recentApiCalls = stats.api.filter(call => call.timestamp > dayAgo);
    const successRate = recentApiCalls.length > 0
      ? ((recentApiCalls.filter(call => call.success).length / recentApiCalls.length) * 100).toFixed(1)
      : '100';

    // Calculate fallback rate usage
    const recentCalcs = stats.calculations.filter(calc => calc.timestamp > dayAgo);
    const fallbackCount = recentCalcs.filter(calc => calc.usedFallbackRate).length;
    const fallbackPercentage = recentCalcs.length > 0
      ? ((fallbackCount / recentCalcs.length) * 100).toFixed(1)
      : '0';

    return NextResponse.json({
      totalVisits: stats.visits.length,
      apiSuccessRate: `${successRate}%`,
      totalCalculations: stats.calculations.filter(calc => calc.timestamp > dayAgo).length,
      apiEndpoints: stats.apiEndpoints,
      currencyPairs: stats.calculations.reduce((acc: Record<string, number>, curr) => {
        acc[curr.currencyPair] = (acc[curr.currencyPair] || 0) + 1;
        return acc;
      }, {}),
      fallbackRateUsage: {
        count: fallbackCount,
        percentage: fallbackPercentage
      },
      exchangeRateStats: {
        apiCalls: stats.api.filter(call => call.endpoint.includes('exchange-rates')).length,
        cacheHits: stats.api.filter(call => call.endpoint.includes('exchange-rates') && call.success).length,
        totalFetches: stats.totalApiCalls,
        lastUpdate: stats.api.length > 0 ? Math.max(...stats.api.map(a => a.timestamp)) : null,
        lastWeekActivity: Array.from({ length: 7 }, (_, i) => {
          const date = new Date(now - i * 24 * 60 * 60 * 1000);
          const dayStart = new Date(date.setHours(0, 0, 0, 0)).getTime();
          const dayEnd = new Date(date.setHours(23, 59, 59, 999)).getTime();
          return stats.api.filter(a => a.timestamp >= dayStart && a.timestamp <= dayEnd).length;
        }).reverse()
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
