import { Currency, CURRENCY_PAIRS } from './api/types';

export interface CalculatorInput {
  accountBalance: number;
  riskPercentage: number;
  stopLoss: number;
  baseCurrency: Currency;
  quoteCurrency: Currency;
}

export interface CalculationResult {
  positionSize: number;
  potentialLoss: number;
  requiredMargin: number;
  pipValue: number;
}

const MARGIN_REQUIREMENT = 0.02; // 2% margin requirement (50:1 leverage)
const STANDARD_LOT_SIZE = 100000; // Standard lot size in base currency

// Standard pip values for major pairs
const PIP_VALUES: Record<string, number> = {
  'EUR/USD': 0.0001,
  'GBP/USD': 0.0001,
  'USD/JPY': 0.01,
  'USD/CHF': 0.0001,
  'AUD/USD': 0.0001,
};

export function calculatePositionSize(input: CalculatorInput): CalculationResult {
  // Validate currency pair
  const isValidPair = CURRENCY_PAIRS.some(
    pair => pair.from === input.baseCurrency && pair.to === input.quoteCurrency
  );
  if (!isValidPair) {
    throw new Error('Invalid currency pair');
  }

  // Calculate the maximum loss amount based on risk percentage
  const maxLoss = input.accountBalance * (input.riskPercentage / 100);

  // Get pip value based on currency pair
  const pipValue = getPipValue(input.baseCurrency, input.quoteCurrency);

  // Calculate position size in lots
  const positionSize = maxLoss / (input.stopLoss * pipValue);

  // Calculate required margin
  const requiredMargin = positionSize * STANDARD_LOT_SIZE * MARGIN_REQUIREMENT;

  return {
    positionSize,
    potentialLoss: maxLoss,
    requiredMargin,
    pipValue: pipValue * positionSize,
  };
}

function getPipValue(baseCurrency: Currency, quoteCurrency: Currency): number {
  const pair = `${baseCurrency}/${quoteCurrency}`;
  return PIP_VALUES[pair] || 0.0001;
}
