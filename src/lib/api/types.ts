export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'CAD', 'JPY', 'AUD', 'NZD'] as const;
export type Currency = typeof SUPPORTED_CURRENCIES[number];

export interface ExchangeRateAPIResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
}

export interface ExchangeRateResponse {
  rate: number;
  source: 'api' | 'fallback' | 'cache';
  spread?: number;
  volatility?: number;
  dailyRange?: {
    high: number;
    low: number;
  };
  timestamp?: number;
}

export interface CachedExchangeRates {
  timestamp: number;
  expiresAt: number;
  rates: {
    [key: string]: number;
  };
}

export const FALLBACK_RATES: Record<Currency, number> = {
  'USD': 1.0000,
  'EUR': 0.9090,
  'GBP': 0.8000,
  'CHF': 0.9500,
  'CAD': 1.3500,
  'JPY': 110.00,
  'AUD': 1.5000,
  'NZD': 1.6000,
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
export const CURRENCY_PAIRS = SUPPORTED_CURRENCIES.flatMap(
  (from) => SUPPORTED_CURRENCIES
    .filter(to => from !== to)
    .map(to => ({ from, to }))
);
