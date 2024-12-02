// Using exchangerate-api.com for real-time forex data
import { Currency, ExchangeRateResponse, FALLBACK_RATES } from './api/types';
import { unstable_cache } from 'next/cache';

const CACHE_TAG = 'market-data';
const CACHE_DURATION = 60; // 1 minute cache

export async function getMarketData(base: Currency, quote: Currency): Promise<ExchangeRateResponse> {
  const getMarketDataFromCache = unstable_cache(
    async () => {
      const response = await fetch(`/api/exchange-rates?from=${base}&to=${quote}`);
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      const data = await response.json();
      const rate = data.rates[quote];
      
      const marketData: ExchangeRateResponse = {
        rate,
        source: 'api',
        spread: rate * 0.0002, // 0.02% spread
        volatility: rate * 0.001, // 0.1% volatility
        dailyRange: {
          high: rate * 1.002, // 0.2% above current rate
          low: rate * 0.998, // 0.2% below current rate,
        }
      };

      return marketData;
    },
    [`market-data-${base}-${quote}`],
    {
      revalidate: CACHE_DURATION,
      tags: [CACHE_TAG]
    }
  );

  try {
    return await getMarketDataFromCache();
  } catch (error) {
    console.warn('Using fallback rates for market data:', error);
    const fallbackRate = FALLBACK_RATES[quote] / FALLBACK_RATES[base];
    
    const marketData: ExchangeRateResponse = {
      rate: fallbackRate,
      source: 'fallback',
      spread: fallbackRate * 0.0002,
      volatility: fallbackRate * 0.001,
      dailyRange: {
        high: fallbackRate * 1.002,
        low: fallbackRate * 0.998,
      }
    };

    return marketData;
  }
}
