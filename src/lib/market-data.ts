// Using Alpha Vantage API for real-time forex data
const API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || 'demo'
const BASE_URL = 'https://www.alphavantage.co/query'

interface MarketData {
  rate: number
  spread: number
  volatility: number
  pipValue: number
  dailyRange: {
    high: number
    low: number
  }
}

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
  try {
    const response = await fetch(
      `${BASE_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${API_KEY}`
    )
    const data = await response.json()
    const rate = parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate'])

    // Get daily range data
    const timeSeriesResponse = await fetch(
      `${BASE_URL}?function=FX_DAILY&from_symbol=${fromCurrency}&to_symbol=${toCurrency}&apikey=${API_KEY}`
    )
    const timeSeriesData = await timeSeriesResponse.json()
    const latestDay = Object.keys(timeSeriesData['Time Series FX (Daily)'])[0]
    const dailyData = timeSeriesData['Time Series FX (Daily)'][latestDay]

    // Mock spread based on pair liquidity
    const spread = `${fromCurrency}/${toCurrency}`.includes('JPY') ? 0.02 : 0.0002

    // Mock volatility (as a decimal, e.g., 0.001 = 0.1%)
    const volatility = 0.001

    return {
      rate,
      spread,
      volatility,
      pipValue: `${fromCurrency}/${toCurrency}`.includes('JPY') ? 0.01 : 0.0001,
      dailyRange: {
        high: parseFloat(dailyData['2. high']),
        low: parseFloat(dailyData['3. low']),
      },
    }
  } catch (error) {
    console.error('Error fetching market data:', error)
    // Return simulated data if API fails
    const pair = `${fromCurrency}/${toCurrency}`
    let rate = mockRates[pair]

    // Handle cross rates if direct rate is not available
    if (!rate && mockRates[`${fromCurrency}/USD`] && mockRates[`USD/${toCurrency}`]) {
      rate = mockRates[`${fromCurrency}/USD`] * mockRates[`USD/${toCurrency}`]
    }

    if (!rate) {
      throw new Error(`No rate available for ${pair}`)
    }

    // Mock spread based on pair liquidity
    const spread = pair.includes('JPY') ? 0.02 : 0.0002

    // Mock volatility (as a decimal, e.g., 0.001 = 0.1%)
    const volatility = 0.001

    return {
      rate,
      spread,
      volatility,
      pipValue: pair.includes('JPY') ? 0.01 : 0.0001,
      dailyRange: {
        high: rate * 1.002,
        low: rate * 0.998,
      },
    }
  }
}

function calculateVolatility(timeSeriesData: any): number {
  const returns: number[] = []
  const prices = Object.values(timeSeriesData)
    .slice(0, 20) // Last 20 days
    .map((day: any) => parseFloat(day['4. close']))

  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i - 1]))
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length
  return Math.sqrt(variance) * Math.sqrt(252) // Annualized volatility
}

function getSimulatedRate(fromCurrency: string, toCurrency: string): number {
  const rates: { [key: string]: number } = {
    'EUR/USD': 1.0876,
    'GBP/USD': 1.2634,
    'USD/JPY': 148.12,
    'USD/CHF': 0.8745,
    'AUD/USD': 0.6589,
  }
  return rates[`${fromCurrency}/${toCurrency}`] || 1.0
}
