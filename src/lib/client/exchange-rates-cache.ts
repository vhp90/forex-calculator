import { Currency, ExchangeRateAPIResponse } from '../api/types';
import { FALLBACK_RATES } from '../api/types';

const CACHE_KEY = 'forex_exchange_rates';
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

interface CachedData {
  timestamp: number;
  data: ExchangeRateAPIResponse;
}

function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

function getCachedData(): CachedData | null {
  if (!isStorageAvailable()) return null;
  
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const parsed = JSON.parse(cached) as unknown;
    if (!parsed || typeof parsed !== 'object' || !('timestamp' in parsed) || !('data' in parsed)) {
      return null;
    }
    
    const parsedCache = parsed as CachedData;
    const now = Date.now();
    
    // If cache is expired, return null
    if (now - parsedCache.timestamp >= CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return parsedCache;
  } catch (e) {
    // If there's any error reading cache, clear it
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {} // Ignore errors in removal
    return null;
  }
}

function setCachedData(data: ExchangeRateAPIResponse): void {
  if (!isStorageAvailable()) return;
  
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  } catch (e) {
    // If storage is full, try to clear old items
    try {
      localStorage.clear();
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        data
      }));
    } catch {} // Ignore if still fails
  }
}

export async function getClientExchangeRates(): Promise<ExchangeRateAPIResponse> {
  // Try to get from memory cache first
  const cached = getCachedData();
  if (cached?.data) {
    return cached.data;
  }

  // If no cache or expired, fetch from API
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const responseData = await response.json() as ExchangeRateAPIResponse;
    
    // Store in cache
    setCachedData(responseData);
    
    return responseData;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    
    // If fetch fails and we have cached data (even if expired), use it
    if (cached?.data) {
      return cached.data;
    }
    
    // If all else fails, return fallback rates
    return {
      result: 'error',
      base_code: 'USD',
      rates: FALLBACK_RATES
    };
  }
}

export function calculateCrossRate(
  rates: { [key: string]: number },
  from: Currency,
  to: Currency
): number {
  if (from === to) return 1;
  
  // Direct rate check
  const directPair = `${from}${to}`;
  if (rates[directPair]) return rates[directPair];
  
  // Inverse rate check
  const inversePair = `${to}${from}`;
  if (rates[inversePair]) return 1 / rates[inversePair];
  
  // Calculate via USD as base
  if (rates[`USD${from}`] && rates[`USD${to}`]) {
    return rates[`USD${to}`] / rates[`USD${from}`];
  }
  
  // Fallback to USD path
  if (from === 'USD') return rates[to] || 1;
  if (to === 'USD') return 1 / (rates[from] || 1);
  
  // Final fallback
  return (rates[to] || 1) / (rates[from] || 1);
}

export function calculatePipValue(
  lotSize: number,
  rate: number,
  accountCurrency: Currency,
  baseCurrency: Currency,
  quoteCurrency: Currency,
  rates: { [key: string]: number }
): number {
  const pipSize = quoteCurrency === 'JPY' ? 0.01 : 0.0001;
  const standardLot = 100000;
  const positionSize = lotSize * standardLot;
  
  let pipValue = (pipSize * positionSize) / rate;
  
  // Convert pip value to account currency if needed
  if (accountCurrency !== quoteCurrency) {
    const conversionRate = calculateCrossRate(rates, quoteCurrency, accountCurrency);
    pipValue *= conversionRate;
  }
  
  return pipValue;
}
