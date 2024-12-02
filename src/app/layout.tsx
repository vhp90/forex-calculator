import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import VisitTracker from '@/components/VisitTracker'
import DonationPrompt from '@/components/DonationPrompt'
import { headers } from 'next/headers'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const DOMAIN = 'https://forex-calculator.onrender.com'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

export const metadata: Metadata = {
  metadataBase: new URL(DOMAIN),
  title: 'Forex Position Size Calculator | Risk Management Tool for Traders',
  description: 'Free professional Forex position size calculator. Calculate optimal lot sizes, manage risk percentage, and determine stop loss levels for successful forex trading. Built for both beginner and experienced traders.',
  keywords: [
    'forex',
    'position size',
    'calculator',
    'trading',
    'risk management',
    'stop loss',
    'forex trading',
    'position sizing',
    'trading tool',
    'forex position size calculator',
    'forex risk management',
    'forex lot size calculator',
    'trading position calculator',
    'forex risk calculator',
    'stop loss calculator',
    'forex trading tools',
    'position sizing calculator',
    'forex risk management tool',
    'forex calculator'
  ].join(','),
  authors: [{ name: 'VHP', email: 'vhp327@gmail.com' }],
  creator: 'VHP',
  publisher: 'VHP',
  formatDetection: {
    email: true,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: DOMAIN,
    title: 'Forex Position Size Calculator | Risk Management Tool for Traders',
    description: 'Free professional Forex position size calculator. Calculate optimal lot sizes, manage risk percentage, and determine stop loss levels for successful forex trading.',
    siteName: 'Forex Position Size Calculator',
    images: [{
      url: `${DOMAIN}/og-image.png`,
      width: 1200,
      height: 630,
      alt: 'Forex Position Size Calculator Preview'
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Forex Position Size Calculator | Risk Management Tool for Traders',
    description: 'Free professional Forex position size calculator. Calculate optimal lot sizes, manage risk percentage, and determine stop loss levels for successful forex trading.',
    images: [`${DOMAIN}/og-image.png`],
    creator: '@vhp',
  },
  alternates: {
    canonical: DOMAIN
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
    nocache: true,
  },
  category: 'Finance',
  classification: 'Financial Tools',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'WebApplication',
                name: 'Forex Position Size Calculator',
                description: 'Professional Forex position size calculator for risk management and trade planning.',
                url: DOMAIN,
                applicationCategory: 'FinanceApplication',
                operatingSystem: 'Web',
                offers: {
                  '@type': 'Offer',
                  price: '0',
                  priceCurrency: 'USD'
                },
                author: {
                  '@type': 'Person',
                  name: 'VHP',
                  email: 'vhp327@gmail.com'
                }
              },
              {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: [{
                  '@type': 'Question',
                  name: 'What is a Forex Position Size Calculator?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'A Forex Position Size Calculator is a tool that helps traders determine the optimal lot size for their trades based on their account size, risk tolerance, and stop loss levels. It helps manage risk and protect trading capital.'
                  }
                }, {
                  '@type': 'Question',
                  name: 'How does the Position Size Calculator work?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'The calculator takes inputs like account currency, trade currency pair, risk percentage, and stop loss to calculate the appropriate position size. It automatically converts currencies and provides the exact lot size to use for your trade.'
                  }
                }]
              },
              {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [{
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Forex Calculator',
                  item: DOMAIN
                }]
              }
            ])
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-900 text-white`}>
        {children}
        <VisitTracker />
        <DonationPrompt />
      </body>
    </html>
  )
}
