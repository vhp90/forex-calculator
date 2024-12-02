interface RiskAnalysisResult {
  riskRating: 'Low' | 'Medium' | 'High' | 'Very High'
  riskScore: number
  suggestions: string[]
  maxRecommendedLeverage: number
}

interface RiskScenario {
  accountBalance: number
  riskPercentage: number
  stopLossPips: number
  leverage: number
  volatility?: number
}

export function analyzeRisk(
  scenario: RiskScenario
): RiskAnalysisResult {
  const { accountBalance, riskPercentage, stopLossPips, leverage, volatility = 0.001 } = scenario
  
  // Validate inputs to prevent NaN
  if (!accountBalance || !riskPercentage || !stopLossPips || !leverage || 
      isNaN(accountBalance) || isNaN(riskPercentage) || isNaN(stopLossPips) || isNaN(leverage)) {
    return {
      riskRating: 'Very High',
      riskScore: 100,
      suggestions: ['Please provide valid numerical values for all parameters'],
      maxRecommendedLeverage: 1
    }
  }
  
  // Calculate risk amount
  const riskAmount = accountBalance * (riskPercentage / 100)
  
  // Calculate position size ratio
  const positionSizeRatio = riskAmount / accountBalance
  
  // Calculate base risk score (0-100)
  let riskScore = 0
  
  // Risk percentage contribution (0-40 points)
  riskScore += Math.min(40, (riskPercentage / 3) * 40)
  
  // Leverage contribution (0-30 points)
  riskScore += Math.min(30, (leverage / 100) * 30)
  
  // Stop loss contribution (0-30 points)
  riskScore += Math.min(30, (10 / stopLossPips) * 30)
  
  // Ensure riskScore stays within 0-100 range
  riskScore = Math.max(0, Math.min(100, riskScore))
  
  // Determine risk rating
  let riskRating: 'Low' | 'Medium' | 'High' | 'Very High'
  if (riskScore < 25) riskRating = 'Low'
  else if (riskScore < 50) riskRating = 'Medium'
  else if (riskScore < 75) riskRating = 'High'
  else riskRating = 'Very High'
  
  // Calculate max recommended leverage based on risk score and account balance
  const maxRecommendedLeverage = Math.max(
    Math.floor((100 - riskScore) / 10) * 10, // Round down to nearest 10
    1 // Minimum leverage of 1
  )
  
  // Generate suggestions
  const suggestions: string[] = []
  
  if (riskPercentage > 2) {
    suggestions.push('Consider reducing risk percentage to 2% or less of account balance')
  }
  
  if (leverage > maxRecommendedLeverage) {
    suggestions.push(`Consider reducing leverage to ${maxRecommendedLeverage}:1 or less based on your risk parameters`)
  }
  
  if (stopLossPips < 10) {
    suggestions.push('Stop loss is very tight. Consider widening it to at least 10 pips')
  }
  
  if (riskScore > 75) {
    suggestions.push('Overall risk is very high. Consider adjusting multiple parameters to reduce risk')
  }
  
  return {
    riskRating,
    riskScore: Math.round(riskScore),
    suggestions,
    maxRecommendedLeverage
  }
}
