'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import { RotateCcw, History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { medicalSuppliesApi } from '@/lib/api';
import { toast } from 'sonner';
import UsageSelectStep from './components/UsageSelectStep';
import SupplyItemSelectStep from './components/SupplyItemSelectStep';
import ReturnDetailsStep from './components/ReturnDetailsStep';
import ReturnHistoryFilter from './components/ReturnHistoryFilter';
import ReturnHistoryTable from './components/ReturnHistoryTable';
import type { Usage, SupplyItem, ReturnReason, ReturnHistoryData } from './types';

export default function ReturnMedicalSuppliesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('return');
  
  // Form states for return
  const [selectedUsageId, setSelectedUsageId] = useState<number | null>(null);
  const [selectedSupplyItemId, setSelectedSupplyItemId] = useState<number | null>(null);
  const [usages, setUsages] = useState<Usage[]>([]);
  const [supplyItems, setSupplyItems] = useState<SupplyItem[]>([]);
  const [selectedSupplyItem, setSelectedSupplyItem] = useState<SupplyItem | null>(null);
  const [returnQty, setReturnQty] = useState<number>(1);
  const [returnReason, setReturnReason] = useState<ReturnReason>('UNWRAPPED_UNUSED');
  const [returnNote, setReturnNote] = useState<string>('');
  const [loadingUsages, setLoadingUsages] = useState(false);
  const [loadingSupplyItems, setLoadingSupplyItems] = useState(false);
  
  // Return history states
  const [returnHistoryDateFrom, setReturnHistoryDateFrom] = useState('');
  const [returnHistoryDateTo, setReturnHistoryDateTo] = useState('');
  const [returnHistoryReason, setReturnHistoryReason] = useState<string>('ALL');
  const [returnHistoryData, setReturnHistoryData] = useState<ReturnHistoryData | null>(null);
  const [returnHistoryPage, setReturnHistoryPage] = useState(1);
  const [returnHistoryLimit] = useState(10);

  // Fetch MedicalSupplyUsage records with supply_items that can be returned
  const fetchUsages = async () => {
    try {
      setLoadingUsages(true);
      const result = await medicalSuppliesApi.getAll({
        page: 1,
        limit: 100,
        startDate: '',
        endDate: '',
      });
      
      if (result.data) {
        const usagesList = Array.isArray(result.data) ? result.data : [result.data];
        // Filter usages that have supply_items with qty_pending > 0
        const usagesWithReturnableItems = usagesList.filter((usage: any) => {
          const usageData = usage.data || usage;
          return usageData.supply_items?.some((item: any) => {
            const qtyPending = (item.qty || 0) - (item.qty_used_with_patient || 0) - (item.qty_returned_to_cabinet || 0);
            return qtyPending > 0;
          });
        });
        setUsages(usagesWithReturnableItems);
      }
    } catch (error: any) {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setLoadingUsages(false);
    }
  };

  // Fetch SupplyUsageItems for selected usage
  const fetchSupplyItems = async (usageId: number) => {
    try {
      setLoadingSupplyItems(true);
      const result = await medicalSuppliesApi.getSupplyItemsByUsageId(usageId);
      
      if (result.success && result.data) {
        // Filter items that can be returned (qty_pending > 0)
        const returnableItems = result.data.filter((item: any) => {
          const qtyPending = (item.qty || 0) - (item.qty_used_with_patient || 0) - (item.qty_returned_to_cabinet || 0);
          return qtyPending > 0;
        });
        setSupplyItems(returnableItems);
      }
    } catch (error: any) {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setLoadingSupplyItems(false);
    }
  };

  const handleUsageSelect = async (usageId: number) => {
    setSelectedUsageId(usageId);
    setSelectedSupplyItemId(null);
    setSelectedSupplyItem(null);
    setReturnQty(1);
    await fetchSupplyItems(usageId);
  };

  const handleSupplyItemSelect = (itemId: number) => {
    setSelectedSupplyItemId(itemId);
    const item = supplyItems.find(i => i.id === itemId);
    if (item) {
      setSelectedSupplyItem(item);
      const qtyPending = (item.qty || 0) - (item.qty_used_with_patient || 0) - (item.qty_returned_to_cabinet || 0);
      setReturnQty(Math.min(1, qtyPending));
    }
  };

  const fetchReturnHistory = async () => {
    try {
      setHistoryLoading(true);
      const params: any = {
        page: returnHistoryPage,
        limit: returnHistoryLimit,
      };
      if (returnHistoryDateFrom) params.date_from = returnHistoryDateFrom;
      if (returnHistoryDateTo) params.date_to = returnHistoryDateTo;
      if (returnHistoryReason && returnHistoryReason !== 'ALL') params.return_reason = returnHistoryReason;

      const result = await medicalSuppliesApi.getReturnHistory(params);
      // Backend returns: { success: true, data: [...], total: ..., page: ..., limit: ... }
      if (result.success && result.data) {
        // Extract the data structure from ApiResponse
        setReturnHistoryData({
          data: result.data,
          total: (result as any).total || 0,
          page: (result as any).page || returnHistoryPage,
          limit: (result as any).limit || returnHistoryLimit,
        });
      } else if (result.data) {
        // Fallback: if result has data but no success flag
        setReturnHistoryData({
          data: result.data,
          total: (result as any).total || 0,
          page: (result as any).page || returnHistoryPage,
          limit: (result as any).limit || returnHistoryLimit,
        });
      } else {
        toast.error('ไม่สามารถดึงข้อมูลประวัติการคืนได้');
      }
    } catch (error: any) {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!selectedSupplyItemId || !selectedSupplyItem) {
      toast.error('กรุณาเลือกรายการที่ต้องการคืน');
      return;
    }

    try {
      setLoading(true);
      
      const qtyPending = (selectedSupplyItem.qty || 0) - (selectedSupplyItem.qty_used_with_patient || 0) - (selectedSupplyItem.qty_returned_to_cabinet || 0);
      
      if (returnQty > qtyPending) {
        toast.error(`จำนวนที่ต้องการคืนเกินจำนวนที่สามารถคืนได้ (${qtyPending})`);
        return;
      }

      await medicalSuppliesApi.recordItemReturn({
        item_id: selectedSupplyItemId,
        qty_returned: returnQty,
        return_reason: returnReason,
        return_by_user_id: user?.id?.toString() || 'unknown',
        return_note: returnNote,
      });

      toast.success('บันทึกการคืนเวชภัณฑ์สำเร็จ');
      
      // Reset form
      setSelectedUsageId(null);
      setSelectedSupplyItemId(null);
      setSelectedSupplyItem(null);
      setReturnQty(1);
      setReturnReason('UNWRAPPED_UNUSED');
      setReturnNote('');
      setSupplyItems([]);
      
      // Refresh data
      if (selectedUsageId) {
        await fetchSupplyItems(selectedUsageId);
      }
      await fetchUsages();
      await fetchReturnHistory();
    } catch (error: any) {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchReturnHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, returnHistoryPage]);

  useEffect(() => {
    if (activeTab === 'return') {
      fetchUsages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };

  const getReturnReasonLabel = (reason: string) => {
    const labels: { [key: string]: string } = {
      'UNWRAPPED_UNUSED': 'ยังไม่ได้แกะซอง หรือยังอยู่ในสภาพเดิม',
      'EXPIRED': 'อุปกรณ์หมดอายุ',
      'CONTAMINATED': 'อุปกรณ์มีการปนเปื้อน',
      'DAMAGED': 'อุปกรณ์ชำรุด',
    };
    return labels[reason] || reason;
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
              <RotateCcw className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                คืนเวชภัณฑ์
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                คืนเวชภัณฑ์ที่เบิกแล้วแต่ยังไม่ได้ใช้กลับเข้าตู้ Vending
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="return" className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                คืนเวชภัณฑ์
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                ประวัติการคืน
              </TabsTrigger>
            </TabsList>

            {/* Tab: Return Items */}
            <TabsContent value="return" className="space-y-4">
              {/* Return Form */}
              <Card>
                <CardHeader>
                  <CardTitle>บันทึกการคืนเวชภัณฑ์</CardTitle>
                  <CardDescription>
                    เลือก MedicalSupplyUsage และ SupplyUsageItem เพื่อบันทึกการคืน
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Step 1: Select MedicalSupplyUsage */}
                  <UsageSelectStep
                    usages={usages}
                    selectedUsageId={selectedUsageId}
                    loading={loadingUsages}
                    onSelect={handleUsageSelect}
                    onRefresh={fetchUsages}
                    formatDate={formatDate}
                  />

                  {/* Step 2: Select SupplyUsageItem */}
                  {selectedUsageId && (
                    <SupplyItemSelectStep
                      supplyItems={supplyItems}
                      selectedSupplyItemId={selectedSupplyItemId}
                      selectedSupplyItem={selectedSupplyItem}
                      loading={loadingSupplyItems}
                      onSelect={handleSupplyItemSelect}
                    />
                  )}

                  {/* Step 3: Return Details */}
                  {selectedSupplyItem && (
                    <ReturnDetailsStep
                      selectedSupplyItem={selectedSupplyItem}
                      returnQty={returnQty}
                      returnReason={returnReason}
                      returnNote={returnNote}
                      loading={loading}
                      onQtyChange={setReturnQty}
                      onReasonChange={setReturnReason}
                      onNoteChange={setReturnNote}
                      onSubmit={handleReturn}
                    />
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Flow การจัดการ:</h4>
                    <ul className="space-y-1 text-sm text-blue-800">
                      <li>• กรณีที่ยังไม่ได้แกะซอง หรือยังอยู่ในสภาพเดิมจากการเบิก: ให้นำกลับเข้าตู้ Vending (หมายถึงการนำกลับมาคืน)</li>
                      <li>• กรณีที่ Package ไม่เหมือนเดิม หรือนำไปใช้ในแผนก: ติดต่อแผนกที่เกี่ยวข้อง</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Return History */}
            <TabsContent value="history" className="space-y-4">
              <ReturnHistoryFilter
                dateFrom={returnHistoryDateFrom}
                dateTo={returnHistoryDateTo}
                reason={returnHistoryReason}
                loading={historyLoading}
                onDateFromChange={setReturnHistoryDateFrom}
                onDateToChange={setReturnHistoryDateTo}
                onReasonChange={setReturnHistoryReason}
                onSearch={fetchReturnHistory}
              />

              {returnHistoryData && (
                <ReturnHistoryTable
                  data={returnHistoryData}
                  currentPage={returnHistoryPage}
                  limit={returnHistoryLimit}
                  dateFrom={returnHistoryDateFrom}
                  dateTo={returnHistoryDateTo}
                  reason={returnHistoryReason}
                  formatDate={formatDate}
                  getReturnReasonLabel={getReturnReasonLabel}
                  onPageChange={setReturnHistoryPage}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
