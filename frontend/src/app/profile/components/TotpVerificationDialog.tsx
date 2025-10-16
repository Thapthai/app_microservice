import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Smartphone } from 'lucide-react';

interface TotpVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  setToken: (token: string) => void;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function TotpVerificationDialog({
  open,
  onOpenChange,
  token,
  setToken,
  loading,
  onConfirm,
  onCancel,
}: TotpVerificationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <div>
            <Label htmlFor="totp-token" className="text-sm font-medium">
              รหัส 2FA
            </Label>
            <Input
              id="totp-token"
              type="text"
              placeholder="123456"
              maxLength={6}
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
              onKeyPress={(e) => e.key === 'Enter' && onConfirm()}
              className="mt-1 text-center text-lg font-mono tracking-widest"
            />
            <p className="mt-1 text-xs text-gray-500">
              ใส่รหัส 6 หลักจากแอป Authenticator
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={onConfirm}
              disabled={!token || token.length !== 6 || loading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {loading ? (
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
  );
}

