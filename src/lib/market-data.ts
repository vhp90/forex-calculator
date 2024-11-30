// Using our exchange rates API for real-time forex data
import { CurrencyPair } from './api/types';

interface MarketData {
  rate: number;
  spread: number;
  volatility: number;
  dailyRange: {
    high: number;
    low: number;
  };
}

// Cache for market data
const marketDataCache: { [key: string]: { data: MarketData; timestamp: number } } = {};
const CACHE_DURATION = 60000; // 1 minute cache

async function getExchangeRates(): Promise<{ [key: string]: number }> {
  try {
    const response = await fetch('/api/exchange-rates');
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

export async function getMarketData(currencyPairOrBase: string, quoteCurrency?: string): Promise<MarketData> {
  // Handle both formats: "EUR/USD" or separate "EUR", "USD"
  let cacheKey: CurrencyPair;
  if (quoteCurrency) {
    cacheKey = `${currencyPairOrBase}/${quoteCurrency}` as CurrencyPair;
  } else {
    cacheKey = currencyPairOrBase as CurrencyPair;
  }

  const now = Date.now();
  
  // Check cache first
  if (marketDataCache[cacheKey] && now - marketDataCache[cacheKey].timestamp < CACHE_DURATION) {
    return marketDataCache[cacheKey].data;
  }

  try {
    // Get exchange rates from our API
    const rates = await getExchangeRates();
    
    // Split the currency pair if needed
    let [baseCurrency, toCurrency] = quoteCurrency ? 
      [currencyPairOrBase, quoteCurrency] : 
      cacheKey.split('/');

    // Calculate the rate
    let rate = 1;
    if (baseCurrency === 'USD') {
      rate = rates[toCurrency] || 1;
    } else if (toCurrency === 'USD') {
      rate = 1 / (rates[baseCurrency] || 1);
    } else {
      // Cross rate calculation
      const baseRate = rates[baseCurrency] || 1;
      const quoteRate = rates[toCurrency] || 1;
      rate = quoteRate / baseRate;
    }

    // Calculate spread and volatility based on the rate
    const spread = rate * 0.0002; // Typical spread is 0.02% of rate
    const volatility = rate * 0.001; // Estimated daily volatility

    const marketData: MarketData = {
      rate,
      spread,
      volatility,
      dailyRange: {
        high: rate * (1 + volatility),
        low: rate * (1 - volatility)
      }
    };

    // Cache the result
    marketDataCache[cacheKey] = {
      data: marketData,
      timestamp: now
    };

    return marketData;
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw error;
  }
}
