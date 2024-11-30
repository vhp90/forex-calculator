import { useState, useEffect } from 'react';
import { CachedExchangeRates } from '@/lib/api/types';

interface UseExchangeRatesResult {
  rates: { [key: string]: number } | null;
  loading: boolean;
  error: Error | null;
  nextUpdate: Date | null;
  timeUntilUpdate: number | null;
  refresh: () => void;
}

export function useExchangeRates(): UseExchangeRatesResult {
  const [rates, setRates] = useState<{ [key: string]: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [nextUpdate, setNextUpdate] = useState<Date | null>(null);

  async function fetchRates() {
    try {
      setLoading(true);
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
      setLoading(false);
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
    rates,
    loading,
    error,
    nextUpdate,
    timeUntilUpdate,
    refresh: fetchRates
  };
}
