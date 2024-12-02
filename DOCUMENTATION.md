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

- `page.tsx`: Landing page with features, benefits, and contact information
- `calculator/page.tsx`: Main calculator page
- `layout.tsx`: Root layout with metadata and global styles
- `globals.css`: Global CSS styles

#### API Routes
- `/api/exchange-rates/route.ts`: Handles exchange rate fetching with caching
- `/api/uptime/route.ts`: Health check endpoint with self-ping mechanism
- `/api/admin/auth/route.ts`: Handles admin authentication
- `/api/admin/stats/route.ts`: Provides analytics data for admin dashboard

### `/src/components`
React components organized by feature.

#### Calculator Components
- `calculator/CalculatorForm.tsx`: Main form component for position size calculations
- `calculator/ResultsDisplay.tsx`: Displays calculation results
- `calculator/RiskAnalysis.tsx`: Shows risk analysis and suggestions
- `DonationPrompt.tsx`: Support button component with mobile responsiveness

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

### 4. User Interface
- Mobile-responsive design
- Dark theme with yellow accents
- Sticky support button
- Contact integration
- Admin interface

## Contact & Support
- Primary Contact: vhp327@gmail.com
- Support Button: Mobile-responsive with collapse functionality
- Contact Button: Integrated in landing page

## Admin Features
- Secure admin dashboard
- Login system with session management
- Analytics tracking
- API performance monitoring

## Security Features
- Secure cookie handling with SameSite attributes
- HTTPS enforcement in production
- XSS protection
- CSRF prevention
- Rate limiting

## Environment Variables
```env
EXCHANGE_RATE_API_KEY=your_api_key
RENDER_EXTERNAL_URL=your_render_url
NODE_ENV=production
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
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

## Cookie Configuration
```typescript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/'
}
```

## Maintenance
- Regular dependency updates
- API health monitoring
- Performance optimization
- Type system maintenance
- Cache invalidation strategy

## Support
For technical support or questions, please contact vhp327@gmail.com or open an issue on the repository.
