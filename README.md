# Forex Risk Calculator

A web-based Forex risk calculator that helps traders make informed decisions about position sizing and risk management through intuitive calculations and data visualization.

## Features

- User Authentication
- Risk Calculator
- Position Size Calculations
- Basic Dashboard
- Calculation History
- User Profile

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase (Database)
- NextAuth (Authentication)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
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
