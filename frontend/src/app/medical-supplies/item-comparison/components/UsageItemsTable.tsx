'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { medicalSuppliesApi } from '@/lib/api';
import { toast } from 'sonner';
import ComparisonPagination from './ComparisonPagination';
import type { UsageItem } from '../types';

interface UsageItemsTableProps {
  itemCode: string;
  itemName: string;
  itemsPerPage?: number;
}

export default function UsageItemsTable({
  itemCode,
  itemName,
  itemsPerPage = 5,
}: UsageItemsTableProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<UsageItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const fetchUsageData = async (page: number = 1) => {
    if (!itemCode) {
      setItems([]);
      return;
    }

    try {
      setLoading(true);
      const params: any = {
        itemCode: itemCode, // Use itemCode from item table
        page,
        limit: itemsPerPage,
      };
      
      // Note: Date filters removed as per backend implementation
      // if (startDate) params.startDate = startDate;
      // if (endDate) params.endDate = endDate;
      
      const response = await medicalSuppliesApi.getUsageByItemCodeFromItemTable(params) as any;
      
      if (response && (response.success || response.data)) {
        const responseItems = Array.isArray(response.data) ? response.data : [];
        
        const total = response.total || responseItems.length;
        const currentPageNum = response.page || page;
        const limit = response.limit || itemsPerPage;
        const totalPagesNum = response.totalPages || Math.ceil(total / limit);
        
        setItems(responseItems);
        setTotalItems(total);
        setTotalPages(totalPagesNum);
        setCurrentPage(currentPageNum);
        
        if (responseItems.length === 0) {
          toast.info('ไม่พบรายการผู้ป่วยที่ใช้เวชภัณฑ์นี้');
        }
      } else {
        toast.error(response?.message || 'ไม่สามารถโหลดรายการใช้งานได้');
        setItems([]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการโหลดรายการใช้งาน');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData(1);
  }, [itemCode]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchUsageData(page);
  };

  const totalUsed = items.reduce((sum, item) => sum + (item.qty_used || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>ผู้ป่วยที่ใช้เวชภัณฑ์นี้</CardTitle>
        <CardDescription>รายการผู้ป่วยทั้งหมดที่ใช้ {itemName}</CardDescription>
      </CardHeader>
      <CardContent className="px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">กำลังโหลด...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">ไม่พบรายการใช้งาน</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                พบผู้ป่วยที่ใช้ทั้งหมด: <span className="text-2xl font-bold">{totalItems}</span> ราย
              </p>
              <p className="text-xs text-blue-700 mt-1">
                รวมจำนวนที่ใช้: {totalUsed} ชิ้น
              </p>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ลำดับ</TableHead>
                    <TableHead>HN</TableHead>
                    <TableHead>ชื่อผู้ป่วย</TableHead>
                    <TableHead>EN</TableHead>
                    <TableHead>แผนก</TableHead>
                    <TableHead>วันที่ใช้</TableHead>
                    <TableHead className="text-right">จำนวนใช้</TableHead>
                    <TableHead className="text-right">จำนวนคืน</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.usage_id}>
                      <TableCell>{((currentPage - 1) * itemsPerPage) + index + 1}</TableCell>
                      <TableCell className="font-medium text-blue-600">{item.patient_hn}</TableCell>
                      <TableCell>{item.patient_name || '-'}</TableCell>
                      <TableCell>{item.patient_en || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.department_code || '-'}</Badge>
                      </TableCell>
                      <TableCell>
                        {item.usage_datetime 
                          ? new Date(item.usage_datetime).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">{item.qty_used || 0}</TableCell>
                      <TableCell className="text-right font-medium text-orange-600">{item.qty_returned || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <ComparisonPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
