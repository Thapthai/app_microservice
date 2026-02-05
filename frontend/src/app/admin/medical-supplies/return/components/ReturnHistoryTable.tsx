'use client';

import { Download, Info, FileSpreadsheet, FileText, ChevronLeft, ChevronRight, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { vendingReportsApi } from '@/lib/api';
import type { ReturnHistoryData, ReturnHistoryRecord } from '../types';

interface ReturnHistoryTableProps {
  data: ReturnHistoryData | null;
  currentPage: number;
  limit: number;
  dateFrom: string;
  dateTo: string;
  reason: string;
  formatDate: (dateString: string) => string;
  getReturnReasonLabel: (reason: string) => string;
  onPageChange: (page: number) => void;
}

function UsageDetailDialog({
  record,
  formatDate,
  trigger,
}: {
  record: ReturnHistoryRecord;
  formatDate: (dateString: string) => string;
  trigger: React.ReactNode;
}) {
  const usage = record.supply_item?.usage;
  const patientName = usage
    ? [usage.first_name, usage.lastname].filter(Boolean).join(' ') || '-'
    : '-';
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <UserCircle className="h-5 w-5 text-emerald-600" />
            รายละเอียดการเบิก (Supply Usage)
          </DialogTitle>
        </DialogHeader>
        {usage ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-4 space-y-3">
              {/* <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                <span className="text-slate-500">รหัส Usage</span>
                <span className="font-mono font-medium text-slate-800">{usage.id ?? '-'}</span>
              </div> */}
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                <span className="text-slate-500">EN</span>
                <span>{usage.en ?? '-'}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                <span className="text-slate-500">HN</span>
                <span>{usage.patient_hn ?? '-'}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                <span className="text-slate-500">ชื่อผู้ป่วย</span>
                <span>{patientName}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                <span className="text-slate-500">แผนก</span>
                <span>{usage.department_code ?? '-'}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2 text-sm items-baseline">
                <span className="text-slate-500">วันที่เบิก</span>
                <span>{usage.created_at ? formatDate(usage.created_at) : '-'}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-sm py-4">ไม่มีข้อมูลการเบิก (Usage)</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ReturnHistoryTable({
  data,
  currentPage,
  limit,
  dateFrom,
  dateTo,
  reason,
  formatDate,
  getReturnReasonLabel,
  onPageChange,
}: ReturnHistoryTableProps) {
  if (!data) return null;

  const handleDownloadExcel = () => {
    vendingReportsApi.downloadReturnReportExcel({
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      return_reason: reason !== 'ALL' ? reason : undefined,
    });
  };

  const handleDownloadPdf = () => {
    vendingReportsApi.downloadReturnReportPdf({
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      return_reason: reason !== 'ALL' ? reason : undefined,
    });
  };

  const totalPages = Math.ceil(data.total / limit) || 1;
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, data.total);

  return (
    <Card className="overflow-hidden border-0 shadow-sm bg-white rounded-xl">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-800">
              รายการประวัติการคืน
            </CardTitle>
            <p className="text-sm text-slate-500 mt-0.5">
              แสดง {data.total} รายการ — กด &quot;ดูรายละเอียด&quot; เพื่อดูข้อมูลการเบิก (EN/HN/ผู้ป่วย)
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadExcel}
              className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              className="gap-2 border-sky-200 text-sky-700 hover:bg-sky-50"
            >
              <FileText className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b">
                <TableHead className="w-14 text-center text-slate-600 font-medium">#</TableHead>
                <TableHead className="text-slate-600 font-medium">รหัสอุปกรณ์</TableHead>
                <TableHead className="text-slate-600 font-medium">ชื่ออุปกรณ์</TableHead>
                <TableHead className="text-slate-600 font-medium min-w-[180px]">มาจากการเบิก (Usage)</TableHead>
                <TableHead className="text-slate-600 font-medium">ผู้คืน</TableHead>
                <TableHead className="text-center text-slate-600 font-medium w-24">จำนวน</TableHead>
                <TableHead className="text-slate-600 font-medium">สาเหตุ</TableHead>
                <TableHead className="text-center text-slate-600 font-medium">วันที่คืน</TableHead>
                <TableHead className="text-slate-600 font-medium">หมายเหตุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data?.map((record: ReturnHistoryRecord, index: number) => {
                const usage = record.supply_item?.usage;
                const usageLabel = usage
                  ? `EN ${usage.en ?? '-'} · HN ${usage.patient_hn ?? '-'}`
                  : '-';
                return (
                  <TableRow
                    key={record.id}
                    className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                  >
                    <TableCell className="text-center text-slate-500 text-sm">
                      {startItem + index}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {record.supply_item?.order_item_code || record.supply_item?.supply_code || '-'}
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px]">
                      {record.supply_item?.order_item_description || record.supply_item?.supply_name || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-600 text-sm truncate max-w-[120px]" title={usageLabel}>
                          {usageLabel}
                        </span>
                        <UsageDetailDialog record={record} formatDate={formatDate} trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 h-7 gap-1 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                          >
                            <Info className="h-3.5 w-3.5" />
                            ดูรายละเอียด
                          </Button>
                        } />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{record.return_by_user_name || 'ไม่ระบุ'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-0 font-medium">
                        {record.qty_returned}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-xs font-normal">
                        {getReturnReasonLabel(record.return_reason)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-slate-600 text-sm whitespace-nowrap">
                      {formatDate(record.return_datetime)}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm max-w-[160px] truncate" title={record.return_note || ''}>
                      {record.return_note || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {data.data?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-slate-100 p-4 mb-3">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">ไม่พบประวัติการคืน</p>
            <p className="text-slate-500 text-sm mt-1">ลองปรับช่วงวันที่หรือสาเหตุการคืน</p>
          </div>
        )}

        {data.total > limit && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-4 border-t bg-slate-50/30">
            <p className="text-sm text-slate-500 order-2 sm:order-1">
              แสดง <span className="font-medium text-slate-700">{startItem}</span> – <span className="font-medium text-slate-700">{endItem}</span> จากทั้งหมด <span className="font-medium text-slate-700">{data.total}</span> รายการ
            </p>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                ก่อนหน้า
              </Button>
              <span className="text-sm text-slate-600 min-w-[80px] text-center">
                หน้า {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="gap-1"
              >
                ถัดไป
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
