import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface DashboardHeaderProps {
  userName?: string;
  onCreateClick?: () => void;
}

export default function DashboardHeader({ userName, onCreateClick }: DashboardHeaderProps) {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            สวัสดี, {userName}!
          </h1>
          <p className="mt-2 text-gray-600">
            ภาพรวมธุรกิจผ้าของคุณ
          </p>
        </div>
        <Button onClick={onCreateClick} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-200">
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มสินค้าใหม่
        </Button>
      </div>
    </div>
  );
}

