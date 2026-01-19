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
  }): Promise<ApiResponse<any>> => {
    const response = await staffApi.get('/medical-supply-items/returned-items', { params: query });
    return response.data;
  },
};
