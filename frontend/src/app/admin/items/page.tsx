'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { itemsApi } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import type { Item } from '@/types/item';
import { toast } from 'sonner';
import ItemsHeader from './components/ItemsHeader';
import ItemsFilter from './components/ItemsFilter';
import ItemsGrid from './components/ItemsGrid';
import CreateItemDialog from './components/CreateItemDialog';
import EditItemDialog from './components/EditItemDialog';
import DeleteItemDialog from './components/DeleteItemDialog';

export default function ItemsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 9; // 3x3 grid

  useEffect(() => {
    fetchItems();
  }, [user?.id, currentPage, searchTerm]);

  useEffect(() => {
    filterItems();
  }, [items, statusFilter]);

  const fetchItems = async () => {
    try {
      if (user?.id) {
        setLoading(true);
        const response = await itemsApi.getAll({ 
          page: currentPage, 
          limit: itemsPerPage,
          keyword: searchTerm || undefined
        });
        if (response.data) {
          setItems(response.data);
          setTotalItems(response.total);
          setTotalPages(response.lastPage);
        }
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
      toast.error('ไม่สามารถโหลดข้อมูลสินค้าได้');
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    // Filter by status (client-side)
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => 
        statusFilter === 'active' ? item.item_status === 0 : item.item_status !== 0
      );
    }

    setFilteredItems(filtered);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    setShowEditDialog(true);
  };

  const handleDelete = (item: Item) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <ItemsHeader onAddClick={() => setShowCreateDialog(true)} />
          
          <ItemsFilter
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            onSearchChange={handleSearch}
            onStatusChange={setStatusFilter}
          />
          
          <ItemsGrid
            loading={loading}
            items={filteredItems}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        <CreateItemDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          userId={user?.id}
          onSuccess={fetchItems}
        />

        <EditItemDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          item={selectedItem}
          onSuccess={fetchItems}
        />

        <DeleteItemDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          item={selectedItem}
          onSuccess={fetchItems}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}
