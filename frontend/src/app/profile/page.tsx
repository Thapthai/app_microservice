'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, Mail, Lock, Shield, Save, Eye, EyeOff, Smartphone, QrCode, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

const profileSchema = z.object({
  name: z.string().min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'),
  email: z.string().email('กรุณาใส่อีเมลที่ถูกต้อง'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'กรุณาใส่รหัสผ่านปัจจุบัน'),
  newPassword: z.string()
    .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
    .regex(/[a-z]/, 'รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว')
    .regex(/[A-Z]/, 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว')
    .regex(/[0-9]/, 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว')
    .regex(/[^a-zA-Z0-9]/, 'รหัสผ่านต้องมีอักษรพิเศษอย่างน้อย 1 ตัว'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'รหัสผ่านไม่ตรงกัน',
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  // ดึงข้อมูลจาก localStorage โดยตรง ไม่พึ่ง useAuth()
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // ดึงข้อมูลจาก localStorage ทันที
    const getStoredUser = () => {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            return userData.user || userData;
          } catch (error) {
            console.error('Failed to parse stored user:', error);
            return null;
          }
        }
      }
      return null;
    };

    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  // Function to update user state and localStorage
  const updateUser = (updates: Partial<any>) => {
    setUser((prev: any) => {
      if (prev) {
        const updatedUser = { ...prev, ...updates };
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // Dispatch custom event to notify other components (like Navbar)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('userUpdated'));
        }

        return updatedUser;
      }
      return prev;
    });
  };
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showTotpDialog, setShowTotpDialog] = useState(false);
  const [passwordAction, setPasswordAction] = useState<'enable' | 'disable'>('enable');
  const [showConfirmPasswordDialog, setShowConfirmPasswordDialog] = useState(false);
  const [pendingProfileData, setPendingProfileData] = useState<ProfileFormData | null>(null);
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [passwordLoading2FA, setPasswordLoading2FA] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Update form values when user data is loaded
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user, profileForm]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    // Store the form data and show confirmation modal
    setPendingProfileData(data);
    setShowConfirmPasswordDialog(true);
  };

  const handleConfirmProfileUpdate = async () => {
    if (!pendingProfileData || !confirmPasswordValue) {
      toast.error('กรุณาใส่รหัสผ่านเพื่อยืนยันการเปลี่ยนแปลง');
      return;
    }

    try {
      setLoading(true);

      // Call the update profile API
      const response = await authApi.updateUserProfile({
        name: pendingProfileData.name,
        email: pendingProfileData.email,
        currentPassword: confirmPasswordValue,
      });

      if (response.success && response.data) {
        // Update user data in state and localStorage
        updateUser(response.data);
        toast.success('อัพเดตข้อมูลโปรไฟล์สำเร็จ');
        
        // Close modal and reset
        setShowConfirmPasswordDialog(false);
        setPendingProfileData(null);
        setConfirmPasswordValue('');
      } else {
        toast.error(response.message || 'เกิดข้อผิดพลาดในการอัพเดตข้อมูล');
      }
    } catch (error: any) {
      // Handle API errors
      const errorMessage = error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการอัพเดตข้อมูล';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelProfileUpdate = () => {
    setShowConfirmPasswordDialog(false);
    setPendingProfileData(null);
    setConfirmPasswordValue('');
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      setPasswordLoading(true);
      
      // Call the change password API
      const response = await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      if (response.success) {
        toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
        passwordForm.reset();
      } else {
        toast.error(response.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      }
    } catch (error: any) {
      // Handle API errors
      const errorMessage = error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน';
      toast.error(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    // For OAuth users, skip password confirmation
    if (user?.preferredAuthMethod === 'oauth2' || !user?.hasPassword) {
      try {
        setTwoFactorLoading(true);

        // Call backend API to enable 2FA without password
        const response = await authApi.enable2FA(''); // Empty password for OAuth users

        if (response.success && response.data) {
          setQrCodeUrl(response.data.qrCodeUrl);
          setTotpSecret(response.data.secret);
          setShow2FADialog(true);
          toast.success('สร้าง QR Code สำเร็จ กรุณาสแกนด้วยแอป Authenticator');
        } else {
          throw new Error(response.message || 'ไม่สามารถเปิดใช้งาน 2FA ได้');
        }
      } catch (error: any) {
        toast.error(error.message || 'เกิดข้อผิดพลาดในการเปิดใช้งาน 2FA');
      } finally {
        setTwoFactorLoading(false);
      }
    } else {
      // For JWT users, show password confirmation
      setPasswordAction('enable');
      setShowPasswordDialog(true);
    }
  };

  const handleDisable2FA = async () => {
    // For OAuth users, skip password confirmation and go directly to TOTP
    if (user?.preferredAuthMethod === 'oauth2' || !user?.hasPassword) {
      setShowTotpDialog(true);
    } else {
      // For JWT users, show password confirmation first
      setPasswordAction('disable');
      setShowPasswordDialog(true);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('กรุณาใส่รหัสยืนยัน 6 หลัก');
      return;
    }

    try {
      setTwoFactorLoading(true);

      // Call backend API to verify 2FA setup
      const response = await authApi.verify2FASetup(totpSecret, verificationCode);

      if (response.success) {
        toast.success('เปิดใช้งานการยืนยันตัวตนสองขั้นตอนสำเร็จ');

        // Show backup codes if provided
        if (response.data?.backupCodes) {
          setBackupCodes(response.data.backupCodes);
          setShowBackupCodesDialog(true);
        }

        setShow2FADialog(false);
        setVerificationCode('');

        // Update user state to reflect 2FA enabled
        updateUser({ twoFactorEnabled: true });
      } else {
        throw new Error(response.message || 'รหัสยืนยันไม่ถูกต้อง');
      }
    } catch (error: any) {
      toast.error(error.message || 'รหัสยืนยันไม่ถูกต้อง');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    toast.success('คัดลอกรหัสสำรองแล้ว');
  };

  const handleDownloadBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    const blob = new Blob([`รหัสสำรองสำหรับการยืนยันตัวตนสองขั้นตอน\n\n${codesText}\n\nหมายเหตุ: เก็บรหัสเหล่านี้ไว้ในที่ปลอดภัย แต่ละรหัสใช้ได้เพียงครั้งเดียว`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes-2fa.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('ดาวน์โหลดรหัสสำรองแล้ว');
  };

  const handlePasswordConfirm = async () => {
    if (!confirmPasswordValue) {
      toast.error('กรุณาใส่รหัสผ่าน');
      return;
    }

    try {
      setPasswordLoading2FA(true);

      if (passwordAction === 'enable') {
        // Call backend API to enable 2FA
        const response = await authApi.enable2FA(confirmPasswordValue);

        if (response.success && response.data) {
          // Backend ส่ง QR Code เป็น base64 data URL มาแล้ว
          setQrCodeUrl(response.data.qrCodeUrl);
          setTotpSecret(response.data.secret);
          setShow2FADialog(true);
          setShowPasswordDialog(false);
          setConfirmPasswordValue('');
          toast.success('สร้าง QR Code สำเร็จ กรุณาสแกนด้วยแอป Authenticator');
        } else {
          throw new Error(response.message || 'ไม่สามารถเปิดใช้งาน 2FA ได้');
        }
      } else if (passwordAction === 'disable') {
        // For disable, we need both password and 2FA token
        setShowPasswordDialog(false);
        setShowTotpDialog(true);
      }
    } catch (error: any) {
      toast.error(error.message || 'รหัสผ่านไม่ถูกต้อง');
    } finally {
      setPasswordLoading2FA(false);
    }
  };

  const handleTotpConfirm = async () => {
    if (!totpToken || totpToken.length !== 6) {
      toast.error('กรุณาใส่รหัส 2FA 6 หลัก');
      return;
    }

    try {
      setPasswordLoading2FA(true);

      // For OAuth users, use empty password
      const password = (user?.preferredAuthMethod === 'oauth2' || !user?.hasPassword) ? '' : confirmPasswordValue;
      const response = await authApi.disable2FA(password, totpToken);

      if (response.success) {
        toast.success('ปิดการใช้งานการยืนยันตัวตนสองขั้นตอนแล้ว');
        setShowTotpDialog(false);
        setConfirmPasswordValue('');
        setTotpToken('');

        // Update user state to reflect 2FA disabled
        updateUser({ twoFactorEnabled: false });
      } else {
        throw new Error(response.message || 'ไม่สามารถปิดใช้งาน 2FA ได้');
      }
    } catch (error: any) {
      toast.error(error.message || 'รหัส 2FA ไม่ถูกต้อง');
    } finally {
      setPasswordLoading2FA(false);
    }
  };

  const handle2FAToggle = (enabled: boolean) => {
    if (enabled) {
      handleEnable2FA();
    } else {
      handleDisable2FA();
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">ตั้งค่าโปรไฟล์</h1>
              <p className="mt-2 text-gray-600">จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณ</p>
            </div>

            <div className="space-y-6">
              {/* Profile Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>ข้อมูลโปรไฟล์</span>
                  </CardTitle>
                  <CardDescription>
                    {user?.preferredAuthMethod === 'oauth2'
                      ? 'อัพเดตชื่อของคุณ (อีเมลมาจาก OAuth Provider)'
                      : 'อัพเดตข้อมูลส่วนตัวของคุณ'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <div className={`grid grid-cols-1 gap-6 ${(user?.preferredAuthMethod === 'jwt' && user?.hasPassword) ? 'sm:grid-cols-2' : 'sm:grid-cols-1'}`}>
                        <FormField
                          control={profileForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ชื่อ</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <Input
                                    placeholder="ชื่อของคุณ"
                                    className="pl-10"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Email field - Only show for JWT users */}
                        {user?.preferredAuthMethod === 'jwt' && user?.hasPassword && (
                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>อีเมล</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                      type="email"
                                      placeholder="your@email.com"
                                      className="pl-10"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {/* OAuth Email Display - Read-only */}
                        {user?.preferredAuthMethod === 'oauth2' && (
                          <div className="col-span-full">
                            <Label className="text-sm font-medium text-gray-700">อีเมล (จาก OAuth Provider)</Label>
                            <div className="mt-1 relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <Input
                                type="email"
                                value={user?.email || ''}
                                className="pl-10 bg-gray-50 cursor-not-allowed"
                                disabled
                                readOnly
                              />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                              อีเมลนี้มาจาก OAuth Provider และไม่สามารถเปลี่ยนแปลงได้
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={loading}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                        >
                          {loading ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>กำลังบันทึก...</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <Save className="w-4 h-4" />
                              <span>บันทึกการเปลี่ยนแปลง</span>
                            </div>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Password Change - Only show for JWT users */}
              {user?.preferredAuthMethod === 'jwt' && user?.hasPassword && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Lock className="h-5 w-5" />
                      <span>เปลี่ยนรหัสผ่าน</span>
                    </CardTitle>
                    <CardDescription>
                      อัพเดตรหัสผ่านเพื่อความปลอดภัยของบัญชี
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>รหัสผ่านปัจจุบัน</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <Input
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="pl-10 pr-10"
                                    {...field}
                                  />
                                  <button
                                    type="button"
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                  >
                                    {showCurrentPassword ? (
                                      <EyeOff className="w-4 h-4 text-gray-400" />
                                    ) : (
                                      <Eye className="w-4 h-4 text-gray-400" />
                                    )}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>รหัสผ่านใหม่</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                      type={showNewPassword ? 'text' : 'password'}
                                      placeholder="••••••••"
                                      className="pl-10 pr-10"
                                      {...field}
                                    />
                                    <button
                                      type="button"
                                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                      onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                      {showNewPassword ? (
                                        <EyeOff className="w-4 h-4 text-gray-400" />
                                      ) : (
                                        <Eye className="w-4 h-4 text-gray-400" />
                                      )}
                                    </button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ยืนยันรหัสผ่านใหม่</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                      type={showConfirmPassword ? 'text' : 'password'}
                                      placeholder="••••••••"
                                      className="pl-10 pr-10"
                                      {...field}
                                    />
                                    <button
                                      type="button"
                                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                      {showConfirmPassword ? (
                                        <EyeOff className="w-4 h-4 text-gray-400" />
                                      ) : (
                                        <Eye className="w-4 h-4 text-gray-400" />
                                      )}
                                    </button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="text-xs text-gray-500 space-y-1">
                          <p>รหัสผ่านใหม่ต้องมี:</p>
                          <ul className="list-disc list-inside space-y-0.5 ml-2">
                            <li>อย่างน้อย 8 ตัวอักษร</li>
                            <li>ตัวพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว</li>
                            <li>ตัวพิมพ์เล็ก (a-z) อย่างน้อย 1 ตัว</li>
                            <li>ตัวเลข (0-9) อย่างน้อย 1 ตัว</li>
                            <li>อักษรพิเศษ (!@#$%^&*) อย่างน้อย 1 ตัว</li>
                          </ul>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={passwordLoading}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          >
                            {passwordLoading ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>กำลังเปลี่ยน...</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <Shield className="w-4 h-4" />
                                <span>เปลี่ยนรหัสผ่าน</span>
                              </div>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              {/* Two-Factor Authentication */}
              {/* Two-Factor Authentication - Only show for JWT users */}
              {user?.preferredAuthMethod === 'jwt' && user?.hasPassword && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Smartphone className="h-5 w-5" />
                      <span>การยืนยันตัวตนสองขั้นตอน (2FA)</span>
                    </CardTitle>
                    <CardDescription>
                      เพิ่มความปลอดภัยให้กับบัญชีของคุณด้วยการยืนยันตัวตนสองขั้นตอน
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-700">
                          สถานะการยืนยันตัวตนสองขั้นตอน
                        </Label>
                        <p className="text-sm text-gray-500">
                          {user?.twoFactorEnabled
                            ? 'บัญชีของคุณได้รับการปกป้องด้วย 2FA แล้ว'
                            : 'เปิดใช้งาน 2FA เพื่อเพิ่มความปลอดภัย'
                          }
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {user?.twoFactorEnabled ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            <Shield className="w-4 h-4 mr-1" />
                            เปิดใช้งาน
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            <Shield className="w-4 h-4 mr-1" />
                            ปิดใช้งาน
                          </span>
                        )}
                        <Switch
                          checked={user?.twoFactorEnabled || false}
                          onCheckedChange={handle2FAToggle}
                          disabled={twoFactorLoading}
                        />
                      </div>
                    </div>

                    {user?.twoFactorEnabled && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-5 h-5 text-green-600" />
                          <p className="text-sm font-medium text-green-800">
                            บัญชีของคุณได้รับการปกป้องแล้ว
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-green-700">
                          คุณจะต้องใส่รหัสจากแอป Authenticator ทุกครั้งที่เข้าสู่ระบบ
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>ข้อมูลบัญชี</span>
                  </CardTitle>
                  <CardDescription>
                    ข้อมูลเพิ่มเติมเกี่ยวกับบัญชีของคุณ
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">ID ผู้ใช้</Label>
                      <p className="mt-1 text-sm text-gray-900">{user?.id}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">วิธีการเข้าสู่ระบบ</Label>
                      <p className="mt-1 text-sm text-gray-900">
                        {user?.preferredAuthMethod === 'oauth2' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            🔗 OAuth (Google)
                          </span>
                        ) : user?.preferredAuthMethod === 'jwt' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            🔑 รหัสผ่าน
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            ❓ ไม่ระบุ
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">วันที่สร้างบัญชี</Label>
                      <p className="mt-1 text-sm text-gray-900">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('th-TH') : '-'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">สถานะรหัสผ่าน</Label>
                      <p className="mt-1 text-sm text-gray-900">
                        {user?.hasPassword ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✅ มีรหัสผ่าน
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            ⚠️ ไม่มีรหัสผ่าน (OAuth เท่านั้น)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* 2FA Setup Dialog */}
        <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <QrCode className="h-5 w-5" />
                <span>ตั้งค่าการยืนยันตัวตนสองขั้นตอน</span>
              </DialogTitle>
              <DialogDescription>
                สแกน QR Code ด้วยแอป Google Authenticator หรือแอปที่รองรับ TOTP
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* QR Code */}
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="QR Code for 2FA setup"
                      className="w-48 h-48 object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded">
                      <QrCode className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>

                {qrCodeUrl && (
                  <p className="text-xs text-green-600 text-center">
                    ✅ QR Code พร้อมใช้งาน
                  </p>
                )}</div>

              {/* Manual Entry */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  หรือใส่รหัสนี้ในแอป Authenticator:
                </p>
                {totpSecret ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <code className="text-sm font-mono text-gray-800 select-all">
                      {totpSecret}
                    </code>
                    <p className="text-xs text-gray-500 mt-1">
                      คลิกเพื่อเลือกทั้งหมด
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-lg p-3">
                    <span className="text-sm text-gray-400">รอสร้างรหัส...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Verification */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="verification-code" className="text-sm font-medium">
                  รหัสยืนยัน 6 หลัก
                </Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-lg font-mono tracking-widest"
                />
                <p className="mt-1 text-xs text-gray-500">
                  ใส่รหัส 6 หลักจากแอป Authenticator
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShow2FADialog(false)}
                  className="flex-1"
                  disabled={twoFactorLoading}
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleVerify2FA}
                  disabled={!verificationCode || verificationCode.length !== 6 || twoFactorLoading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {twoFactorLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>กำลังยืนยัน...</span>
                    </div>
                  ) : (
                    'ยืนยันและเปิดใช้งาน'
                  )}
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">📱 วิธีการตั้งค่า:</h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>ดาวน์โหลด <strong>Google Authenticator</strong> หรือแอปที่รองรับ TOTP</li>
                <li>สแกน QR Code ด้านบน หรือใส่รหัส secret ในแอป</li>
                <li>ใส่รหัส 6 หลักที่แสดงในแอปเพื่อยืนยันการตั้งค่า</li>
                <li>เก็บรหัสสำรองที่จะได้รับไว้ในที่ปลอดภัย</li>
              </ol>
              <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-600">
                💡 <strong>เคล็ดลับ:</strong> รหัส TOTP จะเปลี่ยนทุก 30 วินาที
              </div>
            </div>

          </DialogContent>
        </Dialog>

        {/* Password Confirmation Modal */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-blue-600" />
                <span>ยืนยันตัวตน</span>
              </DialogTitle>
              <DialogDescription>
                {passwordAction === 'enable'
                  ? 'กรุณาใส่รหัสผ่านเพื่อเปิดใช้งาน 2FA'
                  : 'กรุณาใส่รหัสผ่านเพื่อปิดใช้งาน 2FA'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Password Input */}
              <div>
                <Label htmlFor="confirm-password" className="text-sm font-medium">
                  รหัสผ่านปัจจุบัน
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="ใส่รหัสผ่านของคุณ"
                  value={confirmPasswordValue}
                  onChange={(e) => setConfirmPasswordValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePasswordConfirm()}
                  className="mt-1"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordDialog(false);
                    setConfirmPasswordValue('');
                  }}
                  className="flex-1"
                  disabled={passwordLoading2FA}
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handlePasswordConfirm}
                  disabled={!confirmPasswordValue || passwordLoading2FA}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {passwordLoading2FA ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>กำลังยืนยัน...</span>
                    </div>
                  ) : (
                    'ยืนยัน'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* TOTP Confirmation Modal */}
        <Dialog open={showTotpDialog} onOpenChange={setShowTotpDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-orange-600" />
                <span>ยืนยันรหัส 2FA</span>
              </DialogTitle>
              <DialogDescription>
                กรุณาใส่รหัส 6 หลักจากแอป Authenticator เพื่อปิดใช้งาน 2FA
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* TOTP Input */}
              <div>
                <Label htmlFor="totp-token" className="text-sm font-medium">
                  รหัส 2FA
                </Label>
                <Input
                  id="totp-token"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={totpToken}
                  onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, ''))}
                  onKeyPress={(e) => e.key === 'Enter' && handleTotpConfirm()}
                  className="mt-1 text-center text-lg font-mono tracking-widest"
                />
                <p className="mt-1 text-xs text-gray-500">
                  ใส่รหัส 6 หลักจากแอป Authenticator
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTotpDialog(false);
                    setTotpToken('');
                    setConfirmPasswordValue('');
                  }}
                  className="flex-1"
                  disabled={passwordLoading2FA}
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleTotpConfirm}
                  disabled={!totpToken || totpToken.length !== 6 || passwordLoading2FA}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {passwordLoading2FA ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>กำลังปิด...</span>
                    </div>
                  ) : (
                    'ปิดใช้งาน 2FA'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Backup Codes Modal */}
        <Dialog open={showBackupCodesDialog} onOpenChange={setShowBackupCodesDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span>รหัสสำรองของคุณ</span>
              </DialogTitle>
              <DialogDescription>
                เก็บรหัสเหล่านี้ไว้ในที่ปลอดภัย แต่ละรหัสใช้ได้เพียงครั้งเดียว
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Warning */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <div className="text-amber-600 mt-0.5">⚠️</div>
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">สำคัญมาก!</p>
                    <ul className="text-xs space-y-1">
                      <li>• เก็บรหัสเหล่านี้ไว้ในที่ปลอดภัย</li>
                      <li>• ใช้เมื่อไม่สามารถเข้าถึงแอป Authenticator ได้</li>
                      <li>• แต่ละรหัสใช้ได้เพียงครั้งเดียว</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Backup Codes */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="bg-white border rounded px-3 py-2 text-center">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={handleCopyBackupCodes}
                  className="flex-1 flex items-center justify-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>คัดลอก</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadBackupCodes}
                  className="flex-1 flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลด</span>
                </Button>
              </div>

              {/* Close Button */}
              <Button
                onClick={() => setShowBackupCodesDialog(false)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                เก็บรหัสเรียบร้อยแล้ว
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirm Password Modal for Profile Update */}
        <Dialog open={showConfirmPasswordDialog} onOpenChange={setShowConfirmPasswordDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                ยืนยันการเปลี่ยนแปลงข้อมูล
              </DialogTitle>
              <DialogDescription>
                กรุณาใส่รหัสผ่านปัจจุบันเพื่อยืนยันการเปลี่ยนแปลงข้อมูลโปรไฟล์
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Show what will be changed */}
              {pendingProfileData && (
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-gray-700">การเปลี่ยนแปลงที่จะทำ:</p>
                  <div className="text-sm text-gray-600">
                    <p><strong>ชื่อ:</strong> {pendingProfileData.name}</p>
                    <p><strong>อีเมล:</strong> {pendingProfileData.email}</p>
                  </div>
                </div>
              )}

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="confirmPasswordValue">รหัสผ่านปัจจุบัน</Label>
                <div className="relative">
                  <Input
                    id="confirmPasswordValue"
                    type="password"
                    placeholder="ใส่รหัสผ่านปัจจุบัน"
                    value={confirmPasswordValue}
                    onChange={(e) => setConfirmPasswordValue(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelProfileUpdate}
                  className="flex-1"
                  disabled={loading}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmProfileUpdate}
                  className="flex-1"
                  disabled={loading || !confirmPasswordValue}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      กำลังอัพเดต...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      ยืนยันการเปลี่ยนแปลง
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute >
  );
}
