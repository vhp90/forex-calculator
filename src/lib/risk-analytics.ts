export interface RiskAnalysis {
  riskRating: 'Low' | 'Medium' | 'High'
  confidence: number
  suggestions: string[]
  marketCondition: 'Volatile' | 'Stable' | 'Ranging'
  optimalStopLoss: number
  optimalTakeProfit: number
  riskRewardRatio: number
}

export function analyzeRisk(
  accountBalance: number,
  riskPercentage: number,
  stopLoss: number,
  volatility: number,
  dailyRange: { high: number; low: number }
): RiskAnalysis {
  // Calculate risk metrics
  const riskAmount = (accountBalance * riskPercentage) / 100
  const dailyRangeSize = dailyRange.high - dailyRange.low
  const stopLossPercentage = (stopLoss / dailyRangeSize) * 100

  // Determine market condition
  const marketCondition = volatility > 0.15 ? 'Volatile' : volatility < 0.08 ? 'Stable' : 'Ranging'

  // Calculate optimal stop loss based on volatility and daily range
  const optimalStopLoss = Math.max(dailyRangeSize * 0.3, stopLoss)
  const optimalTakeProfit = optimalStopLoss * 2 // 1:2 risk-reward ratio

  // Risk rating calculation
  let riskRating: 'Low' | 'Medium' | 'High'
  if (riskPercentage > 3) riskRating = 'High'
  else if (riskPercentage > 1) riskRating = 'Medium'
  else riskRating = 'Low'

  // Calculate confidence score (0-100)
  const confidence = calculateConfidence(
    riskPercentage,
    stopLossPercentage,
    volatility,
    marketCondition
  )

  // Generate suggestions
  const suggestions = generateTradeSuggestions(
    riskRating,
    marketCondition,
    stopLossPercentage,
    riskPercentage,
    confidence
  )

  return {
    riskRating,
    confidence,
    suggestions,
    marketCondition,
    optimalStopLoss,
    optimalTakeProfit,
    riskRewardRatio: optimalTakeProfit / optimalStopLoss,
  }
}

function calculateConfidence(
  riskPercentage: number,
  stopLossPercentage: number,
  volatility: number,
  marketCondition: string
): number {
  let score = 100

  // Penalize high risk percentage
  if (riskPercentage > 3) score -= 30
  else if (riskPercentage > 2) score -= 20
  else if (riskPercentage > 1) score -= 10

  // Adjust for stop loss
  if (stopLossPercentage > 2) score -= 20
  else if (stopLossPercentage > 1) score -= 10

  // Adjust for market conditions
  if (marketCondition === 'Volatile') score -= 15
  else if (marketCondition === 'Ranging') score -= 5

  // Adjust for volatility
  if (volatility > 0.2) score -= 20
  else if (volatility > 0.15) score -= 10

  return Math.max(0, Math.min(100, score))
}

function generateTradeSuggestions(
  riskRating: string,
  marketCondition: string,
  stopLossPercentage: number,
  riskPercentage: number,
  confidence: number
): string[] {
  const suggestions: string[] = []

  if (riskRating === 'High') {
    suggestions.push('⚠️ Consider reducing your risk percentage to 1-2% for better risk management')
  }

  if (marketCondition === 'Volatile') {
    suggestions.push('📊 Market is volatile - consider widening your stop loss')
    suggestions.push('💡 Use smaller position sizes during high volatility')
  }

  if (stopLossPercentage > 2) {
    suggestions.push('🎯 Your stop loss might be too wide - consider tightening it')
  }

  if (confidence < 50) {
    suggestions.push('⚠️ This trade has a low confidence score - review your parameters')
  }

  if (riskPercentage > 2 && marketCondition === 'Volatile') {
    suggestions.push('🚨 High risk in volatile market - strongly consider reducing position size')
  }

  return suggestions
}
