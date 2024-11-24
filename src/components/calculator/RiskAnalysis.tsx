'use client'

interface RiskAnalysisProps {
  riskRating: 'Low' | 'Medium' | 'High' | 'Very High'
  riskScore: number
  suggestions: string[]
  maxRecommendedLeverage: number
}

export default function RiskAnalysis({
  riskRating,
  riskScore,
  suggestions,
  maxRecommendedLeverage
}: RiskAnalysisProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  }

  const getRiskColor = (rating: 'Low' | 'Medium' | 'High' | 'Very High') => {
    switch (rating) {
      case 'Low':
        return 'text-green-400';
      case 'Medium':
        return 'text-yellow-400';
      case 'High':
        return 'text-orange-400';
      case 'Very High':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  }

  return (
    <div className="relative mt-6 sm:mt-8 p-4 sm:p-6 glass-card rounded-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 pointer-events-none" />
      
      <h2 className="relative text-xl sm:text-2xl font-bold text-purple-400 mb-4 sm:mb-6 flex items-center gap-2">
        <span className="inline-block w-1.5 sm:w-2 h-6 sm:h-8 bg-purple-500 rounded-full" />
        Risk Analysis
      </h2>

      <div className="relative grid grid-cols-1 gap-4 sm:gap-6">
        <div className="space-y-1 p-3 sm:p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors">
          <label className="text-sm font-medium text-gray-400">Risk Rating</label>
          <p className={`text-xl sm:text-2xl font-bold break-words ${getRiskColor(riskRating)}`}>
            {riskRating}
          </p>
          <div className="mt-2 w-full bg-gray-700 rounded-full h-1.5 sm:h-2">
            <div
              className={`h-1.5 sm:h-2 rounded-full ${getRiskColor(riskRating)}`}
              style={{ width: `${riskScore}%` }}
            />
          </div>
        </div>

        <div className="space-y-1 p-3 sm:p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors">
          <label className="text-sm font-medium text-gray-400">Maximum Recommended Leverage</label>
          <p className="text-xl sm:text-2xl font-bold text-white break-words">
            {maxRecommendedLeverage}:1
          </p>
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-1 p-3 sm:p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors">
            <label className="text-sm font-medium text-gray-400">Suggestions</label>
            <ul className="mt-2 space-y-2">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2"
                >
                  <span className="flex-shrink-0 h-4 sm:h-5 w-4 sm:w-5 text-purple-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="text-xs sm:text-sm text-gray-400">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="relative mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
        <div className="flex items-start gap-2 sm:gap-3">
          <span className="text-purple-400 text-lg sm:text-xl flex-shrink-0">⚠️</span>
          <p className="text-xs sm:text-sm text-purple-300 break-words">
            Consider adjusting your position size or stop loss if the risk level is too high.
          </p>
        </div>
      </div>
    </div>
  )
}
