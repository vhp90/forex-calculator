import { Currency } from '../api/types';
import { calculateCrossRate } from './exchange-rates-cache';

interface CalculationParams {
  accountBalance: number;
  riskPercentage: number;
  stopLoss: number;
  leverage: number;
  accountCurrency: Currency;
  baseCurrency: Currency;
  quoteCurrency: Currency;
  exchangeRates: { [key: string]: number };
}

interface CalculationResult {
  positionSize: number;
  positionSizeLots: number;
  potentialLoss: number;
  requiredMargin: number;
  pipValue: number;
  riskRating: 'Low' | 'Medium' | 'High' | 'Very High';
  riskScore: number;
  suggestions: string[];
}

export function calculatePosition({
  accountBalance,
  riskPercentage,
  stopLoss,
  leverage,
  accountCurrency,
  baseCurrency,
  quoteCurrency,
  exchangeRates
}: CalculationParams): CalculationResult {
  // Calculate risk amount in account currency
  const riskAmount = (accountBalance * riskPercentage) / 100;

  // Get exchange rate for the currency pair
  const rate = calculateCrossRate(exchangeRates, baseCurrency, quoteCurrency);
  
  // Calculate pip value and position size
  const pipSize = quoteCurrency === 'JPY' ? 0.01 : 0.0001;
  const standardLot = 100000;
  
  // Calculate position size based on risk and stop loss
  let pipValue = pipSize;
  if (accountCurrency !== quoteCurrency) {
    pipValue *= calculateCrossRate(exchangeRates, quoteCurrency, accountCurrency);
  }
  
  const positionSize = (riskAmount / (stopLoss * pipValue)) * standardLot;
  const positionSizeLots = positionSize / standardLot;
  
  // Calculate required margin
  const positionValueInQuoteCurrency = positionSize * rate;
  let marginInAccountCurrency = positionValueInQuoteCurrency / leverage;
  if (accountCurrency !== quoteCurrency) {
    marginInAccountCurrency *= calculateCrossRate(exchangeRates, quoteCurrency, accountCurrency);
  }

  // Calculate risk metrics
  const riskScore = calculateRiskScore({
    riskPercentage,
    leverage,
    marginToBalance: marginInAccountCurrency / accountBalance
  });

  return {
    positionSize,
    positionSizeLots,
    potentialLoss: riskAmount,
    requiredMargin: marginInAccountCurrency,
    pipValue: pipValue * positionSize,
    riskRating: getRiskRating(riskScore),
    riskScore,
    suggestions: generateSuggestions({
      riskScore,
      riskPercentage,
      leverage,
      marginToBalance: marginInAccountCurrency / accountBalance
    })
  };
}

function calculateRiskScore({
  riskPercentage,
  leverage,
  marginToBalance
}: {
  riskPercentage: number;
  leverage: number;
  marginToBalance: number;
}): number {
  const riskWeight = riskPercentage * 10;
  const leverageWeight = (leverage / 100) * 5;
  const marginWeight = marginToBalance * 100;
  
  return (riskWeight + leverageWeight + marginWeight) / 3;
}

function getRiskRating(riskScore: number): 'Low' | 'Medium' | 'High' | 'Very High' {
  if (riskScore <= 20) return 'Low';
  if (riskScore <= 40) return 'Medium';
  if (riskScore <= 60) return 'High';
  return 'Very High';
}

function generateSuggestions({
  riskScore,
  riskPercentage,
  leverage,
  marginToBalance
}: {
  riskScore: number;
  riskPercentage: number;
  leverage: number;
  marginToBalance: number;
}): string[] {
  const suggestions: string[] = [];
  
  if (riskPercentage > 2) {
    suggestions.push('Consider reducing risk percentage to 2% or less for better risk management');
  }
  
  if (leverage > 50) {
    suggestions.push('High leverage increases risk. Consider reducing leverage');
  }
  
  if (marginToBalance > 0.2) {
    suggestions.push('Position size might be too large relative to account balance');
  }
  
  return suggestions;
}
