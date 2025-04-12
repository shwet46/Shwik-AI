/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features including Turbo
  experimental: {
    turbo: true
  },

  // Configure webpack for PDF.js and other dependencies
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      encoding: false
    }
    
    // Add fallbacks for browser-only modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false
      }
    }
    
    return config
  },

  // Configure image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development'
  },

  // TypeScript configuration
  typescript: {
    // Comment this out to enable type checking during build
    ignoreBuildErrors: true,
  },

  // Build optimization
  swcMinify: true,
  poweredByHeader: false,
  compress: true,

  // Environment configuration
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  }
}

module.exports = nextConfig