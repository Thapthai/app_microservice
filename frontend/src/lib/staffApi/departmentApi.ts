import staffApi from './index';
import type { ApiResponse } from '@/types/common';

export const staffDepartmentApi = {
  getAll: async (params?: { page?: number; limit?: number; keyword?: string; isCancel?: boolean }): Promise<ApiResponse<any[]>> => {
    const response = await staffApi.get('/departments', { params });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<any>> => {
    const response = await staffApi.get(`/departments/${id}`);
    return response.data;
  },
};
