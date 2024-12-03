'use server';

import { Currency } from './api/types';
import { unstable_cache } from 'next/cache';

export interface CalcMetric {
  timestamp: number
  currencyPair: string
  duration: number
  usedFallbackRate: boolean
}

export interface ApiMetric {
  timestamp: number
  endpoint: string
  duration: number
  success: boolean
}

export interface VisitMetric {
  timestamp: number
  path: string
}

export interface ErrorMetric {
  timestamp: number
  endpoint: string
  error: string
}

interface AnalyticsStats {
  visits: VisitMetric[];
  calculations: CalcMetric[];
  api: ApiMetric[];
  errors: ErrorMetric[];
  totalCalculations: number;
  totalApiCalls: number;
  totalErrors: number;
  totalFallbackRates: number;
  apiEndpoints: { [endpoint: string]: { totalCalls: number, errors: { [error: string]: number }, avgResponseTime: number } }
}

// Initialize stats
let stats: AnalyticsStats = {
  visits: [],
  calculations: [],
  api: [],
  errors: [],
  totalCalculations: 0,
  totalApiCalls: 0,
  totalErrors: 0,
  totalFallbackRates: 0,
  apiEndpoints: {}
};

// Cache functions
async function getStatsFromCache(): Promise<AnalyticsStats> {
  const getCachedStats = unstable_cache(
    async () => stats,
    ['analytics-stats'],
    { revalidate: 3600 }
  );
  return getCachedStats();
}

async function setStatsToCache(newStats: AnalyticsStats): Promise<void> {
  stats = newStats;
  const updateStats = unstable_cache(
    async () => newStats,
    ['analytics-stats'],
    { revalidate: 3600 }
  );
  await updateStats();
}

// Helper functions
function cleanup(stats: AnalyticsStats): void {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;  // 24 hours ago
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;  // 7 days ago

  // Keep only last 24 hours of detailed data
  stats.visits = stats.visits.filter(v => v.timestamp > dayAgo);
  stats.calculations = stats.calculations.filter(c => c.timestamp > dayAgo);
  stats.api = stats.api.filter(a => a.timestamp > dayAgo);
  stats.errors = stats.errors.filter(e => e.timestamp > dayAgo);

  // Aggregate old data before removing
  const oldApiCalls = stats.api.filter(a => a.timestamp <= dayAgo);
  if (oldApiCalls.length > 0) {
    const successCount = oldApiCalls.filter(a => a.success).length;
    const totalDuration = oldApiCalls.reduce((acc, curr) => acc + curr.duration, 0);
    
    // Update endpoint stats
    oldApiCalls.forEach(call => {
      const endpoint = stats.apiEndpoints[call.endpoint] || { totalCalls: 0, errors: {}, avgResponseTime: 0 };
      endpoint.totalCalls++;
      if (!call.success) {
        endpoint.errors['historical'] = (endpoint.errors['historical'] || 0) + 1;
      }
      endpoint.avgResponseTime = (endpoint.avgResponseTime * (endpoint.totalCalls - 1) + call.duration) / endpoint.totalCalls;
      stats.apiEndpoints[call.endpoint] = endpoint;
    });
  }

  // Remove data older than a week
  Object.keys(stats.apiEndpoints).forEach(endpoint => {
    const endpointStats = stats.apiEndpoints[endpoint];
    if (endpointStats.totalCalls === 0) {
      delete stats.apiEndpoints[endpoint];
    }
  });
}

async function updateStats(updateFn: (stats: AnalyticsStats) => AnalyticsStats | Promise<AnalyticsStats>): Promise<void> {
  const currentStats = await getStatsFromCache();
  const updatedStats = await updateFn(currentStats);
  await setStatsToCache(updatedStats);
}

// Exported server actions
export async function recordVisit(path: string): Promise<void> {
  await updateStats(stats => {
    const visit: VisitMetric = {
      timestamp: Date.now(),
      path
    };
    stats.visits.push(visit);
    cleanup(stats);
    return stats;
  });
}

export async function trackApiCall(endpoint: string, success: boolean, duration: number): Promise<void> {
  await updateStats(stats => {
    const metric: ApiMetric = {
      timestamp: Date.now(),
      endpoint,
      duration,
      success
    };
    stats.api.push(metric);
    stats.totalApiCalls++;
    cleanup(stats);
    return stats;
  });
}

export async function recordCalculation(currencyPair: string, duration: number, usedFallbackRate: boolean = false): Promise<void> {
  await updateStats(stats => {
    const calc: CalcMetric = {
      timestamp: Date.now(),
      currencyPair,
      duration,
      usedFallbackRate
    };
    stats.calculations.push(calc);
    stats.totalCalculations++;
    if (usedFallbackRate) {
      stats.totalFallbackRates++;
    }
    cleanup(stats);
    return stats;
  });
}

export async function logError(endpoint: string, error: string): Promise<void> {
  await updateStats(stats => {
    const errorMetric: ErrorMetric = {
      timestamp: Date.now(),
      endpoint,
      error
    };
    stats.errors.push(errorMetric);
    stats.totalErrors++;
    cleanup(stats);
    return stats;
  });
}

export async function incrementErrorCount(endpoint: string, error: string): Promise<void> {
  await updateStats(stats => {
    const endpointStats = stats.apiEndpoints[endpoint] || {
      totalCalls: 0,
      errors: {},
      avgResponseTime: 0
    };
    
    endpointStats.errors[error] = (endpointStats.errors[error] || 0) + 1;
    stats.apiEndpoints[endpoint] = endpointStats;
    return stats;
  });
}

export async function getStats(): Promise<AnalyticsStats> {
  return getStatsFromCache();
}

export async function withApiTracking(handler: Function): Promise<Function> {
  return async (...args: any[]) => {
    const startTime = Date.now();
    try {
      const result = await handler(...args);
      await trackApiCall(args[0]?.url || 'unknown', true, Date.now() - startTime);
      return result;
    } catch (error) {
      await trackApiCall(args[0]?.url || 'unknown', false, Date.now() - startTime);
      throw error;
    }
  };
}
