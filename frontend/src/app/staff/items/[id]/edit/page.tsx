'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { itemsApi } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { Item } from '@/types/item';

interface EditItemPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Validation schema for editing
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

export default function EditItemPage({ params }: EditItemPageProps) {
  const [itemcode, setItemcode] = useState<string>('');

  // Unwrap params Promise (Next.js 15+)
  useEffect(() => {
    params.then((p) => setItemcode(p.id));
  }, [params]);
  
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [item, setItem] = useState<Item | null>(null);

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

  useEffect(() => {
    if (itemcode) {
      fetchItem();
    }
  }, [itemcode]);

  const fetchItem = async () => {
    if (!itemcode) return;
    try {
      const response = await itemsApi.getById(itemcode);
      if (response.success && response.data) {
        const itemData = response.data;
        setItem(itemData);

        form.reset({
          itemname: itemData.itemname || '',
          Alternatename: itemData.Alternatename || '',
          Barcode: itemData.Barcode || '',
          Description: itemData.Description || '',
          CostPrice: itemData.CostPrice ? Number(itemData.CostPrice) : 0,
          SalePrice: itemData.SalePrice ? Number(itemData.SalePrice) : 0,
          UsagePrice: itemData.UsagePrice ? Number(itemData.UsagePrice) : 0,
          stock_balance: itemData.stock_balance || 0,
          stock_min: itemData.stock_min || 0,
          stock_max: itemData.stock_max || 0,
          item_status: itemData.item_status || 0,
        });
      } else {
        toast.error('ไม่พบสินค้าที่ต้องการแก้ไข');
        router.push('/items');
      }
    } catch (error: any) {
      console.error('Failed to fetch item:', error);
      toast.error('ไม่สามารถโหลดข้อมูลสินค้าได้');
      router.push('/items');
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: EditItemFormData) => {
    try {
      setLoading(true);

      const response = await itemsApi.update(itemcode, data);

      if (response.success) {
        toast.success('อัปเดตสินค้าเรียบร้อยแล้ว');
        router.push('/items');
      } else {
        toast.error(response.message || 'ไม่สามารถอัปเดตสินค้าได้');
      }
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดตสินค้า');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="mb-6">
              <Link href="/items">
                <Button variant="ghost" className="mb-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  กลับ
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">แก้ไขสินค้า</h1>
              <p className="mt-2 text-gray-600">
                แก้ไขข้อมูลสินค้า: {item.itemname || item.itemcode}
              </p>
            </div>

            {/* Form */}
            <Card>
              <CardHeader>
                <CardTitle>ข้อมูลสินค้า</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

                    <div className="flex justify-end space-x-4">
                      <Link href="/items">
                        <Button variant="outline" type="button">
                          ยกเลิก
                        </Button>
                      </Link>
                      <Button type="submit" disabled={loading}>
                        {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
