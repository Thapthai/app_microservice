import staffApi from './index';
import type { ApiResponse } from '@/types/common';

export const DispensedItemsApi = {
  // getDispensedItems: async (query?: {
  //   keyword?: string;
  //   startDate?: string;
  //   endDate?: string;
  //   page?: number;
  //   limit?: number;
  // }): Promise<ApiResponse<any>> => {
  //   const response = await staffApi.get('/medical-supplies-dispensed-items', { params: query });
  //   return response.data;
  // },
  getDispensedItems: async (query?: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    departmentId?: string;
    cabinetId?: string;
  }): Promise<ApiResponse<any> & {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  }> => {
    const response = await staffApi.get('/medical-supplies-dispensed-items', { params: query });
    return response.data;
  },

  /** ดาวน์โหลดรายงานเบิกจากตู้ (Excel/PDF) โดยไม่เปิดแท็บใหม่ */
  downloadDispensedItemsExcel: async (params?: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    departmentId?: string;
    cabinetId?: string;
  }): Promise<void> => {
    const queryParams = new URLSearchParams();
    if (params?.keyword) queryParams.append('keyword', params.keyword);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
    if (params?.cabinetId) queryParams.append('cabinetId', params.cabinetId);
    const response = await staffApi.get(
      `/medical-supplies-dispensed-items/export/excel?${queryParams.toString()}`,
      { responseType: 'blob' },
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dispensed_items_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  downloadDispensedItemsPdf: async (params?: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    departmentId?: string;
    cabinetId?: string;
  }): Promise<void> => {
    const queryParams = new URLSearchParams();
    if (params?.keyword) queryParams.append('keyword', params.keyword);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
    if (params?.cabinetId) queryParams.append('cabinetId', params.cabinetId);
    const response = await staffApi.get(
      `/medical-supplies-dispensed-items/export/pdf?${queryParams.toString()}`,
      { responseType: 'blob' },
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dispensed_items_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
