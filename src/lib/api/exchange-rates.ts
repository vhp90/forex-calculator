import { unstable_cache } from 'next/cache';
import { Currency, ExchangeRateAPIResponse, ExchangeRateResponse, FALLBACK_RATES, SUPPORTED_CURRENCIES } from './types';
import { logError } from '../analytics-store';

const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const CACHE_TAG = 'exchange-rates';
const CACHE_DURATION = 12 * 60 * 60; // 12 hours in seconds
const BASE_URL = 'https://v6.exchangerate-api.com/v6';
const BASE_CURRENCY: Currency = 'USD';

// Fetch and cache USD rates every 12 hours
const getUSDRates = unstable_cache(
  async () => {
    if (!EXCHANGE_RATE_API_KEY) {
      console.error('API key missing');
      throw new Error('Exchange rate API key not configured');
    }

    const url = `${BASE_URL}/${EXCHANGE_RATE_API_KEY}/latest/${BASE_CURRENCY}`;
    console.log('Fetching fresh USD rates from API');

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'  // Disable fetch cache as we're using Next.js cache
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response not ok:', response.status, errorText);
        throw new Error(`Exchange rate API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.result !== 'success') {
        console.error('API returned error:', data);
        throw new Error(`Exchange rate API returned error: ${data.error || 'Unknown error'}`);
      }

      console.log('Successfully fetched and cached USD rates');
      return {
        timestamp: Date.now(),
        data
      };
    } catch (error) {
      console.error('API error:', error);
      logError('exchange-rates-api', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  },
  ['usd-rates'],  // Cache key
  {
    revalidate: CACHE_DURATION,  // Cache for 12 hours
    tags: [CACHE_TAG]
  }
);

// Calculate cross rates using USD as base
function calculateCrossRate(usdRates: Record<string, number>, from: Currency, to: Currency): number {
  if (from === 'USD') {
    return usdRates[to];
  }
  if (to === 'USD') {
    return 1 / usdRates[from];
  }
  // Calculate cross rate: from -> USD -> to
  return usdRates[to] / usdRates[from];
}

export async function getExchangeRate(from: Currency, to: Currency): Promise<ExchangeRateResponse> {
  try {
    const { data: usdRates, timestamp } = await getUSDRates();
    const rate = calculateCrossRate(usdRates.rates, from, to);

    if (!rate || !isFinite(rate)) {
      throw new Error(`Could not calculate rate for ${from}/${to}`);
    }

    const response: ExchangeRateResponse = {
      source: 'api',
      rate,
      spread: rate * 0.0002, // 0.02% spread
      volatility: rate * 0.001, // 0.1% volatility
      dailyRange: {
        high: rate * 1.002, // 0.2% above current rate
        low: rate * 0.998, // 0.2% below current rate
      },
      timestamp
    };
    return response;
  } catch (error) {
    console.warn('Error fetching live rates:', error);
    console.warn('Falling back to static rates');
    
    // Use fallback rates and ensure both currencies exist
    const fromRate = FALLBACK_RATES[from];
    const toRate = FALLBACK_RATES[to];

    if (fromRate === undefined || toRate === undefined) {
      throw new Error(`Fallback rate not found for ${from} or ${to}`);
    }

    const fallbackRate = toRate / fromRate;
    const response: ExchangeRateResponse = {
      source: 'fallback',
      rate: fallbackRate,
      spread: fallbackRate * 0.0002,
      volatility: fallbackRate * 0.001,
      dailyRange: {
        high: fallbackRate * 1.002,
        low: fallbackRate * 0.998,
      }
    };
    return response;
  }
}

// Type guard to check if a string is a valid currency
export function isCurrency(currency: string): currency is Currency {
  return SUPPORTED_CURRENCIES.includes(currency as Currency);
}

// Initialize cache on startup
getUSDRates().catch(error => {
  console.error('Failed to initialize USD rates cache:', error);
});

export async function fetchExchangeRates(base: Currency): Promise<ExchangeRateAPIResponse> {
  const result = await getUSDRates();
  return result.data;
}
