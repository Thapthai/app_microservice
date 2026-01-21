"use client";

import { Package, RefreshCw, Gauge, Pencil, Trash2, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Item } from "@/types/item";

interface ItemsTableProps {
  items: Item[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  onUpdateMinMax: (item: Item) => void;
  onPageChange: (page: number) => void;
}

export default function ItemsTable({
  items,
  loading,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onEdit,
  onDelete,
  onUpdateMinMax,
  onPageChange
}: ItemsTableProps) {
  
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
    <Card>
      <CardHeader>
        <CardTitle>รายการอุปกรณ์</CardTitle>
        <CardDescription>
          แสดง {items.length} รายการ จากทั้งหมด {totalItems} อุปกรณ์
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
        ) : items.length === 0 ? (
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
                    <TableHead className="text-center">จำนวนในตู้</TableHead>
                    <TableHead className="text-center">Min/Max</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const countItemStock = (item as any).count_itemstock ?? 0;
                    const stockMin = item.stock_min ?? 0;
                    const isLowStock = stockMin > 0 && countItemStock < stockMin;
                    
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
                          <div className="flex items-center justify-center gap-1">
                            <Archive className="h-4 w-4 text-blue-600" />
                            <span className={`font-semibold ${
                              isLowStock ? 'text-red-600' : 'text-blue-600'
                            }`}>
                              {countItemStock.toLocaleString()}
                            </span>
                          </div>
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
                              onClick={() => onUpdateMinMax(item)}
                              title="ตั้งค่า Min/Max"
                              className="text-purple-600 hover:text-purple-700 hover:border-purple-600"
                            >
                              <Gauge className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEdit(item)}
                              title="แก้ไขชื่อ"
                              className="text-blue-600 hover:text-blue-700 hover:border-blue-600"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onDelete(item)}
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
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                  >
                    แรกสุด
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
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
                        onClick={() => onPageChange(page as number)}
                      >
                        {page}
                      </Button>
                    )
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    ถัดไป
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(totalPages)}
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
  );
}
