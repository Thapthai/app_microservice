'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { registerSchema, type RegisterFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Mail, Lock, User, Chrome, UserPlus, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';

export default function RegisterPage() {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError('');
      setLoading(true);
      
      // Register user via backend API
      await api.post('/auth/register', data);
      
      // Auto-login after registration using NextAuth
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('สมัครสมาชิกสำเร็จแล้ว แต่เข้าสู่ระบบไม่สำเร็จ กรุณาลองเข้าสู่ระบบอีกครั้ง');
        router.push('/auth/login');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthRegister = async (provider: 'google' | 'microsoft') => {
    try {
      setError('');
      setOauthLoading(provider);
      
      // Use NextAuth signIn for OAuth
      await signIn(provider, {
        callbackUrl: '/dashboard',
      });
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิกด้วย OAuth');
      setOauthLoading('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2 pb-8">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            สมัครสมาชิก
          </CardTitle>
          <CardDescription className="text-gray-600">
            สร้างบัญชีใหม่สำหรับระบบจัดการผ้าปูที่นอน POSE
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OAuth Register Buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-2 hover:bg-red-50 hover:border-red-200 transition-all duration-200"
              onClick={() => handleOAuthRegister('google')}
              disabled={!!oauthLoading}
            >
              {oauthLoading === 'google' ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  <span>กำลังสมัครสมาชิก...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Chrome className="w-5 h-5 text-red-500" />
                  <span className="font-medium">สมัครด้วย Google</span>
                </div>
              )}
            </Button>

{/* Microsoft register temporarily hidden */}
            {false && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-2 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
                onClick={() => handleOAuthRegister('microsoft')}
                disabled={!!oauthLoading}
              >
                {oauthLoading === 'microsoft' ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span>กำลังสมัครสมาชิก...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-sm flex items-center justify-center">
                      <span className="text-white text-xs font-bold">M</span>
                    </div>
                    <span className="font-medium">สมัครด้วย Microsoft</span>
                  </div>
                )}
              </Button>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-[1px] bg-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-gray-500 font-medium">หรือ</span>
            </div>
          </div>

          {/* Email/Password Register Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">ชื่อ</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="ชื่อของคุณ"
                          className="pl-10 h-12 border-2 focus:border-emerald-500 transition-colors"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">อีเมล</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          className="pl-10 h-12 border-2 focus:border-emerald-500 transition-colors"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">รหัสผ่าน</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="pl-10 pr-10 h-12 border-2 focus:border-emerald-500 transition-colors"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <div className="text-xs text-gray-500 mt-1 space-y-1">
                      <p>รหัสผ่านต้องมี:</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li>อย่างน้อย 8 ตัวอักษร</li>
                        <li>ตัวพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว</li>
                        <li>ตัวพิมพ์เล็ก (a-z) อย่างน้อย 1 ตัว</li>
                        <li>ตัวเลข (0-9) อย่างน้อย 1 ตัว</li>
                        <li>อักษรพิเศษ (!@#$%^&*) อย่างน้อย 1 ตัว</li>
                      </ul>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="text-sm text-red-600 text-center bg-red-50 border border-red-200 p-4 rounded-lg flex items-center justify-center space-x-2">
                  <span>❌</span>
                  <span>{error}</span>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl" 
                disabled={loading || !!oauthLoading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>กำลังสมัครสมาชิก...</span>
                  </div>
                ) : (
                  'สมัครสมาชิก'
                )}
              </Button>

              <div className="text-center text-sm pt-4">
                <span className="text-gray-600">มีบัญชีอยู่แล้ว? </span>
                <Link 
                  href="/auth/login" 
                  className="text-emerald-600 hover:text-emerald-800 font-medium hover:underline transition-colors"
                >
                  เข้าสู่ระบบ
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
