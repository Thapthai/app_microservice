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
};
