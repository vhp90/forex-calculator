export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'CHF' | 'NZD';

export interface ExchangeRateAPIResponse {
  success: boolean;
  rates: { [key in Currency]?: number };
  base: Currency;
  timestamp: number;
}

export interface ExchangeRateResponse {
  rate: number;
  spread: number;
  volatility: number;
  dailyRange: {
    high: number;
    low: number;
  };
}

export interface CachedExchangeRates {
  timestamp: number;
  expiresAt: number;
  rates: {
    [key: string]: number;
  };
}

// Define all supported currencies
export const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'CHF', 'CAD', 'JPY', 'AUD', 'NZD'
] as const;

export const FALLBACK_RATES: { [key in Currency]: number } = {
  'USD': 1.0000,
  'EUR': 0.9090,
  'GBP': 0.8000,
  'JPY': 110.00,
  'AUD': 1.3300,
  'CAD': 1.2500,
  'CHF': 0.9000,
  'NZD': 1.4300
};

// Type guard to check if a string is a valid currency
export function isCurrency(currency: string): currency is Currency {
  return SUPPORTED_CURRENCIES.includes(currency as Currency);
}

// Helper function to validate currency pair
export function isValidCurrencyPair(from: string, to: string): boolean {
  return isCurrency(from) && isCurrency(to) && from !== to;
}

// Generate all possible currency pairs
export const CURRENCY_PAIRS: { from: Currency; to: Currency }[] = SUPPORTED_CURRENCIES.flatMap(
  (from) => SUPPORTED_CURRENCIES
    .filter(to => from !== to)
    .map(to => ({ from, to }))
);
