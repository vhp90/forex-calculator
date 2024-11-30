import { useState, useEffect } from 'react';
import { CachedExchangeRates } from '@/lib/api/types';

interface UseExchangeRatesResult {
  rates: { [key: string]: number } | null;
  isLoading: boolean;
  error: Error | null;
  nextUpdate: Date | null;
  timeUntilUpdate: number | null;
  refresh: () => void;
}

export function useExchangeRates(): UseExchangeRatesResult {
  const [rates, setRates] = useState<{ [key: string]: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [nextUpdate, setNextUpdate] = useState<Date | null>(null);

  async function fetchRates() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/exchange-rates');
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      const data: CachedExchangeRates = await response.json();
      setRates(data.rates);
      setNextUpdate(new Date(data.expiresAt));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchRates();

    // Set up polling for updates
    const pollInterval = setInterval(() => {
      fetchRates();
    }, 5 * 60 * 1000); // Poll every 5 minutes

    return () => clearInterval(pollInterval);
  }, []);

  // Calculate time until next update
  const timeUntilUpdate = nextUpdate ? nextUpdate.getTime() - Date.now() : null;

  return {
    rates: rates || {},
    isLoading,
    error,
    nextUpdate,
    timeUntilUpdate,
    refresh: fetchRates
  };
}
