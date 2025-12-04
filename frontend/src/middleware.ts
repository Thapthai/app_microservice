export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/dashboard/:path*`,
    `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/items/:path*`,
    `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/profile/:path*`,
    `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/categories/:path*`,
  ]
};

