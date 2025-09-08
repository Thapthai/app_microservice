'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewItemPage() {
  const { user } = useAuth();
  const router = useRouter();
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
    if (!user?.id) {
      toast.error('กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    try {
      setLoading(true);
      const response = await itemsApi.create({
        ...data,
        userId: user.id,
      });

      if (response.success) {
        toast.success('เพิ่มสินค้าเรียบร้อยแล้ว');
        router.push('/items');
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
              <h1 className="text-3xl font-bold text-gray-900">เพิ่มสินค้าใหม่</h1>
              <p className="mt-2 text-gray-600">
                เพิ่มสินค้าผ้าปูที่นอนหรือผลิตภัณฑ์ใหม่เข้าสู่ระบบ
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

                    <div className="flex justify-end space-x-4">
                      <Link href="/items">
                        <Button variant="outline" type="button">
                          ยกเลิก
                        </Button>
                      </Link>
                      <Button type="submit" disabled={loading}>
                        {loading ? 'กำลังบันทึก...' : 'บันทึกสินค้า'}
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
