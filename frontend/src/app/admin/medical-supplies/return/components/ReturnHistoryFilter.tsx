'use client';

import { Search, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    <Card className="border-0 shadow-sm bg-white rounded-xl overflow-hidden">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-100">
            <Filter className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-slate-800">กรองประวัติการคืน</CardTitle>
            <CardDescription className="text-slate-500 mt-0.5">
              กำหนดช่วงวันที่และสาเหตุการคืน แล้วกดค้นหา
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="history-date-from" className="text-slate-600 font-medium">
              วันที่เริ่มต้น
            </Label>
            <Input
              id="history-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="rounded-lg border-slate-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="history-date-to" className="text-slate-600 font-medium">
              วันที่สิ้นสุด
            </Label>
            <Input
              id="history-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="rounded-lg border-slate-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="history-reason" className="text-slate-600 font-medium">
              สาเหตุการคืน
            </Label>
            <Select value={reason || 'ALL'} onValueChange={onReasonChange}>
              <SelectTrigger id="history-reason" className="rounded-lg border-slate-200 w-full">
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                <SelectItem value="UNWRAPPED_UNUSED">ยังไม่ได้แกะซอง / อยู่ในสภาพเดิม</SelectItem>
                <SelectItem value="EXPIRED">อุปกรณ์หมดอายุ</SelectItem>
                <SelectItem value="CONTAMINATED">อุปกรณ์มีการปนเปื้อน</SelectItem>
                <SelectItem value="DAMAGED">อุปกรณ์ชำรุด</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button
              onClick={onSearch}
              disabled={loading}
              className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-6"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  กำลังโหลด...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  ค้นหา
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onSearch}
              disabled={loading}
              className="gap-2 rounded-lg border-slate-200"
              title="โหลดประวัติการคืนใหม่"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
