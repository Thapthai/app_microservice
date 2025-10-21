import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Edit, Trash2, Plus, FolderOpen, Tag } from 'lucide-react';
import type { Item } from '@/types/item';
import { ItemsGridSkeleton } from './ItemsSkeleton';
import Pagination from '@/components/Pagination';

interface ItemsGridProps {
  loading: boolean;
  items: Item[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
}

export default function ItemsGrid({
  loading,
  items,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  onEdit,
  onDelete,
}: ItemsGridProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">รายการสินค้า</h2>
            {!loading && totalItems > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                ทั้งหมด {totalItems} รายการ
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <ItemsGridSkeleton />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <ItemsList items={items} onEdit={onEdit} onDelete={onDelete} />
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
    <div className="text-center py-12 px-6">
      <Package className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่พบสินค้า</h3>
      <p className="mt-1 text-sm text-gray-500">
        ลองเปลี่ยนคำค้นหาหรือตัวกรอง
      </p>
    </div>
  );
}

function ItemsList({ 
  items, 
  onEdit, 
  onDelete 
}: { 
  items: Item[]; 
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {items.map((item) => (
        <Card key={item.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-900 flex-1">
                {item.name}
              </h3>
              <Badge variant={item.is_active ? "default" : "destructive"} className="ml-2">
                {item.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
              </Badge>
            </div>
            {item.category ? (
              <div className="w-full bg-gradient-to-r from-blue-50 to-blue-50/50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <FolderOpen className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="font-semibold text-blue-900">{item.category.name}</span>
                </div>
                {item.category.description && (
                  <p className="text-xs text-gray-600 pl-6">
                    {item.category.description}
                  </p>
                )}
              </div>
            ) : (
              <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500 italic">ไม่มีหมวดหมู่</span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              {item.description || '-'}
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">ราคา:</span>
                <span className="font-semibold">฿{item.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">จำนวน:</span>
                <span className="font-semibold">{item.quantity.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">มูลค่ารวม:</span>
                <span className="font-semibold">
                  ฿{(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => onEdit(item)}
              >
                <Edit className="mr-2 h-4 w-4" />
                แก้ไข
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(item)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

