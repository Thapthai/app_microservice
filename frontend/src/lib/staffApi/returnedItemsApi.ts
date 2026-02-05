import staffApi from './index';
import type { ApiResponse } from '@/types/common';

export const returnedItemsApi = {
  getReturnedItems: async (query?: {
    itemCode?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    departmentCode?: string;
    cabinetCode?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await staffApi.get('/medical-supply-items/returned-items', { params: query });
    return response.data;
  },


  downloadReturnToCabinetReportExcel: async (params?: {
    keyword?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    departmentCode?: string;
    cabinetCode?: string;
  }): Promise<void> => {
    const queryParams = new URLSearchParams();
    if (params?.keyword) queryParams.append('keyword', params.keyword);
    if (params?.itemTypeId) queryParams.append('itemTypeId', params.itemTypeId.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.departmentCode) queryParams.append('departmentCode', params.departmentCode);
    if (params?.cabinetCode) queryParams.append('cabinetCode', params.cabinetCode);
    const response = await staffApi.get(`/reports/return-to-cabinet/excel?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `return_to_cabinet_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  downloadReturnToCabinetReportPdf: async (params?: {
    keyword?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    departmentCode?: string;
    cabinetCode?: string;
  }): Promise<void> => {
    const queryParams = new URLSearchParams();
    if (params?.keyword) queryParams.append('keyword', params.keyword);
    if (params?.itemTypeId) queryParams.append('itemTypeId', params.itemTypeId.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.departmentCode) queryParams.append('departmentCode', params.departmentCode);
    if (params?.cabinetCode) queryParams.append('cabinetCode', params.cabinetCode);
    const response = await staffApi.get(`/reports/return-to-cabinet/pdf?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `return_to_cabinet_report_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
