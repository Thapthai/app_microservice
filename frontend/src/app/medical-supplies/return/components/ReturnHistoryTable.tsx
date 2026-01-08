import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>ประวัติการคืนเวชภัณฑ์</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadExcel}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              ดาวน์โหลด Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              ดาวน์โหลด PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ลำดับ</TableHead>
                <TableHead>รหัสอุปกรณ์</TableHead>
                <TableHead>ชื่ออุปกรณ์</TableHead>
                {/* <TableHead>HN</TableHead> */}
                <TableHead className="text-center">จำนวนที่คืน</TableHead>
                <TableHead>สาเหตุการคืน</TableHead>
                <TableHead className="text-center">วันที่คืน</TableHead>
                <TableHead>หมายเหตุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data?.map((record: ReturnHistoryRecord, index: number) => (
                <TableRow key={record.id}>
                  <TableCell className="text-center">
                    {(currentPage - 1) * limit + index + 1}
                  </TableCell>
                  <TableCell className="font-mono">
                    {record.supply_item?.order_item_code || record.supply_item?.supply_code || '-'}
                  </TableCell>
                  <TableCell>
                    {record.supply_item?.order_item_description || record.supply_item?.supply_name || '-'}
                  </TableCell>
                  {/* <TableCell className="font-mono">
                    {record.supply_item?.usage?.patient_hn || '-'}
                  </TableCell> */}
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {record.qty_returned}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {getReturnReasonLabel(record.return_reason)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {formatDate(record.return_datetime)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {record.return_note || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {data.data?.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            ไม่พบข้อมูลประวัติการคืน
          </div>
        )}
        {/* Pagination */}
        {data.total > limit && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              แสดง {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, data.total)} จาก {data.total} รายการ
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                ก่อนหน้า
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage * limit >= data.total}
              >
                ถัดไป
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
