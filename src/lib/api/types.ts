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

// Generate all possible currency pairs
export const CURRENCY_PAIRS = SUPPORTED_CURRENCIES.flatMap(
  (base) => SUPPORTED_CURRENCIES
    .filter(quote => base !== quote)
    .map(quote => `${base}/${quote}`)
);

export type CurrencyPair = typeof CURRENCY_PAIRS[number];

// Type guard to check if a string is a valid currency pair
export function isCurrencyPair(pair: string): pair is CurrencyPair {
  return CURRENCY_PAIRS.includes(pair as CurrencyPair);
}

// Helper function to split currency pair
export function splitCurrencyPair(pair: CurrencyPair): [Currency, Currency] {
  const [base, quote] = pair.split('/') as [Currency, Currency];
  return [base, quote];
}
