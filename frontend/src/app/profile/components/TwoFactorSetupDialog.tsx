import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode } from 'lucide-react';

interface TwoFactorSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCodeUrl: string;
  totpSecret: string;
  verificationCode: string;
  setVerificationCode: (code: string) => void;
  loading: boolean;
  onVerify: () => void;
}

export default function TwoFactorSetupDialog({
  open,
  onOpenChange,
  qrCodeUrl,
  totpSecret,
  verificationCode,
  setVerificationCode,
  loading,
  onVerify,
}: TwoFactorSetupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            )}
          </div>

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
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={onVerify}
              disabled={!verificationCode || verificationCode.length !== 6 || loading}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {loading ? (
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
  );
}

