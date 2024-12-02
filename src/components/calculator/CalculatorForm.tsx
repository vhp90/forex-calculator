'use client'

import { useState, useEffect, useCallback, FormEvent } from 'react'
import { getMarketData } from '@/lib/market-data'
import { analyzeRisk } from '@/lib/risk-analysis'
import { getTradingSuggestions, TradingSuggestion } from '../../lib/trading-suggestions';
import { TradingScenario } from '../../types/calculator';
import { Currency, CurrencyPairType } from '@/lib/api/types'
import { HiMinus, HiPlus } from 'react-icons/hi'
import { CURRENCY_PAIRS } from '@/lib/api/types';
import { recordCalculation, incrementCalculations, incrementFallbackRates } from '@/lib/analytics-store'
import { trackApiCall } from '@/lib/api-tracker'

interface CurrencyPairOption {
  value: string;
  label: string;
  pair: CurrencyPairType;
}

interface CalculationResult {
  positionSize: number
  positionSizeLots: number
  potentialLoss: number
  requiredMargin: number
  pipValue: number
  marketData?: {
    rate: number
    spread: number
    volatility: number
    dailyRange: {
      high: number
      low: number
    }
  }
  riskAnalysis?: {
    riskRating: 'Low' | 'Medium' | 'High' | 'Very High'
    riskScore: number
    suggestions: string[]
    maxRecommendedLeverage: number
  }
  leverage: number
  displayUnit: 'units' | 'lots'
  accountCurrency: string
}

interface CalculatorFormProps {
  onCalculationComplete: (results: {
    positionSize: number
    potentialLoss: number
    requiredMargin: number
    pipValue: number
    displayUnit: 'units' | 'lots'
    leverage: string
    riskAnalysis: {
      riskRating: 'Low' | 'Medium' | 'High' | 'Very High'
      riskScore: number
      suggestions: string[]
      maxRecommendedLeverage: number
    }
    accountCurrency: string
  }) => void
}

interface FormState {
  accountBalance: string;
  riskPercentage: string;
  stopLoss: string;
  selectedPair: string;
  displayUnit: 'units' | 'lots';
  leverage: string;
  accountCurrency: Currency;
  riskDisplayMode: 'percentage' | 'money';
  takeProfit: string;
}

