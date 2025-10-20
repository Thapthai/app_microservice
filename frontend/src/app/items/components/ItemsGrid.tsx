import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Edit, Trash2, Plus } from 'lucide-react';
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
        <Card key={item.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {item.name}
                </h3>
                {item.category && (
                  <Badge variant="secondary" className="mt-1">
                    {item.category.name}
                  </Badge>
                )}
              </div>
              <Badge variant={item.is_active ? "default" : "destructive"}>
                {item.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
              </Badge>
            </div>
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

