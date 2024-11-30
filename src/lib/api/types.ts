export interface ExchangeRateAPIResponse {
  result: string;
  base_code: string;
  time_last_update_utc: string;
  conversion_rates: {
    [key: string]: number;
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

export type Currency = typeof SUPPORTED_CURRENCIES[number];

export interface CurrencyPairType {
  from: Currency;
  to: Currency;
}

// Generate all possible currency pairs
export const CURRENCY_PAIRS: CurrencyPairType[] = SUPPORTED_CURRENCIES.flatMap(
  (from) => SUPPORTED_CURRENCIES
    .filter(to => from !== to)
    .map(to => ({ from, to }))
);

// Type guard to check if a string is a valid currency
export function isCurrency(currency: string): currency is Currency {
  return SUPPORTED_CURRENCIES.includes(currency as Currency);
}

// Helper function to validate currency pair
export function isValidCurrencyPair(from: string, to: string): boolean {
  return isCurrency(from) && isCurrency(to) && from !== to;
}
