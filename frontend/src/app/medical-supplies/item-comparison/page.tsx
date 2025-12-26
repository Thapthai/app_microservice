'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { medicalSuppliesApi } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import { toast } from 'sonner';
import { FileBarChart, Search, Download, RefreshCw, Eye, Filter, Calendar, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ComparisonItem {
  itemcode: string;
  itemname: string;
  itemTypeId: number;
  itemTypeName: string;
  total_dispensed: number;
  total_used: number;
  difference: number;
  status: string;
}

interface UsageItem {
  usage_id: number;
  patient_hn: string;
  patient_name: string;
  patient_en?: string;
  department_code?: string;
  usage_datetime: string;
  itemcode: string;
  itemname: string;
  qty_used: number;
  qty_returned?: number;
  created_at: string;
  updated_at: string;
}

export default function ItemComparisonPage() {
  const { user } = useAuth();
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedItemCode, setSelectedItemCode] = useState<string | null>(null);
  const [comparisonList, setComparisonList] = useState<ComparisonItem[]>([]);
  const [filteredList, setFilteredList] = useState<ComparisonItem[]>([]);
  const [usageItems, setUsageItems] = useState<UsageItem[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(false);
  
  // Filters
  const [searchItemCode, setSearchItemCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [itemTypeFilter, setItemTypeFilter] = useState('all');
  const [searchFirstName, setSearchFirstName] = useState('');
  const [searchLastName, setSearchLastName] = useState('');
  const [searchAssessionNo, setSearchAssessionNo] = useState('');

  // Pagination for comparison list
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Pagination for usage items
  const [usagePage, setUsagePage] = useState(1);
  const [usagePerPage, setUsagePerPage] = useState(5);
  const [usageTotal, setUsageTotal] = useState(0);
  const [usageTotalPages, setUsageTotalPages] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetchComparisonList();
    }
  }, [user?.id]);

  const fetchComparisonList = async (page: number = 1) => {
    try {
      setLoadingList(true);
      const params: any = {
        page,
        limit: itemsPerPage,
      };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (searchItemCode) params.itemCode = searchItemCode;
      if (itemTypeFilter && itemTypeFilter !== 'all') params.itemTypeId = parseInt(itemTypeFilter);

      const response = await medicalSuppliesApi.compareDispensedVsUsage(params);
      
      if (response.success || response.data) {
        const responseData: any = response.data || response;
        
        const comparisonData = responseData.comparison || [];
        
        // Handle pagination - support multiple formats
        let paginationData: any = {};
        if (responseData.pagination) {
          // Format 1: { pagination: { page, limit, total, totalPages } }
          paginationData = {
            page: responseData.pagination.page || page,
            limit: responseData.pagination.limit || itemsPerPage,
            total: responseData.pagination.total || responseData.summary?.total_items || 0,
            totalPages: responseData.pagination.totalPages || Math.ceil((responseData.pagination.total || responseData.summary?.total_items || 0) / (responseData.pagination.limit || itemsPerPage))
          };
        } else {
          // Format 2: { page, limit, total, totalPages } at root
          const totalFromResponse = responseData.total || responseData.summary?.total_items || 0;
          const limitFromResponse = responseData.limit || responseData.filters?.limit || itemsPerPage;
          paginationData = {
            page: responseData.page || responseData.filters?.page || page,
            limit: limitFromResponse,
            total: totalFromResponse,
            totalPages: responseData.totalPages || Math.ceil(totalFromResponse / limitFromResponse)
          };
        }
        
        setComparisonList(comparisonData);
        setFilteredList(comparisonData);
        setTotalItems(paginationData.total || 0);
        setTotalPages(paginationData.totalPages || 0);
        setCurrentPage(paginationData.page || page);
        
        if (comparisonData.length === 0) {
          toast.info('ไม่พบข้อมูลเปรียบเทียบ กรุณาตรวจสอบว่ามีข้อมูลในระบบ');
        } else {
          toast.success(`พบ ${paginationData.total || comparisonData.length} รายการเปรียบเทียบ`);
        }
      } else {
        toast.error(response.message || 'ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoadingList(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
    fetchComparisonList(1);
  };

  const handleClearSearch = () => {
    setSearchItemCode('');
    setItemTypeFilter('all');
    setStartDate('');
    setEndDate('');
    setSearchFirstName('');
    setSearchLastName('');
    setSearchAssessionNo('');
    setCurrentPage(1);
    fetchComparisonList(1);
  };

  const handleSelectItem = (itemCode: string) => {
    setSelectedItemCode(itemCode);
    // Auto load usage details when selecting an item
    handleViewUsageDetails(itemCode, 1);
  };

  const handleViewUsageDetails = async (itemCode: string, page: number = 1) => {
    try {
      setLoadingUsage(true);
      const params: any = {
        itemCode: itemCode,
        page,
        limit: usagePerPage,
      };
      
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (searchFirstName) params.first_name = searchFirstName;
      if (searchLastName) params.lastname = searchLastName;
      if (searchAssessionNo) params.assession_no = searchAssessionNo;
      
      const response = await medicalSuppliesApi.getUsageByItemCode(params) as any;
      
      if (response.success) {
        const responseData = response.data || response;
        const items = responseData.data || responseData || [];
        
        // Calculate pagination info
        const total = responseData.total || items.length;
        const currentPage = responseData.page || responseData.filters?.page || page;
        const limit = responseData.limit || responseData.filters?.limit || usagePerPage;
        const totalPages = responseData.totalPages || Math.ceil(total / limit);
        
        setUsageItems(items);
        setUsageTotal(total);
        setUsageTotalPages(totalPages);
        setUsagePage(currentPage);
      } else {
        toast.error(response.message || 'ไม่สามารถโหลดรายการใช้งานได้');
        setUsageItems([]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการโหลดรายการใช้งาน');
      setUsageItems([]);
    } finally {
      setLoadingUsage(false);
    }
  };

  const handleExportReport = async (format: 'excel' | 'pdf', itemCode?: string) => {
    try {
      const params = new URLSearchParams();
      
      if (itemCode) {
        params.append('itemCode', itemCode);
        params.append('includeUsageDetails', 'true');
      } else {
        // Export all comparison data
        if (searchItemCode) params.append('itemCode', searchItemCode);
        if (itemTypeFilter && itemTypeFilter !== 'all') params.append('itemTypeId', itemTypeFilter);
      }
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const url = `${baseUrl}/medical-supplies-comparison/export/${format}?${params.toString()}`;
      
      toast.info(`กำลังสร้างรายงาน ${format.toUpperCase()}...`);
      
      // Open download in new window
      window.open(url, '_blank');
      
      toast.success(`กำลังดาวน์โหลดรายงาน ${format.toUpperCase()}`);
    } catch (error: any) {
      toast.error(`ไม่สามารถสร้างรายงาน ${format.toUpperCase()} ได้: ${error.message}`);
    }
  };

  const handleExportCSVOld = () => {
    if (!selectedItemCode) {
      toast.error('กรุณาเลือกรายการก่อน');
      return;
    }

    const selectedItem = filteredList.find(item => item.itemcode === selectedItemCode);
    if (!selectedItem) {
      toast.error('ไม่พบข้อมูลรายการที่เลือก');
      return;
    }

    try {
      const headers = ['รหัสเวชภัณฑ์', 'ชื่อเวชภัณฑ์', 'ประเภท', 'จำนวนเบิก', 'จำนวนใช้', 'ผลต่าง', 'สถานะ'];
      const row = [
        selectedItem.itemcode,
        selectedItem.itemname,
        selectedItem.itemTypeName,
        selectedItem.total_dispensed,
        selectedItem.total_used,
        selectedItem.difference,
        selectedItem.status
      ];

      const csvContent = [
        headers.join(','),
        row.join(',')
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `item_comparison_${selectedItemCode}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Export สำเร็จ');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('เกิดข้อผิดพลาดในการ export');
    }
  };

  const calculateSummary = () => {
    // Use total items from pagination, not just current page
    return {
      total: totalItems,
      matched: filteredList.filter(item => item.status === 'MATCHED').length,
      notMatched: filteredList.filter(item => item.status !== 'MATCHED').length
    };
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchComparisonList(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUsagePageChange = (newPage: number) => {
    if (selectedItemCode) {
      handleViewUsageDetails(selectedItemCode, newPage);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      'MATCHED': { 
        label: 'ตรงกัน', 
        className: 'bg-green-50 text-green-700 border-green-200',
        dotColor: 'bg-green-500'
      },
      'DISPENSED_NOT_USED': { 
        label: 'เบิกแล้วไม่ใช้', 
        className: 'bg-orange-50 text-orange-700 border-orange-200',
        dotColor: 'bg-orange-500'
      },
      'USED_WITHOUT_DISPENSE': { 
        label: 'ใช้โดยไม่เบิก', 
        className: 'bg-red-50 text-red-700 border-red-200',
        dotColor: 'bg-red-500'
      },
      'DISPENSE_EXCEEDS_USAGE': { 
        label: 'เบิกเกิน', 
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        dotColor: 'bg-yellow-500'
      },
      'USAGE_EXCEEDS_DISPENSE': { 
        label: 'ใช้เกิน', 
        className: 'bg-purple-50 text-purple-700 border-purple-200',
        dotColor: 'bg-purple-500'
      }
    };

    const config = statusConfig[status] || { 
      label: status, 
      className: 'bg-gray-50 text-gray-700 border-gray-200',
      dotColor: 'bg-gray-500'
    };
    
    return (
      <Badge variant="outline" className={`${config.className} border`}>
        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${config.dotColor}`}></span>
        {config.label}
      </Badge>
    );
  };

  const getItemTypes = () => {
    const types = new Map();
    comparisonList.forEach(item => {
      if (item.itemTypeId && item.itemTypeName) {
        types.set(item.itemTypeId, item.itemTypeName);
      }
    });
    return Array.from(types.entries()).map(([id, name]) => ({ id: id.toString(), name }));
  };

  // Generate page numbers for pagination
  const generatePageNumbers = (current: number, total: number) => {
    const pages: (number | string)[] = [];
    const maxVisible = 5; // Maximum number of page buttons to show

    if (total <= maxVisible + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (current > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(total);
    }

    return pages;
  };

  const summary = calculateSummary();
  const selectedItem = filteredList.find(item => item.itemcode === selectedItemCode);

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                รายงานเปรียบเทียบตามเวชภัณฑ์
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                เปรียบเทียบจำนวนเบิกกับการใช้งานจริงแยกตามรายการเวชภัณฑ์
              </p>
            </div>
          </div>

          {/* Filter Section */}
          <Card>
            <CardHeader>
              <CardTitle>กรองข้อมูล</CardTitle>
              <CardDescription>ค้นหาและกรองรายการเปรียบเทียบ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search by Item Code */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">รหัส/ชื่อเวชภัณฑ์</label>
                  <Input
                    placeholder="ค้นหา..."
                    value={searchItemCode}
                    onChange={(e) => setSearchItemCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>

                {/* Item Type Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">ประเภทเวชภัณฑ์</label>
                  <Select value={itemTypeFilter} onValueChange={setItemTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="ทั้งหมด" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      {getItemTypes().map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">วันที่เริ่มต้น</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">วันที่สิ้นสุด</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                {/* First Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">ชื่อ (Firstname)</label>
                  <Input
                    placeholder="กรอกชื่อ..."
                    value={searchFirstName}
                    onChange={(e) => setSearchFirstName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">นามสกุล (Lastname)</label>
                  <Input
                    placeholder="กรอกนามสกุล..."
                    value={searchLastName}
                    onChange={(e) => setSearchLastName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>

                {/* Assession No */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Assession No</label>
                  <Input
                    placeholder="กรอก Assession No..."
                    value={searchAssessionNo}
                    onChange={(e) => setSearchAssessionNo(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={handleSearch} disabled={loadingList}>
                  <Search className="h-4 w-4 mr-2" />
                  ค้นหา
                </Button>
                <Button onClick={handleClearSearch} variant="outline">
                  ล้าง
                </Button>
                <Button onClick={() => fetchComparisonList(currentPage)} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  รีเฟรช
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comparison List Table */}
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
                    onClick={() => handleExportReport('excel')} 
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button 
                    onClick={() => handleExportReport('pdf')} 
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
              {loadingList ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                  <span className="ml-3 text-gray-500">กำลังโหลดข้อมูล...</span>
                </div>
              ) : filteredList.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">ไม่พบรายการเปรียบเทียบ</p>
                  <p className="text-sm text-gray-400 mt-2">กรุณาตรวจสอบว่ามีข้อมูลในระบบ</p>
                </div>
              ) : (
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
                      {filteredList.map((item) => {
                        const isSelected = selectedItemCode === item.itemcode;
                        
                        return (
                          <TableRow
                            key={item.itemcode}
                            className={`cursor-pointer hover:bg-purple-50 transition-colors ${
                              isSelected ? 'bg-purple-100 hover:bg-purple-100' : ''
                            }`}
                            onClick={() => handleSelectItem(item.itemcode)}
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
                              {getStatusBadge(item.status)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination Controls */}
              {!loadingList && filteredList.length > 0 && (
                <div className="flex flex-col gap-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      แสดง {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} จากทั้งหมด {totalItems} รายการ
                    </div>
                    {totalPages > 1 && (
                      <div className="text-sm text-gray-600">
                        หน้า {currentPage} / {totalPages}
                      </div>
                    )}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                      >
                        ก่อนหน้า
                      </Button>
                      
                      {generatePageNumbers(currentPage, totalPages).map((page, index) => (
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-400">
                            ...
                          </span>
                        ) : (
                          <Button
                            key={page}
                            onClick={() => handlePageChange(page as number)}
                            disabled={currentPage === page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            className={currentPage === page ? "bg-purple-600 hover:bg-purple-700" : ""}
                          >
                            {page}
                          </Button>
                        )
                      ))}
                      
                      <Button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                      >
                        ถัดไป
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detail Section - Only show when item is selected */}
          {selectedItemCode && selectedItem && (
            <>
              {/* Item Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>ข้อมูลเวชภัณฑ์ (รหัส: {selectedItemCode})</CardTitle>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleExportReport('excel', selectedItemCode)} 
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button 
                        onClick={() => handleExportReport('pdf', selectedItemCode)} 
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button
                        onClick={() => handleViewUsageDetails(selectedItemCode, 1)}
                        variant="outline"
                        size="sm"
                        disabled={loadingUsage}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loadingUsage ? 'animate-spin' : ''}`} />
                        รีเฟรช
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">รหัสเวชภัณฑ์</p>
                      <p className="font-semibold">{selectedItem.itemcode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ชื่อเวชภัณฑ์</p>
                      <p className="font-semibold">{selectedItem.itemname || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ประเภท</p>
                      <p className="font-semibold">{selectedItem.itemTypeName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">สถานะ</p>
                      <div className="mt-1">
                        {getStatusBadge(selectedItem.status)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">จำนวนเบิก</p>
                      <p className="text-3xl font-bold text-blue-600">{selectedItem.total_dispensed}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">จำนวนใช้</p>
                      <p className="text-3xl font-bold text-green-600">{selectedItem.total_used}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">ผลต่าง</p>
                      <p className={`text-3xl font-bold ${
                        selectedItem.difference === 0 ? 'text-green-600' :
                        selectedItem.difference > 0 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {selectedItem.difference > 0 && '+'}
                        {selectedItem.difference}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">รายการทั้งหมด</p>
                      <p className="text-3xl font-bold text-purple-600">{summary.total}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        ตรงกัน: {summary.matched} | ไม่ตรง: {summary.notMatched}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Comparison Details */}
              <Card>
                <CardHeader>
                  <CardTitle>รายละเอียดการเปรียบเทียบ</CardTitle>
                  <CardDescription>ข้อมูลเปรียบเทียบระหว่างการเบิกและการใช้งานจริง</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-600">จำนวนเบิกทั้งหมด</p>
                        <p className="text-2xl font-bold text-blue-600">{selectedItem.total_dispensed}</p>
                        <p className="text-xs text-gray-500 mt-1">จำนวนที่เบิกจากคลัง</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">จำนวนใช้งานจริง</p>
                        <p className="text-2xl font-bold text-green-600">{selectedItem.total_used}</p>
                        <p className="text-xs text-gray-500 mt-1">จำนวนที่บันทึกใช้กับผู้ป่วย</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">ผลต่าง</p>
                        <p className={`text-2xl font-bold ${
                          selectedItem.difference === 0 ? 'text-green-600' :
                          selectedItem.difference > 0 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {selectedItem.difference > 0 && '+'}
                          {selectedItem.difference}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedItem.difference === 0 && 'ตรงกัน'}
                          {selectedItem.difference > 0 && 'เบิกมากกว่าที่ใช้'}
                          {selectedItem.difference < 0 && 'ใช้มากกว่าที่เบิก'}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">สถานะการเปรียบเทียบ</h3>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(selectedItem.status)}
                        <span className="text-sm text-gray-600">
                          {selectedItem.status === 'MATCHED' && 'จำนวนเบิกและใช้ตรงกัน'}
                          {selectedItem.status === 'DISPENSED_NOT_USED' && 'มีการเบิกแต่ยังไม่มีการบันทึกการใช้'}
                          {selectedItem.status === 'USED_WITHOUT_DISPENSE' && 'มีการใช้แต่ไม่มีการเบิก'}
                          {selectedItem.status === 'DISPENSE_EXCEEDS_USAGE' && 'จำนวนเบิกมากกว่าจำนวนใช้'}
                          {selectedItem.status === 'USAGE_EXCEEDS_DISPENSE' && 'จำนวนใช้มากกว่าจำนวนเบิก'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Items List */}
              <Card>
                <CardHeader>
                  <CardTitle>ผู้ป่วยที่ใช้เวชภัณฑ์นี้</CardTitle>
                  <CardDescription>รายการผู้ป่วยทั้งหมดที่ใช้ {selectedItem.itemname}</CardDescription>
                </CardHeader>
                <CardContent className="px-4 py-4">
                  {loadingUsage ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                      <span className="ml-3 text-gray-500">กำลังโหลด...</span>
                    </div>
                  ) : usageItems.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">ไม่พบรายการใช้งาน</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">
                          พบผู้ป่วยที่ใช้ทั้งหมด: <span className="text-2xl font-bold">{usageTotal}</span> ราย
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          รวมจำนวนที่ใช้: {usageItems.reduce((sum: number, item: UsageItem) => sum + (item.qty_used || 0), 0)} ชิ้น
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
                            {usageItems.map((item, index) => (
                              <TableRow key={item.usage_id}>
                                <TableCell>{((usagePage - 1) * usagePerPage) + index + 1}</TableCell>
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

                      {/* Pagination for Usage Items */}
                      {usageTotalPages > 1 && (
                        <div className="flex flex-col gap-4 mt-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              แสดง {((usagePage - 1) * usagePerPage) + 1} - {Math.min(usagePage * usagePerPage, usageTotal)} จากทั้งหมด {usageTotal} รายการ
                            </div>
                            <div className="text-sm text-gray-600">
                              หน้า {usagePage} / {usageTotalPages}
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              onClick={() => handleUsagePageChange(usagePage - 1)}
                              disabled={usagePage === 1}
                              variant="outline"
                              size="sm"
                            >
                              ก่อนหน้า
                            </Button>
                            
                            {generatePageNumbers(usagePage, usageTotalPages).map((page, index) => (
                              page === '...' ? (
                                <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-400">
                                  ...
                                </span>
                              ) : (
                                <Button
                                  key={page}
                                  onClick={() => handleUsagePageChange(page as number)}
                                  disabled={usagePage === page}
                                  variant={usagePage === page ? "default" : "outline"}
                                  size="sm"
                                  className={usagePage === page ? "bg-blue-600 hover:bg-blue-700" : ""}
                                >
                                  {page}
                                </Button>
                              )
                            ))}
                            
                            <Button
                              onClick={() => handleUsagePageChange(usagePage + 1)}
                              disabled={usagePage === usageTotalPages}
                              variant="outline"
                              size="sm"
                            >
                              ถัดไป
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
