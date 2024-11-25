// Using Alpha Vantage API for real-time forex data
const API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || 'demo'
const BASE_URL = 'https://www.alphavantage.co/query'

interface MarketData {
  rate: number
  spread: number
  volatility: number
  dailyRange: {
    high: number
    low: number
  }
}

// Cache for market data
const marketDataCache: { [key: string]: { data: MarketData; timestamp: number } } = {}
const CACHE_DURATION = 60000 // 1 minute cache

// Mock market data for testing
const mockRates: { [key: string]: number } = {
  'EUR/USD': 1.0850,
  'GBP/USD': 1.2650,
  'USD/JPY': 148.50,
  'USD/CHF': 0.8750,
  'AUD/USD': 0.6550,
  'USD/CAD': 1.3450,
  'EUR/GBP': 0.8580,
  'GBP/JPY': 187.85,
}

export async function getMarketData(fromCurrency: string, toCurrency: string): Promise<MarketData> {
  const cacheKey = `${fromCurrency}/${toCurrency}`
  const now = Date.now()
  
  // Check cache first
  if (marketDataCache[cacheKey] && now - marketDataCache[cacheKey].timestamp < CACHE_DURATION) {
    return marketDataCache[cacheKey].data
  }

  try {
    let rate: number
    let dailyRange = { high: 0, low: 0 }

    if (API_KEY === 'demo') {
      // Use mock data in demo mode
      rate = mockRates[cacheKey] || 1.0
      dailyRange = {
        high: rate * 1.002, // 0.2% above current rate
        low: rate * 0.998,  // 0.2% below current rate
      }
    } else {
      // Get real-time exchange rate
      const response = await fetch(
        `${BASE_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${API_KEY}`
      )
      const data = await response.json()
      rate = parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate'])

      // Get daily range data
      const timeSeriesResponse = await fetch(
        `${BASE_URL}?function=FX_DAILY&from_symbol=${fromCurrency}&to_symbol=${toCurrency}&apikey=${API_KEY}`
      )
      const timeSeriesData = await timeSeriesResponse.json()
      const latestDay = Object.keys(timeSeriesData['Time Series FX (Daily)'])[0]
      const dailyData = timeSeriesData['Time Series FX (Daily)'][latestDay]
      
      dailyRange = {
        high: parseFloat(dailyData['2. high']),
        low: parseFloat(dailyData['3. low'])
      }
    }

    // Calculate spread based on pair liquidity
    const spread = cacheKey.includes('JPY') ? 0.02 : 0.0002

    // Calculate volatility based on daily range
    const volatility = (dailyRange.high - dailyRange.low) / rate

    const marketData: MarketData = {
      rate,
      spread,
      volatility,
      dailyRange
    }

    // Cache the result
    marketDataCache[cacheKey] = {
      data: marketData,
      timestamp: now
    }

    return marketData
  } catch (error) {
    console.error('Error fetching market data:', error)
    // Fallback to mock data on error
    const mockRate = mockRates[cacheKey] || 1.0
    return {
      rate: mockRate,
      spread: cacheKey.includes('JPY') ? 0.02 : 0.0002,
      volatility: 0.001,
      dailyRange: {
        high: mockRate * 1.002,
        low: mockRate * 0.998
      }
    }
  }
}
