import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import VisitTracker from '@/components/VisitTracker'
import DonationPrompt from '@/components/DonationPrompt'
import { headers } from 'next/headers'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const DOMAIN = 'https://thedailybroker.com'
const ALT_DOMAIN = 'https://forex-calculator.onrender.com'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

export const metadata: Metadata = {
  metadataBase: new URL(DOMAIN),
  title: 'Forex Position Size Calculator | Professional Risk Management Tool',
  description: 'Free professional Forex position size calculator with real-time exchange rates. Calculate optimal lot sizes, manage risk percentage, and determine stop loss levels for successful forex trading. Perfect for both beginner and experienced traders.',
  keywords: [
    'forex calculator',
    'position size calculator',
    'forex position calculator',
    'forex risk management',
    'trading calculator',
    'stop loss calculator',
    'lot size calculator',
    'forex trading tool',
    'risk management calculator',
    'forex risk calculator'
  ],
  authors: [{ name: 'The Daily Broker' }],
  alternates: {
    canonical: DOMAIN,
    languages: {
      'en-US': DOMAIN,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: DOMAIN,
    siteName: 'Forex Position Size Calculator',
    title: 'Professional Forex Position Size Calculator | Risk Management Tool',
    description: 'Calculate optimal forex position sizes with our free professional calculator. Features real-time exchange rates and advanced risk management tools.',
    images: [
      {
        url: `${DOMAIN}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Forex Position Size Calculator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Forex Position Size Calculator | Risk Management Tool',
    description: 'Professional forex position size calculator with real-time exchange rates and risk management features.',
    images: [`${DOMAIN}/og-image.png`],
  },
  category: 'Finance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = headers()
  const host = headersList.get('host') || ''
  const isAltDomain = host.includes('forex-calculator.onrender.com')
  const currentDomain = isAltDomain ? ALT_DOMAIN : DOMAIN

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
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
                  name: 'The Daily Broker',
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
