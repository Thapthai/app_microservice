/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  },
  // Enable standalone output for Docker
  output: 'standalone',
  // Disable image optimization for standalone mode
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
