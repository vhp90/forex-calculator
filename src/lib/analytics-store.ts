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

export class AnalyticsStore {
  private static instance: AnalyticsStore;
  private stats: AnalyticsStats;

  constructor() {
    this.stats = {
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
  }

  static getInstance(): AnalyticsStore {
    if (!AnalyticsStore.instance) {
      AnalyticsStore.instance = new AnalyticsStore();
    }
    return AnalyticsStore.instance;
  }

  public async setStats(newStats: AnalyticsStats): Promise<void> {
    this.stats = newStats;
    const updateStats = unstable_cache(
      async () => newStats,
      ['analytics-stats'],
      { revalidate: 3600 }
    );
    await updateStats();
  }

  public async getStats(): Promise<AnalyticsStats> {
    return this.stats;
  }

  async recordVisit(path: string): Promise<void> {
    await this.updateStats(stats => {
      const visit: VisitMetric = {
        timestamp: Date.now(),
        path
      };
      stats.visits.push(visit);
      this.cleanup(stats);
      return stats;
    });
  }

  async trackApiCall(endpoint: string, success: boolean, duration: number): Promise<void> {
    await this.updateStats(stats => {
      const metric: ApiMetric = {
        timestamp: Date.now(),
        endpoint,
        duration,
        success
      };
      stats.api.push(metric);
      stats.totalApiCalls++;
      this.cleanup(stats);
      return stats;
    });
  }

  async recordCalculation(currencyPair: string, duration: number, usedFallbackRate: boolean = false): Promise<void> {
    await this.updateStats(stats => {
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
      this.cleanup(stats);
      return stats;
    });
  }

  async logError(endpoint: string, error: string): Promise<void> {
    await this.updateStats(stats => {
      const errorMetric: ErrorMetric = {
        timestamp: Date.now(),
        endpoint,
        error
      };
      stats.errors.push(errorMetric);
      stats.totalErrors++;
      this.cleanup(stats);
      return stats;
    });
  }

  private cleanup(stats: AnalyticsStats): void {
    const now = Date.now();
    const hourAgo = now - 24 * 60 * 60 * 1000;

    // Remove old records
    stats.visits = stats.visits.filter(v => v.timestamp > hourAgo);
    stats.calculations = stats.calculations.filter(c => c.timestamp > hourAgo);
    stats.api = stats.api.filter(a => a.timestamp > hourAgo);
    stats.errors = stats.errors.filter(e => e.timestamp > hourAgo);
  }

  private async updateStats(updateFn: (stats: AnalyticsStats) => AnalyticsStats | Promise<AnalyticsStats>): Promise<void> {
    const stats = await this.getStats();
    const updatedStats = await updateFn(stats);
    await this.setStats(updatedStats);
  }
}

// Export a singleton instance
export const analyticsStore = AnalyticsStore.getInstance();

// Export instance methods
export function recordVisit(path: string): void {
  analyticsStore.recordVisit(path);
}

export function trackApiCall(endpoint: string, success: boolean, duration: number): void {
  analyticsStore.trackApiCall(endpoint, success, duration);
}

export function recordCalculation(currencyPair: string, duration: number, usedFallbackRate: boolean = false): void {
  analyticsStore.recordCalculation(currencyPair, duration, usedFallbackRate);
}

export function logError(endpoint: string, error: string): void {
  analyticsStore.logError(endpoint, error);
}

export async function incrementErrorCount(endpoint: string, error: string) {
  const stats = await getStats();
  const endpointStats = stats.apiEndpoints[endpoint] || {
    totalCalls: 0,
    errors: {},
    avgResponseTime: 0
  };
  
  endpointStats.errors[error] = (endpointStats.errors[error] || 0) + 1;
  stats.apiEndpoints[endpoint] = endpointStats;
  
  await updateStats(stats);
}

export function getStats(): Promise<AnalyticsStats> {
  return analyticsStore.getStats();
}

export async function updateStats(stats: AnalyticsStats): Promise<void> {
  await analyticsStore.setStats(stats);
}

// Higher-order function for API tracking
export function withApiTracking(handler: Function): Function {
  return async (...args: any[]) => {
    const startTime = Date.now();
    try {
      const result = await handler(...args);
      analyticsStore.trackApiCall(args[0]?.url || 'unknown', true, Date.now() - startTime);
      return result;
    } catch (error) {
      analyticsStore.trackApiCall(args[0]?.url || 'unknown', false, Date.now() - startTime);
      throw error;
    }
  };
}
