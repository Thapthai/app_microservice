'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { medicalSuppliesApi } from '@/lib/api';
import { toast } from 'sonner';
import { Package } from 'lucide-react';
import FilterSection from './components/FilterSection';
import DispensedTable from './components/DispensedTable';
import type { DispensedItem, FilterState, SummaryData } from './types';

export default function DispenseFromCabinetPage() {
  const { user } = useAuth();
  const [loadingList, setLoadingList] = useState(true);
  const [dispensedList, setDispensedList] = useState<DispensedItem[]>([]);

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
      fetchDispensedList();
    }
  }, [user?.id]);

  const fetchDispensedList = async (page: number = 1) => {
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

      const response = await medicalSuppliesApi.getDispensedItems(params);

      if (response.success || response.data) {
        const responseData: any = response.data || response;

        const dispensedData = Array.isArray(responseData) ? responseData : (responseData.data || []);

        const total = responseData.total || dispensedData.length;
        const limit = responseData.limit || itemsPerPage;
        const totalPagesNum = responseData.totalPages || Math.ceil(total / limit);

        setDispensedList(dispensedData);
        setTotalItems(total);
        setTotalPages(totalPagesNum);
        setCurrentPage(responseData.page || page);

        if (dispensedData.length === 0) {
          toast.info('ไม่พบข้อมูลการเบิกอุปกรณ์ กรุณาตรวจสอบว่ามีข้อมูลในระบบ');
        } else {
          toast.success(`พบ ${total} รายการเบิกอุปกรณ์`);
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
    fetchDispensedList(1);
  };

  const handleClearSearch = () => {
    setFilters({
      searchItemCode: '',
      startDate: '',
      endDate: '',
      itemTypeFilter: 'all',
    });
    setCurrentPage(1);
    fetchDispensedList(1);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExportReport = async (format: 'excel' | 'pdf') => {
    try {
      const params = new URLSearchParams();

      if (filters.searchItemCode) params.append('itemCode', filters.searchItemCode);
      if (filters.itemTypeFilter && filters.itemTypeFilter !== 'all') {
        params.append('itemTypeId', filters.itemTypeFilter);
      }
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      toast.info(`กำลังสร้างรายงาน ${format.toUpperCase()}...`);
      // TODO: Implement export endpoint
      toast.success(`กำลังดาวน์โหลดรายงาน ${format.toUpperCase()}`);
    } catch (error: any) {
      toast.error(`ไม่สามารถสร้างรายงาน ${format.toUpperCase()} ได้: ${error.message}`);
    }
  };

  const calculateSummary = (): SummaryData => {
    const totalQty = dispensedList.reduce((sum, item) => sum + (item.qty || 0), 0);
    return {
      total: totalItems,
      totalQty,
    };
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchDispensedList(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getItemTypes = () => {
    const types = new Map();
    dispensedList.forEach(item => {
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
          <div className="p-2 bg-purple-100 rounded-lg">
            <Package className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              รายงานเบิกอุปกรณ์จากตู้
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              รายการอุปกรณ์ทั้งหมดที่เบิกจากตู้ SmartCabinet
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">รายการทั้งหมด</p>
            <p className="text-2xl font-bold text-blue-900">{summary.total}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">จำนวนรวม</p>
            <p className="text-2xl font-bold text-green-900">{summary.totalQty}</p>
          </div>
        </div>

        {/* Filter Section */}
        <FilterSection
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          onClear={handleClearSearch}
          onRefresh={() => fetchDispensedList(currentPage)}
          itemTypes={getItemTypes()}
          loading={loadingList}
        />

        {/* Dispensed Items Table */}
        <DispensedTable
          loading={loadingList}
          items={dispensedList}
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
