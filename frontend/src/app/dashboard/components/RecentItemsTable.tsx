import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Plus, ArrowRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { SkeletonTable } from '@/components/Skeleton';
import Pagination from '@/components/Pagination';
import type { Item } from '@/types/item';

interface RecentItemsTableProps {
  loading: boolean;
  items: Item[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  sortBy?: string;
  sortOrder?: string;
  onSortChange?: (sortBy: string, sortOrder: string) => void;
}

export default function RecentItemsTable({
  loading,
  items,
  currentPage,
  totalPages,
  onPageChange,
  sortBy = 'CreateDate',
  sortOrder = 'desc',
  onSortChange,
}: RecentItemsTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>รายการเวชภัณฑ์</CardTitle>
            <CardDescription>
              สินค้าล่าสุด {!loading && items.length > 0 && `(${items.length} รายการในหน้านี้)`}
            </CardDescription>
          </div>
          <Link href="/items">
            <Button
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              ดูทั้งหมด
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6">
            <SkeletonTable />
          </div>
        ) : items.length === 0 ? (
          <div className="p-6">
            <EmptyState />
          </div>
        ) : (
          <ItemsTable
            items={items}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={onSortChange}
          />
        )}
      </CardContent>
      {/* Pagination */}
      {!loading && items.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          loading={loading}
        />
      )}
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-6">
      <Package className="mx-auto h-10 w-10 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีสินค้า</h3>
      <p className="mt-1 text-sm text-gray-500">เริ่มต้นด้วยการเพิ่มสินค้าแรกของคุณ</p>
      <div className="mt-6">
        <Link href="/items/new">
          <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-200">
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มสินค้าใหม่
          </Button>
        </Link>
      </div>
    </div>
  );
}

function ItemsTable({
  items,
  sortBy,
  sortOrder,
  onSortChange
}: {
  items: Item[];
  sortBy?: string;
  sortOrder?: string;
  onSortChange?: (sortBy: string, sortOrder: string) => void;
}) {
  const handleSort = (field: string) => {
    if (!onSortChange) return;
    
    // If clicking the same field, toggle the order
    if (sortBy === field) {
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      onSortChange(field, newOrder);
    } else {
      // If clicking a different field, start with descending (newest/highest first)
      onSortChange(field, 'desc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-gray-400" />;
    }
    return sortOrder === 'asc'
      ? <ArrowUp className="h-3.5 w-3.5 ml-1 text-blue-600" />
      : <ArrowDown className="h-3.5 w-3.5 ml-1 text-blue-600" />;
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                <button
                  onClick={() => handleSort('itemname')}
                  className="flex items-center hover:text-blue-600 transition-colors cursor-pointer"
                  disabled={!onSortChange}
                >
                  สินค้า
                  <SortIcon field="itemname" />
                </button>
              </th>
              <th className="hidden lg:table-cell px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                รหัสสินค้า
              </th>
              <th className="hidden sm:table-cell px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                บาร์โค้ด
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[90px]">
                <button
                  onClick={() => handleSort('CostPrice')}
                  className="flex items-center hover:text-blue-600 transition-colors cursor-pointer"
                  disabled={!onSortChange}
                >
                  ราคาทุน
                  <SortIcon field="CostPrice" />
                </button>
              </th>
              <th className="hidden md:table-cell px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[70px]">
                <button
                  onClick={() => handleSort('stock_balance')}
                  className="flex items-center hover:text-blue-600 transition-colors cursor-pointer"
                  disabled={!onSortChange}
                >
                  สต็อก
                  <SortIcon field="stock_balance" />
                </button>
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[90px]">
                สถานะ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.itemcode} className="hover:bg-gray-50 transition-colors">
                <td className="px-2 py-2">
                  <div className="max-w-[140px]">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {item.itemname || 'ไม่มีชื่อ'}
                    </div>
                    {item.Alternatename && (
                      <div className="text-xs text-gray-500 truncate">
                        {item.Alternatename}
                      </div>
                    )}
                    {item.Description && (
                      <div className="text-xs text-blue-600 truncate mt-0.5">
                        {item.Description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="hidden lg:table-cell px-2 py-2 text-sm text-gray-700">
                  <div className="truncate max-w-[100px] font-mono text-xs">
                    {item.itemcode}
                  </div>
                </td>
                <td className="hidden sm:table-cell px-2 py-2 text-sm text-gray-900">
                  <div className="truncate max-w-[100px] font-mono text-xs">
                    {item.Barcode || '-'}
                  </div>
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  ฿{item.CostPrice !== undefined && item.CostPrice !== null ? Number(item.CostPrice).toLocaleString() : '0'}
                </td>
                <td className="hidden md:table-cell px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                  {item.stock_balance !== undefined && item.stock_balance !== null ? item.stock_balance.toLocaleString() : '0'}
                </td>
                <td className="px-2 py-2 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm ${item.item_status === 0
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                      : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${item.item_status === 0 ? 'bg-white' : 'bg-white'
                      }`}></span>
                    {item.item_status === 0 ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

