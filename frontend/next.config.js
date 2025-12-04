/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  },
  // Enable standalone output for Docker
  // basePath ต้องถูก build เข้าไปใน image ตั้งแต่ build time
  // ถ้ามี NEXT_PUBLIC_BASE_PATH จะใช้ค่านั้น ไม่มีจะใช้ root path
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  // Force trailing slash to prevent redirect loops
  // เมื่อมี basePath Next.js จะ redirect จาก /basePath/ ไป /basePath (ไม่มี trailing slash)
  // trailingSlash: true จะทำให้ Next.js ไม่ redirect และใช้ trailing slash เสมอ
  trailingSlash: true,
  output: 'standalone',
  // Disable image optimization for standalone mode
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
