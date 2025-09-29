'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function OAuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setAuthData } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Determine provider from URL path or default to google
        const currentPath = window.location.pathname;
        let provider = 'google';
        if (currentPath.includes('/microsoft')) {
          provider = 'microsoft';
        }


        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        // Exchange code for token
        const response = await authApi.oauthLogin(provider as 'google' | 'microsoft', code, state || undefined);

        if (response.success && response.data) {

          const { user, accessToken, token } = response.data;

          // Backend sends accessToken, but we also check for token for backward compatibility
          const authToken = accessToken || token;

          if (user && authToken) {
            // Use AuthContext to set auth data (same as regular login)
            setAuthData(user, authToken);

            setStatus('success');

            // Redirect to dashboard using router (no page reload needed)
            router.push('/dashboard');
          } else {
            console.error('Missing user or token:', { user, accessToken, token, authToken });
            throw new Error(`OAuth login failed - missing ${!user ? 'user' : 'token'}`);
          }
        } else {
          console.error('OAuth login failed:', response);
          throw new Error(response.message || 'OAuth login failed');
        }
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        console.error('Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });

        let errorMessage = err.message || 'OAuth authentication failed';
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }

        setError(errorMessage);
        setStatus('error');
      }
    };

    handleOAuthCallback();
  }, [searchParams, router]);

  const handleRetry = () => {
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          {status === 'loading' && (
            <>
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                กำลังเข้าสู่ระบบ...
              </CardTitle>
              <CardDescription className="text-gray-600">
                กรุณารอสักครู่ เรากำลังตรวจสอบข้อมูลของคุณ
              </CardDescription>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-600">
                เข้าสู่ระบบสำเร็จ!
              </CardTitle>
              <CardDescription className="text-gray-600">
                กำลังนำคุณไปยังหน้าหลัก...
              </CardDescription>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-red-600">
                เกิดข้อผิดพลาด
              </CardTitle>
              <CardDescription className="text-gray-600">
                ไม่สามารถเข้าสู่ระบบได้
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="text-center">
              <div className="animate-pulse space-y-2">
                <div className="h-2 bg-blue-200 rounded w-3/4 mx-auto"></div>
                <div className="h-2 bg-blue-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center text-sm text-gray-600">
              <p>ยินดีต้อนรับเข้าสู่ระบบ POSE!</p>
              <div className="mt-4 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="text-sm text-red-600 text-center bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="font-medium">รายละเอียดข้อผิดพลาด:</p>
                <p className="mt-1">{error}</p>
                <details className="mt-2 text-left">
                  <summary className="cursor-pointer text-xs text-gray-500">Debug Information</summary>
                  <div className="mt-2 text-xs font-mono bg-gray-100 p-2 rounded">
                    <p>URL: {window.location.href}</p>
                    <p>Code: {searchParams.get('code') ? 'Present' : 'Missing'}</p>
                    <p>State: {searchParams.get('state') || 'None'}</p>
                    <p>Error: {searchParams.get('error') || 'None'}</p>
                  </div>
                </details>
              </div>
              <Button
                onClick={handleRetry}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                ลองใหม่อีกครั้ง
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
