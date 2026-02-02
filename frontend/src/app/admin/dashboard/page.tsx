'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { itemsApi } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import type { Item } from '@/types/item';
import DashboardHeader from './components/DashboardHeader';
import StatsCards from './components/StatsCards';
import DashboardItemsTable from './components/DashboardItemsTable';
import UpdateMinMaxDialog from '../items/components/UpdateMinMaxDialog';

export default function DashboardPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
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

  // Fetch stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user?.id) {
          setLoadingStats(true);
          const response = await itemsApi.getStats();

          if (response.success && response.data) {
            setStats({
              totalItems: response.data.total_items || 0,
              activeItems: response.data.active_items || 0,
              inactiveItems: response.data.inactive_items || 0,
              lowStockItems: response.data.low_stock_items || 0,
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
  }, [user?.id]);

  // Fetch items with pagination
  useEffect(() => {
    const fetchItems = async () => {
      try {
        if (user?.id) {
          setLoadingItems(true);
          const response = await itemsApi.getAll({
            page: currentPage,
            limit: itemsPerPage,
          });

          if (response.data) {
            setItems(response.data);
            setTotalPages(response.lastPage);
            setTotalItems(response.total || 0);
          }
        }
      } catch (error) {
        console.error('Failed to fetch items:', error);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, [user?.id, currentPage]);

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
      itemsApi.getAll({
        page: currentPage,
        limit: itemsPerPage
      }),
      itemsApi.getStats()
    ]);
    
    if (itemsResponse.data) {
      setItems(itemsResponse.data);
      setTotalPages(itemsResponse.lastPage);
      setTotalItems(itemsResponse.total || 0);
    }
    
    if (statsResponse.success && statsResponse.data) {
      setStats({
        totalItems: statsResponse.data.total_items || 0,
        activeItems: statsResponse.data.active_items || 0,
        inactiveItems: statsResponse.data.inactive_items || 0,
        lowStockItems: statsResponse.data.low_stock_items || 0,
      });
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout fullWidth>
        <DashboardHeader 
          userName={user?.name}
        />
        
        <StatsCards loading={loadingStats} stats={stats} />
        
        <DashboardItemsTable
          items={items}
          loading={loadingItems}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onUpdateMinMax={handleUpdateMinMax}
          onPageChange={handlePageChange}
        />

        <UpdateMinMaxDialog
          open={showMinMaxDialog}
          onOpenChange={setShowMinMaxDialog}
          item={selectedItem}
          onSuccess={handleUpdateMinMaxSuccess}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}
