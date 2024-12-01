import { NextResponse } from 'next/server';
import { fetchExchangeRates, FALLBACK_RATES } from '@/lib/api/exchange-rates';
import { CachedExchangeRates } from '@/lib/api/types';
import { unstable_cache } from 'next/cache';

// Configure route segment
export const revalidate = 43200; // 12 hours in seconds
const CACHE_TAG = 'exchange-rates';

const getExchangeRates = unstable_cache(
  async () => {
    try {
      const response = await fetchExchangeRates();
      
      if (!response || !response.conversion_rates) {
        throw new Error('Invalid response from exchange rate API');
      }

      const now = Date.now();
      return {
        rates: response.conversion_rates,
        timestamp: now,
        expiresAt: now + (43200 * 1000) // 12 hours in milliseconds
      };
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      const now = Date.now();
      return {
        rates: FALLBACK_RATES,
        timestamp: now,
        expiresAt: now + (3600 * 1000), // 1 hour for fallback rates
        isFallback: true
      };
    }
  },
  ['exchange-rates'],
  {
    revalidate: 43200, // 12 hours
    tags: [CACHE_TAG]
  }
);

export async function GET() {
  const data = await getExchangeRates();
  
  return NextResponse.json(data, {
    status: 200,
    headers: {
      'Cache-Control': data.isFallback 
        ? 'public, max-age=3600' // 1 hour for fallback
        : 'public, max-age=43200', // 12 hours for real data
      'Content-Type': 'application/json',
    },
  });
}
