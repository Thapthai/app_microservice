'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { itemsApi } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import Link from 'next/link';
import type { Item } from '@/types/api';
import { toast } from 'sonner';
import Pagination from '@/components/Pagination';

export default function ItemsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchItems();
  }, [user?.id, currentPage, searchTerm]);

  useEffect(() => {
    filterItems();
  }, [items, categoryFilter, statusFilter]);

  const fetchItems = async () => {
    try {
      if (user?.id) {
        setLoading(true);
        const response = await itemsApi.getAll({ 
          page: currentPage, 
          limit: itemsPerPage,
          keyword: searchTerm || undefined
        });
        if (response.data) {
          setItems(response.data);
          setTotalItems(response.total);
          setTotalPages(response.lastPage);
        }
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
      toast.error('ไม่สามารถโหลดข้อมูลสินค้าได้');
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    // Filter by category (client-side)
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Filter by status (client-side)
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => 
        statusFilter === 'active' ? item.isActive : !item.isActive
      );
    }

    setFilteredItems(filtered);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleDelete = async (id: number) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?')) {
      return;
    }

    try {
      const response = await itemsApi.delete(id);
      if (response.success) {
        toast.success('ลบสินค้าเรียบร้อยแล้ว');
        fetchItems();
      } else {
        toast.error(response.message || 'ไม่สามารถลบสินค้าได้');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบสินค้า');
    }
  };

  const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean))) as string[];
  

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">จัดการสินค้า</h1>
                <p className="mt-2 text-gray-600">
                  จัดการสินค้าผ้าปูที่นอนและผลิตภัณฑ์ของคุณ
                </p>
              </div>
              <Link href="/items/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  เพิ่มสินค้าใหม่
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>ค้นหาและกรองสินค้า</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="ค้นหาสินค้า..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="หมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="สถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                    <SelectItem value="active">ใช้งาน</SelectItem>
                    <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Items List */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>รายการสินค้า</CardTitle>
                {!loading && totalItems > 0 && (
                  <p className="text-sm text-gray-600">
                    ทั้งหมด {totalItems} รายการ
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {items.length === 0 ? 'ไม่มีสินค้า' : 'ไม่พบสินค้าที่ค้นหา'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {items.length === 0 
                      ? 'เริ่มต้นด้วยการเพิ่มสินค้าแรกของคุณ'
                      : 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง'
                    }
                  </p>
                  {items.length === 0 && (
                    <div className="mt-6">
                      <Link href="/items/new">
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          เพิ่มสินค้าใหม่
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {filteredItems.map((item) => (
                    <Card key={item.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {item.name}
                            </h3>
                            {item.category && (
                              <Badge variant="secondary" className="mt-1">
                                {item.category}
                              </Badge>
                            )}
                          </div>
                          <Badge variant={item.isActive ? "default" : "destructive"}>
                            {item.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-4">
                            {item.description}
                          </p>
                        )}
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">ราคา:</span>
                            <span className="font-semibold">฿{item.price.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">จำนวน:</span>
                            <span className="font-semibold">{item.quantity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">มูลค่ารวม:</span>
                            <span className="font-semibold">
                              ฿{(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/items/${item.id}/edit`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              <Edit className="mr-2 h-4 w-4" />
                              แก้ไข
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {!loading && filteredItems.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              loading={loading}
            />
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
