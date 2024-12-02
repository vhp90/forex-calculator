'use client'

import { useState, useEffect, useCallback, FormEvent } from 'react'
import { getMarketData } from '@/lib/market-data'
import { analyzeRisk } from '@/lib/risk-analysis'
import { getTradingSuggestions } from '@/lib/trading-suggestions'
import { Currency, ExchangeRateResponse } from '@/lib/api/types'
import { HiMinus, HiPlus } from 'react-icons/hi'
import { CURRENCY_PAIRS } from '@/lib/api/types'
import { recordCalculation } from '@/lib/analytics-store'

interface CurrencyPair {
  from: Currency;
  to: Currency;
}

interface CurrencyPairOption {
  value: string;
  label: string;
  pair: CurrencyPair;
}

interface CalculationResult {
  positionSize: number;
  positionSizeLots: number;
  potentialLoss: number;
  requiredMargin: number;
  pipValue: number;
  marketData: ExchangeRateResponse;
  riskAnalysis: {
    riskRating: 'Low' | 'Medium' | 'High' | 'Very High';
    riskScore: number;
    suggestions: string[];
    maxRecommendedLeverage: number;
  };
  leverage: number;
  displayUnit: 'units' | 'lots';
  accountCurrency: Currency;
}

interface CalculatorFormProps {
  onCalculationComplete: (results: CalculationResult) => void;
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
  suggestions: string[];
}

interface TradingScenario {
  accountBalance: number;
  accountCurrency: Currency;
  riskAmount: number;
  positionSize: number;
  stopLoss: number;
  takeProfit: number;
}

interface TradingSuggestion {
  message: string;
  type: string;
}

interface RiskAnalysisProps {
  accountBalance: number;
  accountCurrency: Currency;
  riskAmount: number;
  positionSize: number;
  stopLoss: number;
  takeProfit: number;
}

const debounce = <F extends (...args: any[]) => void>(fn: F, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const debouncedFn = (...args: Parameters<F>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
  
  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
  
  return debouncedFn;
};

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
    takeProfit: '',
    suggestions: []
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [riskAmount, setRiskAmount] = useState(0)
  const [alertMessage, setAlertMessage] = useState('')

  const calculatePositionSize = (
    accountBalance: number,
    riskAmount: number,
    stopLoss: number,
    rate: number,
    leverage: number
  ): { units: number; lots: number } => {
    // Calculate position size in units
    const pipSize = formState.selectedPair.includes('JPY') ? 0.01 : 0.0001;
    const stopLossAmount = stopLoss * pipSize;
    
    let positionSizeUnits: number;
    
    if (stopLossAmount === 0) {
      return { units: 0, lots: 0 };
    }
    
    positionSizeUnits = (riskAmount / stopLossAmount);
    const positionSizeLots = positionSizeUnits / 100000; // Standard lot size

    return {
      units: positionSizeUnits,
      lots: positionSizeLots
    };
  };

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
      const accountBalance = parseFloat(formState.accountBalance);
      const riskPercentage = parseFloat(formState.riskPercentage);
      const stopLoss = parseFloat(formState.stopLoss);
      const leverage = parseFloat(formState.leverage);
      const takeProfit = parseFloat(formState.takeProfit);

      if (isNaN(accountBalance) || isNaN(riskPercentage) || isNaN(stopLoss)) {
        throw new Error('Please fill in all required fields with valid numbers');
      }

      const [baseCurrency, quoteCurrency] = formState.selectedPair.split('/') as [Currency, Currency];
      const marketData = await getMarketData(baseCurrency, quoteCurrency);
      
      const riskAmount = (accountBalance * riskPercentage) / 100;
      const position = calculatePositionSize(
        accountBalance,
        riskAmount,
        stopLoss,
        marketData.rate,
        leverage
      );

      const results: CalculationResult = {
        positionSize: formState.displayUnit === 'lots' ? position.lots : position.units,
        positionSizeLots: position.lots,
        potentialLoss: riskAmount,
        requiredMargin: (position.units * marketData.rate) / leverage,
        pipValue: (position.units * marketData.rate * (formState.selectedPair.includes('JPY') ? 0.01 : 0.0001)),
        marketData,
        riskAnalysis: analyzeRisk({
          accountBalance,
          riskPercentage,
          stopLossPips: stopLoss,
          leverage,
        }),
        leverage,
        displayUnit: formState.displayUnit,
        accountCurrency: formState.accountCurrency
      };

      onCalculationComplete(results);
      
      // Record calculation
      recordCalculation(formState.selectedPair, 0);
    } catch (error) {
      console.error('Calculation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to calculate position size');
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

  const handleSuggestions = (suggestions: TradingSuggestion[]) => {
    const suggestionMessages = suggestions.map(s => s.message);
    setFormState((prevState) => ({ ...prevState, suggestions: suggestionMessages }));
  };

  const handleAlert = (alert: { message: string; type: string }) => {
    setAlertMessage(alert.message);
  };

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
      
      const suggestions = getTradingSuggestions(scenario);
      const suggestionMessages = suggestions.map(s => s.message);
      setFormState(prev => ({ ...prev, suggestions: suggestionMessages }));
    } catch (error) {
      console.error('Error getting trading suggestions:', error);
      setFormState(prev => ({ 
        ...prev, 
        suggestions: ['Unable to generate trading suggestions. Please check your input values.'] 
      }));
    }
  }, [
    formState.accountBalance,
    formState.accountCurrency,
    formState.stopLoss,
    formState.takeProfit,
    riskAmount
  ]);

  const debouncedHandleSubmit = useCallback(
    debounce(() => {
      if (formState.accountBalance && formState.riskPercentage && formState.stopLoss) {
        handleSubmit();
      }
    }, 500),
    [formState.accountBalance, formState.riskPercentage, formState.stopLoss, formState.leverage, formState.selectedPair, handleSubmit]
  );

  useEffect(() => {
    debouncedHandleSubmit();
    return () => debouncedHandleSubmit.cancel();
  }, [debouncedHandleSubmit]);

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
          {formState.suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg backdrop-blur-sm shadow-lg transition-all duration-300 hover:translate-y-[-2px] 
                bg-blue-900/20 border border-blue-700/30 shadow-blue-900/20`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 hidden sm:block text-blue-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm font-medium flex-1 text-blue-200">
                  {suggestion}
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
