/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    styledComponents: true,
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
  },
  output: 'standalone',
  poweredByHeader: false,
  images: {
    unoptimized: true
  },
}

module.exports = nextConfig
