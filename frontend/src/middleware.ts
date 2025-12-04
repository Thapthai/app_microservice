import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        
        // ข้าม auth routes และ root path
        if (
          pathname.startsWith(`${basePath}/auth/`) ||
          pathname === basePath ||
          pathname === `${basePath}/`
        ) {
          return true;
        }
        
        // ตรวจสอบว่าเป็น protected route หรือไม่
        const protectedRoutes = [
          `${basePath}/dashboard`,
          `${basePath}/items`,
          `${basePath}/profile`,
          `${basePath}/categories`,
        ];
        
        const isProtectedRoute = protectedRoutes.some(route => 
          pathname === route || pathname.startsWith(`${route}/`)
        );
        
        // ถ้าเป็น protected route ต้องมี token
        return isProtectedRoute ? !!token : true;
      },
    },
    pages: {
      signIn: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/auth/login`,
    },
  }
);

// ใช้ matcher ที่ match ทุก path แล้วจัดการ basePath ใน middleware function
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

