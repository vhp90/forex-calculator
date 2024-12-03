import { NextResponse } from 'next/server';
import { withApiTracking } from '@/lib/api-tracker';
import { getExchangeRate, isCurrency } from '@/lib/api/exchange-rates';
import { unstable_cache } from 'next/cache';
import { Currency, SUPPORTED_CURRENCIES } from '@/lib/api/types';

interface ExchangeRateStats {
  lastWeekFetches: Array<{ timestamp: number; source: 'cache' | 'api' }>;
  totalFetches: number;
  lastUpdate: number | null;
  cacheHits: number;
  apiCalls: number;
}

// Cache exchange rates stats for 1 week
const getExchangeRateStats = unstable_cache(
  async () => {
    const defaultStats: ExchangeRateStats = {
      lastWeekFetches: [],
      totalFetches: 0,
      lastUpdate: null,
      cacheHits: 0,
      apiCalls: 0
    };
    return defaultStats;
  },
  ['exchange-rate-stats'],
  {
    revalidate: 604800, // 1 week in seconds
    tags: ['exchange-rate-stats']
  }
);

// Update exchange rate stats
const updateStats = unstable_cache(
  async (source: 'cache' | 'api') => {
    const stats = await getExchangeRateStats();
    const now = Date.now();
    
    // Update stats
    stats.totalFetches++;
    stats.lastUpdate = now;
    if (source === 'cache') {
      stats.cacheHits++;
    } else {
      stats.apiCalls++;
    }

    // Add to weekly fetches and remove old entries
    stats.lastWeekFetches.push({ timestamp: now, source });
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    stats.lastWeekFetches = stats.lastWeekFetches.filter(fetch => fetch.timestamp > weekAgo);
  },
  ['exchange-rate-stats-update'],
  {
    revalidate: 0,  // Don't cache updates
    tags: ['exchange-rate-stats']
  }
);

async function handler(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromCurrency = searchParams.get('from');
    const toCurrency = searchParams.get('to');

    if (!fromCurrency || !toCurrency) {
      return NextResponse.json(
        { error: 'Missing required parameters: from and to currencies' },
        { status: 400 }
      );
    }

    // Validate currencies
    if (!isCurrency(fromCurrency) || !isCurrency(toCurrency)) {
      return NextResponse.json(
        { error: 'Invalid currency code. Supported currencies: ' + SUPPORTED_CURRENCIES.join(', ') },
        { status: 400 }
      );
    }

    const rateData = await getExchangeRate(fromCurrency, toCurrency);
    
    // Log the response for debugging
    console.log('Exchange rate response:', {
      from: fromCurrency,
      to: toCurrency,
      ...rateData
    });
    
    // Update stats based on the data source
    await updateStats(rateData.source === 'api' ? 'api' : 'cache');
    
    return NextResponse.json(rateData);
  } catch (error) {
    console.error('Error in exchange rate handler:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch exchange rate' },
      { status: 500 }
    );
  }
}

export const GET = withApiTracking('/api/exchange-rates', handler);
