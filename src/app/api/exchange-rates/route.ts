// @ts-nocheck
import { NextResponse } from 'next/server';
import { fetchExchangeRates, FALLBACK_RATES } from '@/lib/api/exchange-rates';

// Enable edge runtime for better performance
export const runtime = 'edge';

// Configure route segment
export const fetchCache = 'force-cache';
export const revalidate = 43200; // 12 hours in seconds

let cachedResponse = null;
let lastCacheTime = 0;
const CACHE_DURATION = 43200 * 1000; // 12 hours in milliseconds

export async function GET() {
  const now = Date.now();

  // Return cached response if valid
  if (cachedResponse && (now - lastCacheTime < CACHE_DURATION)) {
    return cachedResponse;
  }

  try {
    const response = await fetchExchangeRates();
    
    const responseData = {
      rates: response.conversion_rates,
      timestamp: now,
      expiresAt: now + CACHE_DURATION,
      source: 'api'
    };

    // Create and cache the response
    cachedResponse = NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=21600',
        'CDN-Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=21600',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=21600'
      }
    });
    lastCacheTime = now;

    return cachedResponse;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    // Return fallback rates if API fails
    const fallbackData = {
      rates: FALLBACK_RATES,
      timestamp: now,
      expiresAt: now + CACHE_DURATION,
      source: 'fallback'
    };

    // Create and cache the fallback response
    cachedResponse = NextResponse.json(fallbackData, {
      headers: {
        'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=21600',
        'CDN-Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=21600',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=21600'
      }
    });
    lastCacheTime = now;

    return cachedResponse;
  }
}
