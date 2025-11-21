'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Syringe, Edit, Trash2, Printer, Eye } from 'lucide-react';
import { SkeletonTable } from '@/components/Skeleton';
import Pagination from '@/components/Pagination';

interface MedicalSupply {
  id?: number;
  data?: {
    hospital?: string;
    en?: string;
    patient_hn?: string;
    first_name?: string;
    lastname?: string;
    name_th?: string;
    name_en?: string;
  };
  supplies_count?: number;
  supplies_summary?: any[];
  usage_details?: {
    usage_datetime?: string;
    usage_type?: string;
  };
  personnel?: {
    recorded_by?: string;
  };
  billing?: {
    status?: string;
    subtotal?: number;
    tax?: number;
    total?: number;
    currency?: string;
  };
  created_at: string;
  timestamp?: string;
}

interface MedicalSuppliesTableProps {
  loading: boolean;
  supplies: MedicalSupply[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onView?: (supply: MedicalSupply) => void;
  onEdit?: (supply: MedicalSupply) => void;
  onDelete?: (supply: MedicalSupply) => void;
  onPrint?: (supply: MedicalSupply) => void;
}

export default function MedicalSuppliesTable({
  loading,
  supplies,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onPrint,
}: MedicalSuppliesTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>รายการใช้เวชภัณฑ์</CardTitle>
            <CardDescription>
              {!loading && supplies.length > 0 && `ทั้งหมด ${totalItems} รายการ`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6">
            <SkeletonTable />
          </div>
        ) : supplies.length === 0 ? (
          <EmptyState />
        ) : (
          <SuppliesTable
            supplies={supplies}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onPrint={onPrint}
          />
        )}
      </CardContent>
      {!loading && supplies.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          loading={loading}
        />
      )}
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <Syringe className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
        ไม่มีข้อมูล
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        เริ่มต้นด้วยการบันทึกการใช้เวชภัณฑ์
      </p>
    </div>
  );
}

function SuppliesTable({
  supplies,
  onView,
  onEdit,
  onDelete,
  onPrint,
}: {
  supplies: MedicalSupply[];
  onView?: (supply: MedicalSupply) => void;
  onEdit?: (supply: MedicalSupply) => void;
  onDelete?: (supply: MedicalSupply) => void;
  onPrint?: (supply: MedicalSupply) => void;
}) {
  return (
    <>
      {/* Mobile Card View */}
      <div className="block md:hidden">
        {supplies.map((supply, index) => (
          <MobileSupplyCard
            key={supply.id || index}
            supply={supply}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onPrint={onPrint}
          />
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block w-full overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                HN / EN
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                ชื่อผู้ป่วย
              </th>
              <th className="hidden lg:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                โรงพยาบาล
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                รายการ
              </th>
              <th className="hidden xl:table-cell px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                มูลค่ารวม
              </th>
              <th className="hidden lg:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                วันที่บันทึก
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {supplies.map((supply, index) => {
              const patientData = supply.data;
              const hn = patientData?.patient_hn || '-';
              const en = patientData?.en || '-';
              const patientName = patientData?.name_th || patientData?.name_en || 
                                  `${patientData?.first_name || ''} ${patientData?.lastname || ''}`.trim() || '-';
              const hospital = patientData?.hospital || '-';
              const suppliesCount = supply.supplies_count || 0;
              const totalAmount = supply.billing?.total || 0;
              const currency = supply.billing?.currency || 'THB';
              const createdAt = supply.created_at || supply.timestamp;

              return (
                <tr key={supply.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {hn}
                      </div>
                      {en && en !== '-' && (
                        <div className="text-gray-500 dark:text-gray-400 text-xs">
                          EN: {en}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {patientName}
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {hospital}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {suppliesCount}
                    </span>
                  </td>
                  <td className="hidden xl:table-cell px-3 py-2 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                    {totalAmount > 0 ? (
                      <span className="font-medium">
                        {totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="hidden lg:table-cell px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {createdAt ? new Date(createdAt).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    }) : '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-1">
                      {onView && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900"
                          onClick={() => onView(supply)}
                          title="ดูรายละเอียด"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {onPrint && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900"
                          onClick={() => onPrint(supply)}
                          title="พิมพ์"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hidden xl:inline-flex h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900"
                          onClick={() => onEdit(supply)}
                          title="แก้ไข"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hidden xl:inline-flex h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900"
                          onClick={() => onDelete(supply)}
                          title="ลบ"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}

function MobileSupplyCard({
  supply,
  onView,
  onEdit,
  onDelete,
  onPrint,
}: {
  supply: MedicalSupply;
  onView?: (supply: MedicalSupply) => void;
  onEdit?: (supply: MedicalSupply) => void;
  onDelete?: (supply: MedicalSupply) => void;
  onPrint?: (supply: MedicalSupply) => void;
}) {
  const patientData = supply.data;
  const hn = patientData?.patient_hn || '-';
  const en = patientData?.en || '-';
  const patientName = patientData?.name_th || patientData?.name_en || 
                      `${patientData?.first_name || ''} ${patientData?.lastname || ''}`.trim() || '-';
  const hospital = patientData?.hospital || '-';
  const suppliesCount = supply.supplies_count || 0;
  const totalAmount = supply.billing?.total || 0;
  const currency = supply.billing?.currency || 'THB';
  const createdAt = supply.created_at || supply.timestamp;

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {hn}
            </span>
            {en && en !== '-' && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                EN: {en}
              </span>
            )}
          </div>
          <div className="text-base font-medium text-gray-900 dark:text-white">
            {patientName}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onView && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900"
              onClick={() => onView(supply)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onPrint && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900"
              onClick={() => onPrint(supply)}
            >
              <Printer className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        {hospital && hospital !== '-' && (
          <div>
            <span className="text-gray-500 dark:text-gray-400">โรงพยาบาล:</span>
            <span className="ml-1 text-gray-900 dark:text-white">{hospital}</span>
          </div>
        )}
        <div>
          <span className="text-gray-500 dark:text-gray-400">รายการ:</span>
          <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {suppliesCount}
          </span>
        </div>
        {totalAmount > 0 && (
          <div className="col-span-2">
            <span className="text-gray-500 dark:text-gray-400">มูลค่ารวม:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-white">
              {totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} {currency}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {createdAt ? new Date(createdAt).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }) : '-'}
        </span>
        <div className="flex items-center gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900"
              onClick={() => onEdit(supply)}
            >
              <Edit className="h-3 w-3 mr-1" />
              แก้ไข
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900"
              onClick={() => onDelete(supply)}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              ลบ
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

