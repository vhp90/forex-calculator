import { useExchangeRates } from '@/hooks/useExchangeRates';
import { CURRENCY_PAIRS } from '@/lib/api/types';

export default function ExchangeRatesDisplay() {
  const { rates, isLoading, error, lastUpdated, nextUpdate } = useExchangeRates();

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
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const hasRates = Object.keys(rates).length > 0;

  if (!hasRates) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-600">No exchange rates available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-sm text-gray-500">
        {lastUpdated && (
          <div>
            Last updated: {lastUpdated.toLocaleString()}
          </div>
        )}
        {nextUpdate && (
          <div>
            Next update: {nextUpdate.toLocaleString()}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {CURRENCY_PAIRS.map(pair => {
          const rate = rates[pair];
          return (
            <div
              key={pair}
              className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-sm font-medium text-gray-500">{pair}</div>
              <div className="text-lg font-semibold text-gray-900">
                {typeof rate === 'number' 
                  ? rate.toFixed(6)
                  : <span className="text-red-500">N/A</span>
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
