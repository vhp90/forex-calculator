import { unstable_cache } from 'next/cache';
import { Currency, ExchangeRateAPIResponse, ExchangeRateResponse, FALLBACK_RATES } from './types';
import { logError } from '../analytics-store';

const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const CACHE_TAG = 'exchange-rates';
const CACHE_DURATION = 5 * 60; // 5 minutes

async function fetchExchangeRates(base: Currency): Promise<ExchangeRateAPIResponse> {
  if (!EXCHANGE_RATE_API_KEY) {
    throw new Error('Exchange rate API key not configured');
  }

  const url = `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/latest/${base}`;
  
  try {
    const response = await fetch(url, { next: { tags: [CACHE_TAG] } });
    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    logError('exchange-rates-api', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

export async function getExchangeRate(from: Currency, to: Currency): Promise<ExchangeRateResponse> {
  const getCachedRate = unstable_cache(
    async () => {
      try {
        const data = await fetchExchangeRates(from);
        const rate = data.rates[to];
        
        if (!rate) {
          throw new Error(`Rate not found for ${from}/${to}`);
        }

        return {
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
        // Calculate cross rate using fallback rates
        const fallbackRate = FALLBACK_RATES[to] / FALLBACK_RATES[from];
        
        return {
          rate: fallbackRate,
          spread: fallbackRate * 0.0002,
          volatility: fallbackRate * 0.001,
          dailyRange: {
            high: fallbackRate * 1.002,
            low: fallbackRate * 0.998,
          }
        };
      }
    },
    [`exchange-rate-${from}-${to}`],
    {
      revalidate: CACHE_DURATION,
      tags: [CACHE_TAG]
    }
  );

  return getCachedRate();
}

export { fetchExchangeRates };
