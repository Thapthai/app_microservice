import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from './StatusBadge';
import type { ComparisonItem } from '../types';

interface ItemInfoCardProps {
  item: ComparisonItem;
  loading: boolean;
  onExportExcel: () => void;
  onExportPdf: () => void;
  onRefresh: () => void;
}

export default function ItemInfoCard({
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
          <CardTitle>ข้อมูลเวชภัณฑ์ (รหัส: {item.itemcode})</CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={onExportExcel} 
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button 
              onClick={onExportPdf} 
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </Button>
          </div>
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
