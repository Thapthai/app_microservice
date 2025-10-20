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
import { signInWithGoogle } from '@/lib/firebase';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [firebaseLoading, setFirebaseLoading] = useState(false);
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

  const handleFirebaseRegister = async () => {
    try {
      setError('');
      setFirebaseLoading(true);

      // Sign in with Firebase to get ID token
      const { idToken } = await signInWithGoogle();

      // Use NextAuth with Firebase provider
      const result = await signIn('firebase', {
        idToken,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success('สมัครสมาชิกและเข้าสู่ระบบสำเร็จ');
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิกด้วย Google');
      toast.error(err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิกด้วย Google');
    } finally {
      setFirebaseLoading(false);
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
            สร้างบัญชีใหม่สำหรับระบบจัดการผ้า POSE
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Firebase Register Button */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-2 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 bg-gradient-to-r from-emerald-50 to-teal-50"
              onClick={handleFirebaseRegister}
              disabled={firebaseLoading || loading}
            >
              {firebaseLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span>กำลังสมัครสมาชิก...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                  </svg>
                  <span className="font-medium">สมัครด้วย Google</span>
                </div>
              )}
            </Button>
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
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className={`text-sm font-medium transition-colors ${
                      fieldState.error ? 'text-red-600' : 'text-gray-700'
                    }`}>ชื่อ *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors ${
                          fieldState.error ? 'text-red-400' : 'text-gray-400'
                        }`} />
                        <Input
                          type="text"
                          placeholder="ชื่อของคุณ"
                          className={`pl-10 h-12 border-2 transition-all duration-200 ${
                            fieldState.error 
                              ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 shadow-sm shadow-red-100 animate-shake' 
                              : 'border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100'
                          }`}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs mt-1.5 flex items-center gap-1 text-red-600 font-medium animate-shake" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className={`text-sm font-medium transition-colors ${
                      fieldState.error ? 'text-red-600' : 'text-gray-700'
                    }`}>อีเมล *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors ${
                          fieldState.error ? 'text-red-400' : 'text-gray-400'
                        }`} />
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          className={`pl-10 h-12 border-2 transition-all duration-200 ${
                            fieldState.error 
                              ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 shadow-sm shadow-red-100 animate-shake' 
                              : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                          }`}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs mt-1.5 flex items-center gap-1 text-red-600 font-medium animate-shake" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className={`text-sm font-medium transition-colors ${
                      fieldState.error ? 'text-red-600' : 'text-gray-700'
                    }`}>รหัสผ่าน *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors ${
                          fieldState.error ? 'text-red-400' : 'text-gray-400'
                        }`} />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className={`pl-10 pr-10 h-12 border-2 transition-all duration-200 ${
                            fieldState.error 
                              ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 shadow-sm shadow-red-100 animate-shake' 
                              : 'border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100'
                          }`}
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
                    <FormMessage className="text-xs mt-1.5 flex items-center gap-1 text-red-600 font-medium animate-shake" />
                    {!fieldState.error && (
                      <div className="text-xs text-gray-500 mt-1 space-y-1">
                        <p className="font-medium">รหัสผ่านต้องมี:</p>
                        <ul className="list-disc list-inside space-y-0.5 ml-2">
                          <li>อย่างน้อย 8 ตัวอักษร</li>
                          <li>ตัวพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว</li>
                          <li>ตัวพิมพ์เล็ก (a-z) อย่างน้อย 1 ตัว</li>
                          <li>ตัวเลข (0-9) อย่างน้อย 1 ตัว</li>
                          <li>อักษรพิเศษ (!@#$%^&*) อย่างน้อย 1 ตัว</li>
                        </ul>
                      </div>
                    )}
                  </FormItem>
                )}
              />

              {error && (
                <div className="text-sm text-red-600 text-center bg-red-50/80 border-2 border-red-200 p-4 rounded-xl flex items-center justify-center space-x-2 animate-shake shadow-lg shadow-red-100">
                  <span className="text-lg">❌</span>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-13 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:via-teal-600 hover:to-emerald-700 text-white font-semibold text-base transition-all duration-300 shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 hover:scale-[1.02] active:scale-[0.98] rounded-xl border border-emerald-400/20" 
                disabled={loading || firebaseLoading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    <span>กำลังสมัครสมาชิก...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <UserPlus className="w-5 h-5" />
                    <span>สมัครสมาชิก</span>
                  </div>
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
