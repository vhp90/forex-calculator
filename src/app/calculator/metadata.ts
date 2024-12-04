import { Metadata } from 'next';

const DOMAIN = 'https://thedailybroker.com';

export const metadata: Metadata = {
  title: 'Forex Position Size Calculator | Risk Management Calculator',
  description: 'Calculate optimal forex position sizes with real-time exchange rates. Our professional position size calculator helps manage risk and determine ideal lot sizes for forex trading.',
  keywords: [
    'forex position calculator',
    'forex lot size calculator',
    'trading position size',
    'forex risk calculator',
    'forex trade size',
    'forex lot calculator',
    'position sizing tool',
    'forex risk management',
    'forex trading calculator',
    'stop loss calculator'
  ],
  alternates: {
    canonical: `${DOMAIN}/calculator`,
  },
  openGraph: {
    title: 'Professional Forex Position Size Calculator',
    description: 'Calculate optimal forex positions with real-time rates. Free position size calculator for proper risk management in forex trading.',
    url: `${DOMAIN}/calculator`,
    type: 'website',
    images: [
      {
        url: `${DOMAIN}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Forex Position Size Calculator Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Forex Position Size Calculator',
    description: 'Professional forex position size calculator with real-time exchange rates.',
    images: [`${DOMAIN}/og-image.png`],
  }
};
