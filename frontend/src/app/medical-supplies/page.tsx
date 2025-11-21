'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { medicalSuppliesApi } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import { toast } from 'sonner';
import { Syringe, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CreateMedicalSupplyDialog from './components/CreateMedicalSupplyDialog';
import MedicalSuppliesTable from './components/MedicalSuppliesTable';
import ViewMedicalSupplyDialog from './components/ViewMedicalSupplyDialog';

export default function MedicalSuppliesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [supplies, setSupplies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedSupplyId, setSelectedSupplyId] = useState<number | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    if (user?.id) {
      fetchSupplies();
    }
  }, [user?.id, currentPage, searchTerm]);

  const fetchSupplies = async () => {
    try {
      setLoading(true);
      const response = await medicalSuppliesApi.getAll({
        page: currentPage,
        limit: itemsPerPage,
        keyword: searchTerm || undefined,
      });

      if (response.data) {
        setSupplies(response.data);
        setTotalPages(response.lastPage || 1);
        setTotalItems(response.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch medical supplies:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateDialog(false);
    fetchSupplies();
    toast.success('บันทึกข้อมูลเรียบร้อยแล้ว');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleView = (supply: any) => {
    // ดึง id จาก nested data หรือใช้ index
    const supplyId = supply.data?.id || supply.id;
    if (!supplyId) {
      toast.error('ไม่พบ ID ของรายการ');
      return;
    }
    setSelectedSupplyId(supplyId);
    setShowViewDialog(true);
  };

  const handleEdit = (supply: any) => {
    toast.info('กำลังพัฒนาฟีเจอร์แก้ไข');
  };

  const handleDelete = async (supply: any) => {
    if (!confirm('คุณต้องการลบรายการนี้หรือไม่?')) return;
    
    try {
      await medicalSuppliesApi.delete(supply.id);
      toast.success('ลบรายการเรียบร้อยแล้ว');
      fetchSupplies();
    } catch (error) {
      toast.error('ไม่สามารถลบรายการได้');
    }
  };

  const handlePrint = (supply: any) => {
    toast.info('กำลังพัฒนาฟีเจอร์พิมพ์');
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Syringe className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  จัดการเวชภัณฑ์
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  บันทึกและจัดการการใช้เวชภัณฑ์
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              บันทึกการใช้เวชภัณฑ์
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="ค้นหาด้วย HN, AN, ชื่อผู้ป่วย..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              ตัวกรอง
            </Button>
          </div>

          {/* Table */}
          <MedicalSuppliesTable
            loading={loading}
            supplies={supplies}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPrint={handlePrint}
          />
        </div>

        <CreateMedicalSupplyDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={handleCreateSuccess}
        />
        
        {selectedSupplyId && (
          <ViewMedicalSupplyDialog
            open={showViewDialog}
            onOpenChange={setShowViewDialog}
            supplyId={selectedSupplyId}
          />
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}

