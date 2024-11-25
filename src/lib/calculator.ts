export interface CalculatorInput {
  accountBalance: number
  riskPercentage: number
  stopLoss: number
  currencyPair: string
}

export interface CalculationResult {
  positionSize: number
  potentialLoss: number
  requiredMargin: number
  pipValue: number
}

const MARGIN_REQUIREMENT = 0.02 // 2% margin requirement (50:1 leverage)
const STANDARD_LOT_SIZE = 100000 // Standard lot size in base currency

export function calculatePositionSize(input: CalculatorInput): CalculationResult {
  // Calculate the maximum loss amount based on risk percentage
  const maxLoss = input.accountBalance * (input.riskPercentage / 100)

  // Get pip value based on currency pair (simplified for example)
  const pipValue = getPipValue(input.currencyPair)

  // Calculate position size in lots
  const positionSize = maxLoss / (input.stopLoss * pipValue)

  // Calculate required margin
  const requiredMargin = positionSize * STANDARD_LOT_SIZE * MARGIN_REQUIREMENT

  return {
    positionSize: positionSize,
    potentialLoss: maxLoss,
    requiredMargin: requiredMargin,
    pipValue: pipValue * positionSize,
  }
}

function getPipValue(currencyPair: string): number {
  // Simplified pip value calculation
  // In reality, this would need to fetch current exchange rates
  const pipValues: { [key: string]: number } = {
    'EUR/USD': 0.0001,
    'GBP/USD': 0.0001,
    'USD/JPY': 0.01,
    'USD/CHF': 0.0001,
    'AUD/USD': 0.0001,
  }

  return pipValues[currencyPair] || 0.0001
}
