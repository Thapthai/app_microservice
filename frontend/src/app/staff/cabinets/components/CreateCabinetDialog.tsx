import { useState, useEffect } from 'react';
import { cabinetApi } from '@/lib/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Package } from 'lucide-react';

interface CreateCabinetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateCabinetDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCabinetDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cabinet_name: '',
    cabinet_code: '',
    cabinet_type: '',
    stock_id: '',
    cabinet_status: 'AVAILIABLE',
  });

  // Reset form when dialog is closed
  useEffect(() => {
    if (!open) {
      setFormData({
        cabinet_name: '',
        cabinet_code: '',
        cabinet_type: '',
        stock_id: '',
        cabinet_status: 'AVAILIABLE',
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const data: any = {
        cabinet_name: formData.cabinet_name || undefined,
        cabinet_code: formData.cabinet_code || undefined,
        cabinet_type: formData.cabinet_type || undefined,
        cabinet_status: formData.cabinet_status || 'AVAILIABLE',
      };

      if (formData.stock_id) {
        data.stock_id = parseInt(formData.stock_id);
      }

      const response = await cabinetApi.create(data);

      if (response.success) {
        toast.success('เพิ่มตู้เรียบร้อยแล้ว');
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(response.message || 'ไม่สามารถเพิ่มตู้ได้');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มตู้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>เพิ่มตู้ใหม่</span>
          </DialogTitle>
          <DialogDescription>
            เพิ่มตู้ใหม่เข้าสู่ระบบ
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cabinet_name">ชื่อตู้</Label>
            <Input
              id="cabinet_name"
              placeholder="เช่น ตู้ A1, ตู้ห้องผ่าตัด"
              value={formData.cabinet_name}
              onChange={(e) => setFormData({ ...formData, cabinet_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cabinet_code">รหัสตู้</Label>
            <Input
              id="cabinet_code"
              placeholder="เช่น CAB001, CAB-A1"
              value={formData.cabinet_code}
              onChange={(e) => setFormData({ ...formData, cabinet_code: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cabinet_type">ประเภทตู้</Label>
            <Input
              id="cabinet_type"
              placeholder="เช่น ตู้ยา, ตู้อุปกรณ์"
              value={formData.cabinet_type}
              onChange={(e) => setFormData({ ...formData, cabinet_type: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock_id">Stock ID</Label>
            <Input
              id="stock_id"
              type="number"
              placeholder="เช่น 1, 2, 3"
              value={formData.stock_id}
              onChange={(e) => setFormData({ ...formData, stock_id: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cabinet_status">สถานะ</Label>
            <Select
              value={formData.cabinet_status}
              onValueChange={(value) => setFormData({ ...formData, cabinet_status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AVAILIABLE">ใช้งานได้ (AVAILIABLE)</SelectItem>
                <SelectItem value="USED">ใช้งานอยู่ (USED)</SelectItem>
                <SelectItem value="MAINTENANCE">ซ่อมบำรุง (MAINTENANCE)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              disabled={loading}
            >
              {loading ? 'กำลังเพิ่ม...' : 'เพิ่มตู้'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
