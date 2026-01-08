'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { medicalSuppliesApi } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import { toast } from 'sonner';
import { Package } from 'lucide-react';
import FilterSection from './components/FilterSection';
import ComparisonTable from './components/ComparisonTable';
import ItemInfoCard from './components/ItemInfoCard';
import SummaryCards from './components/SummaryCards';
import ComparisonDetailsCard from './components/ComparisonDetailsCard';
import UsageItemsTable from './components/UsageItemsTable';
import type { ComparisonItem, UsageItem, FilterState, SummaryData } from './types';

export default function ItemComparisonPage() {
  const { user } = useAuth();
  const [loadingList, setLoadingList] = useState(true);
  const [selectedItemCode, setSelectedItemCode] = useState<string | null>(null);
  const [comparisonList, setComparisonList] = useState<ComparisonItem[]>([]);
  const [filteredList, setFilteredList] = useState<ComparisonItem[]>([]);
  
  // Filters
  const [filters, setFilters] = useState<FilterState>({
    searchItemCode: '',
    startDate: '',
    endDate: '',
    itemTypeFilter: 'all',
  });

  // Pagination for comparison list
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

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
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.searchItemCode) params.itemCode = filters.searchItemCode;
      if (filters.itemTypeFilter && filters.itemTypeFilter !== 'all') {
        params.itemTypeId = parseInt(filters.itemTypeFilter);
      }

      const response = await medicalSuppliesApi.compareDispensedVsUsage(params);
      
      if (response.success || response.data) {
        const responseData: any = response.data || response;
        
        const comparisonData = responseData.comparison || [];
        
        // Handle pagination - support multiple formats
        let paginationData: any = {};
        if (responseData.pagination) {
          paginationData = {
            page: responseData.pagination.page || page,
            limit: responseData.pagination.limit || itemsPerPage,
            total: responseData.pagination.total || responseData.summary?.total_items || 0,
            totalPages: responseData.pagination.totalPages || Math.ceil((responseData.pagination.total || responseData.summary?.total_items || 0) / (responseData.pagination.limit || itemsPerPage))
          };
        } else {
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
    setCurrentPage(1);
    fetchComparisonList(1);
  };

  const handleClearSearch = () => {
    setFilters({
      searchItemCode: '',
      startDate: '',
      endDate: '',
      itemTypeFilter: 'all',
    });
    setCurrentPage(1);
    fetchComparisonList(1);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectItem = (itemCode: string) => {
    setSelectedItemCode(itemCode);
  };

  const handleExportReport = async (format: 'excel' | 'pdf', itemCode?: string) => {
    try {
      const params = new URLSearchParams();
      
      if (itemCode) {
        params.append('itemCode', itemCode);
        params.append('includeUsageDetails', 'true');
      } else {
        if (filters.searchItemCode) params.append('itemCode', filters.searchItemCode);
        if (filters.itemTypeFilter && filters.itemTypeFilter !== 'all') {
          params.append('itemTypeId', filters.itemTypeFilter);
        }
      }
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const url = `${baseUrl}/medical-supplies-comparison/export/${format}?${params.toString()}`;
      
      toast.info(`กำลังสร้างรายงาน ${format.toUpperCase()}...`);
      
      window.open(url, '_blank');
      
      toast.success(`กำลังดาวน์โหลดรายงาน ${format.toUpperCase()}`);
    } catch (error: any) {
      toast.error(`ไม่สามารถสร้างรายงาน ${format.toUpperCase()} ได้: ${error.message}`);
    }
  };

  const calculateSummary = (): SummaryData => {
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


  const getItemTypes = () => {
    const types = new Map();
    comparisonList.forEach(item => {
      if (item.itemTypeId && item.itemTypeName) {
        types.set(item.itemTypeId, item.itemTypeName);
      }
    });
    return Array.from(types.entries()).map(([id, name]) => ({ id: id.toString(), name }));
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
          <FilterSection
            filters={filters}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            onClear={handleClearSearch}
            onRefresh={() => fetchComparisonList(currentPage)}
            itemTypes={getItemTypes()}
            loading={loadingList}
          />

          {/* Comparison List Table */}
          <ComparisonTable
            loading={loadingList}
            items={filteredList}
            selectedItemCode={selectedItemCode}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            searchItemCode={filters.searchItemCode}
            itemTypeFilter={filters.itemTypeFilter}
            onSelectItem={handleSelectItem}
            onPageChange={handlePageChange}
            onExportExcel={() => handleExportReport('excel')}
            onExportPdf={() => handleExportReport('pdf')}
          />

          {/* Detail Section - Only show when item is selected */}
          {selectedItemCode && selectedItem && (
            <>
              {/* Item Info */}
              <ItemInfoCard
                item={selectedItem}
                loading={false}
                onExportExcel={() => handleExportReport('excel', selectedItemCode)}
                onExportPdf={() => handleExportReport('pdf', selectedItemCode)}
                onRefresh={() => {}}
              />

              {/* Summary Cards */}
              <SummaryCards
                selectedItem={selectedItem}
                summary={summary}
              />

              {/* Comparison Details */}
              <ComparisonDetailsCard item={selectedItem} />

              {/* Usage Items List */}
              <UsageItemsTable
                itemCode={selectedItemCode}
                itemName={selectedItem.itemname}
              />
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
