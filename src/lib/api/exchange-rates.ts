import { unstable_cache } from 'next/cache';
import { Currency, ExchangeRateAPIResponse, ExchangeRateResponse, FALLBACK_RATES } from './types';
import { logError } from '../analytics-store';

const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const CACHE_TAG = 'exchange-rates';
const CACHE_DURATION = 5 * 60; // 5 minutes
const BASE_URL = 'https://v6.exchangerate-api.com/v6';

async function fetchExchangeRates(base: Currency): Promise<ExchangeRateAPIResponse> {
  if (!EXCHANGE_RATE_API_KEY) {
    throw new Error('Exchange rate API key not configured');
  }

  const url = `${BASE_URL}/${EXCHANGE_RATE_API_KEY}/latest/${base}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'force-cache'
    });

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

        const response: ExchangeRateResponse = {
          source: 'api',
          rate,
          spread: rate * 0.0002, // 0.02% spread
          volatility: rate * 0.001, // 0.1% volatility
          dailyRange: {
            high: rate * 1.002, // 0.2% above current rate
            low: rate * 0.998, // 0.2% below current rate
          }
        };
        return response;
      } catch (error) {
        console.warn('Using fallback rates:', error);
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
    },
    [`exchange-rate-${from}-${to}`],
    {
      revalidate: CACHE_DURATION,
      tags: [CACHE_TAG]
    }
  );

  return getCachedRate();
}

export async function getExchangeRateDirect(
  fromCurrency: string,
  toCurrency: string
): Promise<ExchangeRateResponse> {
  if (!EXCHANGE_RATE_API_KEY) {
    throw new Error('Exchange rate API key not configured');
  }

  try {
    const response = await fetch(
      `${BASE_URL}/${EXCHANGE_RATE_API_KEY}/pair/${fromCurrency}/${toCurrency}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'force-cache'
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rate: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      rate: data.conversion_rate,
      source: 'api',
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    throw error;
  }
}

export { fetchExchangeRates };
