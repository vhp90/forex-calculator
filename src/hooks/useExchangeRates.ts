import { useState, useEffect } from 'react';
import { CachedExchangeRates, Currency, FALLBACK_RATES } from '@/lib/api/types';
import { getExchangeRates } from '@/lib/client/performance-cache';

interface UseExchangeRatesResult {
  rates: Record<Currency, number>;
  isLoading: boolean;
  error: Error | null;
  nextUpdate: Date | null;
  timeUntilUpdate: number | null;
  refresh: () => Promise<void>;
}

export function useExchangeRates(): UseExchangeRatesResult {
  const [rates, setRates] = useState<Record<Currency, number>>(FALLBACK_RATES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [nextUpdate, setNextUpdate] = useState<Date | null>(null);

  async function fetchRates() {
    try {
      setIsLoading(true);
      const data = await getExchangeRates();
      setRates(data.rates as Record<Currency, number>);
      // Set next update to 12 hours from now
      setNextUpdate(new Date(Date.now() + 12 * 60 * 60 * 1000));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      // Keep the previous rates on error
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchRates();
    
    // Set up polling based on next update time
    const checkInterval = setInterval(() => {
      if (nextUpdate && Date.now() >= nextUpdate.getTime()) {
        fetchRates();
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [nextUpdate]);

  // Calculate time until next update
  const timeUntilUpdate = nextUpdate ? nextUpdate.getTime() - Date.now() : null;

  return {
    rates,
    isLoading,
    error,
    nextUpdate,
    timeUntilUpdate,
    refresh: fetchRates
  };
}

export { FALLBACK_RATES };
