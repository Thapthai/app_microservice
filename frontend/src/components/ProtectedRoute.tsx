'use client';


import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    // Prevent staff from accessing /admin
    if (!loading && isAuthenticated && pathname.startsWith('/admin')) {
      const role = user?.role;
      if (role === 'staff' || (typeof role === 'object' && (role.code === 'staff' || role.name === 'staff'))) {
        router.replace('/403');
      }
    }
  }, [isAuthenticated, loading, router, pathname, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Optionally, show nothing if staff is on /admin (redirect will happen)
  if (isAuthenticated && pathname.startsWith('/admin')) {
    const role = user?.role;
    if (role === 'staff' || (typeof role === 'object' && (role.code === 'staff' || role.name === 'staff'))) {
      return null;
    }
  }

  return <>{children}</>;
}
