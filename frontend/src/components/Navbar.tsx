'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from 'next-auth/react';

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();

  const logout = async () => {
    await signOut({ callbackUrl: '/auth/login' });
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Title (Hidden on mobile with sidebar) */}
          <div className="hidden lg:flex items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              ระบบจัดการผ้า
            </h2>
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center ml-auto space-x-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>ตั้งค่าบัญชี</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>ออกจากระบบ</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">เข้าสู่ระบบ</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">สมัครสมาชิก</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
