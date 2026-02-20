import staffApi from './index';
import type { ApiResponse } from '@/types/common';

export const itemComparisonApi = {
  compareDispensedVsUsage: async (query?: {
    itemCode?: string;
    keyword?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    departmentCode?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const response = await staffApi.get('/medical-supplies-comparison', { params: query });
    return response.data;
  },

  getUsageByItemCodeFromItemTable: async (query?: {
    itemCode?: string;
    startDate?: string;
    endDate?: string;
    first_name?: string;
    lastname?: string;
    assession_no?: string;
    departmentCode?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const response = await staffApi.get('/medical-supplies-usage-by-item-code', { params: query });
    return response.data;
  },

  /** ดาวน์โหลดรายงานเปรียบเทียบการเบิกและใช้ (Excel/PDF) โดยไม่เปิดแท็บใหม่ */
  downloadComparisonExcel: async (params?: {
    itemCode?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    departmentCode?: string;
    includeUsageDetails?: boolean | string;
  }): Promise<void> => {
    const queryParams = new URLSearchParams();
    if (params?.itemCode) queryParams.append('itemCode', params.itemCode);
    if (params?.itemTypeId != null) queryParams.append('itemTypeId', String(params.itemTypeId));
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.departmentCode) queryParams.append('departmentCode', params.departmentCode);
    if (params?.includeUsageDetails !== undefined) queryParams.append('includeUsageDetails', String(params.includeUsageDetails));
    const response = await staffApi.get(
      `/medical-supplies-comparison/export/excel?${queryParams.toString()}`,
      { responseType: 'blob' },
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `medical_supplies_comparison_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  downloadComparisonPdf: async (params?: {
    itemCode?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    departmentCode?: string;
    includeUsageDetails?: boolean | string;
  }): Promise<void> => {
    const queryParams = new URLSearchParams();
    if (params?.itemCode) queryParams.append('itemCode', params.itemCode);
    if (params?.itemTypeId != null) queryParams.append('itemTypeId', String(params.itemTypeId));
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.departmentCode) queryParams.append('departmentCode', params.departmentCode);
    if (params?.includeUsageDetails !== undefined) queryParams.append('includeUsageDetails', String(params.includeUsageDetails));
    const response = await staffApi.get(
      `/medical-supplies-comparison/export/pdf?${queryParams.toString()}`,
      { responseType: 'blob' },
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `medical_supplies_comparison_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};


