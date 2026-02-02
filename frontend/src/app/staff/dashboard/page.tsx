'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, FileText } from 'lucide-react';
import { staffItemsApi } from '@/lib/staffApi/itemsApi';
import type { Item } from '@/types/item';
import DashboardItemsTable from './components/DashboardItemsTable';
import UpdateMinMaxDialog from '../items/components/UpdateMinMaxDialog';
import StatsCards from '../../admin/dashboard/components/StatsCards';

export default function StaffDashboardPage() {
  const [staffUser, setStaffUser] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    activeItems: 0,
    inactiveItems: 0,
    lowStockItems: 0,
  });
  const [showMinMaxDialog, setShowMinMaxDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    const user = localStorage.getItem('staff_user');
    if (user) {
      setStaffUser(JSON.parse(user));
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
            setStats({
              totalItems: (response.data as any).details?.total_items ?? response.data.total_items ?? 0,
              activeItems: (response.data as any).details?.active_items ?? response.data.active_items ?? 0,
              inactiveItems: (response.data as any).details?.inactive_items ?? response.data.inactive_items ?? 0,
              lowStockItems: (response.data as any).details?.low_stock_items ?? response.data.low_stock_items ?? 0,
            });
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

  useEffect(() => {
    if (staffUser) {
      fetchItems();
    }
  }, [staffUser, currentPage]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await staffItemsApi.getAll({
        page: currentPage,
        limit: itemsPerPage,
      });
      if (response.data) {
        setItems(response.data);
        setTotalItems(response.total || 0);
        setTotalPages(response.lastPage || 1);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateMinMax = (item: Item) => {
    setSelectedItem(item);
    setShowMinMaxDialog(true);
  };

  const handleUpdateMinMaxSuccess = async () => {
    setShowMinMaxDialog(false);
    // Refresh items and stats
    const [itemsResponse, statsResponse] = await Promise.all([
      staffItemsApi.getAll({
        page: currentPage,
        limit: itemsPerPage
      }),
      staffItemsApi.getStats()
    ]);
    
    if (itemsResponse.data) {
      setItems(itemsResponse.data);
      setTotalPages(itemsResponse.lastPage || 1);
      setTotalItems(itemsResponse.total || 0);
    }
    
    if (statsResponse.success && statsResponse.data) {
      setStats({
        totalItems: (statsResponse.data as any).details?.total_items ?? statsResponse.data.total_items ?? 0,
        activeItems: (statsResponse.data as any).details?.active_items ?? statsResponse.data.active_items ?? 0,
        inactiveItems: (statsResponse.data as any).details?.inactive_items ?? statsResponse.data.inactive_items ?? 0,
        lowStockItems: (statsResponse.data as any).details?.low_stock_items ?? statsResponse.data.low_stock_items ?? 0,
      });
    }
  };

  if (!staffUser) {
    return null;
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          ยินดีต้อนรับ, {staffUser.fname}!
        </h2>
        <p className="text-gray-600">อีเมล: {staffUser.email}</p>
      </div>

      {/* Stats Cards */}
      <StatsCards loading={loadingStats} stats={stats} />

      {/* Items Table */}
      <DashboardItemsTable
        items={items}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onUpdateMinMax={handleUpdateMinMax}
        onPageChange={handlePageChange}
      />

      {/* Info Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>ข้อมูลการใช้งาน</CardTitle>
          <CardDescription>
            ระบบสำหรับพนักงาน - สามารถดูและจัดการข้อมูลพื้นฐาน
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <strong>Client ID:</strong> {staffUser.client_id}
            </p>
            <p className="text-sm text-gray-600">
              <strong>สถานะ:</strong>{' '}
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ใช้งานอยู่
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      <UpdateMinMaxDialog
        open={showMinMaxDialog}
        onOpenChange={setShowMinMaxDialog}
        item={selectedItem}
        onSuccess={handleUpdateMinMaxSuccess}
      />
    </>
  );
}

