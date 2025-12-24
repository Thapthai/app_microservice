'use client';

import { useState, useEffect } from 'react';
import { itemsApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import type { Item } from '@/types/item';

interface UpdateMinMaxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
  onSuccess: () => void;
}

export default function UpdateMinMaxDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: UpdateMinMaxDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    Minimum: 0,
    Maximum: 0,
  });
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (item && open) {
      console.log('🔍 Item data for MinMax:', {
        itemcode: item.itemcode,
        itemname: item.itemname,
        Minimum: item.Minimum,
        Maximum: item.Maximum,
      });
      
      setFormData({
        Minimum: item.Minimum ?? 0,
        Maximum: item.Maximum ?? 0,
      });
      setErrors([]);
    }
  }, [item, open]);

  const validateForm = () => {
    const newErrors: string[] = [];

    if (formData.Maximum < formData.Minimum) {
      newErrors.push('Maximum ต้องมากกว่าหรือเท่ากับ Minimum');
    }

    if (formData.Minimum < 0) {
      newErrors.push('Minimum ต้องมากกว่าหรือเท่ากับ 0');
    }

    if (formData.Maximum < 0) {
      newErrors.push('Maximum ต้องมากกว่าหรือเท่ากับ 0');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!item?.itemcode) {
      toast.error('ไม่พบข้อมูลสินค้า');
      return;
    }

    try {
      setLoading(true);
      const response = await itemsApi.updateMinMax(item.itemcode, formData);

      if (response.success) {
        toast.success('อัปเดต Min/Max สำเร็จ');
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(response.message || 'อัปเดต Min/Max ไม่สำเร็จ');
      }
    } catch (error: any) {
      console.error('Update min/max error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดต');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>อัปเดต Min/Max</DialogTitle>
          <DialogDescription>
            ตั้งค่าจำนวนขั้นต่ำและสูงสุดของสินค้า
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Info */}
          <div className="bg-blue-50 p-3 rounded-lg space-y-2">
            <div className="text-sm">
              <span className="text-gray-600">รหัส: </span>
              <code className="text-xs bg-white px-2 py-1 rounded">{item?.itemcode}</code>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">ชื่อ: </span>
              <span className="font-medium">{item?.itemname}</span>
            </div>
            <div className="flex items-center space-x-4 pt-2 border-t border-blue-200">
              <div className="text-sm">
                <span className="text-gray-600">Min ปัจจุบัน: </span>
                <span className="font-bold text-blue-600">{item?.Minimum ?? 0}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Max ปัจจุบัน: </span>
                <span className="font-bold text-blue-600">{item?.Maximum ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  {errors.map((error, idx) => (
                    <p key={idx} className="text-sm text-red-600">{error}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
            {/* Minimum */}
            <div>
              <Label htmlFor="minimum">
                Minimum <span className="text-red-500">*</span>
              </Label>
              <Input
                id="minimum"
                type="number"
                min="0"
                value={formData.Minimum}
                onChange={(e) => setFormData({ ...formData, Minimum: parseInt(e.target.value) || 0 })}
                required
                className="font-medium"
              />
              <p className="text-xs text-gray-500 mt-1">จำนวนขั้นต่ำ</p>
            </div>

            {/* Maximum */}
            <div>
              <Label htmlFor="maximum">
                Maximum <span className="text-red-500">*</span>
              </Label>
              <Input
                id="maximum"
                type="number"
                min="0"
                value={formData.Maximum}
                onChange={(e) => setFormData({ ...formData, Maximum: parseInt(e.target.value) || 0 })}
                required
                className="font-medium"
              />
              <p className="text-xs text-gray-500 mt-1">จำนวนสูงสุด</p>
            </div>
          </div>

          {/* Change Summary */}
          {(formData.Minimum !== (item?.Minimum ?? 0) || formData.Maximum !== (item?.Maximum ?? 0)) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm font-medium text-yellow-800 mb-1">การเปลี่ยนแปลง:</p>
              <div className="space-y-1">
                {formData.Minimum !== (item?.Minimum ?? 0) && (
                  <p className="text-xs text-yellow-700">
                    • Minimum: <span className="line-through">{item?.Minimum ?? 0}</span> → <span className="font-bold">{formData.Minimum}</span>
                  </p>
                )}
                {formData.Maximum !== (item?.Maximum ?? 0) && (
                  <p className="text-xs text-yellow-700">
                    • Maximum: <span className="line-through">{item?.Maximum ?? 0}</span> → <span className="font-bold">{formData.Maximum}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

