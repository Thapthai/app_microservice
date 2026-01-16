'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Package } from 'lucide-react';

interface TransactionsTableProps {
  loading: boolean;
  transactions: any[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  filters: {
    visitDate: string;
    patientHN: string;
    en: string;
    firstName: string;
    lastName: string;
    itemCode: string;
    assessionNo: string;
  };
}

export default function TransactionsTable({
  loading,
  transactions,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  filters,
}: TransactionsTableProps) {
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  // Get paginated transactions
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>รายการบันทึกใช้อุปกรณ์กับคนไข้</CardTitle>
            <CardDescription>
              ข้อมูลจาก HIS ทั้งหมด {totalItems} รายการ
              {filters.visitDate && (
                <span className="ml-2">
                  (วันที่ {new Date(filters.visitDate).toLocaleDateString('th-TH')})
                </span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">กำลังโหลดข้อมูล...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">ไม่พบรายการบันทึกใช้อุปกรณ์</p>
            <p className="text-sm text-gray-400 mt-2">ลองเปลี่ยนเงื่อนไขการค้นหา</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ลำดับ</TableHead>
                  <TableHead>รหัสอุปกรณ์</TableHead>
                  <TableHead>ชื่ออุปกรณ์</TableHead>
                  <TableHead>Assession No</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead>UOM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((transaction, index) => {
                  const itemCode = transaction.order_item_code || transaction.supply_code || '-';
                  const itemName = transaction.order_item_description || transaction.supply_name || '-';
                  const assessionNo = transaction.assession_no || '-';
                  const status = transaction.order_item_status || '-';
                  const qty = transaction.qty || transaction.quantity || 0;
                  const uom = transaction.uom || transaction.unit || '-';
                  
                  return (
                    <TableRow 
                      key={`${transaction.usage_id}-${transaction.id}-${index}`}
                      className="hover:bg-gray-50"
                    >
                      <TableCell className="text-center">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {itemCode}
                      </TableCell>
                      <TableCell>
                        {itemName}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {assessionNo}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {qty}
                      </TableCell>
                      <TableCell>
                        {uom}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {!loading && transactions.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <div className="text-sm text-gray-500">
              หน้า {currentPage} จาก {totalPages} ({totalItems} รายการ)
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
              >
                แรกสุด
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ก่อนหน้า
              </Button>
              
              {generatePageNumbers().map((page, idx) =>
                page === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
                ) : (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                  >
                    {page}
                  </Button>
                )
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                ถัดไป
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                สุดท้าย
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

