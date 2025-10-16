import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ItemsHeaderProps {
  onAddClick: () => void;
}

export default function ItemsHeader({ onAddClick }: ItemsHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">จัดการสินค้า</h1>
        <p className="mt-2 text-gray-600">
          จัดการและดูรายการสินค้าทั้งหมด
        </p>
      </div>
      <Button onClick={onAddClick}>
        <Plus className="mr-2 h-4 w-4" />
        เพิ่มสินค้าใหม่
      </Button>
    </div>
  );
}

