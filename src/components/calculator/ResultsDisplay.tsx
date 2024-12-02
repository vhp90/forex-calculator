'use client'

import { useEffect } from 'react'

interface ResultsDisplayProps {
  positionSize: number
  potentialLoss: number
  requiredMargin: number
  pipValue: number
  displayUnit: 'units' | 'lots'
  leverage: number
  accountCurrency: string
}

export default function ResultsDisplay({
  positionSize,
  potentialLoss,
  requiredMargin,
  pipValue,
  displayUnit,
  leverage,
  accountCurrency
}: ResultsDisplayProps) {
  useEffect(() => {
    const handleCalculationUpdate = () => {
      console.log('Calculation update received')
    }

    window.addEventListener('calculation-update', handleCalculationUpdate)
    return () => window.removeEventListener('calculation-update', handleCalculationUpdate)
  }, [])

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: displayUnit === 'lots' ? 2 : 0,
      maximumFractionDigits: displayUnit === 'lots' ? 2 : 0,
    }).format(num)
  }

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'AUD': 'A$',
      'CAD': 'C$',
      'CHF': 'Fr'
    }
    return symbols[currency] || '$'
  }

  const currencySymbol = getCurrencySymbol(accountCurrency)

  return (
    <div className="relative p-6 glass-card rounded-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 pointer-events-none" />
      
      <h2 className="relative text-2xl font-bold text-blue-400 mb-6 flex items-center gap-2">
        <span className="inline-block w-2 h-8 bg-blue-500 rounded-full" />
        Calculation Results
      </h2>

      <dl className="relative grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="space-y-1 p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors">
          <dt className="text-sm font-medium text-gray-400">Position Size</dt>
          <dd className="text-2xl font-bold text-white">
            {formatNumber(positionSize)} {displayUnit}
          </dd>
        </div>

        <div className="space-y-1 p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors">
          <dt className="text-sm font-medium text-gray-400">Potential Loss</dt>
          <dd className="text-2xl font-bold text-red-400">{currencySymbol}{formatNumber(potentialLoss)}</dd>
        </div>

        <div className="space-y-1 p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors">
          <dt className="text-sm font-medium text-gray-400">Required Margin</dt>
          <dd className="text-2xl font-bold text-green-400">{currencySymbol}{formatNumber(requiredMargin)}</dd>
        </div>

        <div className="space-y-1 p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors">
          <dt className="text-sm font-medium text-gray-400">Pip Value</dt>
          <dd className="text-2xl font-bold text-purple-400">{currencySymbol}{formatNumber(pipValue)}</dd>
        </div>
      </dl>
      
      <div className="relative mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-start gap-3">
          <span className="text-blue-400 text-xl">💡</span>
          <p className="text-sm text-blue-300">
            These calculations are based on current market rates and your specified risk parameters.
          </p>
        </div>
      </div>
    </div>
  )
}
