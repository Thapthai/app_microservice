/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  },

  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  
  // Enable trailing slash to prevent 308 redirects
  trailingSlash: true,

  output: 'standalone',
  // Disable image optimization for standalone mode
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
