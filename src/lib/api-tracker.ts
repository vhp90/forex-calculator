import { AnalyticsStore } from './analytics-store'
import { incrementErrorCount } from './analytics-store'

interface ApiEndpointStats {
  calls: number
  cacheHits: number
  lastUpdate: number | null
  lastWeekActivity: Array<{
    timestamp: number
    source: 'cache' | 'api'
  }>
}

const endpointStats: Record<string, ApiEndpointStats> = {}

// Initialize stats for an endpoint if not exists
function initEndpointStats(endpoint: string) {
  if (!endpointStats[endpoint]) {
    endpointStats[endpoint] = {
      calls: 0,
      cacheHits: 0,
      lastUpdate: null,
      lastWeekActivity: []
    }
  }
}

// Clean up old activity entries (older than 1 week)
function cleanupOldActivity() {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  Object.keys(endpointStats).forEach(endpoint => {
    endpointStats[endpoint].lastWeekActivity = endpointStats[endpoint].lastWeekActivity.filter(
      activity => activity.timestamp > weekAgo
    )
  })
}

// Run cleanup every hour
setInterval(cleanupOldActivity, 60 * 60 * 1000)

import { NextRequest, NextResponse } from 'next/server';
import { trackApiCall as analyticsTrackApiCall } from './analytics-store';

type RouteHandler = (request: Request | NextRequest, ...args: any[]) => Promise<Response | NextResponse>;

export const withApiTracking = (endpoint: string, handler: RouteHandler): RouteHandler => {
  return async (request: Request | NextRequest, ...args: any[]) => {
    const startTime = Date.now();
    try {
      const response = await handler(request, ...args);
      analyticsTrackApiCall(endpoint, response.ok, Date.now() - startTime);
      return response;
    } catch (error) {
      analyticsTrackApiCall(endpoint, false, Date.now() - startTime);
      throw error;
    }
  };
};

export async function withApiTrackingOriginal<T>(
  endpoint: string, 
  fn: () => Promise<T>,
  source: 'cache' | 'api' = 'api'
): Promise<T> {
  initEndpointStats(endpoint)
  const stats = endpointStats[endpoint]
  const now = Date.now()

  try {
    const result = await fn()
    
    // Update stats
    if (source === 'cache') {
      stats.cacheHits++
    }
    stats.calls++
    stats.lastUpdate = now
    stats.lastWeekActivity.push({ timestamp: now, source })

    return result
  } catch (error) {
    incrementErrorCount();
    throw error
  }
}

export function getApiStats() {
  cleanupOldActivity()
  return endpointStats
}
