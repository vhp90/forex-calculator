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
  apiEndpoints: { 
    [endpoint: string]: { 
      totalCalls: number, 
      errors: { [error: string]: number }, 
      avgResponseTime: number,
      lastUpdate: number 
    } 
  }
}

// Initialize stats with default values
const initialStats: AnalyticsStats = {
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

// Initialize stats
let stats: AnalyticsStats = initialStats;

// Cache functions with longer revalidation and tags
async function getStatsFromCache(): Promise<AnalyticsStats> {
  const getCachedStats = unstable_cache(
    async () => {
      // Return existing stats or initialize new ones
      return stats || initialStats;
    },
    ['analytics-stats'],
    { 
      revalidate: 3600, // Revalidate every hour
      tags: ['analytics']  // Add tag for better cache control
    }
  );
  return getCachedStats();
}

async function setStatsToCache(newStats: AnalyticsStats): Promise<void> {
  stats = newStats;
  const updateStats = unstable_cache(
    async () => newStats,
    ['analytics-stats'],
    { 
      revalidate: 3600, // Match the get cache duration
      tags: ['analytics'] 
    }
  );
  await updateStats();
}

// Helper functions
function cleanup(stats: AnalyticsStats): void {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;  // 24 hours ago
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;  // 7 days ago
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000; // 30 days ago

  // Keep only last 24 hours of detailed data
  stats.visits = stats.visits.filter(v => v.timestamp > dayAgo);
  stats.calculations = stats.calculations.filter(c => c.timestamp > dayAgo);
  stats.api = stats.api.filter(a => a.timestamp > dayAgo);
  stats.errors = stats.errors.filter(e => e.timestamp > dayAgo);

  // Aggregate old data before removing
  const oldApiCalls = stats.api.filter(a => a.timestamp <= dayAgo && a.timestamp > weekAgo);
  if (oldApiCalls.length > 0) {
    // Update endpoint stats
    oldApiCalls.forEach(call => {
      const endpoint = stats.apiEndpoints[call.endpoint] || { totalCalls: 0, errors: {}, avgResponseTime: 0, lastUpdate: 0 };
      endpoint.totalCalls++;
      if (!call.success) {
        endpoint.errors['historical'] = (endpoint.errors['historical'] || 0) + 1;
      }
      endpoint.avgResponseTime = (endpoint.avgResponseTime * (endpoint.totalCalls - 1) + call.duration) / endpoint.totalCalls;
      endpoint.lastUpdate = now;
      stats.apiEndpoints[call.endpoint] = endpoint;
    });
  }

  // Remove data older than a month
  Object.keys(stats.apiEndpoints).forEach(endpoint => {
    const endpointStats = stats.apiEndpoints[endpoint];
    if (endpointStats.totalCalls === 0 || endpointStats.lastUpdate < monthAgo) {
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

export async function recordCalculation(data: { 
  input: { 
    accountBalance: number;
    riskPercentage: number;
    stopLoss: number;
    leverage: number;
    pair: string;
    accountCurrency: Currency;
  };
  output: any;
}): Promise<void> {
  await updateStats(stats => {
    const calc: CalcMetric = {
      timestamp: Date.now(),
      currencyPair: data.input.pair,
      duration: 0,
      usedFallbackRate: data.output.usedFallbackRate || false
    };
    stats.calculations.push(calc);
    stats.totalCalculations++;
    if (calc.usedFallbackRate) {
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
      errors: {} ,
      avgResponseTime: 0,
      lastUpdate: 0
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
