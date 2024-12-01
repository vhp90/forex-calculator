// Using our exchange rates API for real-time forex data
import { Currency, CURRENCY_PAIRS } from './api/types';

interface MarketData {
  rate: number;
  spread: number;
  volatility: number;
  dailyRange: {
    high: number;
    low: number;
  };
}

// Cache for market data calculations
const marketDataCache = new Map<string, { data: MarketData; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute cache for calculations

async function getExchangeRates(): Promise<{ [key: string]: number }> {
  try {
    const response = await fetch('/api/exchange-rates', {
      next: {
        tags: ['exchange-rates']
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }
    
    const data = await response.json();
    return data.rates || {};
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return {};
  }
}

export async function getMarketData(base: Currency, quote: Currency): Promise<MarketData> {
  const cacheKey = `${base}/${quote}`;

  // Validate currency pair
  const isValidPair = CURRENCY_PAIRS.some(pair => pair.from === base && pair.to === quote);
  if (!isValidPair) {
    throw new Error('Invalid currency pair');
  }

  // Check calculation cache
  const cached = marketDataCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // Fetch new data
  try {
    const rates = await getExchangeRates();
    const rate = rates[quote] || 1;
    
    // Calculate market data
    const spread = rate * 0.0002; // Typical spread is 2 pips
    const volatility = rate * 0.001; // Simplified volatility calculation
    const dailyRange = {
      high: rate * 1.002, // Simplified daily high
      low: rate * 0.998,  // Simplified daily low
    };

    const marketData: MarketData = {
      rate,
      spread,
      volatility,
      dailyRange,
    };

    // Update calculation cache
    marketDataCache.set(cacheKey, {
      data: marketData,
      timestamp: now,
    });

    return marketData;
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw new Error('Failed to fetch market data');
  }
}
