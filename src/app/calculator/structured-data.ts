export const calculatorStructuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Forex Position Size Calculator",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "Professional forex position size calculator with real-time exchange rates and risk management features.",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "150"
  },
  "featureList": [
    "Real-time exchange rates",
    "Position size calculation",
    "Risk percentage management",
    "Stop loss calculation",
    "Multiple currency pairs"
  ]
};

export const howToStructuredData = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Calculate Forex Position Size",
  "description": "Learn how to calculate the correct position size for your forex trades using our calculator.",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Enter Account Details",
      "text": "Enter your account balance and select your account currency"
    },
    {
      "@type": "HowToStep",
      "name": "Set Risk Parameters",
      "text": "Specify your risk percentage and stop loss in pips"
    },
    {
      "@type": "HowToStep",
      "name": "Choose Currency Pair",
      "text": "Select the currency pair you want to trade"
    },
    {
      "@type": "HowToStep",
      "name": "Get Results",
      "text": "View your recommended position size and risk analysis"
    }
  ],
  "tool": {
    "@type": "HowToTool",
    "name": "Forex Position Size Calculator"
  }
};
