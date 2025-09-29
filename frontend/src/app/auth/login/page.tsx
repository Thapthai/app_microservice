'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema, type LoginFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Mail, Lock, Chrome, User } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string>('');
  const { login, loginWithOAuth } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('');
      setLoading(true);
      await login(data);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'microsoft') => {
    try {
      setError('');
      setOauthLoading(provider);
      await loginWithOAuth(provider);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setOauthLoading('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2 pb-8">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mb-4">
            <User className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            เข้าสู่ระบบ
          </CardTitle>
          <CardDescription className="text-gray-600">
            เข้าสู่ระบบจัดการผ้าปูที่นอน POSE
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OAuth Login Buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-2 hover:bg-red-50 hover:border-red-200 transition-all duration-200"
              onClick={() => handleOAuthLogin('google')}
              disabled={!!oauthLoading}
            >
              {oauthLoading === 'google' ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  <span>กำลังเข้าสู่ระบบ...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Chrome className="w-5 h-5 text-red-500" />
                  <span className="font-medium">เข้าสู่ระบบด้วย Google</span>
                </div>
              )}
            </Button>

{/* Microsoft login temporarily hidden */}
            {false && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-2 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
                onClick={() => handleOAuthLogin('microsoft')}
                disabled={!!oauthLoading}
              >
                {oauthLoading === 'microsoft' ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span>กำลังเข้าสู่ระบบ...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-sm flex items-center justify-center">
                      <span className="text-white text-xs font-bold">M</span>
                    </div>
                    <span className="font-medium">เข้าสู่ระบบด้วย Microsoft</span>
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

          {/* Email/Password Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                อีเมล
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10 h-12 border-2 focus:border-blue-500 transition-colors"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <span>⚠️</span>
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                รหัสผ่าน
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12 border-2 focus:border-blue-500 transition-colors"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <span>⚠️</span>
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>

            {error && (
              <div className="text-sm text-red-600 text-center bg-red-50 border border-red-200 p-4 rounded-lg flex items-center justify-center space-x-2">
                <span>❌</span>
                <span>{error}</span>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl" 
              disabled={loading || !!oauthLoading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังเข้าสู่ระบบ...</span>
                </div>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </Button>

            <div className="text-center text-sm pt-4">
              <span className="text-gray-600">ยังไม่มีบัญชี? </span>
              <Link 
                href="/auth/register" 
                className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
              >
                สมัครสมาชิก
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
