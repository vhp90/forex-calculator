import { FC } from 'react';
import Script from 'next/script';

interface SEOProps {
  canonicalUrl?: string;
}

const SEO: FC<SEOProps> = ({ canonicalUrl }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Forex Position Size Calculator",
    "description": "Professional Forex position size calculator for risk management in trading",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Position size calculation",
      "Risk management",
      "Stop loss calculation",
      "Real-time exchange rates",
      "Multiple currency pairs support"
    ]
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is a Forex Position Size Calculator?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A Forex Position Size Calculator is a tool that helps traders determine the optimal lot size for their trades based on their account size, risk tolerance, and stop loss level."
        }
      },
      {
        "@type": "Question",
        "name": "How does the Position Size Calculator work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The calculator uses your account balance, risk percentage, and stop loss distance to calculate the appropriate position size (lot size) for your trade, ensuring proper risk management."
        }
      },
      {
        "@type": "Question",
        "name": "Why is position sizing important in Forex trading?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Position sizing is crucial for risk management as it helps traders limit potential losses to a predetermined percentage of their account, promoting sustainable trading practices."
        }
      }
    ]
  };

  return (
    <>
      <Script 
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Script 
        id="faq-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      {canonicalUrl && (
        <link rel="canonical" href={canonicalUrl} />
      )}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
    </>
  );
};

export default SEO;
