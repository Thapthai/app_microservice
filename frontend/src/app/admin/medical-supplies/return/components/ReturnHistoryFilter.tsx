import { Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ReturnReason } from '../types';

interface ReturnHistoryFilterProps {
  dateFrom: string;
  dateTo: string;
  reason: string;
  loading: boolean;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onReasonChange: (reason: string) => void;
  onSearch: () => void;
}

export default function ReturnHistoryFilter({
  dateFrom,
  dateTo,
  reason,
  loading,
  onDateFromChange,
  onDateToChange,
  onReasonChange,
  onSearch,
}: ReturnHistoryFilterProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>กรองข้อมูลประวัติการคืน</CardTitle>
            <CardDescription>ดูประวัติการคืนเวชภัณฑ์ทั้งหมด</CardDescription>
          </div>
          <Button
            onClick={onSearch}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                กำลังโหลด...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                ค้นหา
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="history-date-from">วันที่เริ่มต้น</Label>
            <Input
              id="history-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="history-date-to">วันที่สิ้นสุด</Label>
            <Input
              id="history-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="history-reason">สาเหตุการคืน</Label>
            <Select value={reason || 'ALL'} onValueChange={onReasonChange}>
              <SelectTrigger>
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                <SelectItem value="UNWRAPPED_UNUSED">ยังไม่ได้แกะซอง หรือยังอยู่ในสภาพเดิม</SelectItem>
                <SelectItem value="EXPIRED">อุปกรณ์หมดอายุ</SelectItem>
                <SelectItem value="CONTAMINATED">อุปกรณ์มีการปนเปื้อน</SelectItem>
                <SelectItem value="DAMAGED">อุปกรณ์ชำรุด</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {loading && (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-5 w-5 animate-spin text-gray-400 mr-2" />
            <span className="text-gray-500">กำลังโหลดข้อมูล...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
