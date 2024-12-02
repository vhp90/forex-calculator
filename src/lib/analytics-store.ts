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

interface AnalyticsStats {
  calculations: number
  apiCalls: number
  errors: number
  fallbackRates: number
}

class AnalyticsStore {
  private static instance: AnalyticsStore
  private visits: VisitMetric[] = []
  private apiMetrics: ApiMetric[] = []
  private calcMetrics: CalcMetric[] = []
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
  }

  recordVisit(path: string) {
    this.visits.push({
      timestamp: Date.now(),
      path
    })
    this.maybeTriggerCleanup()
  }

  recordApiCall(endpoint: string, duration: number, success: boolean) {
    this.apiMetrics.push({
      timestamp: Date.now(),
      endpoint,
      duration,
      success
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

  private maybeTriggerCleanup() {
    const totalRecords = this.visits.length + this.apiMetrics.length + this.calcMetrics.length
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
    calculations: 0,
    apiCalls: 0,
    errors: 0,
    fallbackRates: 0
  }

  incrementCalculations() {
    this.stats.calculations++
  }

  incrementApiCalls() {
    this.stats.apiCalls++
  }

  incrementErrors() {
    this.stats.errors++
  }

  incrementFallbackRates() {
    this.stats.fallbackRates++
  }

  resetStats() {
    this.stats = {
      calculations: 0,
      apiCalls: 0,
      errors: 0,
      fallbackRates: 0
    }
  }

  getStats() {
    return { ...this.stats }
  }
}

const analyticsStore = AnalyticsStore.getInstance()
const analyticsStoreStats = new AnalyticsStoreStats()

// Export instance methods
export const recordVisit = (path: string) => analyticsStore.recordVisit(path)
export const recordApiCall = (endpoint: string, duration: number, success: boolean) => 
  analyticsStore.recordApiCall(endpoint, duration, success)
export const recordCalculation = (currencyPair: string, duration: number, usedFallbackRate: boolean = false) => 
  analyticsStore.recordCalculation(currencyPair, duration, usedFallbackRate)
export const getStats = () => analyticsStore.getStats()

// Export stats methods
export const incrementCalculations = () => analyticsStoreStats.incrementCalculations()
export const incrementApiCalls = () => analyticsStoreStats.incrementApiCalls()
export const incrementErrors = () => analyticsStoreStats.incrementErrors()
export const incrementFallbackRates = () => analyticsStoreStats.incrementFallbackRates()
export const resetAnalyticsStoreStats = () => analyticsStoreStats.resetStats()
