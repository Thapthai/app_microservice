import staffApi from './index';
import type { ApiResponse } from '@/types/common';

export const itemComparisonApi = {
  compareDispensedVsUsage: async (query?: {
    itemCode?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
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
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const response = await staffApi.get('/medical-supplies-usage-by-item-code', { params: query });
    return response.data;
  },
};


