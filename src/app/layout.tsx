import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { KeepAlive } from '@/components/KeepAlive'
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
        {/* Add your Google verification meta tag here once you have it */}
        {/* <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" /> */}
      </head>
      <body className={inter.className}>
        <KeepAlive />
        {children}
      </body>
    </html>
  )
}
