'use client'

import { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface Stats {
  totalVisits: number
  apiSuccessRate: string
  avgResponseTime: string
  totalCalculations: number
  avgCalculationTime: string
  memoryUsage: string
  hourlyVisits: number[]
  apiEndpoints: Record<string, number>
  currencyPairs: Record<string, number>
  fallbackRateUsage: {
    count: number
    percentage: string
  }
}

const initialStats: Stats = {
  totalVisits: 0,
  apiSuccessRate: '0%',
  avgResponseTime: '0ms',
  totalCalculations: 0,
  avgCalculationTime: '0ms',
  memoryUsage: '0 MB',
  hourlyVisits: new Array(24).fill(0),
  apiEndpoints: {},
  currencyPairs: {},
  fallbackRateUsage: {
    count: 0,
    percentage: '0'
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>(initialStats)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const REFRESH_INTERVAL = 300000 // 5 minutes in milliseconds

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/admin/stats', {
          headers: { 'Cache-Control': 'no-cache' }
        })
        
        if (!response.ok) throw new Error('Failed to fetch stats')
        
        const data = await response.json()
        setStats({
          ...initialStats,
          ...data,
          apiEndpoints: data.apiEndpoints || {},
          currencyPairs: data.currencyPairs || {},
          fallbackRateUsage: data.fallbackRateUsage || { count: 0, percentage: '0' }
        })
        setLastUpdated(new Date())
        setError('')
      } catch (err) {
        setError('Failed to fetch analytics data')
        console.error('Error fetching stats:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {lastUpdated?.toLocaleString() || 'Never'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Visits"
          value={stats.totalVisits.toString()}
          trend="+12% from last week"
        />
        <StatCard
          title="API Success Rate"
          value={stats.apiSuccessRate}
          trend={Number(stats.apiSuccessRate.replace('%', '')) >= 99 ? 'Healthy' : 'Needs Attention'}
          trendColor={Number(stats.apiSuccessRate.replace('%', '')) >= 99 ? 'text-green-500' : 'text-yellow-500'}
        />
        <StatCard
          title="Total Calculations"
          value={stats.totalCalculations.toString()}
          trend="Last 24 hours"
        />
        <StatCard
          title="Memory Usage"
          value={stats.memoryUsage}
          trend="Server Resources"
        />
      </div>

      {/* Fallback Rate Usage Alert */}
      {stats.fallbackRateUsage && Number(stats.fallbackRateUsage.percentage) > 5 && (
        <div className="mb-8 p-4 bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-200">
          <div className="flex items-center">
            <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-bold">High Fallback Rate Usage Detected</p>
              <p>
                {stats.fallbackRateUsage.count} calculations ({stats.fallbackRateUsage.percentage}%) 
                in the last hour used fallback rates. This may indicate issues with the market data API.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts and detailed stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* API Endpoints Usage */}
        <div className="p-6 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-lg shadow-black/10">
          <h2 className="text-2xl font-semibold text-blue-400 mb-4">API Endpoints Usage</h2>
          {stats.apiEndpoints && Object.keys(stats.apiEndpoints).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(stats.apiEndpoints).map(([endpoint, count]) => (
                <div key={endpoint} className="flex justify-between items-center text-gray-300">
                  <span>{endpoint}</span>
                  <span>{count} calls</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No API calls recorded yet</p>
          )}
        </div>

        {/* Currency Pairs Usage */}
        <div className="p-6 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-lg shadow-black/10">
          <h2 className="text-2xl font-semibold text-blue-400 mb-4">Currency Pairs Usage</h2>
          {stats.currencyPairs && Object.keys(stats.currencyPairs).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(stats.currencyPairs).map(([pair, count]) => (
                <div key={pair} className="flex justify-between items-center text-gray-300">
                  <span>{pair}</span>
                  <span>{count} calculations</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No calculations performed yet</p>
          )}
        </div>

        {/* Hourly Visits Chart */}
        <div className="p-6 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-lg shadow-black/10">
          <h2 className="text-2xl font-semibold text-blue-400 mb-4">Hourly Visits</h2>
          {stats.hourlyVisits && Array.isArray(stats.hourlyVisits) && stats.hourlyVisits.length === 24 ? (
            <div className="h-[300px] relative">
              <Line
                data={{
                  labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
                  datasets: [{
                    label: 'Visits',
                    data: stats.hourlyVisits,
                    borderColor: '#60A5FA',
                    backgroundColor: '#60A5FA20',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: {
                    duration: 300
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      min: 0,
                      suggestedMax: Math.max(5, ...stats.hourlyVisits),
                      grid: {
                        color: '#374151'
                      },
                      ticks: {
                        stepSize: 1,
                        precision: 0,
                        color: '#9CA3AF'
                      }
                    },
                    x: {
                      grid: {
                        color: '#374151'
                      },
                      ticks: {
                        maxRotation: 0,
                        color: '#9CA3AF',
                        callback: (_, index) => index % 3 === 0 ? `${index}:00` : ''
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      enabled: true,
                      backgroundColor: '#1F2937',
                      titleColor: '#60A5FA',
                      bodyColor: '#F3F4F6',
                      borderColor: '#374151',
                      borderWidth: 1,
                      padding: 10,
                      callbacks: {
                        title: (tooltipItems) => {
                          const item = tooltipItems[0]
                          return `Hour: ${item.label}`
                        },
                        label: (context) => {
                          const value = context.parsed.y
                          return `${value} visit${value !== 1 ? 's' : ''}`
                        }
                      }
                    }
                  },
                  interaction: {
                    intersect: false,
                    mode: 'index'
                  }
                }}
              />
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-gray-400">No visit data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, trend, trendColor = 'text-gray-500' }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
      <p className={`text-sm ${trendColor}`}>{trend}</p>
    </div>
  )
}
