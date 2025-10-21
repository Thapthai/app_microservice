'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { itemsApi, categoriesApi } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import type { Item, Category } from '@/types/item';
import type { PaginatedResponse } from '@/types/common';
import DashboardHeader from './components/DashboardHeader';
import StatsCards from './components/StatsCards';
import RecentItemsTable from './components/RecentItemsTable';
import CreateItemDialog from '../items/components/CreateItemDialog';

export default function DashboardPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    activeItems: 0,
    totalValue: 0,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll({ page: 1, limit: 100 });
      if (response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // Fetch stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user?.id) {
          setLoadingStats(true);
          const response = await itemsApi.getAll({
            page: 1,
            limit: 10 // Just get first page, stats come from backend
          });

          if (response.stats) {
            setStats({
              totalItems: response.stats.total_items,
              activeItems: response.stats.active_items,
              totalValue: response.stats.total_value,
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

  // Fetch recent items with pagination
  useEffect(() => {
    const fetchItems = async () => {
      try {
        if (user?.id) {
          setLoadingItems(true);
          const response = await itemsApi.getAll({
            page: currentPage,
            limit: itemsPerPage
          });

          if (response.data) {
            setItems(response.data);
            setTotalPages(response.lastPage);
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

  const handleCreateSuccess = async () => {
    setIsCreateDialogOpen(false);
    // Refresh items and stats
    const response = await itemsApi.getAll({
      page: currentPage,
      limit: itemsPerPage
    });
    if (response.data) {
      setItems(response.data);
      setTotalPages(response.lastPage);
    }
    if (response.stats) {
      setStats({
        totalItems: response.stats.total_items,
        activeItems: response.stats.active_items,
        totalValue: response.stats.total_value,
      });
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <DashboardHeader 
          userName={user?.name}
          onCreateClick={() => setIsCreateDialogOpen(true)}
        />
        
        <StatsCards loading={loadingStats} stats={stats} />
        
        <RecentItemsTable
          loading={loadingItems}
          items={items}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />

        <CreateItemDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          userId={user?.id}
          categories={categories}
          onSuccess={handleCreateSuccess}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}
