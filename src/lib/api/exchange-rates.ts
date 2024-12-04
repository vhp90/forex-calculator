import { unstable_cache } from 'next/cache';
import { Currency, ExchangeRateAPIResponse, ExchangeRateResponse, FALLBACK_RATES } from './types';
import { logError } from '../analytics-store';

const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const CACHE_TAG = 'exchange-rates';
const CACHE_DURATION = 12 * 60 * 60; // 12 hours in seconds
const BASE_URL = 'https://v6.exchangerate-api.com/v6';

// Fetch and cache USD rates for 12 hours
const getUSDRates = unstable_cache(
  async (): Promise<ExchangeRateAPIResponse> => {
    if (!EXCHANGE_RATE_API_KEY) {
      throw new Error('Exchange rate API key not configured');
    }

    const url = `${BASE_URL}/${EXCHANGE_RATE_API_KEY}/latest/USD`;

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Exchange rate API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      logError('exchange-rates-api', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  },
  ['usd-rates'],
  {
    revalidate: CACHE_DURATION,
    tags: [CACHE_TAG]
  }
);

// Calculate cross rate using USD as base
function calculateCrossRate(usdRates: { [key: string]: number }, from: Currency, to: Currency): number {
  const fromRate = usdRates[from];
  const toRate = usdRates[to];

  if (!fromRate || !toRate) {
    throw new Error(`Rate not found for ${from} or ${to}`);
  }

  // If USD is involved, return direct rate
  if (from === 'USD') return toRate;
  if (to === 'USD') return 1 / fromRate;

  // Calculate cross rate through USD
  return toRate / fromRate;
}

export async function getExchangeRate(from: Currency, to: Currency): Promise<ExchangeRateResponse> {
  try {
    const usdRates = await getUSDRates();
    const rate = calculateCrossRate(usdRates.rates, from, to);

    return {
      source: 'api',
      rate,
      spread: rate * 0.0002, // 0.02% spread
      volatility: rate * 0.001, // 0.1% volatility
      dailyRange: {
        high: rate * 1.002, // 0.2% above current rate
        low: rate * 0.998, // 0.2% below current rate
      }
    };
  } catch (error) {
    console.warn('Using fallback rates:', error);
    // Use fallback rates
    const fromRate = FALLBACK_RATES[from];
    const toRate = FALLBACK_RATES[to];

    if (fromRate === undefined || toRate === undefined) {
      throw new Error(`Fallback rate not found for ${from} or ${to}`);
    }

    const fallbackRate = toRate / fromRate;
    return {
      source: 'fallback',
      rate: fallbackRate,
      spread: fallbackRate * 0.0002,
      volatility: fallbackRate * 0.001,
      dailyRange: {
        high: fallbackRate * 1.002,
        low: fallbackRate * 0.998,
      }
    };
  }
}

// Export for direct API access to USD rates
export const fetchExchangeRates = getUSDRates;
