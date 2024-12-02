import { Currency } from './api/types';

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
}

export class AnalyticsStore {
  private static instance: AnalyticsStore
  private visits: VisitMetric[] = []
  private apiMetrics: ApiMetric[] = []
  private calcMetrics: CalcMetric[] = []
  private errors: ErrorMetric[] = []
  private readonly maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  private readonly maxRecordsPerHour = 1000 // Limit records per hour
  private readonly maxTotalRecords = 10000 // Total records limit
  private lastCleanup = Date.now()
  private readonly cleanupInterval = 5 * 60 * 1000 // 5 minutes

  private constructor() {
    // Run cleanup every 5 minutes
    setInterval(() => this.cleanup(), this.cleanupInterval)
  }

  public static getInstance(): AnalyticsStore {
    if (!AnalyticsStore.instance) {
      AnalyticsStore.instance = new AnalyticsStore()
    }
    return AnalyticsStore.instance
  }

  private cleanup() {
    const now = Date.now()
    // Only run cleanup if enough time has passed
    if (now - this.lastCleanup < this.cleanupInterval) {
      return
    }
    this.lastCleanup = now
    
    const threshold = now - this.maxAge

    // Helper function to limit records per hour and total
    const limitRecords = <T extends { timestamp: number }>(records: T[]): T[] => {
      // First, remove old records
      records = records.filter(r => r.timestamp > threshold)

      // Then, group by hour
      const hourlyGroups = new Map<number, T[]>()
      records.forEach(record => {
        const hour = Math.floor(record.timestamp / (60 * 60 * 1000))
        if (!hourlyGroups.has(hour)) {
          hourlyGroups.set(hour, [])
        }
        hourlyGroups.get(hour)!.push(record)
      })

      // Limit records per hour and flatten
      return Array.from(hourlyGroups.values())
        .map(group => group.slice(-this.maxRecordsPerHour))
        .flat()
        .slice(-this.maxTotalRecords)
    }

    this.visits = limitRecords(this.visits)
    this.apiMetrics = limitRecords(this.apiMetrics)
    this.calcMetrics = limitRecords(this.calcMetrics)
    this.errors = limitRecords(this.errors)
  }

  recordVisit(path: string) {
    this.visits.push({
      timestamp: Date.now(),
      path
    })
    this.maybeTriggerCleanup()
  }

  trackApiCall(endpoint: string, success: boolean, duration: number) {
    this.apiMetrics.push({
      endpoint,
      success,
      duration,
      timestamp: Date.now()
    })
    this.maybeTriggerCleanup()
  }

  recordCalculation(currencyPair: string, duration: number, usedFallbackRate: boolean = false) {
    this.calcMetrics.push({
      timestamp: Date.now(),
      currencyPair,
      duration,
      usedFallbackRate
    })
    this.maybeTriggerCleanup()
  }

  incrementErrors(endpoint: string, error: string) {
    this.errors.push({
      endpoint,
      error,
      timestamp: Date.now()
    })
    this.maybeTriggerCleanup()
  }

  private maybeTriggerCleanup() {
    const totalRecords = this.visits.length + this.apiMetrics.length + this.calcMetrics.length + this.errors.length
    if (totalRecords > this.maxTotalRecords) {
      this.cleanup()
    }
  }

  getStats() {
    const now = Date.now()
    const hourAgo = now - 60 * 60 * 1000 // 1 hour ago

    // Get recent metrics
    const recentMetrics = this.calcMetrics.filter(m => m.timestamp > hourAgo)
    const recentApiCalls = this.apiMetrics.filter(m => m.timestamp > hourAgo)

    // Calculate API endpoints usage
    const apiEndpoints: Record<string, number> = {}
    recentApiCalls.forEach(call => {
      apiEndpoints[call.endpoint] = (apiEndpoints[call.endpoint] || 0) + 1
    })

    // Calculate currency pairs usage
    const currencyPairs: Record<string, number> = {}
    recentMetrics.forEach(calc => {
      currencyPairs[calc.currencyPair] = (currencyPairs[calc.currencyPair] || 0) + 1
    })

    // Calculate fallback rate usage
    const fallbackRateUsage = recentMetrics.reduce((acc, curr) => {
      if (curr.usedFallbackRate) acc.count++
      return acc
    }, { count: 0, total: recentMetrics.length })

    // Calculate hourly visits
    const hourlyVisits = new Array(24).fill(0)
    this.visits.forEach(visit => {
      const hour = new Date(visit.timestamp).getHours()
      hourlyVisits[hour]++
    })

    // Calculate average response time
    const avgResponseTime = recentApiCalls.length > 0
      ? Math.round(recentApiCalls.reduce((acc, curr) => acc + curr.duration, 0) / recentApiCalls.length)
      : 0

    // Calculate average calculation time
    const avgCalcTime = recentMetrics.length > 0
      ? Math.round(recentMetrics.reduce((acc, curr) => acc + curr.duration, 0) / recentMetrics.length)
      : 0

    return {
      totalVisits: this.visits.length,
      totalCalculations: this.calcMetrics.length,
      apiSuccessRate: recentApiCalls.length > 0
        ? `${(recentApiCalls.filter(m => m.success).length / recentApiCalls.length * 100).toFixed(1)}%`
        : '100%',
      avgResponseTime: `${avgResponseTime}ms`,
      avgCalculationTime: `${avgCalcTime}ms`,
      memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      hourlyVisits,
      apiEndpoints,
      currencyPairs,
      fallbackRateUsage: {
        count: fallbackRateUsage.count,
        percentage: fallbackRateUsage.total > 0
          ? (fallbackRateUsage.count / fallbackRateUsage.total * 100).toFixed(1)
          : '0'
      }
    }
  }
}

class AnalyticsStoreStats {
  private stats: AnalyticsStats = {
    visits: [],
    calculations: [],
    api: [],
    errors: [],
    totalCalculations: 0,
    totalApiCalls: 0,
    totalErrors: 0,
    totalFallbackRates: 0
  }

  incrementCalculations() {
    this.stats.totalCalculations++
  }

  incrementApiCalls() {
    this.stats.totalApiCalls++
  }

  incrementErrors() {
    this.stats.totalErrors++
  }

  incrementFallbackRates() {
    this.stats.totalFallbackRates++
  }

  resetStats() {
    this.stats = {
      visits: [],
      calculations: [],
      api: [],
      errors: [],
      totalCalculations: 0,
      totalApiCalls: 0,
      totalErrors: 0,
      totalFallbackRates: 0
    }
  }

  getStats() {
    return { ...this.stats }
  }
}

const analyticsStore = AnalyticsStore.getInstance()
const analyticsStoreStats = new AnalyticsStoreStats()

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
  analyticsStore.incrementErrors(endpoint, error);
}

export function getStats(): AnalyticsStats {
  return analyticsStoreStats.getStats();
}

// Export stats methods
export function incrementCalculations(): void {
  analyticsStoreStats.incrementCalculations();
}

export function incrementApiCalls(): void {
  analyticsStoreStats.incrementApiCalls();
}

export function incrementErrorCount(): void {
  analyticsStoreStats.incrementErrors();
}

export function incrementFallbackRates(): void {
  analyticsStoreStats.incrementFallbackRates();
}

export function resetAnalyticsStoreStats(): void {
  analyticsStoreStats.resetStats();
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

export { analyticsStore };
