'use client'

import { useState, useEffect } from 'react'
import { getMarketData } from '@/lib/market-data'
import { analyzeRisk } from '@/lib/risk-analysis'

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
  }) => void
}

export function CalculatorForm({ onCalculationComplete }: CalculatorFormProps) {
  const [accountBalance, setAccountBalance] = useState('')
  const [riskPercentage, setRiskPercentage] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [selectedPair, setSelectedPair] = useState('EUR/USD')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [displayUnit, setDisplayUnit] = useState<'units' | 'lots'>('units')
  const [leverage, setLeverage] = useState('0')

  const leverageOptions = [
    { value: '0', label: 'No Leverage' },
    { value: '50', label: '50:1' },
    { value: '100', label: '100:1' },
    { value: '200', label: '200:1' },
    { value: '500', label: '500:1' },
    { value: '1000', label: '1000:1' },
    { value: '2000', label: '2000:1' }
  ]

  const validateInputs = () => {
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

    // Clear any previous errors
    setError('')
    return true
  }

  const handleAccountBalanceChange = (value: string) => {
    // Only allow positive numbers
    if (parseFloat(value) >= 0 || value === '') {
      setAccountBalance(value)
    }
  }

  const handleRiskPercentageChange = (value: string) => {
    // Only allow values between 0 and 100
    const numValue = parseFloat(value)
    if ((numValue >= 0 && numValue <= 100) || value === '') {
      setRiskPercentage(value)
    }
  }

  const handleStopLossChange = (value: string) => {
    // Only allow positive numbers
    if (parseFloat(value) >= 0 || value === '') {
      setStopLoss(value)
    }
  }

  const calculatePipValue = (lotSize: number, marketData: any, base: string, quote: string) => {
    const standardLotSize = 100000 // 1 standard lot
    const positionSize = lotSize * standardLotSize
    const pipSize = quote === 'JPY' ? 0.01 : 0.0001

    let pipValue
    if (quote === 'USD') {
      // For pairs with USD as quote currency (EUR/USD, GBP/USD)
      pipValue = positionSize * pipSize
    } else if (base === 'USD') {
      // For pairs with USD as base currency (USD/JPY, USD/CHF)
      pipValue = (positionSize * pipSize) / marketData.rate
    } else {
      // For cross pairs (EUR/GBP, GBP/JPY)
      // We need to convert through USD rate
      pipValue = (positionSize * pipSize * marketData.rate)
    }

    return pipValue
  }

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!validateInputs()) {
      setIsLoading(false)
      return
    }

    try {
      const [base, quote] = selectedPair.split('/')
      const marketData = await getMarketData(base, quote)
      
      // Convert inputs to numbers
      const balance = parseFloat(accountBalance)
      const risk = parseFloat(riskPercentage)
      const stopLossPips = parseFloat(stopLoss)
      const leverageValue = parseFloat(leverage)

      // Calculate risk amount in account currency
      const riskAmount = balance * (risk / 100)

      // First, calculate pip value for 1 standard lot
      const standardLotPipValue = calculatePipValue(1, marketData, base, quote)

      // Calculate required position size in lots
      const positionSizeInLots = riskAmount / (stopLossPips * standardLotPipValue)

      // Calculate actual pip value for the position
      const actualPipValue = calculatePipValue(positionSizeInLots, marketData, base, quote)

      // Calculate position size in units
      const positionSizeInUnits = positionSizeInLots * 100000

      // Calculate required margin
      const positionValue = positionSizeInUnits * marketData.rate
      const requiredMargin = leverageValue === 0 
        ? positionValue // Full position value if no leverage
        : positionValue / leverageValue

      // Perform risk analysis
      const riskAnalysis = analyzeRisk(
        balance,
        risk,
        stopLossPips,
        leverageValue,
        marketData.volatility
      )

      // Prepare results with proper rounding
      const results = {
        positionSize: displayUnit === 'lots' 
          ? Math.round(positionSizeInLots * 100) / 100 
          : Math.round(positionSizeInUnits),
        potentialLoss: Math.round(riskAmount * 100) / 100,
        requiredMargin: Math.round(requiredMargin * 100) / 100,
        pipValue: Math.round(actualPipValue * 100) / 100, // Round to 2 decimal places for display
        displayUnit,
        leverage,
        riskAnalysis
      }

      console.log('Calculation details:', {
        standardLotPipValue,
        positionSizeInLots,
        actualPipValue,
        marketRate: marketData.rate
      })

      onCalculationComplete(results)
    } catch (err) {
      setError('Error calculating position size. Please check your inputs.')
      console.error('Calculation error:', err)
    }

    setIsLoading(false)
  }

  const handleUnitToggle = (unit: 'units' | 'lots') => {
    setDisplayUnit(unit)
    // Dispatch event to update display immediately if results exist
    const calculationEvent = new Event('calculation-update')
    window.dispatchEvent(calculationEvent)
  }

  const handleLeverageChange = (value: string) => {
    setLeverage(value);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (accountBalance && riskPercentage && stopLoss) {
        handleCalculate(new Event('input') as any);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [accountBalance, riskPercentage, stopLoss, leverage, selectedPair]);

  return (
    <form onSubmit={handleCalculate}>
      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      
      <div className="space-y-6">
        {/* Account Balance Input */}
        <div className="w-full">
          <label htmlFor="accountBalance" className="block text-sm font-medium text-gray-200 mb-2">
            Account Balance
          </label>
          <div className="input-with-prefix relative">
            <input
              type="number"
              id="accountBalance"
              min="0"
              step="1"
              value={accountBalance}
              onChange={(e) => handleAccountBalanceChange(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-7 sm:pl-8 pr-4 py-2.5 text-sm sm:text-base text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your account balance"
            />
            <span className="prefix text-gray-400 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-sm sm:text-base">$</span>
          </div>
        </div>

        {/* Risk Percentage Input */}
        <div className="w-full">
          <label htmlFor="riskPercentage" className="block text-sm font-medium text-gray-200 mb-2">
            Risk Percentage
          </label>
          <div className="relative">
            <input
              type="number"
              id="riskPercentage"
              min="0"
              max="100"
              step="1"
              value={riskPercentage}
              onChange={(e) => handleRiskPercentageChange(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 pr-8 py-2.5 text-sm sm:text-base text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter risk percentage"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm sm:text-base">%</span>
          </div>
        </div>

        {/* Stop Loss Input */}
        <div className="w-full">
          <label htmlFor="stopLoss" className="block text-sm font-medium text-gray-200 mb-2">
            Stop Loss (in pips)
          </label>
          <input
            type="number"
            id="stopLoss"
            min="0"
            step="1"
            value={stopLoss}
            onChange={(e) => handleStopLossChange(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm sm:text-base text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter stop loss in pips"
          />
        </div>

        {/* Currency Pair Selection */}
        <div className="w-full">
          <label htmlFor="currencyPair" className="block text-sm font-medium text-gray-200 mb-2">
            Currency Pair
          </label>
          <select
            id="currencyPair"
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm sm:text-base text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="EUR/USD">EUR/USD</option>
            <option value="GBP/USD">GBP/USD</option>
            <option value="USD/JPY">USD/JPY</option>
            <option value="USD/CHF">USD/CHF</option>
            <option value="EUR/GBP">EUR/GBP</option>
            <option value="GBP/JPY">GBP/JPY</option>
          </select>
        </div>

        {/* Leverage Selection */}
        <div className="w-full">
          <label htmlFor="leverage" className="block text-sm font-medium text-gray-200 mb-2">
            Leverage
          </label>
          <select
            id="leverage"
            value={leverage}
            onChange={(e) => handleLeverageChange(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm sm:text-base text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {leverageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Display Units */}
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Display Units
          </label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              type="button"
              onClick={() => setDisplayUnit('units')}
              className={`py-2 sm:py-2.5 px-3 sm:px-4 text-sm font-medium rounded-lg transition-all duration-200
                ${displayUnit === 'units'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
            >
              Units
            </button>
            <button
              type="button"
              onClick={() => setDisplayUnit('lots')}
              className={`py-2 sm:py-2.5 px-3 sm:px-4 text-sm font-medium rounded-lg transition-all duration-200
                ${displayUnit === 'lots'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
            >
              Lots
            </button>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-gray-400">
            1 lot = 100,000 units
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 sm:py-3 px-4 rounded-lg 
            font-medium text-sm sm:text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {isLoading ? 'Calculating...' : 'Calculate Position Size'}
        </button>
      </div>
    </form>
  )
}
