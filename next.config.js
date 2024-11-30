/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    styledComponents: true,
  },
  env: {
    EXCHANGE_RATE_API_KEY: process.env.EXCHANGE_RATE_API_KEY,
    PORT: process.env.PORT || 3000,
  },
  experimental: {
    serverComponentsExternalPackages: ['@mui/material'],
  },
}

module.exports = nextConfig
