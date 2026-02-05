'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import { RotateCcw, History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { medicalSuppliesApi } from '@/lib/api';
import { toast } from 'sonner';
import UsageSearchStep from './components/UsageSearchStep';
import ReturnEditableTable, { type ReturnRow } from './components/ReturnEditableTable';
import ReturnHistoryFilter from './components/ReturnHistoryFilter';
import ReturnHistoryTable from './components/ReturnHistoryTable';
import type { Usage, SupplyItem, ReturnReason, ReturnHistoryData } from './types';

const USAGES_PAGE_SIZE = 10;

export default function ReturnMedicalSuppliesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('return');

  // Step 1: Search & table (default start/end date = today)
  const today = () => new Date().toISOString().slice(0, 10);
  const [searchStartDate, setSearchStartDate] = useState(today);
  const [searchEndDate, setSearchEndDate] = useState(today);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [usages, setUsages] = useState<Usage[]>([]);
  const [usagesPage, setUsagesPage] = useState(1);
  const [usagesTotal, setUsagesTotal] = useState(0);
  const [usagesLastPage, setUsagesLastPage] = useState(1);
  const [loadingUsages, setLoadingUsages] = useState(false);
  const [selectedUsageId, setSelectedUsageId] = useState<number | null>(null);

  // Step 2: Editable return table
  const [supplyItems, setSupplyItems] = useState<SupplyItem[]>([]);
  const [returnRows, setReturnRows] = useState<ReturnRow[]>([]);
  const [loadingSupplyItems, setLoadingSupplyItems] = useState(false);

  // Return history (default date from/to = today)
  const [returnHistoryDateFrom, setReturnHistoryDateFrom] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [returnHistoryDateTo, setReturnHistoryDateTo] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [returnHistoryReason, setReturnHistoryReason] = useState<string>('ALL');
  const [returnHistoryData, setReturnHistoryData] = useState<ReturnHistoryData | null>(null);
  const [returnHistoryPage, setReturnHistoryPage] = useState(1);
  const [returnHistoryLimit] = useState(10);

  const fetchUsages = useCallback(async (page: number = 1) => {
    try {
      setLoadingUsages(true);
      const result = await medicalSuppliesApi.getAll({
        page,
        limit: USAGES_PAGE_SIZE,
        startDate: searchStartDate || undefined,
        endDate: searchEndDate || undefined,
        keyword: searchKeyword.trim() || undefined,
      });
      const data = result.data ?? [];
      const list = Array.isArray(data) ? data : [data];
      setUsages(list);
      setUsagesTotal(result.total ?? 0);
      setUsagesPage(result.page ?? page);
      setUsagesLastPage(result.lastPage ?? (Math.ceil((result.total ?? 0) / USAGES_PAGE_SIZE) || 1));
    } catch (error: any) {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
      setUsages([]);
    } finally {
      setLoadingUsages(false);
    }
  }, [searchStartDate, searchEndDate, searchKeyword]);

  const handleSearch = () => fetchUsages(1);

  const fetchSupplyItems = useCallback(async (usageId: number) => {
    try {
      setLoadingSupplyItems(true);
      const result = await medicalSuppliesApi.getSupplyItemsByUsageId(usageId);
      const raw = result.success && result.data ? result.data : [];
      const items = Array.isArray(raw) ? raw : [raw];
      const returnable = items.filter((item: any) => {
        const qtyPending = (item.qty || 0) - (item.qty_used_with_patient || 0) - (item.qty_returned_to_cabinet || 0);
        return qtyPending > 0;
      }) as SupplyItem[];
      setSupplyItems(returnable);
      setReturnRows(
        returnable.map((item) => ({
          item,
          returnQty: 0,
          returnReason: 'UNWRAPPED_UNUSED' as ReturnReason,
          returnNote: '',
        }))
      );
    } catch (error: any) {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
      setSupplyItems([]);
      setReturnRows([]);
    } finally {
      setLoadingSupplyItems(false);
    }
  }, []);

  const handleSelectUsage = (usageId: number) => {
    setSelectedUsageId(usageId);
    fetchSupplyItems(usageId);
  };

  const setReturnQty = (itemId: number, qty: number) => {
    setReturnRows((prev) =>
      prev.map((r) => (r.item.id === itemId ? { ...r, returnQty: Math.max(0, qty) } : r))
    );
  };
  const setReturnReason = (itemId: number, reason: ReturnReason) => {
    setReturnRows((prev) =>
      prev.map((r) => (r.item.id === itemId ? { ...r, returnReason: reason } : r))
    );
  };
  const setReturnNote = (itemId: number, note: string) => {
    setReturnRows((prev) =>
      prev.map((r) => (r.item.id === itemId ? { ...r, returnNote: note } : r))
    );
  };

  const handleSaveReturn = async () => {
    const toSave = returnRows.filter((r) => r.returnQty > 0);
    if (toSave.length === 0) {
      toast.error('กรุณาระบุจำนวนที่ต้องการคืนอย่างน้อย 1 รายการ');
      return;
    }

    try {
      setLoading(true);
      for (const row of toSave) {
        const maxQty =
          (row.item.qty || 0) -
          (row.item.qty_used_with_patient || 0) -
          (row.item.qty_returned_to_cabinet || 0);
        if (row.returnQty > maxQty) {
          toast.error(`จำนวนคืนเกินที่คืนได้ (${row.item.order_item_code || row.item.supply_code})`);
          return;
        }
        await medicalSuppliesApi.recordItemReturn({
          item_id: row.item.id,
          qty_returned: row.returnQty,
          return_reason: row.returnReason,
          return_by_user_id: user?.id?.toString() || 'unknown',
          return_note: row.returnNote,
        });
      }
      toast.success('บันทึกการคืนเวชภัณฑ์สำเร็จ');
      setSelectedUsageId(null);
      setSupplyItems([]);
      setReturnRows([]);
      await fetchUsages(usagesPage);
      fetchReturnHistory();
    } catch (error: any) {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setLoading(false);
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
      if (result.success && result.data) {
        setReturnHistoryData({
          data: result.data,
          total: (result as any).total || 0,
          page: (result as any).page || returnHistoryPage,
          limit: (result as any).limit || returnHistoryLimit,
        });
      } else if (result.data) {
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

  useEffect(() => {
    if (activeTab === 'history') fetchReturnHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, returnHistoryPage]);

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
      UNWRAPPED_UNUSED: 'ยังไม่ได้แกะซอง หรือยังอยู่ในสภาพเดิม',
      EXPIRED: 'อุปกรณ์หมดอายุ',
      CONTAMINATED: 'อุปกรณ์มีการปนเปื้อน',
      DAMAGED: 'อุปกรณ์ชำรุด',
    };
    return labels[reason] || reason;
  };

  return (
    <ProtectedRoute>
      <AppLayout fullWidth>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-sm">
              <RotateCcw className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">คืนอุปกรณ์เข้าตู้</h1>
              <p className="text-slate-500 mt-1">
                บันทึกการคืนเวชภัณฑ์ที่เบิกแล้วแต่ยังไม่ได้ใช้ กลับเข้าตู้ Vending
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 h-11 rounded-lg bg-slate-100 p-1">
              <TabsTrigger value="return" className="flex items-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <RotateCcw className="h-4 w-4" />
                คืนอุปกรณ์
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <History className="h-4 w-4" />
                ประวัติการคืน
              </TabsTrigger>
            </TabsList>

            <TabsContent value="return" className="space-y-4">
              <Card className="border-0 shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="border-b bg-slate-50/50">
                  <CardTitle className="text-lg font-semibold text-slate-800">บันทึกการคืนเวชภัณฑ์</CardTitle>
                  <CardDescription className="text-slate-500 mt-1">
                    <span className="font-medium text-slate-600">ขั้นที่ 1</span> ค้นหาด้วยวันที่และชื่อรายการ → เลือกแถวจากตาราง (10 รายการ/หน้า) · <span className="font-medium text-slate-600">ขั้นที่ 2</span> ปรับจำนวน/สาเหตุ/หมายเหตุในตาราง → กดบันทึกการคืน
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <UsageSearchStep
                    startDate={searchStartDate}
                    endDate={searchEndDate}
                    keyword={searchKeyword}
                    usages={usages}
                    selectedUsageId={selectedUsageId}
                    loading={loadingUsages}
                    page={usagesPage}
                    total={usagesTotal}
                    limit={USAGES_PAGE_SIZE}
                    lastPage={usagesLastPage}
                    onStartDateChange={setSearchStartDate}
                    onEndDateChange={setSearchEndDate}
                    onKeywordChange={setSearchKeyword}
                    onSearch={handleSearch}
                    onSelectUsage={handleSelectUsage}
                    onPageChange={(p) => {
                      setUsagesPage(p);
                      fetchUsages(p);
                    }}
                    formatDate={formatDate}
                  />

                  {selectedUsageId && (
                    <div className="border-t border-slate-200 pt-6 mt-6">
                      {loadingSupplyItems ? (
                        <div className="flex items-center gap-3 text-slate-500 py-6">
                          <span className="h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          กำลังโหลดรายการที่คืนได้...
                        </div>
                      ) : (
                        <ReturnEditableTable
                          rows={returnRows}
                          loading={loading}
                          onQtyChange={setReturnQty}
                          onReasonChange={setReturnReason}
                          onNoteChange={setReturnNote}
                          onSubmit={handleSaveReturn}
                        />
                      )}
                    </div>
                  )}

                  <div className="rounded-xl bg-sky-50 border border-sky-100 p-4">
                    <h4 className="font-semibold text-sky-800 mb-2 flex items-center gap-2">แนวทางการจัดการ</h4>
                    <ul className="space-y-2 text-sm text-sky-700">
                      <li className="flex gap-2">
                        <span className="text-sky-500 shrink-0">•</span>
                        <span>ยังไม่ได้แกะซอง / อยู่ในสภาพเดิม → นำกลับเข้าตู้ Vending (บันทึกการคืน)</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-sky-500 shrink-0">•</span>
                        <span>Package ไม่เหมือนเดิม หรือนำไปใช้ในแผนก → ติดต่อแผนกที่เกี่ยวข้อง</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

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
