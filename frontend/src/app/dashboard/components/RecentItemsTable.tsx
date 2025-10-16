import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Plus } from 'lucide-react';
import { SkeletonTable } from '@/components/Skeleton';
import Pagination from '@/components/Pagination';
import type { Item } from '@/types/item';

interface RecentItemsTableProps {
  loading: boolean;
  items: Item[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function RecentItemsTable({
  loading,
  items,
  currentPage,
  totalPages,
  onPageChange,
}: RecentItemsTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>รายการสินค้า</CardTitle>
            <CardDescription>
              สินค้าล่าสุด {!loading && items.length > 0 && `(${items.length} รายการในหน้านี้)`}
            </CardDescription>
          </div>
          <Link href="/items">
            <Button variant="outline">ดูทั้งหมด</Button>
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
          <ItemsTable items={items} />
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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มสินค้าใหม่
          </Button>
        </Link>
      </div>
    </div>
  );
}

function ItemsTable({ items }: { items: Item[] }) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                สินค้า
              </th>
              <th className="hidden sm:table-cell px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                หมวดหมู่
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[90px]">
                ราคา
              </th>
              <th className="hidden md:table-cell px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[70px]">
                จำนวน
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[90px]">
                สถานะ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-2 py-2">
                  <div className="max-w-[140px]">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {item.name}
                    </div>
                    {item.description && (
                      <div className="text-xs text-gray-500 truncate">
                        {item.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="hidden sm:table-cell px-2 py-2 text-sm text-gray-900">
                  <div className="truncate max-w-[100px]">
                    {item.category || '-'}
                  </div>
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  ฿{item.price.toLocaleString()}
                </td>
                <td className="hidden md:table-cell px-2 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                  {item.quantity}
                </td>
                <td className="px-2 py-2 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                    item.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
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

