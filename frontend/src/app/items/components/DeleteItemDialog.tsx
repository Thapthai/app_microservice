import { useState } from 'react';
import { itemsApi } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Item } from '@/types/item';
import { Loader2, AlertTriangle } from 'lucide-react';

interface DeleteItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
  onSuccess: () => void;
}

export default function DeleteItemDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: DeleteItemDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!item) {
      toast.error('ไม่พบข้อมูลสินค้า');
      return;
    }

    try {
      setLoading(true);
      const response = await itemsApi.delete(item.id);

      if (response.success) {
        toast.success('ลบสินค้าสำเร็จ');
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(response.message || 'ไม่สามารถลบสินค้าได้');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบสินค้า');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <DialogTitle>ยืนยันการลบสินค้า</DialogTitle>
              <DialogDescription className="mt-1">
                การกระทำนี้ไม่สามารถยกเลิกได้
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600">
            คุณกำลังจะลบสินค้า{' '}
            <span className="font-semibold text-gray-900">"{item?.name}"</span>
          </p>
          {item && (
            <div className="mt-4 rounded-lg bg-gray-50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ราคา:</span>
                <span className="font-medium">฿{item.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">จำนวน:</span>
                <span className="font-medium">{item.quantity}</span>
              </div>
              {item.category && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">หมวดหมู่:</span>
                  <span className="font-medium">{item.category.name}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังลบ...
              </>
            ) : (
              'ลบสินค้า'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
