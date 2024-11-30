import { NextResponse } from 'next/server';
import { fetchExchangeRates, FALLBACK_RATES } from '@/lib/api/exchange-rates';
import { CachedExchangeRates } from '@/lib/api/types';

// Configure route segment
export const revalidate = 43200; // 12 hours in seconds

let cachedResponse: NextResponse<CachedExchangeRates> | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 43200 * 1000; // 12 hours in milliseconds

export async function GET() {
  const now = Date.now();

  try {
    // Return cached response if valid
    if (cachedResponse && (now - lastCacheTime < CACHE_DURATION)) {
      return cachedResponse;
    }

    const response = await fetchExchangeRates();
    
    if (!response || !response.conversion_rates) {
      throw new Error('Invalid response from exchange rate API');
    }

    const responseData: CachedExchangeRates = {
      rates: response.conversion_rates,
      timestamp: now,
      expiresAt: now + CACHE_DURATION
    };

    // Create and cache the response
    cachedResponse = NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=43200',
        'Content-Type': 'application/json',
      },
    });
    lastCacheTime = now;

    return cachedResponse;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);

    // Return fallback rates if cache exists
    if (cachedResponse) {
      console.log('Using cached rates due to error');
      return cachedResponse;
    }

    // Return fallback rates with error status
    const fallbackData: CachedExchangeRates = {
      rates: FALLBACK_RATES,
      timestamp: now,
      expiresAt: now + CACHE_DURATION
    };

    return NextResponse.json(fallbackData, {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '300',
      },
    });
  }
}
