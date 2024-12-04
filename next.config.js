/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    styledComponents: true,
    removeConsole: process.env.NODE_ENV === 'production',
  },
  env: {
    EXCHANGE_RATE_API_KEY: process.env.EXCHANGE_RATE_API_KEY,
    PORT: process.env.PORT || 3000,
    APP_URL: process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 3000}`
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    appDir: true,
    serverActions: true,
    serverComponentsExternalPackages: ['@mui/material'],
    optimizeCss: true,
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  images: {
    domains: ['thedailybroker.com', 'forex-calculator.onrender.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, must-revalidate'
        }
      ]
    },
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store'
        }
      ]
    }
  ]
}

module.exports = nextConfig
