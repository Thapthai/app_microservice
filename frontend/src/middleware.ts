import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const pathname = req.nextUrl.pathname;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const token = req.nextauth?.token;

    // Block staff from accessing /admin
    if (pathname.startsWith(`${basePath}/admin`)) {
      // If user is staff (role === 'staff' or role object with code 'staff')
      const role = token?.role;
      if (role === 'staff' || (typeof role === 'object' && (role.code === 'staff' || role.name === 'staff'))) {
        return NextResponse.redirect(new URL(basePath + '/403', req.url));
      }
    }
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
        
        // ตรวจสอบว่าเป็น protected route หรือไม่ (แยก admin กับ route อื่น)
        const protectedRoutes = [
          `${basePath}/admin`,
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

