// Using exchangerate-api.com for real-time forex data
import { Currency, ExchangeRateResponse, FALLBACK_RATES } from './api/types';

// Cache for market data calculations
const marketDataCache = new Map<string, { data: ExchangeRateResponse; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute cache

export async function getMarketData(base: Currency, quote: Currency): Promise<ExchangeRateResponse> {
  const cacheKey = `${base}/${quote}`;
  
  // Check cache first
  const cached = marketDataCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const response = await fetch(`/api/exchange-rates?from=${base}&to=${quote}`);
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }
    const data = await response.json();
    const rate = data.rates[quote];
    
    const marketData: ExchangeRateResponse = {
      rate,
      spread: rate * 0.0002, // 0.02% spread
      volatility: rate * 0.001, // 0.1% volatility
      dailyRange: {
        high: rate * 1.002, // 0.2% above current rate
        low: rate * 0.998, // 0.2% below current rate,
      }
    };

    // Update cache
    marketDataCache.set(cacheKey, {
      data: marketData,
      timestamp: Date.now()
    });

    return marketData;
  } catch (error) {
    console.warn('Using fallback rates for market data:', error);
    const fallbackRate = FALLBACK_RATES[quote] / FALLBACK_RATES[base];
    
    const marketData: ExchangeRateResponse = {
      rate: fallbackRate,
      spread: fallbackRate * 0.0002,
      volatility: fallbackRate * 0.001,
      dailyRange: {
        high: fallbackRate * 1.002,
        low: fallbackRate * 0.998,
      }
    };

    // Update cache
    marketDataCache.set(cacheKey, {
      data: marketData,
      timestamp: Date.now()
    });

    return marketData;
  }
}
