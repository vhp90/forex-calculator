import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Free Forex Position Size Calculator | Risk Management Tool',
  description: 'Professional Forex Position Size Calculator. Calculate lot size, manage risk, and get trading insights. Free online tool for forex traders.',
  keywords: 'forex calculator, position size calculator, forex risk management, forex lot size calculator, trading calculator, forex trading tools',
  openGraph: {
    title: 'Free Forex Position Size Calculator | Risk Management Tool',
    description: 'Calculate your forex position size and manage trading risk with our professional calculator. Get instant results and risk analysis.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Forex Calculator'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Forex Position Size Calculator',
    description: 'Professional forex position size calculator with risk management insights.'
  },
  verification: {
    google: 'your-google-verification-code', // You'll need to add this later
  },
  alternates: {
    canonical: 'https://your-domain.com' // Replace with your actual domain
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
