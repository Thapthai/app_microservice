'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { medicalSuppliesApi, vendingReportsApi } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import { toast } from 'sonner';
import { RotateCcw } from 'lucide-react';
import FilterSection from '../dispense-from-cabinet/components/FilterSection';
import ReturnedTable from './components/ReturnedTable';
import type { DispensedItem, FilterState, SummaryData } from '../dispense-from-cabinet/types';

export default function ReturnToCabinetReportPage() {
  const { user } = useAuth();
  const [loadingList, setLoadingList] = useState(true);
  const [returnedList, setReturnedList] = useState<DispensedItem[]>([]);
  
  // Filters
  const [filters, setFilters] = useState<FilterState>({
    searchItemCode: '',
    startDate: '',
    endDate: '',
    itemTypeFilter: 'all',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetchReturnedList();
    }
  }, [user?.id]);

  const fetchReturnedList = async (page: number = 1) => {
    try {
      setLoadingList(true);
      const params: any = {
        page,
        limit: itemsPerPage,
      };
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.searchItemCode) params.itemCode = filters.searchItemCode;
      if (filters.itemTypeFilter && filters.itemTypeFilter !== 'all') {
        params.itemTypeId = parseInt(filters.itemTypeFilter);
      }

      const response = await medicalSuppliesApi.getReturnedItems(params);
      
      if (response.success || response.data) {
        const responseData: any = response.data || response;
        
        const returnedData = Array.isArray(responseData) ? responseData : (responseData.data || []);
        
        const total = responseData.total || returnedData.length;
        const limit = responseData.limit || itemsPerPage;
        const totalPagesNum = responseData.totalPages || Math.ceil(total / limit);
        
        setReturnedList(returnedData);
        setTotalItems(total);
        setTotalPages(totalPagesNum);
        setCurrentPage(responseData.page || page);
        
        if (returnedData.length === 0) {
          toast.info('ไม่พบข้อมูลการคืนอุปกรณ์เข้าตู้ กรุณาตรวจสอบว่ามีข้อมูลในระบบ');
        } else {
          toast.success(`พบ ${total} รายการคืนอุปกรณ์เข้าตู้`);
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
    setCurrentPage(1);
    fetchReturnedList(1);
  };

  const handleClearSearch = () => {
    setFilters({
      searchItemCode: '',
      startDate: '',
      endDate: '',
      itemTypeFilter: 'all',
    });
    setCurrentPage(1);
    fetchReturnedList(1);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExportReport = async (format: 'excel' | 'pdf') => {
    try {
      const params: any = {};
      if (filters.searchItemCode) params.itemCode = filters.searchItemCode;
      if (filters.itemTypeFilter && filters.itemTypeFilter !== 'all') {
        params.itemTypeId = parseInt(filters.itemTypeFilter);
      }
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      toast.info(`กำลังสร้างรายงาน ${format.toUpperCase()}...`);
      
      if (format === 'excel') {
        await vendingReportsApi.downloadReturnToCabinetReportExcel(params);
      } else {
        await vendingReportsApi.downloadReturnToCabinetReportPdf(params);
      }
      
      toast.success(`กำลังดาวน์โหลดรายงาน ${format.toUpperCase()}`);
    } catch (error: any) {
      toast.error(`ไม่สามารถสร้างรายงาน ${format.toUpperCase()} ได้: ${error.message}`);
    }
  };

  const calculateSummary = (): SummaryData => {
    const totalQty = returnedList.reduce((sum, item) => sum + (item.qty || 0), 0);
    return {
      total: totalItems,
      totalQty,
    };
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchReturnedList(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getItemTypes = () => {
    const types = new Map();
    returnedList.forEach(item => {
      if (item.itemtypeID && item.itemType) {
        types.set(item.itemtypeID, item.itemType);
      }
    });
    return Array.from(types.entries()).map(([id, name]) => ({ id: id.toString(), name }));
  };

  const summary = calculateSummary();

  return (
<>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <RotateCcw className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                รายงานคืนอุปกรณ์เข้าตู้
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                รายการอุปกรณ์ทั้งหมดที่คืนเข้าตู้ SmartCabinet
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">รายการทั้งหมด</p>
              <p className="text-2xl font-bold text-green-900">{summary.total}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">จำนวนรวม</p>
              <p className="text-2xl font-bold text-blue-900">{summary.totalQty}</p>
            </div>
          </div>

          {/* Filter Section */}
          <FilterSection
            filters={filters}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            onClear={handleClearSearch}
            onRefresh={() => fetchReturnedList(currentPage)}
            itemTypes={getItemTypes()}
            loading={loadingList}
          />

          {/* Returned Items Table */}
          <ReturnedTable
            loading={loadingList}
            items={returnedList}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            searchItemCode={filters.searchItemCode}
            itemTypeFilter={filters.itemTypeFilter}
            onPageChange={handlePageChange}
            onExportExcel={() => handleExportReport('excel')}
            onExportPdf={() => handleExportReport('pdf')}
          />
        </div>
      </>
  );
}
