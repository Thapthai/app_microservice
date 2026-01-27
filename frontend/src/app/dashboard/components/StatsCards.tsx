import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, Box, CheckCircle } from 'lucide-react';
import { SkeletonStats } from '@/components/Skeleton';

interface StatsCardsProps {
  loading: boolean;
  stats: {
    totalItems: number;
    activeItems: number;
    inactiveItems: number;
    lowStockItems: number;
  };
}

export default function StatsCards({ loading, stats }: StatsCardsProps) {
  if (loading) {
    return <SkeletonStats />;
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {/* Total Items Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">อุปกรณ์ทั้งหมด</CardTitle>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Box className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.totalItems.toLocaleString()}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            ใช้งาน {stats.activeItems.toLocaleString()} | ไม่ใช้งาน {stats.inactiveItems.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Active Items Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">อุปกรณ์ที่ใช้งาน</CardTitle>
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.activeItems.toLocaleString()}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {stats.totalItems > 0 
              ? `${((stats.activeItems / stats.totalItems) * 100).toFixed(1)}% ของทั้งหมด`
              : 'ไม่มีอุปกรณ์'}
          </p>
        </CardContent>
      </Card>

      {/* Low Stock Items Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ต้องเติมสต็อก</CardTitle>
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.lowStockItems.toLocaleString()}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {stats.lowStockItems > 0 ? 'สต็อกต่ำกว่าระดับขั้นต่ำ' : 'สต็อกเพียงพอทุกรายการ'}
          </p>
        </CardContent>
      </Card>

      {/* Inactive Items Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">อุปกรณ์ไม่ใช้งาน</CardTitle>
          <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
            <Package className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.inactiveItems.toLocaleString()}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            ปิดการใช้งานชั่วคราว
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

