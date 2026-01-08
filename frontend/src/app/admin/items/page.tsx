'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { itemsApi } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import type { Item } from '@/types/item';
import { toast } from 'sonner';
import { Package, Search, Plus, RefreshCw, Pencil, Trash2, Filter, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CreateItemDialog from './components/CreateItemDialog';
import EditItemDialog from './components/EditItemDialog';
import DeleteItemDialog from './components/DeleteItemDialog';
import UpdateMinMaxDialog from './components/UpdateMinMaxDialog';

export default function ItemsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMinMaxDialog, setShowMinMaxDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10; // Table layout

  useEffect(() => {
    fetchItems();
  }, [user?.id, currentPage, searchTerm]);

  useEffect(() => {
    filterItems();
  }, [items, statusFilter]);

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
          // Debug: ตรวจสอบข้อมูล Min/Max
          console.log('📦 Items data:', response.data.slice(0, 2).map(item => ({
            itemcode: item.itemcode,
            itemname: item.itemname,
            Minimum: item.Minimum,
            Maximum: item.Maximum
          })));
          
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

    // Filter by status (client-side)
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => 
        statusFilter === 'active' ? item.item_status === 0 : item.item_status !== 0
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

  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    setShowEditDialog(true);
  };

  const handleDelete = (item: Item) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  const handleUpdateMinMax = (item: Item) => {
    setSelectedItem(item);
    setShowMinMaxDialog(true);
  };

  const getStatusBadge = (status: number | undefined) => {
    if (status === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border bg-green-100 text-green-800 border-green-200">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          ใช้งาน
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border bg-gray-100 text-gray-800 border-gray-200">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
        ไม่ใช้งาน
      </span>
    );
  };

  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">จัดการสต๊อกอุปกรณ์ในตู้</h1>
                <p className="text-sm text-gray-500">รายการอุปกรณ์ทั้งหมดในระบบ</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchItems()}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                รีเฟรช
              </Button>
              <Button
                size="sm"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มอุปกรณ์
              </Button>
            </div>
          </div>

          {/* Filter Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <CardTitle>ตัวกรอง</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">ค้นหา</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="ค้นหารหัสหรือชื่อสินค้า..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">สถานะ</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกสถานะ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      <SelectItem value="active">ใช้งาน</SelectItem>
                      <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setCurrentPage(1);
                    }}
                  >
                    ล้างตัวกรอง
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table Section */}
          <Card>
            <CardHeader>
              <CardTitle>รายการอุปกรณ์</CardTitle>
              <CardDescription>
                แสดง {filteredItems.length} รายการ จากทั้งหมด {totalItems} อุปกรณ์
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 py-4">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
                  </div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">ไม่พบข้อมูลอุปกรณ์</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">ลำดับ</TableHead>
                          <TableHead>รหัสอุปกรณ์</TableHead>
                          <TableHead>ชื่อสินค้า</TableHead>
                          <TableHead className="text-center">Stock Balance</TableHead>
                          <TableHead className="text-center">Min/Max</TableHead>
                          <TableHead>สถานะ</TableHead>
                          <TableHead className="text-right">จัดการ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.map((item, index) => {
                          const stockBalance = item.stock_balance ?? 0;
                          const stockMin = item.stock_min ?? 0;
                          const isLowStock = stockMin > 0 && stockBalance < stockMin;
                          
                          return (
                            <TableRow 
                              key={item.itemcode}
                              className={isLowStock ? 'bg-red-50 hover:bg-red-100' : ''}
                            >
                              <TableCell className="font-medium">
                                {(currentPage - 1) * itemsPerPage + index + 1}
                              </TableCell>
                              <TableCell>
                                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {item.itemcode}
                                </code>
                              </TableCell>
                              <TableCell className="font-medium">{item.itemname || '-'}</TableCell>
                              <TableCell className="text-center">
                                <span className={`font-semibold ${
                                  isLowStock ? 'text-red-600' : 'text-gray-900'
                                }`}>
                                  {stockBalance.toLocaleString()}
                                </span>
                              </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center space-x-1 text-xs">
                                <span className="text-gray-600">{item.stock_min ?? 0}</span>
                                <span className="text-gray-400">/</span>
                                <span className="text-gray-600">{item.stock_max ?? 0}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(item.item_status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateMinMax(item)}
                                  title="ตั้งค่า Min/Max"
                                  className="text-purple-600 hover:text-purple-700 hover:border-purple-600"
                                >
                                  <Gauge className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(item)}
                                  title="แก้ไขชื่อ"
                                  className="text-blue-600 hover:text-blue-700 hover:border-blue-600"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(item)}
                                  title="ลบอุปกรณ์"
                                  className="text-red-600 hover:text-red-700 hover:border-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between border-t pt-4">
                      <div className="text-sm text-gray-500">
                        หน้า {currentPage} จาก {totalPages} ({totalItems} อุปกรณ์)
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(1)}
                          disabled={currentPage === 1}
                        >
                          แรกสุด
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          ก่อนหน้า
                        </Button>
                        
                        {generatePageNumbers().map((page, idx) => (
                          page === '...' ? (
                            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
                          ) : (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page as number)}
                            >
                              {page}
                            </Button>
                          )
                        ))}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          ถัดไป
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          สุดท้าย
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <CreateItemDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          userId={user?.id}
          onSuccess={fetchItems}
        />

        <EditItemDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          item={selectedItem}
          onSuccess={fetchItems}
        />

        <DeleteItemDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          item={selectedItem}
          onSuccess={fetchItems}
        />

        <UpdateMinMaxDialog
          open={showMinMaxDialog}
          onOpenChange={setShowMinMaxDialog}
          item={selectedItem}
          onSuccess={fetchItems}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}
