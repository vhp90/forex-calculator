import { NextResponse } from 'next/server'
import { withApiTracking } from '@/lib/analytics-store'
import { unstable_cache } from 'next/cache'

const API_KEY = process.env.FOREX_API_KEY
const BASE_URL = 'https://api.forexrateapi.com/v1/latest'

// Cache exchange rates for 1 hour
const getExchangeRates = unstable_cache(
  async () => {
    const response = await fetch(`${BASE_URL}?api_key=${API_KEY}`)
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates')
    }
    return response.json()
  },
  ['exchange-rates'],
  { revalidate: 3600 }
)

export async function GET() {
  return withApiTracking('/api/exchange-rates', async () => {
    try {
      const data = await getExchangeRates()
      return NextResponse.json(data)
    } catch (error) {
      console.error('Error fetching exchange rates:', error)
      return NextResponse.json(
        { error: 'Failed to fetch exchange rates' },
        { status: 500 }
      )
    }
  })
}
