import { Currency, ExchangeRateAPIResponse } from '../api/types';
import { FALLBACK_RATES } from '../api/types';

// In-memory cache for ultra-fast access
const memoryCache = new Map<string, {
  data: ExchangeRateAPIResponse;
  timestamp: number;
}>();

const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours
const MEMORY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Check if storage is available without side effects
const isStorageAvailable = (() => {
  try {
    const test = '__storage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
})();

// Use a small chunk of memory for quick calculations
const calculationCache = new Map<string, number>();

export function clearCalculationCache(): void {
  calculationCache.clear();
}

// Efficient cross rate calculation with memoization
export function getExchangeRate(
  rates: { [key: string]: number },
  from: Currency,
  to: Currency
): number {
  const cacheKey = `${from}-${to}`;
  
  if (calculationCache.has(cacheKey)) {
    return calculationCache.get(cacheKey)!;
  }

  let rate: number;
  if (from === to) {
    rate = 1;
  } else if (from === 'USD') {
    rate = rates[to];
  } else if (to === 'USD') {
    rate = 1 / rates[from];
  } else {
    rate = rates[to] / rates[from];
  }

  calculationCache.set(cacheKey, rate);
  return rate;
}

// Efficient data retrieval with multi-level caching
export async function getExchangeRates(): Promise<ExchangeRateAPIResponse> {
  const now = Date.now();
  
  // Check memory cache first (fastest)
  const memoryCached = memoryCache.get('rates');
  if (memoryCached && (now - memoryCached.timestamp < MEMORY_CACHE_DURATION)) {
    return memoryCached.data;
  }

  // Try localStorage next (still fast)
  if (isStorageAvailable) {
    try {
      const stored = localStorage.getItem('forex_rates');
      if (stored) {
        const { data, timestamp } = JSON.parse(stored);
        if (now - timestamp < CACHE_DURATION) {
          // Update memory cache
          memoryCache.set('rates', { data, timestamp });
          return data;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  // Fetch fresh data if needed
  try {
    const response = await fetch('/api/exchange-rates', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch rates');
    }

    const data = await response.json();
    const timestamp = now;

    // Update both caches
    memoryCache.set('rates', { data, timestamp });
    
    if (isStorageAvailable) {
      try {
        localStorage.setItem('forex_rates', JSON.stringify({ data, timestamp }));
      } catch {
        // If storage is full, clear it and try again
        localStorage.clear();
        try {
          localStorage.setItem('forex_rates', JSON.stringify({ data, timestamp }));
        } catch {
          // Ignore if still fails
        }
      }
    }

    return data;
  } catch (error) {
    // Return fallback data if everything fails
    const fallbackData: ExchangeRateAPIResponse = {
      result: 'success',
      base_code: 'USD',
      rates: FALLBACK_RATES
    };

    return fallbackData;
  }
}

// Clear old calculation cache every 5 minutes
setInterval(clearCalculationCache, 5 * 60 * 1000);
