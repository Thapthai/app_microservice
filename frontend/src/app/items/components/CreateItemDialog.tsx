import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { itemsApi } from '@/lib/api';
import { itemSchema, type ItemFormData } from '@/lib/validations';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';

interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: number;
  onSuccess: () => void;
}

export default function CreateItemDialog({
  open,
  onOpenChange,
  userId,
  onSuccess,
}: CreateItemDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      quantity: 0,
      category: '',
    },
  });

  const onSubmit = async (data: ItemFormData) => {
    if (!userId) {
      toast.error('กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    try {
      setLoading(true);
      const response = await itemsApi.create({
        ...data,
        userId,
      });

      if (response.success) {
        toast.success('เพิ่มสินค้าเรียบร้อยแล้ว');
        form.reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(response.message || 'ไม่สามารถเพิ่มสินค้าได้');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มสินค้า');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>เพิ่มสินค้าใหม่</DialogTitle>
          <DialogDescription>
            เพิ่มสินค้าผ้าหรือผลิตภัณฑ์ใหม่เข้าสู่ระบบ
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อสินค้า *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="เช่น ผ้าคอตตอน 100%"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>คำอธิบาย</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="รายละเอียดของสินค้า..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ราคา (บาท) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำนวน</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>หมวดหมู่</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="เช่น ผ้า, หมอน, ผ้าห่ม"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'กำลังบันทึก...' : 'บันทึกสินค้า'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

