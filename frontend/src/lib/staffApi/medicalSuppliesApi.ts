import staffApi from './index';
import type { ApiResponse, PaginatedResponse } from '@/types/common';

export const staffMedicalSuppliesApi = {
    create: async (data: any): Promise<ApiResponse<any>> => {
        const response = await staffApi.post('/medical-supplies', data);
        return response.data;
    },

    getAll: async (query?: {
        page?: number;
        limit?: number;
        keyword?: string;
        patient_hn?: string;
        hn?: string;
        an?: string;
        sort_by?: string;
        sort_order?: string;
        startDate?: string;
        endDate?: string;
        user_name?: string;
        first_name?: string;
        lastname?: string;
        assession_no?: string;
    }): Promise<PaginatedResponse<any>> => {
        const response = await staffApi.get('/medical-supplies', { params: query });

        return response.data;
    },

    getById: async (id: number): Promise<ApiResponse<any>> => {
        const response = await staffApi.get(`/medical-supplies/${id}`);
        return response.data;
    },

    update: async (id: number, data: any): Promise<ApiResponse<any>> => {
        const response = await staffApi.put(`/medical-supplies/${id}`, data);
        return response.data;
    },

    updatePrintInfo: async (id: number, data: {
        print_location?: string;
        print_date?: Date;
        time_print_date?: Date;
    }): Promise<ApiResponse<any>> => {
        const response = await staffApi.patch(`/medical-supplies/${id}/print-info`, data);
        return response.data;
    },

    delete: async (id: number): Promise<ApiResponse> => {
        const response = await staffApi.delete(`/medical-supplies/${id}`);
        return response.data;
    },

    getStatistics: async (): Promise<ApiResponse<any>> => {
        const response = await staffApi.get('/medical-supplies/statistics');
        return response.data;
    },

    /** สรุปโดยรวม: จำนวนเบิก, จำนวนใช้, ผลต่าง (สำหรับ Dashboard) */
    getDispensedVsUsageSummary: async (params?: {
        startDate?: string;
        endDate?: string;
    }): Promise<ApiResponse<{ total_dispensed: number; total_used: number; difference: number }>> => {
        const response = await staffApi.get('/medical-supplies-comparison/summary', { params });
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
    getSupplyItemsByUsageId: async (usageId: number): Promise<ApiResponse<any>> => {
        const response = await staffApi.get(`/medical-supply-items/usage/${usageId}`);
        return response.data;
    },

    getReturnHistory: async (query?: {
        department_code?: string;
        patient_hn?: string;
        return_reason?: string;
        date_from?: string;
        date_to?: string;
        page?: number;
        limit?: number;
      }): Promise<ApiResponse<any>> => {
        const response = await staffApi.get('/medical-supply-items/return-history', { params: query });
        return response.data;
      },

    recordItemReturn: async (data: {
        item_id: number;
        qty_returned: number;
        return_reason: string;
        return_by_user_id?: string;
        return_note?: string;
      }): Promise<ApiResponse<any>> => {
        const response = await staffApi.post('/medical-supply-items/record-return', data);
        return response.data;
      },
};


