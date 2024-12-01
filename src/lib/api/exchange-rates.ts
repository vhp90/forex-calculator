import { ExchangeRateAPIResponse, CachedExchangeRates, Currency } from './types';

// Exchange Rate API integration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const BASE_CURRENCY = 'USD' as Currency;

export const FALLBACK_RATES: Record<Currency, number> = {
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.50,
  CHF: 0.89,
  AUD: 1.54,
  CAD: 1.36,
  NZD: 1.67,
  USD: 1.00
};

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchExchangeRates(retryCount = 0): Promise<ExchangeRateAPIResponse> {
  if (!API_KEY) {
    throw new Error('Exchange rate API key not configured');
  }

  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${BASE_CURRENCY}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        next: {
          revalidate: 43200 // 12 hours
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);

    // Retry logic for transient errors
    if (retryCount < MAX_RETRIES) {
      await delay(RETRY_DELAY * (retryCount + 1));
      return fetchExchangeRates(retryCount + 1);
    }

    throw error;
  }
}
