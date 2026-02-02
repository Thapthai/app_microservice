'use client';

import { useEffect, useState } from 'react';
import { staffItemsApi } from '@/lib/staffApi/itemsApi';
import { staffMedicalSuppliesApi } from '@/lib/staffApi/medicalSuppliesApi';
import { staffCabinetDepartmentApi } from '@/lib/staffApi/cabinetApi';
import type { ItemWithExpiry } from '../../admin/dashboard/components/ItemsWithExpirySidebar';
import StatsCards from '../../admin/dashboard/components/StatsCards';
import DashboardMappingsTable, { type CabinetDepartment } from '../../admin/dashboard/components/DashboardMappingsTable';
import DispensedVsUsageChartCard from '../../admin/dashboard/components/DispensedVsUsageChartCard';
import ItemsWithExpirySidebar from '../../admin/dashboard/components/ItemsWithExpirySidebar';

export default function StaffDashboardPage() {
  const [staffUser, setStaffUser] = useState<any>(null);
  const [mappings, setMappings] = useState<CabinetDepartment[]>([]);
  const [loadingMappings, setLoadingMappings] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    activeItems: 0,
    inactiveItems: 0,
    lowStockItems: 0,
  });
  const [itemsWithExpiry, setItemsWithExpiry] = useState<ItemWithExpiry[]>([]);
  const [nearExpire7Days, setNearExpire7Days] = useState(0);
  const [nearExpire3Days, setNearExpire3Days] = useState(0);
  const [dispensedVsUsageSummary, setDispensedVsUsageSummary] = useState<{
    total_dispensed: number;
    total_used: number;
    difference: number;
  } | null>(null);
  const [loadingDispensedVsUsage, setLoadingDispensedVsUsage] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('staff_user');
    if (user) {
      try {
        setStaffUser(JSON.parse(user));
      } catch {
        setStaffUser(null);
      }
    }
  }, []);

  // Fetch stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (staffUser) {
          setLoadingStats(true);
          const response = await staffItemsApi.getStats();

          if (response.success && response.data) {
            const data = response.data as any;
            const d = data.details ?? data;
            setStats({
              totalItems: d.total_items ?? 0,
              activeItems: d.active_items ?? 0,
              inactiveItems: d.inactive_items ?? 0,
              lowStockItems: d.low_stock_items ?? 0,
            });
            const itemStock = data.item_stock;
            if (itemStock) {
              setNearExpire7Days(itemStock.expire?.near_expire_7_days ?? 0);
              setNearExpire3Days(itemStock.expire?.near_expire_3_days ?? 0);
              setItemsWithExpiry(Array.isArray(itemStock.items_with_expiry) ? itemStock.items_with_expiry : []);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [staffUser]);

  // Fetch เบิก vs ใช้ โดยรวม
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        if (!staffUser) return;
        setLoadingDispensedVsUsage(true);
        const response = await staffMedicalSuppliesApi.getDispensedVsUsageSummary();
        if (response.success && response.data) {
          setDispensedVsUsageSummary(response.data);
        } else {
          setDispensedVsUsageSummary(null);
        }
      } catch (error) {
        console.error('Failed to fetch dispensed vs usage summary:', error);
        setDispensedVsUsageSummary(null);
      } finally {
        setLoadingDispensedVsUsage(false);
      }
    };
    fetchSummary();
  }, [staffUser]);

  // Fetch รายการเชื่อมโยง (ตู้-แผนก)
  useEffect(() => {
    const fetchMappings = async () => {
      try {
        if (staffUser) {
          setLoadingMappings(true);
          const response = await staffCabinetDepartmentApi.getAll();
          if (response.success && response.data) {
            setMappings(response.data as CabinetDepartment[]);
          } else {
            setMappings([]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch cabinet-department mappings:', error);
        setMappings([]);
      } finally {
        setLoadingMappings(false);
      }
    };

    fetchMappings();
  }, [staffUser]);

  if (!staffUser) {
    return null;
  }

  return (
    <>
      <StatsCards
        loading={loadingStats}
        stats={stats}
        dispensedVsUsage={dispensedVsUsageSummary}
        loadingDispensedVsUsage={loadingDispensedVsUsage}
      />

      {/* แถว 1: สรุปการเชื่อมโยง (เล็ก) + รายการเชื่อมโยง (ตาราง) | Card อุปกรณ์ใกล้หมดอายุ ความสูงเท่ากัน */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-stretch">
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
          <DispensedVsUsageChartCard
            mappingSummary={{
              total: mappings.length,
              cabinets: new Set(mappings.map((m) => m.cabinet_id)).size,
              departments: new Set(mappings.map((m) => m.department_id)).size,
            }}
            loadingMappings={loadingMappings}
          />
          <DashboardMappingsTable mappings={mappings} loading={loadingMappings} />
        </div>
        <div className="lg:col-span-1 h-full min-h-0 flex flex-col">
          <ItemsWithExpirySidebar
            itemsWithExpiry={itemsWithExpiry}
            nearExpire7Days={nearExpire7Days}
            nearExpire3Days={nearExpire3Days}
            loading={loadingStats}
          />
        </div>
      </div>
    </>
  );
}
