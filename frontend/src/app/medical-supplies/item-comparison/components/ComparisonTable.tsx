import { Download, RefreshCw, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from './StatusBadge';
import ComparisonPagination from './ComparisonPagination';
import type { ComparisonItem } from '../types';

interface ComparisonTableProps {
  loading: boolean;
  items: ComparisonItem[];
  selectedItemCode: string | null;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  searchItemCode: string;
  itemTypeFilter: string;
  onSelectItem: (itemCode: string) => void;
  onPageChange: (page: number) => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
}

export default function ComparisonTable({
  loading,
  items,
  selectedItemCode,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  searchItemCode,
  itemTypeFilter,
  onSelectItem,
  onPageChange,
  onExportExcel,
  onExportPdf,
}: ComparisonTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>รายการเปรียบเทียบทั้งหมด</CardTitle>
            <CardDescription>
              คลิกที่รายการเพื่อดูรายละเอียดการเปรียบเทียบ
              {(searchItemCode || itemTypeFilter) && ' (กรองแล้ว)'}
            </CardDescription>
          </div>
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
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">กำลังโหลดข้อมูล...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">ไม่พบรายการเปรียบเทียบ</p>
            <p className="text-sm text-gray-400 mt-2">กรุณาตรวจสอบว่ามีข้อมูลในระบบ</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">รหัสเวชภัณฑ์</TableHead>
                    <TableHead>ชื่อเวชภัณฑ์</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead className="text-right">จำนวนเบิก</TableHead>
                    <TableHead className="text-right">จำนวนใช้</TableHead>
                    <TableHead className="text-right">ผลต่าง</TableHead>
                    <TableHead className="text-center">สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const isSelected = selectedItemCode === item.itemcode;
                    
                    return (
                      <TableRow
                        key={item.itemcode}
                        className={`cursor-pointer hover:bg-purple-50 transition-colors ${
                          isSelected ? 'bg-purple-100 hover:bg-purple-100' : ''
                        }`}
                        onClick={() => onSelectItem(item.itemcode)}
                      >
                        <TableCell className="font-medium">
                          {isSelected && <Badge variant="default" className="mr-2">เลือก</Badge>}
                          {item.itemcode}
                        </TableCell>
                        <TableCell>{item.itemname || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.itemTypeName || '-'}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{item.total_dispensed}</TableCell>
                        <TableCell className="text-right font-medium">{item.total_used}</TableCell>
                        <TableCell className={`text-right font-bold ${
                          item.difference === 0 ? 'text-green-600' :
                          item.difference > 0 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {item.difference > 0 && '+'}
                          {item.difference}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={item.status} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <ComparisonPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={onPageChange}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
