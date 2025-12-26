'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import { RotateCcw, Search, RefreshCw, CheckCircle, History, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { vendingReportsApi, medicalSuppliesApi } from '@/lib/api';
import { toast } from 'sonner';

export default function ReturnMedicalSuppliesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('return');
  
  // Form states for return
  const [selectedUsageId, setSelectedUsageId] = useState<number | null>(null);
  const [selectedSupplyItemId, setSelectedSupplyItemId] = useState<number | null>(null);
  const [usages, setUsages] = useState<any[]>([]);
  const [supplyItems, setSupplyItems] = useState<any[]>([]);
  const [selectedSupplyItem, setSelectedSupplyItem] = useState<any>(null);
  const [returnQty, setReturnQty] = useState<number>(1);
  const [returnReason, setReturnReason] = useState<string>('UNWRAPPED_UNUSED');
  const [returnNote, setReturnNote] = useState<string>('');
  const [loadingUsages, setLoadingUsages] = useState(false);
  const [loadingSupplyItems, setLoadingSupplyItems] = useState(false);
  
  // Old unused data states (keep for backward compatibility)
  const [unusedDate, setUnusedDate] = useState('');
  const [unusedData, setUnusedData] = useState<any>(null);
  
  // Return history states
  const [returnHistoryDateFrom, setReturnHistoryDateFrom] = useState('');
  const [returnHistoryDateTo, setReturnHistoryDateTo] = useState('');
  const [returnHistoryReason, setReturnHistoryReason] = useState<string>('ALL');
  const [returnHistoryData, setReturnHistoryData] = useState<any>(null);
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

  const fetchUnusedData = async () => {
    try {
      setDataLoading(true);
      const params: any = {};
      if (unusedDate) params.date = unusedDate;

      const result = await vendingReportsApi.getUnusedDispensedData(params);
      if (result.success || (result as any).status === 'success') {
        setUnusedData(result.data || (result as any).data);
      } else {
        toast.error('ไม่สามารถดึงข้อมูลได้');
      }
    } catch (error: any) {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setDataLoading(false);
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
        setReturnHistoryData(result);
      } else if (result.data) {
        // Fallback: if result has data but no success flag
        setReturnHistoryData(result);
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
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="usage-select" className="text-base font-semibold">
                        ขั้นตอนที่ 1: เลือก MedicalSupplyUsage
                      </Label>
                      <Button
                        onClick={fetchUsages}
                        disabled={loadingUsages}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {loadingUsages ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            กำลังโหลด...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4" />
                            รีเฟรช
                          </>
                        )}
                      </Button>
                    </div>
                    <Select
                      value={selectedUsageId?.toString() || ''}
                      onValueChange={(value) => handleUsageSelect(parseInt(value))}
                      disabled={loadingUsages}
                    >
                      <SelectTrigger id="usage-select" className="w-full">
                        <SelectValue placeholder="เลือก MedicalSupplyUsage" />
                      </SelectTrigger>
                      <SelectContent>
                        {usages.length === 0 ? (
                          <SelectItem value="no-data" disabled>
                            ไม่พบข้อมูล
                          </SelectItem>
                        ) : (
                          usages.map((usage: any) => {
                            const usageData = usage.data || usage;
                            return (
                              <SelectItem key={usageData.id} value={usageData.id.toString()}>
                                {usageData.en || usageData.id} - {usageData.patient_hn} - {usageData.first_name} {usageData.lastname}
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                    {selectedUsageId && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        {(() => {
                          const selectedUsage = usages.find((u: any) => (u.data || u).id === selectedUsageId);
                          const usageData = selectedUsage?.data || selectedUsage;
                          return (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="font-semibold text-blue-900">EN:</span> {usageData?.en || '-'}
                              </div>
                              <div>
                                <span className="font-semibold text-blue-900">HN:</span> {usageData?.patient_hn || '-'}
                              </div>
                              <div className="col-span-2">
                                <span className="font-semibold text-blue-900">ชื่อผู้ป่วย:</span> {usageData?.first_name || ''} {usageData?.lastname || ''}
                              </div>
                              <div>
                                <span className="font-semibold text-blue-900">แผนก:</span> {usageData?.department_code || '-'}
                              </div>
                              <div>
                                <span className="font-semibold text-blue-900">วันที่:</span> {usageData?.created_at ? formatDate(usageData.created_at) : '-'}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Step 2: Select SupplyUsageItem */}
                  {selectedUsageId && (
                    <div className="space-y-3 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="supply-item-select" className="text-base font-semibold">
                          ขั้นตอนที่ 2: เลือก SupplyUsageItem
                        </Label>
                        {loadingSupplyItems && (
                          <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                        )}
                      </div>
                      <Select
                        value={selectedSupplyItemId?.toString() || ''}
                        onValueChange={(value) => handleSupplyItemSelect(parseInt(value))}
                        disabled={loadingSupplyItems || supplyItems.length === 0}
                      >
                        <SelectTrigger id="supply-item-select" className="w-full">
                          <SelectValue placeholder="เลือก SupplyUsageItem" />
                        </SelectTrigger>
                        <SelectContent>
                          {supplyItems.length === 0 ? (
                            <SelectItem value="no-items" disabled>
                              ไม่พบรายการที่สามารถคืนได้
                            </SelectItem>
                          ) : (
                            supplyItems.map((item: any) => {
                              const qtyPending = (item.qty || 0) - (item.qty_used_with_patient || 0) - (item.qty_returned_to_cabinet || 0);
                              return (
                                <SelectItem key={item.id} value={item.id.toString()}>
                                  {item.order_item_code || item.supply_code} - {item.order_item_description || item.supply_name} (คืนได้: {qtyPending})
                                </SelectItem>
                              );
                            })
                          )}
                        </SelectContent>
                      </Select>
                      {selectedSupplyItem && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-semibold text-green-900">รหัส:</span> {selectedSupplyItem.order_item_code || selectedSupplyItem.supply_code || '-'}
                            </div>
                            <div>
                              <span className="font-semibold text-green-900">ชื่อ:</span> {selectedSupplyItem.order_item_description || selectedSupplyItem.supply_name || '-'}
                            </div>
                            <div>
                              <span className="font-semibold text-green-900">จำนวนที่เบิก:</span> {selectedSupplyItem.qty || 0}
                            </div>
                            <div>
                              <span className="font-semibold text-green-900">ใช้แล้ว:</span> {selectedSupplyItem.qty_used_with_patient || 0}
                            </div>
                            <div>
                              <span className="font-semibold text-green-900">คืนแล้ว:</span> {selectedSupplyItem.qty_returned_to_cabinet || 0}
                            </div>
                            <div>
                              <span className="font-semibold text-green-900">คืนได้:</span> 
                              <Badge variant="outline" className="ml-2 bg-green-100 text-green-700 border-green-300">
                                {(selectedSupplyItem.qty || 0) - (selectedSupplyItem.qty_used_with_patient || 0) - (selectedSupplyItem.qty_returned_to_cabinet || 0)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: Return Details */}
                  {selectedSupplyItem && (
                    <div className="space-y-4 border-t pt-4">
                      <Label className="text-base font-semibold">ขั้นตอนที่ 3: ระบุรายละเอียดการคืน</Label>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="return-qty">จำนวนที่ต้องการคืน</Label>
                          <Input
                            id="return-qty"
                            type="number"
                            min="1"
                            max={selectedSupplyItem ? (selectedSupplyItem.qty || 0) - (selectedSupplyItem.qty_used_with_patient || 0) - (selectedSupplyItem.qty_returned_to_cabinet || 0) : 0}
                            value={returnQty}
                            onChange={(e) => setReturnQty(parseInt(e.target.value) || 1)}
                          />
                          <p className="text-xs text-gray-500">
                            จำนวนที่สามารถคืนได้: {(selectedSupplyItem.qty || 0) - (selectedSupplyItem.qty_used_with_patient || 0) - (selectedSupplyItem.qty_returned_to_cabinet || 0)}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="return-reason">สาเหตุการคืน</Label>
                          <Select value={returnReason} onValueChange={setReturnReason}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UNWRAPPED_UNUSED">ยังไม่ได้แกะซอง หรือยังอยู่ในสภาพเดิม</SelectItem>
                              <SelectItem value="EXPIRED">อุปกรณ์หมดอายุ</SelectItem>
                              <SelectItem value="CONTAMINATED">อุปกรณ์มีการปนเปื้อน</SelectItem>
                              <SelectItem value="DAMAGED">อุปกรณ์ชำรุด</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="return-note">หมายเหตุ (ถ้ามี)</Label>
                          <Textarea
                            id="return-note"
                            value={returnNote}
                            onChange={(e) => setReturnNote(e.target.value)}
                            placeholder="ระบุหมายเหตุเพิ่มเติม..."
                            rows={3}
                          />
                        </div>

                        <Button
                          onClick={handleReturn}
                          disabled={loading || !returnQty || returnQty < 1}
                          className="w-full bg-green-600 hover:bg-green-700"
                          size="lg"
                        >
                          {loading ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              กำลังบันทึก...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              บันทึกการคืน
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
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
              {/* Filter Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>กรองข้อมูลประวัติการคืน</CardTitle>
                      <CardDescription>ดูประวัติการคืนเวชภัณฑ์ทั้งหมด</CardDescription>
                    </div>
                    <Button
                      onClick={fetchReturnHistory}
                      disabled={historyLoading}
                      className="flex items-center gap-2"
                    >
                      {historyLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          กำลังโหลด...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          ค้นหา
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="history-date-from">วันที่เริ่มต้น</Label>
                      <Input
                        id="history-date-from"
                        type="date"
                        value={returnHistoryDateFrom}
                        onChange={(e) => setReturnHistoryDateFrom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="history-date-to">วันที่สิ้นสุด</Label>
                      <Input
                        id="history-date-to"
                        type="date"
                        value={returnHistoryDateTo}
                        onChange={(e) => setReturnHistoryDateTo(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="history-reason">สาเหตุการคืน</Label>
                      <Select value={returnHistoryReason || 'ALL'} onValueChange={setReturnHistoryReason}>
                        <SelectTrigger>
                          <SelectValue placeholder="ทั้งหมด" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">ทั้งหมด</SelectItem>
                          <SelectItem value="UNWRAPPED_UNUSED">ยังไม่ได้แกะซอง หรือยังอยู่ในสภาพเดิม</SelectItem>
                          <SelectItem value="EXPIRED">อุปกรณ์หมดอายุ</SelectItem>
                          <SelectItem value="CONTAMINATED">อุปกรณ์มีการปนเปื้อน</SelectItem>
                          <SelectItem value="DAMAGED">อุปกรณ์ชำรุด</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {historyLoading && (
                    <div className="flex items-center justify-center py-4">
                      <RefreshCw className="h-5 w-5 animate-spin text-gray-400 mr-2" />
                      <span className="text-gray-500">กำลังโหลดข้อมูล...</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Display Return History */}
              {returnHistoryData && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>ประวัติการคืนเวชภัณฑ์</CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              vendingReportsApi.downloadReturnReportExcel({
                                date_from: returnHistoryDateFrom || undefined,
                                date_to: returnHistoryDateTo || undefined,
                                return_reason: returnHistoryReason !== 'ALL' ? returnHistoryReason : undefined,
                              });
                            }}
                            disabled={historyLoading}
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            ดาวน์โหลด Excel
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              vendingReportsApi.downloadReturnReportPdf({
                                date_from: returnHistoryDateFrom || undefined,
                                date_to: returnHistoryDateTo || undefined,
                                return_reason: returnHistoryReason !== 'ALL' ? returnHistoryReason : undefined,
                              });
                            }}
                            disabled={historyLoading}
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            ดาวน์โหลด PDF
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 py-4">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[80px]">ลำดับ</TableHead>
                              <TableHead>รหัสอุปกรณ์</TableHead>
                              <TableHead>ชื่ออุปกรณ์</TableHead>
                              <TableHead>HN</TableHead>
                              <TableHead className="text-center">จำนวนที่คืน</TableHead>
                              <TableHead>สาเหตุการคืน</TableHead>
                              <TableHead className="text-center">วันที่คืน</TableHead>
                              <TableHead>หมายเหตุ</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {returnHistoryData.data?.map((record: any, index: number) => (
                              <TableRow key={record.id}>
                                <TableCell className="text-center">
                                  {(returnHistoryPage - 1) * returnHistoryLimit + index + 1}
                                </TableCell>
                                <TableCell className="font-mono">
                                  {record.supply_item?.order_item_code || record.supply_item?.supply_code || '-'}
                                </TableCell>
                                <TableCell>
                                  {record.supply_item?.order_item_description || record.supply_item?.supply_name || '-'}
                                </TableCell>
                                <TableCell className="font-mono">
                                  {record.supply_item?.usage?.patient_hn || '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    {record.qty_returned}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    {getReturnReasonLabel(record.return_reason)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  {formatDate(record.return_datetime)}
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {record.return_note || '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {returnHistoryData.data?.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          ไม่พบข้อมูลประวัติการคืน
                        </div>
                      )}
                      {/* Pagination */}
                      {returnHistoryData.total > returnHistoryLimit && (
                        <div className="flex items-center justify-between mt-4">
                          <div className="text-sm text-gray-500">
                            แสดง {((returnHistoryPage - 1) * returnHistoryLimit) + 1} - {Math.min(returnHistoryPage * returnHistoryLimit, returnHistoryData.total)} จาก {returnHistoryData.total} รายการ
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setReturnHistoryPage(p => Math.max(1, p - 1))}
                              disabled={returnHistoryPage === 1}
                            >
                              ก่อนหน้า
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setReturnHistoryPage(p => p + 1)}
                              disabled={returnHistoryPage * returnHistoryLimit >= returnHistoryData.total}
                            >
                              ถัดไป
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>

        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

