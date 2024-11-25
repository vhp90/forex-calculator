import { TradingScenario } from '../types/calculator';

interface SuggestionRule {
  condition: (scenario: TradingScenario) => boolean;
  message: (scenario: TradingScenario) => string;
  type: 'warning' | 'info' | 'success';
}

export interface TradingSuggestion {
  message: string;
  type: 'warning' | 'info' | 'success';
}

const formatCurrency = (value: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
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
  
  // Account Balance Based Suggestions
  {
    condition: (scenario) => scenario.accountBalance < 1000,
    message: (scenario) => `Small Account Strategy: With an account balance of ${formatCurrency(scenario.accountBalance, scenario.accountCurrency)}, focus on consistent small gains and strict risk management.`,
    type: 'info'
  },
  {
    condition: (scenario) => scenario.accountBalance >= 10000,
    message: (scenario) => `Capital Preservation: With a substantial account of ${formatCurrency(scenario.accountBalance, scenario.accountCurrency)}, consider splitting risk across multiple smaller positions.`,
    type: 'info'
  },
  
  // Risk-Reward Based Suggestions
  {
    condition: (scenario) => (scenario.takeProfit / scenario.stopLoss) < 1.5,
    message: (scenario) => `Low Risk-Reward Ratio: Your RR ratio of ${(scenario.takeProfit / scenario.stopLoss).toFixed(1)} is below the recommended 1:2. Consider adjusting your take profit level.`,
    type: 'warning'
  },
  {
    condition: (scenario) => (scenario.takeProfit / scenario.stopLoss) >= 2,
    message: (scenario) => `Excellent Risk-Reward: Your RR ratio of ${(scenario.takeProfit / scenario.stopLoss).toFixed(1)} provides good profit potential.`,
    type: 'success'
  }
];

export const getTradingSuggestions = (scenario: TradingScenario): TradingSuggestion[] => {
  // Filter out invalid scenarios
  if (!scenario.accountBalance || !scenario.stopLoss || !scenario.takeProfit) {
    return [];
  }

  // Get all applicable suggestions
  const suggestions = suggestionRules
    .filter(rule => rule.condition(scenario))
    .map(rule => ({
      message: rule.message(scenario),
      type: rule.type
    }));

  // Sort suggestions by type (warnings first, then info, then success)
  const typeOrder = { warning: 0, info: 1, success: 2 };
  return suggestions.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);
};
