import React from 'react';

interface RiskAnalysisProps {
  riskRating: 'Low' | 'Medium' | 'High' | 'Very High';
  riskScore: number;
  suggestions: string[];
  maxRecommendedLeverage: number;
}

const RiskAnalysis: React.FC<RiskAnalysisProps> = ({
  riskRating,
  riskScore,
  suggestions,
  maxRecommendedLeverage,
}) => {
  const getRiskColor = (rating: string) => {
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
  };

  const getRiskBgColor = (rating: string) => {
    switch (rating) {
      case 'Low':
        return 'bg-green-400/10 border-green-400/20';
      case 'Medium':
        return 'bg-yellow-400/10 border-yellow-400/20';
      case 'High':
        return 'bg-orange-400/10 border-orange-400/20';
      case 'Very High':
        return 'bg-red-400/10 border-red-400/20';
      default:
        return 'bg-gray-400/10 border-gray-400/20';
    }
  };

  return (
    <div className="relative p-6 glass-card rounded-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5 pointer-events-none" />
      
      <h2 className="relative text-2xl font-bold text-pink-400 mb-6 flex items-center gap-2">
        <span className="inline-block w-2 h-8 bg-pink-500 rounded-full" />
        Risk Analysis
      </h2>

      <div className="relative space-y-6">
        {/* Risk Score Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className={`space-y-1 p-4 rounded-lg ${getRiskBgColor(riskRating)} hover:bg-gray-800/70 transition-colors`}>
            <dt className="text-sm font-medium text-gray-400">Risk Rating</dt>
            <dd className={`text-xl font-bold ${getRiskColor(riskRating)}`}>
              {riskRating}
            </dd>
          </div>

          <div className="space-y-1 p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors">
            <dt className="text-sm font-medium text-gray-400">Risk Score</dt>
            <dd className="text-2xl font-bold text-white">
              {!riskScore ? "0/100" : Math.round(riskScore)}
            </dd>
            <div className="w-full bg-gray-700/30 rounded-full h-1.5 mt-2">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${getRiskColor(riskRating)}`}
                style={{ width: `${Math.min(Math.round(riskScore), 100)}%`, opacity: 0.3 }}
              />
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
            <span className="text-pink-400">📋</span>
            Trading Recommendations
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {suggestions.map((suggestion, index) => {
              // Select an icon based on the content of the suggestion
              const getIcon = (text: string) => {
                if (text.toLowerCase().includes('stop loss')) return '🛑';
                if (text.toLowerCase().includes('profit')) return '💰';
                if (text.toLowerCase().includes('risk')) return '⚠️';
                if (text.toLowerCase().includes('leverage')) return '⚡';
                if (text.toLowerCase().includes('position')) return '📊';
                return '💡'; // default icon
              };

              return (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors flex items-start gap-3 group"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">
                    {getIcon(suggestion)}
                  </span>
                  <p className="text-sm text-gray-300 leading-relaxed">{suggestion}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Max Leverage */}
        <div className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors">
          <div className="flex items-start gap-3">
            <span className="text-pink-400 text-xl">⚡</span>
            <div>
              <dt className="text-sm font-medium text-gray-400">Max Recommended Leverage</dt>
              <dd className="text-2xl font-bold text-white mt-1">{maxRecommendedLeverage}:1</dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskAnalysis;
