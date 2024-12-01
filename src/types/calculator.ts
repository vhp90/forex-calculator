import { Currency } from '../lib/api/types';

export interface TradingScenario {
  accountBalance: number;
  accountCurrency: Currency;
  riskAmount: number;
  positionSize: number;
  stopLoss: number;
  takeProfit: number;
}
