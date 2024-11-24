interface RiskAnalysisResult {
  riskRating: 'Low' | 'Medium' | 'High' | 'Very High'
  riskScore: number
  suggestions: string[]
  maxRecommendedLeverage: number
}

export function analyzeRisk(
  accountBalance: number,
  riskPercentage: number,
  stopLossPips: number,
  leverage: number,
  volatility: number = 0.001 // Default daily volatility of 0.1%
): RiskAnalysisResult {
  // Calculate risk factors
  const riskAmount = accountBalance * (riskPercentage / 100)
  const riskToBalanceRatio = riskAmount / accountBalance

  // Calculate individual risk components (0-100 scale)
  const riskPercentageScore = Math.min(100, (riskPercentage / 3) * 100) // >3% is maximum risk
  const stopLossScore = Math.min(100, (10 / stopLossPips) * 100) // <10 pips is maximum risk
  const leverageScore = Math.min(100, (leverage / 20)) // >2000 is maximum risk
  const balanceScore = Math.max(0, 100 - Math.log10(accountBalance) * 20) // Higher balance = lower risk

  // Calculate overall risk score (0-100)
  const riskScore = Math.min(
    100,
    (riskPercentageScore * 0.4) + // Risk percentage has highest weight
    (stopLossScore * 0.3) + // Stop loss has second highest weight
    (leverageScore * 0.2) + // Current leverage
    (balanceScore * 0.1) // Account balance has lowest weight
  )

  // Determine risk rating
  let riskRating: 'Low' | 'Medium' | 'High' | 'Very High'
  if (riskScore < 25) riskRating = 'Low'
  else if (riskScore < 50) riskRating = 'Medium'
  else if (riskScore < 75) riskRating = 'High'
  else riskRating = 'Very High'

  // Calculate maximum recommended leverage
  const baseMaxLeverage = 2000

  // Adjust based on risk percentage (lower risk % allows higher leverage)
  const riskPercentageMultiplier = Math.max(0.1, 1 - (riskPercentage / 5))
  
  // Adjust based on stop loss (wider stop loss allows higher leverage)
  const stopLossMultiplier = Math.min(1, stopLossPips / 20)
  
  // Adjust based on account balance (higher balance allows higher leverage)
  const balanceMultiplier = Math.min(1, Math.log10(accountBalance) / 4)

  // Calculate final recommended leverage
  let maxRecommendedLeverage = Math.floor(
    baseMaxLeverage * 
    riskPercentageMultiplier * 
    stopLossMultiplier * 
    balanceMultiplier
  )

  // Ensure it stays within reasonable bounds
  maxRecommendedLeverage = Math.max(1, Math.min(2000, maxRecommendedLeverage))

  // Generate suggestions
  const suggestions: string[] = []

  if (riskPercentage > 2) {
    suggestions.push('Consider reducing risk percentage to 2% or less of account balance')
  }

  if (leverage > maxRecommendedLeverage) {
    suggestions.push(`Consider reducing leverage to ${maxRecommendedLeverage}:1 or less based on your current risk parameters`)
  }

  if (stopLossPips < 10) {
    suggestions.push('Stop loss is very tight. Consider widening it to at least 10 pips')
  }

  if (riskScore > 75) {
    suggestions.push('Overall risk is very high. Consider adjusting multiple parameters to reduce risk')
  }

  // Log the calculation factors for debugging
  console.log('Risk Analysis Factors:', {
    riskPercentageScore,
    stopLossScore,
    leverageScore,
    balanceScore,
    riskScore,
    maxRecommendedLeverage,
    multipliers: {
      risk: riskPercentageMultiplier,
      stopLoss: stopLossMultiplier,
      balance: balanceMultiplier
    }
  })

  return {
    riskRating,
    riskScore,
    suggestions,
    maxRecommendedLeverage
  }
}
