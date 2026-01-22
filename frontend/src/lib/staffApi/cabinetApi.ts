import staffApi from './index';
import type { Item, CreateItemDto, UpdateItemDto, GetItemsQuery } from '@/types/item';
import type { ApiResponse, PaginatedResponse } from '@/types/common';

// =========================== Cabinet API ===========================
export const staffCabinetApi = {
  getAll: async (params?: { page?: number; limit?: number; keyword?: string; sort_by?: string; sort_order?: string }): Promise<PaginatedResponse<any>> => {
    const response = await staffApi.get('/cabinets', { params });
    return response.data;
  },
};

// =========================== Cabinet Department Mapping API ===========================
export const staffCabinetDepartmentApi = {
  getAll: async (params?: { cabinetId?: number; departmentId?: number; status?: string; keyword?: string }): Promise<ApiResponse<any[]>> => {
    // แปลง camelCase -> snake_case ให้ตรงกับ backend
    const apiParams: any = {};
    if (params?.cabinetId !== undefined) apiParams.cabinet_id = params.cabinetId;
    if (params?.departmentId !== undefined) apiParams.department_id = params.departmentId;
    if (params?.status !== undefined) apiParams.status = params.status;
    if (params?.keyword !== undefined && params.keyword !== "") apiParams.keyword = params.keyword;

    const response = await staffApi.get('/cabinet-departments', { params: apiParams });
    return response.data;
  },

  create: async (data: any): Promise<ApiResponse<any>> => {
    const response = await staffApi.post('/cabinet-departments', data);
    return response.data;
  },

  update: async (id: number, data: any): Promise<ApiResponse<any>> => {
    const response = await staffApi.put(`/cabinet-departments/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await staffApi.delete(`/cabinet-departments/${id}`);
    return response.data;
  },

  getItemStocksByCabinet: async (cabinetId: number, params?: { page?: number; limit?: number; keyword?: string }): Promise<ApiResponse<any>> => {
    const response = await staffApi.get('/item-stocks/in-cabinet', {
      params: { ...params, cabinet_id: cabinetId }
    });
    return response.data;
  },
};