import { FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '../common/StatusBadge';
import type { ComparisonItem } from '../../types';

interface ItemInfoCardProps {
  item: ComparisonItem;
  loading: boolean;
  onExportExcel: () => void;
  onExportPdf: () => void;
  onRefresh: () => void;
}

export function ItemInfoCard({
  item,
  loading,
  onExportExcel,
  onExportPdf,
  onRefresh,
}: ItemInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>ข้อมูลเวชภัณฑ์(รหัส: {item.itemcode})</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">รหัสเวชภัณฑ์</p>
            <p className="font-semibold">{item.itemcode}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">ชื่อเวชภัณฑ์</p>
            <p className="font-semibold">{item.itemname || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">ประเภท</p>
            <p className="font-semibold">{item.itemTypeName || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">สถานะ</p>
            <div className="mt-1">
              <StatusBadge status={item.status} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
