'use client'

import { useState } from 'react'
import CalculatorForm from '@/components/calculator/CalculatorForm'
import ResultsDisplay from '@/components/calculator/ResultsDisplay'
import RiskAnalysis from '@/components/calculator/RiskAnalysis'

interface CalculationResults {
  positionSize: number;
  potentialLoss: number;
  requiredMargin: number;
  pipValue: number;
  displayUnit: 'units' | 'lots';
  leverage: number;
  accountCurrency: string;
  riskAnalysis: {
    riskRating: 'Low' | 'Medium' | 'High' | 'Very High';
    riskScore: number;
    suggestions: string[];
    maxRecommendedLeverage: number;
  };
}

export default function CalculatorPage() {
  const [calculationResults, setCalculationResults] = useState<CalculationResults>({
    positionSize: 0,
    potentialLoss: 0,
    requiredMargin: 0,
    pipValue: 0,
    displayUnit: 'units',
    leverage: 1,
    accountCurrency: 'USD',
    riskAnalysis: {
      riskRating: 'Low',
      riskScore: 0,
      suggestions: [],
      maxRecommendedLeverage: 0
    }
  })

  const handleCalculationComplete = (newResults: CalculationResults) => {
    setCalculationResults(newResults)
  }

  return (
    <div className="min-h-screen bg-gray-900 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-blue-400 mb-2 sm:mb-4">
            Forex Position Size Calculator
          </h1>
          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
            Calculate your position size and analyze trading risk with our advanced calculator
          </p>
        </div>
        
        <div className="grid gap-6 sm:gap-8 md:grid-cols-[2fr,1fr]">
          <div className="space-y-6 sm:space-y-8">
            <div className="glass-card p-4 sm:p-6">
              <CalculatorForm onCalculationComplete={handleCalculationComplete} />
            </div>
            <div className="glass-card p-4 sm:p-6">
              <ResultsDisplay {...calculationResults} />
            </div>
          </div>
          
          <div className="glass-card p-4 sm:p-6 h-fit">
            <RiskAnalysis {...calculationResults.riskAnalysis} />
          </div>
        </div>
      </div>
    </div>
  )
}
