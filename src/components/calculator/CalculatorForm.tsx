'use client'

import { useState, useEffect, useCallback } from 'react'
import { getMarketData } from '@/lib/market-data'
import { analyzeRisk } from '@/lib/risk-analysis'
import { getTradingSuggestions, TradingSuggestion } from '../../lib/trading-suggestions';
import { TradingScenario } from '../../types/calculator';

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

export function CalculatorForm({ onCalculationComplete }: CalculatorFormProps) {
  const [formState, setFormState] = useState({
    accountBalance: '',
    riskPercentage: '',
    stopLoss: '',
    selectedPair: 'EUR/USD',
    displayUnit: 'units' as 'units' | 'lots',
    leverage: '0',
    accountCurrency: 'USD',
    riskDisplayMode: 'percentage' as 'percentage' | 'money'
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [riskAmount, setRiskAmount] = useState<number>(0)
  const [suggestions, setSuggestions] = useState<TradingSuggestion[]>([]);

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
    { value: 'USD', label: 'USD ($)', symbol: '$' },
    { value: 'EUR', label: 'EUR (€)', symbol: '€' },
    { value: 'GBP', label: 'GBP (£)', symbol: '£' },
    { value: 'JPY', label: 'JPY (¥)', symbol: '¥' },
    { value: 'AUD', label: 'AUD ($)', symbol: 'A$' },
    { value: 'CAD', label: 'CAD ($)', symbol: 'C$' },
    { value: 'CHF', label: 'CHF (Fr)', symbol: 'Fr' },
  ]

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
    let isValid = true
    
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

  const calculatePipValue = useCallback((lotSize: number, marketData: any, base: string, quote: string) => {
    const standardLotSize = 100000
    const positionSize = lotSize * standardLotSize
    const pipSize = quote === 'JPY' ? 0.01 : 0.0001

    if (quote === 'USD') {
      return positionSize * pipSize
    } else if (base === 'USD') {
      return (positionSize * pipSize) / marketData.rate
    }
    return (positionSize * pipSize * marketData.rate)
  }, [])

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!validateInputs()) {
      setIsLoading(false)
      return
    }

    try {
      const [base, quote] = formState.selectedPair.split('/')
      const marketData = await getMarketData(base, quote)
      
      // Convert inputs to numbers
      const balance = parseFloat(formState.accountBalance)
      const risk = parseFloat(formState.riskPercentage)
      const stopLossPips = parseFloat(formState.stopLoss)
      const leverageValue = parseFloat(formState.leverage)

      // Calculate risk amount in account currency
      const riskAmount = balance * (risk / 100)

      // First, calculate pip value for 1 standard lot
      const standardLotPipValue = calculatePipValue(1, marketData, base, quote)

      // Calculate required position size in lots
      const positionSizeInLots = riskAmount / (stopLossPips * standardLotPipValue)

      // Calculate actual pip value for the position
      const actualPipValue = calculatePipValue(positionSizeInLots, marketData, base, quote)

      // Calculate position size in units (1 lot = 100,000 units)
      const positionSizeInUnits = positionSizeInLots * 100000

      // Calculate required margin
      const positionValue = positionSizeInUnits * marketData.rate
      const requiredMargin = leverageValue === 0 
        ? positionValue 
        : positionValue / leverageValue

      // Perform risk analysis
      const riskAnalysis = analyzeRisk(
        balance,
        risk,
        stopLossPips,
        leverageValue,
        marketData.volatility
      )

      // Prepare final position size based on display unit
      const finalPositionSize = formState.displayUnit === 'lots'
        ? positionSizeInLots
        : positionSizeInUnits

      // Prepare results with proper rounding
      const results = {
        positionSize: finalPositionSize,
        potentialLoss: Math.round(riskAmount * 100) / 100,
        requiredMargin: Math.round(requiredMargin * 100) / 100,
        pipValue: Math.round(actualPipValue * 100) / 100,
        displayUnit: formState.displayUnit,
        leverage: formState.leverage,
        riskAnalysis,
        accountCurrency: formState.accountCurrency
      }

      onCalculationComplete(results)
    } catch (error) {
      console.error('Calculation error:', error)
      setError('Failed to calculate position size. Please try again.')
    }

    setIsLoading(false)
  }

  const handleUnitToggle = (unit: 'units' | 'lots') => {
    setFormState(prev => ({ ...prev, displayUnit: unit }))
    
    // Trigger a recalculation immediately when unit changes
    handleCalculate(new Event('submit'))
  }

  useEffect(() => {
    const scenario: TradingScenario = {
      accountBalance: parseFloat(formState.accountBalance) || 0,
      accountCurrency: formState.accountCurrency,
      riskAmount: riskAmount,
      positionSize: 0,
      stopLoss: parseFloat(formState.stopLoss) || 0,
      takeProfit: 0,
    };
    
    setSuggestions(getTradingSuggestions(scenario));
  }, [formState, riskAmount]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formState.accountBalance && formState.riskPercentage && formState.stopLoss) {
        handleCalculate(new Event('input') as any);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [formState.accountBalance, formState.riskPercentage, formState.stopLoss, formState.leverage, formState.selectedPair]);

  return (
    <form onSubmit={handleCalculate} className="w-full max-w-3xl mx-auto">
      <div className="space-y-6 p-4 sm:p-6 md:p-8 bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800/50 shadow-xl">
        {/* Grid layout for form fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Balance Section */}
          <div className="space-y-2">
            <label htmlFor="accountBalance" className="block text-sm font-medium text-gray-200">
              Account Balance
            </label>
            <div className="relative flex gap-2">
              <select
                value={formState.accountCurrency}
                onChange={(e) => setFormState(prev => ({ ...prev, accountCurrency: e.target.value }))}
                className="w-20 sm:w-24 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg px-2 py-2.5 
                  text-xs sm:text-sm text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                  shadow-lg shadow-black/10 transition-all duration-200 hover:border-gray-600/50"
              >
                {currencies.map(currency => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm pointer-events-none w-6 flex justify-center">
                  {getCurrencySymbol(formState.accountCurrency)}
                </div>
                <input
                  type="number"
                  id="accountBalance"
                  min="0"
                  step="1"
                  value={formState.accountBalance}
                  onChange={(e) => handleInputChange('accountBalance', e.target.value)}
                  className="w-full bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg pl-12 pr-4 py-2.5 
                    text-xs sm:text-sm text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                    shadow-lg shadow-black/10 transition-all duration-200 hover:border-gray-600/50"
                  placeholder={`Enter your account balance`}
                />
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
                  className="w-full bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg px-4 pr-12 py-2.5 
                    text-xs sm:text-sm text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                    shadow-lg shadow-black/10 transition-all duration-200 hover:border-gray-600/50"
                  placeholder={formState.riskDisplayMode === 'percentage' ? "Enter risk percentage" : "Enter risk amount"}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm pointer-events-none w-6 flex justify-center">
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
            <input
              type="number"
              id="stopLoss"
              min="0"
              step="1"
              value={formState.stopLoss}
              onChange={(e) => handleInputChange('stopLoss', e.target.value)}
              className="w-full bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg px-4 py-2.5 
                text-xs sm:text-sm text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                shadow-lg shadow-black/10 transition-all duration-200 hover:border-gray-600/50"
              placeholder="Enter stop loss in pips"
            />
          </div>

          {/* Currency Pair Selection */}
          <div className="space-y-2">
            <label htmlFor="currencyPair" className="block text-sm font-medium text-gray-200">
              Currency Pair
            </label>
            <select
              id="currencyPair"
              value={formState.selectedPair}
              onChange={(e) => setFormState(prev => ({ ...prev, selectedPair: e.target.value }))}
              className="w-full bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg px-4 py-2.5 
                text-xs sm:text-sm text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                shadow-lg shadow-black/10 transition-all duration-200 hover:border-gray-600/50"
            >
              <option value="EUR/USD">EUR/USD</option>
              <option value="GBP/USD">GBP/USD</option>
              <option value="USD/JPY">USD/JPY</option>
              <option value="USD/CHF">USD/CHF</option>
              <option value="AUD/USD">AUD/USD</option>
            </select>
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
              className="w-full bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg px-4 py-2.5 
                text-xs sm:text-sm text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 
                shadow-lg shadow-black/10 transition-all duration-200 hover:border-gray-600/50"
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
            font-medium text-sm sm:text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
            backdrop-blur-sm border border-indigo-500/30 hover:border-indigo-400/30 shadow-lg shadow-indigo-900/10
            transform hover:translate-y-[-2px] mt-8 hover:text-indigo-100"
        >
          {isLoading ? 'Calculating...' : 'Calculate Position Size'}
        </button>
      </div>
    </form>
  )
}
