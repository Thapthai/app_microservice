export { default } from "next-auth/middleware";

// Next.js will automatically prepend basePath to matcher paths
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/items/:path*',
    '/profile/:path*',
    '/categories/:path*',
  ]
};

