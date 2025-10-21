import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { itemsApi } from '@/lib/api';
import { itemSchema } from '@/lib/validations';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { toast } from 'sonner';
import type { Item, Category } from '@/types/item';
import { Loader2, FolderOpen, Tag } from 'lucide-react';
import { z } from 'zod';

// Extend itemSchema to include is_active
const editItemSchema = itemSchema.extend({
  is_active: z.boolean(),
});

type EditItemFormData = z.infer<typeof editItemSchema>;

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
  categories: Category[];
  onSuccess: () => void;
}

export default function EditItemDialog({
  open,
  onOpenChange,
  item,
  categories,
  onSuccess,
}: EditItemDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<EditItemFormData>({
    resolver: zodResolver(editItemSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      quantity: 0,
      category_id: undefined,
      is_active: true,
    },
  });

  // Update form when item changes or dialog opens
  useEffect(() => {
    if (open && item) {
      form.reset({
        name: item.name,
        description: item.description || '',
        price: item.price,
        quantity: item.quantity,
        category_id: item.category_id || undefined,
        is_active: item.is_active,
      });
    } else if (!open) {
      // Reset to default values when dialog closes
      form.reset({
        name: '',
        description: '',
        price: 0,
        quantity: 0,
        category_id: undefined,
        is_active: true,
      });
    }
  }, [open, item, form]);

  const onSubmit = async (data: EditItemFormData) => {
    if (!item) {
      toast.error('ไม่พบข้อมูลสินค้า');
      return;
    }

    try {
      setLoading(true);
      const response = await itemsApi.update(item.id, data);

      if (response.success) {
        toast.success('แก้ไขสินค้าเรียบร้อยแล้ว');
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(response.message || 'ไม่สามารถแก้ไขสินค้าได้');
      }
    } catch (error: any) {
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
            แก้ไขข้อมูลสินค้าในระบบ
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
                      disabled={loading}
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
                      disabled={loading}
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
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? '' : parseFloat(value) || 0);
                        }}
                        disabled={loading}
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
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? '' : parseInt(value) || 0);
                        }}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-2 border-t border-gray-100">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => {
                  const selectedCategory = categories.find(cat => cat.id === field.value);
                  return (
                    <FormItem className="w-full">
                      <FormLabel className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-blue-600" />
                        <span>หมวดหมู่</span>
                      </FormLabel>
                      <FormControl>
                      <Select
                        value={field.value?.toString() || 'none'}
                        onValueChange={(val) => field.onChange(val === 'none' ? undefined : parseInt(val))}
                        disabled={loading}
                      >
                        <SelectTrigger className="w-full h-auto min-h-[2.75rem] bg-gradient-to-r from-gray-50 to-white border-gray-300 hover:border-blue-400 transition-colors py-2">
                          <SelectValue>
                            {selectedCategory ? (
                              <div className="flex flex-col items-start gap-1 w-full">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                                  <span className="font-medium text-gray-900">{selectedCategory.name}</span>
                                </div>
                                {selectedCategory.description && (
                                  <span className="text-xs text-gray-500 pl-4 w-full text-left">
                                    {selectedCategory.description}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500">เลือกหมวดหมู่...</span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <SelectItem 
                            value="none" 
                            className="text-gray-500 italic hover:bg-gray-50 cursor-pointer py-3"
                          >
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4 text-gray-400" />
                              <span>ไม่ระบุหมวดหมู่</span>
                            </div>
                          </SelectItem>
                          
                          <div className="my-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                          
                          {categories.map((category) => (
                            <SelectItem 
                              key={category.id} 
                              value={category.id.toString()}
                              className="cursor-pointer py-3 hover:bg-blue-50 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                <div className="flex flex-col gap-0.5 flex-1">
                                  <span className="font-medium text-gray-900">{category.name}</span>
                                  {category.description && (
                                    <span className="text-xs text-gray-500 line-clamp-2">{category.description}</span>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                          
                          {categories.length === 0 && (
                            <div className="text-center py-8 px-4">
                              <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                              <p className="text-sm text-gray-500">ไม่พบหมวดหมู่</p>
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">สถานะสินค้า</FormLabel>
                    <FormDescription>
                      เปิดหรือปิดการใช้งานสินค้านี้
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
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

