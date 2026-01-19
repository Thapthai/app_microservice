import staffApi from './index';
import type { ApiResponse } from '@/types/common';

export const DispensedItemsApi = {
  getDispensedItems: async (query?: {
    itemCode?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await staffApi.get('/medical-supplies-dispensed-items', { params: query });
    return response.data;
  },
};
