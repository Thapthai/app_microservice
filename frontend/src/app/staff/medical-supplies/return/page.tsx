'use client';

import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, History, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { staffMedicalSuppliesApi } from '@/lib/staffApi/medicalSuppliesApi';
import { staffItemsApi } from '@/lib/staffApi/itemsApi';
import { toast } from 'sonner';
import ReturnHistoryFilter from './components/ReturnHistoryFilter';
import ReturnHistoryTable from './components/ReturnHistoryTable';
import type { ReturnHistoryData } from './types';

interface WillReturnItem {
  itemname: string;
  ItemCode: string;
  RfidCode: string;
}

export default function ReturnMedicalSuppliesPage() {
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('return');

  // รายการจาก /item-stocks/will-return
  const [willReturnItems, setWillReturnItems] = useState<WillReturnItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [loadingWillReturn, setLoadingWillReturn] = useState(false);
  const [rowDetails, setRowDetails] = useState<
    Record<number, { reason: string; note: string }>
  >({});

  // Return history
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

  const loadWillReturnItems = useCallback(async () => {
    try {
      setLoadingWillReturn(true);
      const res = await staffItemsApi.getItemStocksWillReturn();
      if (res?.success && Array.isArray(res.data)) {
        setWillReturnItems(res.data as WillReturnItem[]);
      } else {
        setWillReturnItems([]);
      }
    } catch {
      setWillReturnItems([]);
    } finally {
      setLoadingWillReturn(false);
    }
  }, []);

  useEffect(() => {
    loadWillReturnItems();
  }, [loadWillReturnItems]);

  const toggleSelectAll = () => {
    if (selectedIndices.length === willReturnItems.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(willReturnItems.map((_, i) => i));
    }
  };

  const toggleSelectOne = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const getStaffUserId = (): string | undefined => {
    try {
      const staffUser = localStorage.getItem('staff_user');
      if (staffUser) {
        const parsed = JSON.parse(staffUser);
        const id = parsed?.id ?? parsed?.user_id;
        if (id != null) return `staff:${id}`;
      }
    } catch {}
    return undefined;
  };

  const handleReturnToCabinet = async () => {
    if (selectedIndices.length === 0) {
      toast.error('กรุณาเลือกรายการที่ต้องการคืนเข้าตู้');
      return;
    }

    try {
      setLoading(true);

      const items: Array<{ item_stock_id: number; return_reason: string; return_note?: string }> = [];

      for (const index of selectedIndices) {
        const item = willReturnItems[index];
        if (!item) continue;

        const result: any = await staffMedicalSuppliesApi.getItemStocksForReturnToCabinet({
          rfidCode: item.RfidCode,
          page: 1,
          limit: 1,
        });

        const row = result?.success && Array.isArray(result.data) ? result.data[0] : null;
        const itemStockId = row && typeof row.RowID === 'number' ? row.RowID : null;
        if (itemStockId == null) continue;

        const meta = rowDetails[index] || { reason: 'UNWRAPPED_UNUSED', note: '' };
        items.push({
          item_stock_id: itemStockId,
          return_reason: meta.reason,
          return_note: meta.note?.trim() || undefined,
        });
      }

      if (items.length === 0) {
        toast.error('ไม่พบ RowID สำหรับรายการที่เลือก');
        return;
      }

      const resp: any = await staffMedicalSuppliesApi.recordStockReturn({
        items,
        return_by_user_id: getStaffUserId(),
      });

      if (resp?.success) {
        toast.success(resp.message || `บันทึกการคืนอุปกรณ์เข้าตู้สำเร็จ ${resp.updatedCount ?? items.length} รายการ`);
        setSelectedIndices([]);
        setRowDetails({});
        await loadWillReturnItems();
      } else {
        toast.error(resp?.error || 'ไม่สามารถบันทึกการคืนอุปกรณ์เข้าตู้ได้');
      }
    } catch (error: any) {
      toast.error(`เกิดข้อผิดพลาด: ${error.message || error}`);
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

      const result = await staffMedicalSuppliesApi.getReturnHistory(params);
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
              <CardTitle className="text-lg font-semibold text-slate-800">คืนอุปกรณ์เข้าตู้จากรายการค้างคืน</CardTitle>
              <CardDescription className="text-slate-500 mt-1">
                เลือกรายการจากตู้ที่ยังไม่ได้บันทึกคืน แล้วกดปุ่มด้านล่างเพื่อบันทึกการคืนเข้าตู้
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mt-1">
                    แสดงรายการจากตู้ที่มีโอกาสต้องคืนเข้าตู้ Vending
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {willReturnItems.length > 0 && (
                    <p className="text-sm text-slate-700">
                      ทั้งหมด{' '}
                      <span className="font-semibold">
                        {willReturnItems.length.toLocaleString('th-TH')}
                      </span>{' '}
                      รายการ
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={loadWillReturnItems}
                    disabled={loadingWillReturn}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    title="โหลดรายการใหม่"
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingWillReturn ? 'animate-spin' : ''}`} />
                    รีเฟรช
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-x-auto">
                {loadingWillReturn ? (
                  <div className="flex items-center justify-center py-10 text-slate-500">
                    <span className="h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3" />
                    กำลังโหลดรายการจากตู้...
                  </div>
                ) : willReturnItems.length === 0 ? (
                  <div className="py-10 text-center text-slate-500">
                    ไม่มีรายการที่ต้องคืนจากตู้
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b">
                        <TableHead className="w-12" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="rounded border-slate-300"
                            checked={
                              selectedIndices.length === willReturnItems.length &&
                              willReturnItems.length > 0
                            }
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelectAll();
                            }}
                          />
                        </TableHead>
                        <TableHead className="text-slate-600 font-medium">RFID</TableHead>
                        <TableHead className="text-slate-600 font-medium">รหัส</TableHead>
                        <TableHead className="text-slate-600 font-medium">ชื่อรายการ</TableHead>
                        <TableHead className="text-slate-600 font-medium min-w-[180px]">
                          กรณีการคืน
                        </TableHead>
                        <TableHead className="text-slate-600 font-medium min-w-[180px]">
                          หมายเหตุ
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {willReturnItems.map((item, index) => {
                        const meta = rowDetails[index] || {
                          reason: 'UNWRAPPED_UNUSED',
                          note: '',
                        };
                        return (
                          <TableRow
                            key={`will-return-${index}-${item.RfidCode}`}
                            className={
                              selectedIndices.includes(index)
                                ? 'bg-emerald-50/60'
                                : ''
                            }
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                className="rounded border-slate-300"
                                checked={selectedIndices.includes(index)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleSelectOne(index);
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                                {item.RfidCode}
                              </code>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{item.ItemCode}</TableCell>
                            <TableCell className="text-sm">{item.itemname}</TableCell>
                            <TableCell>
                              <Select
                                value={meta.reason}
                                onValueChange={(v) =>
                                  setRowDetails((prev) => ({
                                    ...prev,
                                    [index]: {
                                      reason: v,
                                      note: prev[index]?.note ?? '',
                                    },
                                  }))
                                }
                              >
                                <SelectTrigger className="w-full min-w-[180px] rounded-lg border-slate-200">
                                  <SelectValue placeholder="เลือกกรณีการคืน" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="UNWRAPPED_UNUSED">
                                    ยังไม่ได้แกะซอง / อยู่ในสภาพเดิม
                                  </SelectItem>
                                  <SelectItem value="EXPIRED">อุปกรณ์หมดอายุ</SelectItem>
                                  <SelectItem value="CONTAMINATED">
                                    อุปกรณ์มีการปนเปื้อน
                                  </SelectItem>
                                  <SelectItem value="DAMAGED">อุปกรณ์ชำรุด</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={meta.note}
                                onChange={(e) =>
                                  setRowDetails((prev) => ({
                                    ...prev,
                                    [index]: {
                                      reason: prev[index]?.reason ?? 'UNWRAPPED_UNUSED',
                                      note: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="ใส่รายละเอียดเพิ่มเติม (ถ้ามี)"
                                className="w-full min-w-[180px] rounded-lg border-slate-200"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>

              {willReturnItems.length > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    เลือก {selectedIndices.length} / {willReturnItems.length} รายการ
                  </p>
                  <button
                    type="button"
                    onClick={handleReturnToCabinet}
                    disabled={loading || selectedIndices.length === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-4 w-4" />
                        คืนอุปกรณ์เข้าตู้
                      </>
                    )}
                  </button>
                </div>
              )}
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
  );
}
