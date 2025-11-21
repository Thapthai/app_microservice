import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, Syringe, AlertCircle } from 'lucide-react';
import { SkeletonStats } from '@/components/Skeleton';

interface StatsCardsProps {
  loading: boolean;
  stats: {
    totalItems: number;
    activeItems: number;
    inactiveItems?: number;
    totalValue: number;
  };
}

export default function StatsCards({ loading, stats }: StatsCardsProps) {
  if (loading) {
    return <SkeletonStats />;
  }

  const inactiveItems = stats.inactiveItems || (stats.totalItems - stats.activeItems);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {/* Total Items Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">สินค้าทั้งหมด</CardTitle>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Package className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.totalItems.toLocaleString()}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            ใช้งาน {stats.activeItems.toLocaleString()} | ไม่ใช้งาน {inactiveItems.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Active Items Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">สินค้าที่ใช้งาน</CardTitle>
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <Package className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.activeItems.toLocaleString()}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {stats.totalItems > 0 
              ? `${((stats.activeItems / stats.totalItems) * 100).toFixed(1)}% ของทั้งหมด`
              : 'ไม่มีสินค้า'}
          </p>
        </CardContent>
      </Card>

      {/* Total Value Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">มูลค่ารวม</CardTitle>
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            ฿{stats.totalValue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            จากสินค้าทั้งหมด
          </p>
        </CardContent>
      </Card>

      {/* Medical Supplies Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">เวชภัณฑ์</CardTitle>
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <Syringe className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            -
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            ระบบจัดการเวชภัณฑ์
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

