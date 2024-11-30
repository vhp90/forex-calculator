interface ExchangeRates {
  conversion_rates?: Record<string, number>;
  result?: string;
  'error-type'?: string;
}

interface CacheResult {
  success: boolean;
  timestamp: number;
  rates: Record<string, number>;
}

// Exchange Rate API integration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const BASE_CURRENCY = 'USD';

export const FALLBACK_RATES: Record<string, number> = {
  'EUR': 0.92,
  'GBP': 0.79,
  'JPY': 149.50,
  'CHF': 0.89,
  'AUD': 1.54,
  'CAD': 1.36,
  'NZD': 1.67,
  'USD': 1.00
};

// Cache for storing the last fetch time
let lastFetchTime = 0;
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchExchangeRates(retryCount = 0): Promise<ExchangeRates> {
  if (!API_KEY) {
    throw new Error('Exchange rate API key not configured');
  }

  // Check if we need to refresh the cache
  const now = Date.now();
  if (now - lastFetchTime < CACHE_DURATION) {
    // Return from Next.js cache if within cache duration
    const response = await fetch('/api/exchange-rates');
    return response.json();
  }

  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${BASE_CURRENCY}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      if (response.status === 429 && retryCount < MAX_RETRIES) {
        // Rate limit hit, retry after delay
        await delay(RETRY_DELAY * (retryCount + 1));
        return fetchExchangeRates(retryCount + 1);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    lastFetchTime = now;
    return data;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw error;
  }
}

// Function to update rates cache
export async function updateRatesCache(): Promise<CacheResult> {
  try {
    const data = await fetchExchangeRates();
    lastFetchTime = Date.now();
    return {
      success: true,
      timestamp: lastFetchTime,
      rates: data.conversion_rates || FALLBACK_RATES
    };
  } catch (error) {
    console.error('Error updating rates cache:', error);
    throw error;
  }
}

// Function to start background refresh
export function startBackgroundRefresh(): void {
  // Initial fetch
  updateRatesCache().catch(console.error);

  // Set up periodic refresh
  setInterval(() => {
    updateRatesCache().catch(console.error);
  }, CACHE_DURATION);
}

// Initialize background refresh if we're on the client side
if (typeof window !== 'undefined') {
  startBackgroundRefresh();
}
