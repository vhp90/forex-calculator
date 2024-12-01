import { TradingScenario } from '../types/calculator';
import { Currency } from './api/types';

interface SuggestionRule {
  condition: (scenario: TradingScenario) => boolean;
  message: (scenario: TradingScenario) => string;
  type: 'warning' | 'info' | 'success';
}

export interface TradingSuggestion {
  message: string;
  type: 'warning' | 'info' | 'success';
}

const formatCurrency = (value: number, currency: Currency): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

const suggestionRules: SuggestionRule[] = [
  // Risk Management Suggestions
  {
    condition: (scenario) => (scenario.riskAmount / scenario.accountBalance) * 100 > 3,
    message: (scenario) => `High Risk Alert: Your current risk of ${formatCurrency(scenario.riskAmount, scenario.accountCurrency)} represents ${formatPercentage((scenario.riskAmount / scenario.accountBalance) * 100)} of your account. Consider reducing position size to stay within 1-3% risk per trade.`,
    type: 'warning'
  },
  {
    condition: (scenario) => (scenario.riskAmount / scenario.accountBalance) * 100 <= 2,
    message: (scenario) => `Good Risk Management: Your risk of ${formatPercentage((scenario.riskAmount / scenario.accountBalance) * 100)} is within safe limits.`,
    type: 'success'
  },
  
  // Position Size Suggestions
  {
    condition: (scenario) => scenario.positionSize > scenario.accountBalance * 3,
    message: (scenario) => `High Leverage Warning: Your position size of ${formatCurrency(scenario.positionSize, scenario.accountCurrency)} is more than 3x your account balance. Consider reducing leverage to manage risk.`,
    type: 'warning'
  },
  {
    condition: (scenario) => scenario.stopLoss < 10,
    message: (scenario) => `Tight Stop Loss: Your stop loss of ${scenario.stopLoss} pips is quite tight. Consider widening it to account for market volatility.`,
    type: 'info'
  },
  {
    condition: (scenario) => scenario.stopLoss > 50,
    message: (scenario) => `Wide Stop Loss: Your stop loss of ${scenario.stopLoss} pips is quite wide. This may require a smaller position size to maintain the same risk level.`,
    type: 'info'
  },
  {
    condition: (scenario) => scenario.takeProfit > 0 && scenario.takeProfit < scenario.stopLoss,
    message: (scenario) => `Risk-Reward Ratio: Your take profit target is closer than your stop loss. Consider adjusting your targets for a better risk-reward ratio.`,
    type: 'info'
  },
  
  // Risk-Reward Based Suggestions
  {
    condition: (scenario) => scenario.takeProfit > 0 && (scenario.takeProfit / scenario.stopLoss) < 1.5,
    message: (scenario) => `Low Reward Ratio: Your risk-reward ratio is less than 1.5:1. Consider adjusting your take profit level for better potential returns.`,
    type: 'warning'
  },
  {
    condition: (scenario) => scenario.takeProfit > 0 && (scenario.takeProfit / scenario.stopLoss) >= 2,
    message: (scenario) => `Good Risk-Reward: Your risk-reward ratio is 2:1 or better, which is good for long-term profitability.`,
    type: 'success'
  }
];

export function getTradingSuggestions(scenario: TradingScenario): TradingSuggestion[] {
  if (!scenario || !scenario.accountBalance) {
    return [];
  }

  return suggestionRules
    .filter(rule => rule.condition(scenario))
    .map(rule => ({
      message: rule.message(scenario),
      type: rule.type
    }));
}
