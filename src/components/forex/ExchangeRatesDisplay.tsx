import { useExchangeRates } from '@/hooks/useExchangeRates';
import { CURRENCY_PAIRS } from '@/lib/api/types';

export default function ExchangeRatesDisplay() {
  const { rates, isLoading, error, nextUpdate } = useExchangeRates();

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse delay-100"></div>
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse delay-200"></div>
        </div>
        <p className="text-center text-gray-600 mt-2">Loading exchange rates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 font-medium">Error loading rates:</p>
        <p className="text-red-500">{error.message}</p>
      </div>
    );
  }

  if (Object.keys(rates).length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-600">No exchange rates available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-sm text-gray-500">
        {nextUpdate && (
          <div>
            Next update: {nextUpdate.toLocaleString()}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CURRENCY_PAIRS.map(({ from, to }) => {
          const rate = rates[to];
          if (!rate) return null;

          return (
            <div
              key={`${from}-${to}`}
              className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-center">
                <div className="text-lg font-semibold">
                  {from}/{to}
                </div>
                <div className="text-xl font-bold text-blue-600">
                  {rate.toFixed(4)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
