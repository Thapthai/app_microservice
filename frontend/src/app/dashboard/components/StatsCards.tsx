import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, Users } from 'lucide-react';
import { SkeletonStats } from '@/components/Skeleton';

interface StatsCardsProps {
  loading: boolean;
  stats: {
    totalItems: number;
    activeItems: number;
    totalValue: number;
  };
}

export default function StatsCards({ loading, stats }: StatsCardsProps) {
  if (loading) {
    return <SkeletonStats />;
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">สินค้าทั้งหมด</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalItems.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            สินค้าที่ใช้งาน {stats.activeItems.toLocaleString()} รายการ
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">มูลค่ารวม</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ฿{stats.totalValue.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            จากสินค้าทั้งหมด
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">บัญชีผู้ใช้</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1</div>
          <p className="text-xs text-muted-foreground">
            ผู้ใช้งานในระบบ
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

