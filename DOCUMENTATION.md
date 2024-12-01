# Forex Calculator Documentation

## Project Overview
A professional-grade forex position size calculator built with Next.js, TypeScript, and Tailwind CSS. The application helps traders calculate optimal position sizes while managing risk effectively.

## Technical Stack
- **Framework**: Next.js 13+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Render.com
- **API Integration**: Exchange Rate API
- **State Management**: React Hooks
- **Build Tool**: npm

## Directory Structure

### `/src/app`
Next.js 13 app directory containing routes and API endpoints.

- `page.tsx`: Landing page with features and benefits
- `calculator/page.tsx`: Main calculator page
- `layout.tsx`: Root layout with metadata and global styles
- `globals.css`: Global CSS styles

#### API Routes
- `/api/exchange-rates/route.ts`: Handles exchange rate fetching with caching
- `/api/uptime/route.ts`: Health check endpoint with self-ping mechanism

### `/src/components`
React components organized by feature.

#### Calculator Components
- `calculator/CalculatorForm.tsx`: Main form component for position size calculations
- `calculator/ResultsDisplay.tsx`: Displays calculation results
- `calculator/RiskAnalysis.tsx`: Shows risk analysis and suggestions

### `/src/lib`
Core business logic and utilities.

- `api/exchange-rates.ts`: Exchange rate API integration with retry logic
- `api/types.ts`: TypeScript definitions for API responses
- `calculator.ts`: Position size calculation logic
- `market-data.ts`: Market data handling with caching
- `risk-analysis.ts`: Risk assessment calculations
- `trading-suggestions.ts`: Trading advice generation

### `/src/types`
TypeScript type definitions.

- `calculator.ts`: Types for calculator inputs and results
- `trading.ts`: Types for trading-related data structures

## Key Features

### 1. Position Size Calculator
- Supports all major currency pairs
- Calculates position size in lots and units
- Risk-based calculations
- Real-time exchange rate data

### 2. Risk Management
- Risk percentage calculation
- Stop loss and take profit analysis
- Margin requirement calculation
- Leverage options

### 3. Trading Insights
- Professional trading suggestions
- Risk analysis
- Market volatility consideration
- Risk-reward ratio analysis

## API Integration

### Exchange Rate API
- Base URL: `https://v6.exchangerate-api.com/v6/`
- Caching Duration: 12 hours
- Fallback Mechanism: Built-in fallback rates
- Retry Logic: 3 attempts with exponential backoff

### Health Check System
- Endpoint: `/api/uptime`
- Self-ping Interval: 10 minutes
- Uses Render's health check system
- Environment Variable: `RENDER_EXTERNAL_URL`

## Environment Variables
```env
EXCHANGE_RATE_API_KEY=your_api_key
RENDER_EXTERNAL_URL=your_render_url
NODE_ENV=production
```

## Caching Strategy

### Exchange Rates
- Primary Cache: 12 hours
- Fallback Cache: 1 hour
- Implementation: Next.js unstable_cache
- Cache Tags: ['exchange-rates']

### Market Data
- Duration: 1 minute
- Scope: Per currency pair
- Storage: In-memory Map
- Auto-refresh on expiry

## Type System

### Currency Types
```typescript
type Currency = 'USD' | 'EUR' | 'GBP' | 'CHF' | 'CAD' | 'JPY' | 'AUD' | 'NZD';

interface CurrencyPairType {
  from: Currency;
  to: Currency;
}
```

### Calculator Types
```typescript
interface CalculatorInput {
  accountBalance: number;
  riskPercentage: number;
  stopLoss: number;
  baseCurrency: Currency;
  quoteCurrency: Currency;
}

interface CalculationResult {
  positionSize: number;
  potentialLoss: number;
  requiredMargin: number;
  pipValue: number;
}
```

## Deployment

### Render.com Configuration
```yaml
services:
  - type: web
    name: forex-calculator
    env: node
    runtime: "node:18.x"
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /api/uptime
    plan: free
```

## SEO Optimization
- Meta tags for social sharing
- OpenGraph and Twitter card support
- Google site verification ready
- Semantic HTML structure
- Mobile-responsive design

## UI/UX Features
- Dark theme with blue accents
- Responsive design
- Interactive form elements
- Real-time calculations
- Clear error messages
- Loading states
- Professional trading suggestions

## Error Handling
- API fallback mechanism
- Type validation
- Input validation
- Network error handling
- Rate limiting consideration
- Graceful degradation

## Future Enhancements
1. Additional currency pairs
2. Historical rate analysis
3. Chart integration
4. User preferences storage
5. Advanced risk metrics
6. PDF report generation
7. Multiple language support

## Maintenance
- Regular dependency updates
- API health monitoring
- Performance optimization
- Type system maintenance
- Cache invalidation strategy

## Support
For technical support or contributions, please open an issue on the repository.
