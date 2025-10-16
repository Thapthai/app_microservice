import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface DashboardHeaderProps {
  userName?: string;
}

export default function DashboardHeader({ userName }: DashboardHeaderProps) {
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

