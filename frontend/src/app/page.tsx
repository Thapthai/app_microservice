'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Package, Users, BarChart3, Shield } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
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
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">ระบบจัดการ</span>{' '}
                  <span className="block text-blue-600 xl:inline">ผ้าปูที่นอน</span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                  ระบบจัดการสินค้าผ้าปูที่นอนและผลิตภัณฑ์ที่เกี่ยวข้อง พร้อมฟีเจอร์ครบครันสำหรับการบริหารจัดการธุรกิจของคุณ
                </p>
                <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                  <div className="rounded-md shadow">
                    <Link href="/auth/register">
                      <Button size="lg" className="w-full">
                        เริ่มต้นใช้งาน
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                    <Link href="/auth/login">
                      <Button variant="outline" size="lg" className="w-full">
                        เข้าสู่ระบบ
                      </Button>
                    </Link>
                  </div>
                </div>
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
                  <CardTitle className="text-lg">จัดการสินค้า</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    เพิ่ม แก้ไข และจัดการสินค้าผ้าปูที่นอนได้อย่างง่ายดาย
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
            สมัครสมาชิกวันนี้และเริ่มจัดการธุรกิจผ้าปูที่นอนของคุณได้ทันที
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