'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ASSETS } from '@/lib/assets';
import { Package, Users, BarChart3, Shield, Sparkles, User } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/admin/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="text-center">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                    <div className="relative bg-white rounded-2xl p-6 shadow-2xl">
                      <img
                        src={ASSETS.LOGO}
                        alt="POSE Logo"
                        width={120}
                        height={120}
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>

                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">ระบบจัดการเวชภัณฑ์</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mt-2">
                    ที่ทันสมัยและครบครัน
                  </span>
                </h1>
                
                <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 sm:text-xl">
                  จัดการเวชภัณฑ์และอุปกรณ์ทางการแพทย์ได้อย่างมีประสิทธิภาพ 
                  พร้อมระบบรายงานและการติดตามแบบ Real-time
                </p>

                {/* Action Buttons */}
                <div className="mt-10 max-w-2xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <Link href="/auth/login">
                      <Button 
                        size="lg" 
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <User className="mr-2 h-5 w-5" />
                        เข้าสู่ระบบ Admin
                      </Button>
                    </Link>
                    
                    <Link href="/auth/staff/login">
                      <Button 
                        size="lg" 
                        variant="outline"
                        className="w-full border-2 border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <User className="mr-2 h-5 w-5" />
                        เข้าสู่ระบบ Staff
                      </Button>
                    </Link>
                  </div>
                  
                  {/* <div className="flex justify-center">
                    <Link href="/auth/register">
                      <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                        ยังไม่มีบัญชี? สมัครเลย →
                      </Button>
                    </Link>
                  </div> */}
                </div>

                {/* Stats */}
                {/* <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">10K+</div>
                    <div className="text-sm text-gray-600 mt-1">รายการเวชภัณฑ์</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">24/7</div>
                    <div className="text-sm text-gray-600 mt-1">ติดตามแบบ Real-time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">99.9%</div>
                    <div className="text-sm text-gray-600 mt-1">ความแม่นยำ</div>
                  </div>
                </div> */}
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">
              ฟีเจอร์หลัก
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              ทุกสิ่งที่คุณต้องการสำหรับการจัดการธุรกิจ
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="text-center">
                <CardHeader>
                  <Package className="h-12 w-12 text-blue-600 mx-auto" />
                  <CardTitle className="text-lg">จัดการอุปกรณ์</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    เพิ่ม แก้ไข และจัดการเวชภัณฑ์ได้อย่างง่ายดาย
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <Users className="h-12 w-12 text-blue-600 mx-auto" />
                  <CardTitle className="text-lg">จัดการผู้ใช้</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    ระบบผู้ใช้ที่ปลอดภัย พร้อมการจัดการสิทธิ์การเข้าถึง
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <BarChart3 className="h-12 w-12 text-blue-600 mx-auto" />
                  <CardTitle className="text-lg">รายงานและสถิติ</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    ดูข้อมูลสถิติและรายงานการขายแบบเรียลไทม์
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <Shield className="h-12 w-12 text-blue-600 mx-auto" />
                  <CardTitle className="text-lg">ความปลอดภัย</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    ระบบรักษาความปลอดภัยขั้นสูงด้วย JWT Authentication
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">พร้อมเริ่มต้นแล้วหรือยัง?</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-blue-200">
            สมัครสมาชิกวันนี้และเริ่มจัดการเวชภัณฑ์ของคุณได้ทันที
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary" className="mt-8">
              สมัครสมาชิกฟรี
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}