# Forex Risk Calculator

A web-based Forex risk calculator that helps traders make informed decisions about position sizing and risk management through intuitive calculations and data visualization.

## Features

- Position Size Calculator
  - Support for all major currency pairs
  - Real-time exchange rate data
  - Risk percentage calculation
  - Stop loss analysis
- Admin Dashboard
  - Analytics tracking
  - API performance monitoring
  - Secure authentication
- Mobile-Responsive Design
  - Dark theme with yellow accents
  - Collapsible support button
  - Integrated contact system

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Exchange Rate API
- SameSite Secure Cookies

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env.local` file with the following variables:
   ```
   EXCHANGE_RATE_API_KEY=your_api_key
   RENDER_EXTERNAL_URL=your_render_url
   ADMIN_USERNAME=your_admin_username
   ADMIN_PASSWORD=your_admin_password
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/src/app` - App router pages and layouts
- `/src/components` - Reusable UI components
- `/src/lib` - Utility functions and shared logic
- `/src/types` - TypeScript type definitions
- `/src/styles` - Global styles and Tailwind CSS config

## Contact & Support

For questions, technical support, or feedback, please contact vhp327@gmail.com.

## Security

- Secure cookie handling with SameSite attributes
- HTTPS enforcement in production
- XSS protection
- CSRF prevention
- Rate limiting

## License

This project is proprietary and not open for redistribution.
