/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      encoding: false
    }
    return config
  },
  images: {
    domains: ['localhost'],
  }
}

module.exports = nextConfig