export default function CalculatorForm({ onCalculationComplete }: CalculatorFormProps) {
  const [formState, setFormState] = useState<FormState>({
    accountBalance: '',
    riskPercentage: '',
    stopLoss: '',
    selectedPair: 'EUR/USD',
    displayUnit: 'units',
    leverage: '100',
    accountCurrency: 'USD',
    riskDisplayMode: 'percentage',
    takeProfit: ''
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [riskAmount, setRiskAmount] = useState(0)
  const [suggestions, setSuggestions] = useState<TradingSuggestion[]>([])

  // Form submission handler
  const handleSubmit = useCallback(async (event?: FormEvent<HTMLFormElement>) => {
    if (event) {
      event.preventDefault()
    }
    
    // Enhanced validation with specific error messages
    const validationErrors = [];
    if (!formState.accountBalance) validationErrors.push('Account Balance');
    if (!formState.riskPercentage) validationErrors.push('Risk Percentage');
    if (!formState.stopLoss) validationErrors.push('Stop Loss');
    if (!formState.selectedPair) validationErrors.push('Currency Pair');
    
    if (validationErrors.length > 0) {
      setError(`Please fill in the following required fields: ${validationErrors.join(', ')}`);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Get market data with tracking and fallback handling
      const [base, quote] = formState.selectedPair.split('/') as [Currency, Currency];
      let marketData;
      
      try {
        marketData = await trackApiCall('market-data', async () => {
          const data = await getMarketData(base, quote);
          if (!data || !data.rate) throw new Error('Invalid market data');
          return data;
        });
      } catch (marketError) {
        console.warn('Using fallback rates due to market data error:', marketError);
        // Use fallback rate based on common currency pairs
        const fallbackRates: { [key: string]: number } = {
          'EUR/USD': 1.1000,
          'GBP/USD': 1.2500,
          'USD/JPY': 110.00,
          'USD/CHF': 0.9000,
          'AUD/USD': 0.7500,
          'USD/CAD': 1.2500,
          'NZD/USD': 0.7000,
        };
        
        const rate = fallbackRates[formState.selectedPair] || 1.0000;
        marketData = {
          rate,
          spread: rate * 0.0002,
          volatility: rate * 0.001,
          dailyRange: {
            high: rate * 1.002,
            low: rate * 0.998,
          }
        };
        
        // Track fallback rate usage
        incrementFallbackRates();
      }

      const balance = parseFloat(formState.accountBalance);
      const risk = parseFloat(formState.riskPercentage);
      const stopLossPips = parseFloat(formState.stopLoss);
      const leverage = parseFloat(formState.leverage);
      
      // Validate numeric inputs
      if (isNaN(balance) || balance <= 0) throw new Error('Invalid account balance');
      if (isNaN(risk) || risk <= 0 || risk > 100) throw new Error('Risk percentage must be between 0 and 100');
      if (isNaN(stopLossPips) || stopLossPips <= 0) throw new Error('Invalid stop loss');
      if (isNaN(leverage) || leverage < 0) throw new Error('Invalid leverage');

      const riskAmount = balance * (risk / 100);
      setRiskAmount(riskAmount);

      // Standard lot size and pip calculations with JPY pair handling
      const standardLotSize = 100000;
      const pipSize = formState.selectedPair.includes('JPY') ? 0.01 : 0.0001;
      const stopLossAmount = stopLossPips * pipSize;

      // Calculate position size with safety checks and cross rate handling
      if (stopLossAmount === 0) throw new Error('Invalid stop loss calculation');
      
      let positionSize;
      const [baseCurrency, quoteCurrency] = formState.selectedPair.split('/');
      
      if (quoteCurrency === 'USD') {
        // Direct USD quote (e.g., EUR/USD)
        positionSize = (riskAmount / stopLossAmount) / marketData.rate;
      } else if (baseCurrency === 'USD') {
        // Inverse USD quote (e.g., USD/JPY)
        positionSize = (riskAmount / stopLossAmount) * marketData.rate;
      } else {
        // Cross rate (e.g., EUR/JPY) - need to convert through USD
        try {
          // Get USD/quote rate for conversion
          const usdQuoteRate = await getMarketData('USD' as Currency, quoteCurrency as Currency);
          positionSize = (riskAmount / stopLossAmount) / usdQuoteRate.rate;
        } catch (error) {
          console.warn('Failed to get cross rate, using approximation:', error);
          // Fallback: use direct conversion as approximation
          positionSize = (riskAmount / stopLossAmount) / marketData.rate;
        }
      }

      const lotsSize = positionSize / standardLotSize;

      // Validate calculation results
      if (!isFinite(positionSize) || positionSize <= 0) throw new Error('Invalid position size calculation');
      
      const marginRequired = (positionSize * marketData.rate) / leverage;
      const pipValue = (pipSize * positionSize * marketData.rate);

      // Analyze risk with correct parameters
      const riskAnalysis = analyzeRisk(
        balance,
        risk,
        stopLossPips,
        leverage,
        marketData.volatility
      );

      // Record calculation
      recordCalculation(formState.selectedPair, 0);

      // Format and send results with validated risk analysis
      onCalculationComplete({
        positionSize: formState.displayUnit === 'lots' ? lotsSize : positionSize,
        potentialLoss: riskAmount,
        requiredMargin: marginRequired,
        pipValue,
        displayUnit: formState.displayUnit,
        leverage: formState.leverage,
        riskAnalysis: {
          riskRating: riskAnalysis.riskRating,
          riskScore: Math.round(riskAnalysis.riskScore),
          suggestions: riskAnalysis.suggestions,
          maxRecommendedLeverage: riskAnalysis.maxRecommendedLeverage
        },
        accountCurrency: formState.accountCurrency
      });

    } catch (err) {
      console.error('Calculation error:', err);
      setError(err instanceof Error ? err.message : 'Unable to calculate position size. Please check your inputs and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [formState, onCalculationComplete]);

  const handleUnitToggle = useCallback((unit: 'units' | 'lots') => {
    if (unit === formState.displayUnit) return
    setFormState(prev => ({ ...prev, displayUnit: unit }))
    if (formState.accountBalance && formState.riskPercentage && formState.stopLoss && formState.selectedPair) {
      handleSubmit()
    }
  }, [formState, handleSubmit])

  const leverageOptions = [
    { value: '0', label: 'No Leverage' },
    { value: '50', label: '50:1' },
    { value: '100', label: '100:1' },
    { value: '200', label: '200:1' },
    { value: '500', label: '500:1' },
    { value: '1000', label: '1000:1' },
    { value: '2000', label: '2000:1' }
  ]

  const currencies = [
    { value: 'USD' as Currency, label: 'USD ($)', symbol: '$' },
    { value: 'EUR' as Currency, label: 'EUR (€)', symbol: '€' },
    { value: 'GBP' as Currency, label: 'GBP (£)', symbol: '£' },
    { value: 'JPY' as Currency, label: 'JPY (¥)', symbol: '¥' },
    { value: 'CHF' as Currency, label: 'CHF (Fr)', symbol: 'Fr' },
    { value: 'CAD' as Currency, label: 'CAD ($)', symbol: '$' },
    { value: 'AUD' as Currency, label: 'AUD ($)', symbol: '$' },
    { value: 'NZD' as Currency, label: 'NZD ($)', symbol: '$' }
  ]

  const currencyPairOptions: CurrencyPairOption[] = CURRENCY_PAIRS.map(pair => ({
    value: `${pair.from}/${pair.to}`,
    label: `${pair.from}/${pair.to}`,
    pair
  }));

  const getCurrencySymbol = (currency: string) => {
    return currencies.find(c => c.value === currency)?.symbol || '$'
  }

  const validateInputs = () => {
    const { accountBalance, riskPercentage, stopLoss, leverage } = formState
    const balance = parseFloat(accountBalance)
    const risk = parseFloat(riskPercentage)
    const stopLossPips = parseFloat(stopLoss)
    const leverageValue = parseFloat(leverage)

    if (isNaN(balance) || balance <= 0) {
      setError('Account balance must be greater than 0')
      return false
    }

    if (isNaN(risk) || risk <= 0 || risk > 100) {
      setError('Risk percentage must be between 0 and 100')
      return false
    }

    if (isNaN(stopLossPips) || stopLossPips <= 0) {
      setError('Stop loss must be greater than 0')
      return false
    }

    if (isNaN(leverageValue) || leverageValue < 0 || leverageValue > 2000) {
      setError('Please select a valid leverage option')
      return false
    }

    setError('')
    return true
  }

  const handleInputChange = (field: string, value: string) => {
    // Special handling for non-numeric fields
    if (field === 'accountCurrency' || field === 'selectedPair' || field === 'leverage' || field === 'displayUnit') {
      setFormState(prev => ({ ...prev, [field]: value }));
      return;
    }
    
    // Allow empty values
    if (value === '') {
      setFormState(prev => ({ ...prev, [field]: value }))
      return
    }

    // Allow decimal point and numbers
    if (!/^\d*\.?\d*$/.test(value)) {
      return
    }

    const numValue = parseFloat(value)

    let isValid = true

    switch (field) {
      case 'accountBalance':
        isValid = numValue >= 0
        break
      case 'riskPercentage':
        isValid = numValue >= 0 && numValue <= 100
        break
      case 'stopLoss':
        isValid = numValue >= 0
        break
      default:
        break
    }

    if (isValid) {
      setFormState(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleRiskInputChange = (value: string) => {
    // Allow empty values
    if (value === '') {
      setFormState(prev => ({ ...prev, riskPercentage: '' }))
      setRiskAmount(0)
      return
    }

    // Allow decimal point and numbers, including a single decimal point
    if (!/^\d*\.?\d*$/.test(value)) {
      return
    }

    const balance = parseFloat(formState.accountBalance) || 0
    
    if (formState.riskDisplayMode === 'percentage') {
      // For percentage mode, allow input even if it's just a decimal point
      if (value === '.') {
        setFormState(prev => ({ ...prev, riskPercentage: '0.' }))
        setRiskAmount(0)
        return
      }

      const numValue = parseFloat(value)
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
        setFormState(prev => ({ ...prev, riskPercentage: value }))
        setRiskAmount(Math.round((balance * numValue / 100) * 100) / 100)
      }
    } else {
      // For money mode, handle decimal input
      if (value === '.') {
        setFormState(prev => ({ ...prev, riskPercentage: '0' }))
        setRiskAmount(0)
        return
      }

      const numValue = parseFloat(value)
      if (!isNaN(numValue) && numValue >= 0 && numValue <= balance) {
        const percentage = balance > 0 ? ((numValue / balance) * 100).toFixed(2) : '0'
        setFormState(prev => ({ ...prev, riskPercentage: percentage }))
        setRiskAmount(Math.round(numValue * 100) / 100)
      }
    }
  }

  const toggleRiskDisplayMode = () => {
    const newMode = formState.riskDisplayMode === 'percentage' ? 'money' : 'percentage'
    const balance = parseFloat(formState.accountBalance) || 0
    const currentPercentage = parseFloat(formState.riskPercentage) || 0
    
    if (newMode === 'money') {
      const amount = (balance * currentPercentage / 100)
      setRiskAmount(Math.round(amount * 100) / 100)
    } else {
      const amount = (balance * currentPercentage / 100)
      setRiskAmount(Math.round(amount * 100) / 100)
    }
    
    setFormState(prev => ({ ...prev, riskDisplayMode: newMode }))
  }

  useEffect(() => {
    try {
      const scenario: TradingScenario = {
        accountBalance: parseFloat(formState.accountBalance) || 0,
        accountCurrency: formState.accountCurrency,
        riskAmount: riskAmount,
        positionSize: 0,
        stopLoss: parseFloat(formState.stopLoss) || 0,
        takeProfit: parseFloat(formState.takeProfit) || 0,
      };
      
      setSuggestions(getTradingSuggestions(scenario));
    } catch (error) {
      console.error('Error getting trading suggestions:', error);
      setSuggestions([{
        message: 'Unable to generate trading suggestions. Please check your input values.',
        type: 'warning'
      }]);
    }
  }, [formState, riskAmount]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formState.accountBalance && formState.riskPercentage && formState.stopLoss) {
        handleSubmit();
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [formState.accountBalance, formState.riskPercentage, formState.stopLoss, formState.leverage, formState.selectedPair]);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="space-y-6 p-4 sm:p-6 md:p-8 bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800/50 shadow-xl">
        {/* Grid layout for form fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Balance Section */}
          <div className="space-y-2">
            <label htmlFor="accountBalance" className="block text-sm font-medium text-gray-200">
              Account Balance
            </label>
            <div className="relative flex gap-2">
              <div className="relative w-20">
                <select
                  value={formState.accountCurrency}
                  onChange={(e) => handleInputChange('accountCurrency', e.target.value as Currency)}
                  className="w-full h-full bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-l-lg 
                    text-xs text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                    shadow-lg shadow-black/10 transition-all duration-200 hover:border-gray-600/50
                    px-2 py-2.5 pr-6 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgb(156, 163, 175)' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 4px center',
                    backgroundSize: '16px'
                  }}
                >
                  {currencies.map(currency => (
                    <option key={currency.value} value={currency.value} className="py-1">
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm pointer-events-none w-6 flex justify-center">
                  {getCurrencySymbol(formState.accountCurrency)}
                </div>
                <input
                  type="number"
                  id="accountBalance"
                  name="accountBalance"
                  value={formState.accountBalance}
                  onChange={(e) => handleInputChange('accountBalance', e.target.value)}
                  placeholder="Enter balance"
                  className="w-full pl-8 pr-4 py-2.5 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-r-lg
                    text-sm sm:text-base text-gray-200 placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20
                    hover:bg-gray-800/90 transition-colors duration-200"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col -space-y-px">
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = parseFloat(formState.accountBalance) || 0;
                      handleInputChange('accountBalance', (currentValue + 1).toString());
                    }}
                    className="px-1.5 py-1 rounded-t border-b border-gray-700/50 bg-gray-800/80 hover:bg-gray-700/80 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-2.5 h-2.5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 3L14 9L2 9L8 3Z" fill="currentColor"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = parseFloat(formState.accountBalance) || 0;
                      if (currentValue > 0) {
                        handleInputChange('accountBalance', (currentValue - 1).toString());
                      }
                    }}
                    className="px-1.5 py-1 rounded-b bg-gray-800/80 hover:bg-gray-700/80 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-2.5 h-2.5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 13L2 7L14 7L8 13Z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Input Section */}
          <div className="space-y-2">
            <label htmlFor="riskInput" className="block text-sm font-medium text-gray-200">
              Risk {formState.riskDisplayMode === 'percentage' ? 'Percentage' : 'Amount'}
            </label>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  id="riskInput"
                  min="0"
                  max={formState.riskDisplayMode === 'percentage' ? "100" : formState.accountBalance}
                  step={formState.riskDisplayMode === 'percentage' ? "0.1" : "1"}
                  value={formState.riskDisplayMode === 'percentage' ? formState.riskPercentage : riskAmount}
                  onChange={(e) => handleRiskInputChange(e.target.value)}
                  placeholder={formState.riskDisplayMode === 'percentage' ? "Enter risk %" : "Enter risk amount"}
                  className="w-full pl-3 pr-8 py-2.5 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg
                    text-sm sm:text-base text-gray-200 placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20
                    hover:bg-gray-800/90 transition-colors duration-200"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col -space-y-px">
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = formState.riskDisplayMode === 'percentage' 
                        ? parseFloat(formState.riskPercentage) || 0
                        : parseFloat(riskAmount.toString()) || 0;
                      const step = formState.riskDisplayMode === 'percentage' ? 0.1 : 1;
                      const newValue = (currentValue + step).toFixed(formState.riskDisplayMode === 'percentage' ? 1 : 0);
                      handleRiskInputChange(newValue);
                    }}
                    className="px-1.5 py-1 rounded-t border-b border-gray-700/50 bg-gray-800/80 hover:bg-gray-700/80 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-2.5 h-2.5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 3L14 9L2 9L8 3Z" fill="currentColor"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = formState.riskDisplayMode === 'percentage' 
                        ? parseFloat(formState.riskPercentage) || 0
                        : parseFloat(riskAmount.toString()) || 0;
                      const step = formState.riskDisplayMode === 'percentage' ? 0.1 : 1;
                      if (currentValue > 0) {
                        const newValue = (currentValue - step).toFixed(formState.riskDisplayMode === 'percentage' ? 1 : 0);
                        handleRiskInputChange(Math.max(0, parseFloat(newValue)).toString());
                      }
                    }}
                    className="px-1.5 py-1 rounded-b bg-gray-800/80 hover:bg-gray-700/80 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-2.5 h-2.5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 13L2 7L14 7L8 13Z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
                <div className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm pointer-events-none">
                  {formState.riskDisplayMode === 'percentage' ? '%' : getCurrencySymbol(formState.accountCurrency)}
                </div>
              </div>
              <button
                type="button"
                onClick={toggleRiskDisplayMode}
                className="w-12 sm:w-14 h-full bg-gray-700/80 backdrop-blur-sm hover:bg-gray-600/80 rounded-lg text-xs sm:text-sm text-white 
                  transition-all duration-200 border border-gray-600/50 hover:border-gray-500/50 shadow-lg shadow-black/10
                  flex items-center justify-center"
              >
                {formState.riskDisplayMode === 'percentage' ? '%→$' : '$→%'}
              </button>
            </div>
            {formState.riskDisplayMode === 'percentage' && riskAmount > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Risk Amount: {getCurrencySymbol(formState.accountCurrency)}
                {riskAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
          </div>

          {/* Stop Loss Section */}
          <div className="space-y-2">
            <label htmlFor="stopLoss" className="block text-sm font-medium text-gray-200">
              Stop Loss (Pips)
            </label>
            <div className="relative">
              <input
                type="number"
                id="stopLoss"
                min="0"
                step="1"
                value={formState.stopLoss}
                onChange={(e) => handleInputChange('stopLoss', e.target.value)}
                placeholder="Enter stop loss in pips"
                className="w-full pl-3 pr-4 py-2.5 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg
                  text-sm sm:text-base text-gray-200 placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20
                  hover:bg-gray-800/90 transition-colors duration-200"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col -space-y-px">
                <button
                  type="button"
                  onClick={() => {
                    const currentValue = parseFloat(formState.stopLoss) || 0;
                    handleInputChange('stopLoss', (currentValue + 1).toString());
                  }}
                  className="px-1.5 py-1 rounded-t border-b border-gray-700/50 bg-gray-800/80 hover:bg-gray-700/80 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-2.5 h-2.5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 3L14 9L2 9L8 3Z" fill="currentColor"/>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const currentValue = parseFloat(formState.stopLoss) || 0;
                    if (currentValue > 0) {
                      handleInputChange('stopLoss', (currentValue - 1).toString());
                    }
                  }}
                  className="px-1.5 py-1 rounded-b bg-gray-800/80 hover:bg-gray-700/80 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-2.5 h-2.5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 13L2 7L14 7L8 13Z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Currency Pair Selection */}
          <div className="space-y-2">
            <label htmlFor="selectedPair" className="block text-sm font-medium text-gray-200">
              Currency Pair
            </label>
            <div className="relative">
              <select
                id="selectedPair"
                value={formState.selectedPair}
                onChange={(e) => handleInputChange('selectedPair', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg
                  text-sm sm:text-base text-gray-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20
                  hover:bg-gray-800/90 transition-colors duration-200"
              >
                {currencyPairOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Leverage Selection */}
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="leverage" className="block text-sm font-medium text-gray-200">
              Leverage
            </label>
            <select
              id="leverage"
              value={formState.leverage}
              onChange={(e) => setFormState(prev => ({ ...prev, leverage: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg
                text-sm sm:text-base text-gray-200
                focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20
                hover:bg-gray-800/90 transition-colors duration-200"
            >
              {leverageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Display Unit Toggle */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-200">
              Display Unit
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleUnitToggle('units')}
                className={`flex-1 py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200
                  ${formState.displayUnit === 'units'
                    ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/30'
                    : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600/80 border-gray-600/50'
                  } backdrop-blur-sm border shadow-lg shadow-black/10`}
              >
                Units
              </button>
              <button
                type="button"
                onClick={() => handleUnitToggle('lots')}
                className={`flex-1 py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200
                  ${formState.displayUnit === 'lots'
                    ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/30'
                    : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600/80 border-gray-600/50'
                  } backdrop-blur-sm border shadow-lg shadow-black/10`}
              >
                Lots
              </button>
            </div>
            <p className="text-xs text-gray-400">
              1 lot = 100,000 units
            </p>
          </div>
        </div>

        {/* Trading Suggestions */}
        <div className="mt-8 space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg backdrop-blur-sm shadow-lg transition-all duration-300 hover:translate-y-[-2px] 
                ${suggestion.type === 'warning'
                  ? 'bg-red-900/20 border border-red-700/30 shadow-red-900/20'
                  : suggestion.type === 'success'
                  ? 'bg-green-900/20 border border-green-700/30 shadow-green-900/20'
                  : 'bg-blue-900/20 border border-blue-700/30 shadow-blue-900/20'
                }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 hidden sm:block ${
                  suggestion.type === 'warning'
                    ? 'text-red-400'
                    : suggestion.type === 'success'
                    ? 'text-green-400'
                    : 'text-blue-400'
                }`}>
                  {suggestion.type === 'warning' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : suggestion.type === 'success' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <p className={`text-xs sm:text-sm font-medium flex-1 ${
                  suggestion.type === 'warning'
                    ? 'text-red-200'
                    : suggestion.type === 'success'
                    ? 'text-green-200'
                    : 'text-blue-200'
                }`}>
                  {suggestion.message}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Calculate Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 py-2.5 sm:py-3 px-4 rounded-lg 
            font-medium text-sm sm:text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
            backdrop-blur-sm border border-indigo-500/30 hover:border-indigo-400/40 shadow-lg shadow-indigo-900/10
            transform hover:-translate-y-0.5 active:translate-y-0 mt-8 hover:text-indigo-100
            hover:shadow-indigo-900/20"
        >
          {isLoading ? 'Calculating...' : 'Calculate Position Size'}
        </button>
      </div>
    </form>
  )
}
