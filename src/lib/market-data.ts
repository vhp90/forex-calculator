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

// Fallback rates for common currency pairs
const FALLBACK_RATES: { [key: string]: number } = {
  'EUR/USD': 1.1000,
  'GBP/USD': 1.2500,
  'USD/JPY': 110.00,
  'USD/CHF': 0.9000,
  'AUD/USD': 0.7500,
  'USD/CAD': 1.2500,
  'NZD/USD': 0.7000,
};

async function getExchangeRates(): Promise<{ [key: string]: number }> {
  try {
    const response = await fetch('/api/exchange-rates', {
      next: {
        tags: ['exchange-rates']
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data || !data.rates || typeof data.rates !== 'object') {
      throw new Error('Invalid exchange rates data format');
    }
    
    return data.rates;
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
    throw new Error(`Invalid currency pair: ${base}/${quote}`);
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
    let rate: number;

    // Try to get rate from API response
    if (rates && Object.keys(rates).length > 0) {
      rate = rates[quote] || rates[`${base}${quote}`];
    }

    // If no rate found, try fallback
    if (!rate || !isFinite(rate)) {
      const fallbackKey = `${base}/${quote}`;
      rate = FALLBACK_RATES[fallbackKey];
      
      // If direct fallback not found, try inverse rate
      if (!rate) {
        const inverseKey = `${quote}/${base}`;
        const inverseRate = FALLBACK_RATES[inverseKey];
        if (inverseRate) {
          rate = 1 / inverseRate;
        } else {
          rate = 1.0000; // Default fallback
        }
      }
      
      console.warn(`Using fallback rate for ${base}/${quote}: ${rate}`);
    }
    
    // Calculate market data with safety checks
    const spread = Math.max(rate * 0.0002, 0.0001); // Minimum 0.1 pip spread
    const volatility = Math.max(rate * 0.001, 0.0001); // Minimum volatility
    const dailyRange = {
      high: rate * 1.002,
      low: rate * 0.998,
    };

    const marketData: MarketData = {
      rate,
      spread,
      volatility,
      dailyRange,
    };

    // Validate market data before caching
    if (!isFinite(rate) || !isFinite(spread) || !isFinite(volatility)) {
      throw new Error('Invalid market data calculations');
    }

    // Update calculation cache
    marketDataCache.set(cacheKey, {
      data: marketData,
      timestamp: now,
    });

    return marketData;
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw error;
  }
}
