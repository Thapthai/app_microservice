'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { staffUserApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ASSETS } from '@/lib/assets';
import { User, Lock, AlertCircle, Sparkles, Eye, EyeOff } from 'lucide-react';

export default function StaffLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await staffUserApi.staffUserLogin({ ...formData, roleType: 'staff' }); // ระบุชัดเจนว่าเป็น staff login
      
      if (response.success) {
        // Store staff token and user info in localStorage
        localStorage.setItem('staff_token', response.data.access_token);
        localStorage.setItem('staff_user', JSON.stringify(response.data.user));
        
        // Redirect to staff dashboard
        router.push('/staff/dashboard');
      } else {
        setError(response.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 relative z-10">
        <CardHeader className="space-y-4 pb-6">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative bg-white rounded-xl p-4 shadow-lg">
                <img
                  src={ASSETS.LOGO}
                  alt="POSE Logo"
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          <div className="text-center space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Staff Portal
            </CardTitle>
            <CardDescription className="text-base">
              เข้าสู่ระบบสำหรับพนักงาน
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border-l-4 border-red-500 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                อีเมล
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="staff@example.com"
                  className="pl-10 h-12 border-2 focus:border-green-500 transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                รหัสผ่าน
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-12 border-2 focus:border-green-500 transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>กำลังเข้าสู่ระบบ...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
              
                  <span>เข้าสู่ระบบ</span>
                </div>
              )}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">หรือ</span>
              </div>
            </div>

            <div className="text-center space-y-2">
              <Link href="/auth/login">
                <Button variant="outline" className="w-full border-2 hover:bg-blue-50 hover:border-blue-600 transition-all">
                  <User className="mr-2 h-4 w-4" />
                  เข้าสู่ระบบ Admin
                </Button>
              </Link>
              
              <Link href="/">
                <Button variant="ghost" className="w-full text-gray-600 hover:text-gray-900">
                  ← กลับหน้าหลัก
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

