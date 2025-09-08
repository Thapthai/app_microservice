'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { itemsApi } from '@/lib/api';
import { itemSchema, type ItemFormData } from '@/lib/validations';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { Item } from '@/types/api';

interface EditItemPageProps {
  params: {
    id: string;
  };
}

export default function EditItemPage({ params }: EditItemPageProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [item, setItem] = useState<Item | null>(null);

  const form = useForm<ItemFormData & { isActive: boolean }>({
    resolver: zodResolver(itemSchema.extend({
      isActive: z.boolean().optional(),
    })),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      quantity: 0,
      category: '',
      isActive: true,
    },
  });

  useEffect(() => {
    fetchItem();
  }, [params.id]);

  const fetchItem = async () => {
    try {
      const response = await itemsApi.getById(parseInt(params.id));
      if (response.success && response.data) {
        const itemData = response.data;
        setItem(itemData);
        
        // Check if user owns this item
        if (itemData.userId !== user?.id) {
          toast.error('คุณไม่มีสิทธิ์แก้ไขสินค้านี้');
          router.push('/items');
          return;
        }

        form.reset({
          name: itemData.name,
          description: itemData.description || '',
          price: itemData.price,
          quantity: itemData.quantity,
          category: itemData.category || '',
          isActive: itemData.isActive,
        });
      } else {
        toast.error('ไม่พบสินค้าที่ต้องการแก้ไข');
        router.push('/items');
      }
    } catch (error: any) {
      toast.error('ไม่สามารถโหลดข้อมูลสินค้าได้');
      router.push('/items');
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: ItemFormData & { isActive: boolean }) => {
    try {
      setLoading(true);
      const { isActive, ...updateData } = data;
      
      const response = await itemsApi.update(parseInt(params.id), {
        ...updateData,
        isActive,
      });

      if (response.success) {
        toast.success('อัปเดตสินค้าเรียบร้อยแล้ว');
        router.push('/items');
      } else {
        toast.error(response.message || 'ไม่สามารถอัปเดตสินค้าได้');
      }
    } catch (error: any) {
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
                แก้ไขข้อมูลสินค้า: {item.name}
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
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ชื่อสินค้า *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="เช่น ผ้าปูที่นอนคอตตอน 100%"
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                              placeholder="เช่น ผ้าปูที่นอน, หมอน, ผ้าห่ม"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">สถานะการใช้งาน</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              เปิด/ปิดการใช้งานสินค้านี้
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
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
