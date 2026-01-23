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
  }): Promise<ApiResponse<any>> => {
    const response = await staffApi.get('/medical-supplies-dispensed-items', { params: query });
    return response.data;
  },
};
