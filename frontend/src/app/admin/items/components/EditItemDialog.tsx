import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { itemsApi } from '@/lib/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import type { Item, UpdateItemDto } from '@/types/item';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

// Validation schema for editing (all fields optional except required ones)
const editItemSchema = z.object({
  itemname: z.string().min(2, 'ชื่อสินค้าต้องมีอย่างน้อย 2 ตัวอักษร').max(255).optional(),
  Alternatename: z.string().max(100).optional(),
  Barcode: z.string().max(50).optional(),
  Description: z.string().optional(),
  CostPrice: z.number().min(0).optional(),
  SalePrice: z.number().min(0).optional(),
  UsagePrice: z.number().min(0).optional(),
  stock_balance: z.number().int().min(0).optional(),
  stock_min: z.number().int().min(0).optional(),
  stock_max: z.number().int().min(0).optional(),
  item_status: z.number().int().optional(),
});

type EditItemFormData = z.infer<typeof editItemSchema>;

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
  onSuccess: () => void;
}

export default function EditItemDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: EditItemDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<EditItemFormData>({
    resolver: zodResolver(editItemSchema),
    defaultValues: {
      itemname: '',
      Alternatename: '',
      Barcode: '',
      Description: '',
      CostPrice: 0,
      stock_balance: 0,
      item_status: 0,
    },
  });

  // Update form when item changes or dialog opens
  useEffect(() => {
    if (open && item) {
      form.reset({
        itemname: item.itemname || '',
        Alternatename: item.Alternatename || '',
        Barcode: item.Barcode || '',
        Description: item.Description || '',
        CostPrice: item.CostPrice ? Number(item.CostPrice) : 0,
        SalePrice: item.SalePrice ? Number(item.SalePrice) : 0,
        UsagePrice: item.UsagePrice ? Number(item.UsagePrice) : 0,
        stock_balance: item.stock_balance || 0,
        stock_min: item.stock_min || 0,
        stock_max: item.stock_max || 0,
        item_status: item.item_status || 0,
      });
    } else if (!open) {
      form.reset();
    }
  }, [open, item, form]);

  const onSubmit = async (data: EditItemFormData) => {
    if (!item) {
      toast.error('ไม่พบข้อมูลสินค้า');
      return;
    }

    try {
      setLoading(true);
      const response = await itemsApi.update(item.itemcode, data);

      if (response.success) {
        toast.success('แก้ไขสินค้าเรียบร้อยแล้ว');
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(response.message || 'ไม่สามารถแก้ไขสินค้าได้');
      }
    } catch (error: any) {
      console.error('Update item error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการแก้ไขสินค้า');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>แก้ไขสินค้า</DialogTitle>
          <DialogDescription>
            แก้ไขข้อมูลสินค้า: {item?.itemcode || ''}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* ชื่อสินค้า */}
            <FormField
              control={form.control}
              name="itemname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อสินค้า *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="เช่น ชุดเครื่องมือผ่าตัดใหญ่"
                      maxLength={255}
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ชื่อสำรอง */}
            <FormField
              control={form.control}
              name="Alternatename"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อสำรอง (EN)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="เช่น Major Surgical Instrument Set"
                      maxLength={100}
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Barcode */}
            <FormField
              control={form.control}
              name="Barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>บาร์โค้ด</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="เช่น 8859876543210"
                      maxLength={50}
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              {/* ราคาทุน */}
              <FormField
                control={form.control}
                name="CostPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ราคาทุน</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ราคาขาย */}
              <FormField
                control={form.control}
                name="SalePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ราคาขาย</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ราคาใช้งาน */}
              <FormField
                control={form.control}
                name="UsagePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ราคาใช้งาน</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* จำนวนในสต็อก */}
              <FormField
                control={form.control}
                name="stock_balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำนวนในสต็อก</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* จำนวนขั้นต่ำ */}
              <FormField
                control={form.control}
                name="stock_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำนวนขั้นต่ำ</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* จำนวนสูงสุด */}
              <FormField
                control={form.control}
                name="stock_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำนวนสูงสุด</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* คำอธิบาย */}
            <FormField
              control={form.control}
              name="Description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>คำอธิบาย</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="รายละเอียดของสินค้า..."
                      className="min-h-[100px]"
                      {...field}
                      disabled={loading}
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
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  'บันทึกการแก้ไข'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
