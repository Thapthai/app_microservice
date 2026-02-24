import axios from 'axios';
import { getSession } from 'next-auth/react';
import type { ApiResponse, PaginatedResponse, ItemsStats } from '@/types/common';
import type { AuthResponse, User, RegisterDto, LoginDto } from '@/types/auth';
import type { Item, CreateItemDto, UpdateItemDto, GetItemsQuery } from '@/types/item';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token from NextAuth session or staff token
api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    // Check if this is a staff API endpoint
    const isStaffEndpoint = config.url?.startsWith('/staff') || config.url?.startsWith('/staff-users');

    if (isStaffEndpoint) {
      // Use staff token from localStorage for staff endpoints
      const staffToken = localStorage.getItem('staff_token');
      if (staffToken) {
        config.headers.Authorization = `Bearer ${staffToken}`;
      }
    } else {
      // Use NextAuth session token for regular endpoints
      const session = await getSession();
      if (session && (session as any).accessToken) {
        const token = (session as any).accessToken;
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('⚠️ No access token found in session');
      }
    }
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Check if this is a staff API endpoint
      const isStaffEndpoint = error.config?.url?.startsWith('/staff') || error.config?.url?.startsWith('/staff-users');

      if (isStaffEndpoint) {
        // Only redirect staff routes to staff login
        // Clear staff tokens
        localStorage.removeItem('staff_token');
        localStorage.removeItem('staff_user');

        // Use Next.js router if available, otherwise use window.location
        const currentPath = window.location.pathname;
        if (currentPath.includes('/staff/')) {
          // Next.js automatically handles basePath
          window.location.href = '/auth/staff/login';
        }
      }
      // For non-staff endpoints, let the app handle the redirect
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (data: RegisterDto): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginDto): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Firebase Authentication API
  firebaseLogin: async (idToken: string): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/firebase/login', { idToken });
    return response.data;
  },

  // 2FA APIs
  enable2FA: async (password: string): Promise<ApiResponse<{ qrCodeUrl: string; secret: string }>> => {
    const response = await api.post('/auth/2fa/enable', { password });
    return response.data;
  },

  verify2FASetup: async (secret: string, token: string): Promise<ApiResponse<{ backupCodes: string[] }>> => {
    const response = await api.post('/auth/2fa/verify-setup', { secret, token });
    return response.data;
  },

  disable2FA: async (password: string, token?: string): Promise<ApiResponse> => {
    const response = await api.post('/auth/2fa/disable', { password, token });
    return response.data;
  },

  loginWith2FA: async (tempToken: string, code: string, type?: string): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/login/2fa', { tempToken, code, type });
    return response.data;
  },

  // User Management APIs
  getUserProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/user/profile');
    return response.data;
  },

  updateUserProfile: async (data: {
    name?: string;
    email?: string;
    preferredAuthMethod?: string;
    currentPassword: string;
  }): Promise<ApiResponse<User>> => {
    const response = await api.put('/auth/user/profile', data);
    return response.data;
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse> => {
    const response = await api.post('/auth/user/change-password', data);
    return response.data;
  },

  requestPasswordReset: async (email: string): Promise<ApiResponse> => {
    const response = await api.post('/auth/password/reset-request', { email });
    return response.data;
  },
};

// =========================================== Items API ===========================================
export const itemsApi = {
  create: async (data: CreateItemDto): Promise<ApiResponse<Item>> => {
    const { picture, ...restData } = data;

    // If has file, use multipart/form-data with /items/upload endpoint
    if (picture && picture instanceof File) {
      const formData = new FormData();

      // Append all fields to FormData
      Object.keys(restData).forEach((key) => {
        const value = restData[key as keyof typeof restData];
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, String(value));
        }
      });

      formData.append('picture', picture);

      const response = await api.post('/items/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }

    // Otherwise, send as JSON to /items endpoint
    const response = await api.post('/items', restData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  getAll: async (query?: GetItemsQuery): Promise<PaginatedResponse<Item>> => {
    const response = await api.get('/items', { params: query });
    return response.data;
  },

  getStats: async (query?: { cabinet_id?: number; department_id?: number }): Promise<ApiResponse<ItemsStats>> => {
    const response = await api.get('/items/stats', { params: query });
    return response.data;
  },

  getItemStocksWillReturn: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get('/item-stocks/will-return');
    return response.data as { success: boolean; data: any[] };
  },

  getById: async (itemcode: string): Promise<ApiResponse<Item>> => {
    const response = await api.get(`/items/${itemcode}`);
    return response.data;
  },

  update: async (itemcode: string, data: UpdateItemDto): Promise<ApiResponse<Item>> => {
    const { picture, ...restData } = data;

    // If has file, use multipart/form-data with /items/upload endpoint
    if (picture && picture instanceof File) {
      const formData = new FormData();

      // Append all fields to FormData
      Object.keys(restData).forEach((key) => {
        const value = restData[key as keyof typeof restData];
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, String(value));
        }
      });

      formData.append('picture', picture);

      const response = await api.put(`/items/${itemcode}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }

    // Otherwise, send as JSON
    const response = await api.put(`/items/${itemcode}`, restData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  delete: async (itemcode: string): Promise<ApiResponse> => {
    const response = await api.delete(`/items/${itemcode}`);
    return response.data;
  },

  updateMinMax: async (itemcode: string, data: { stock_min?: number; stock_max?: number }, cabinetId?: number): Promise<ApiResponse<Item>> => {
    const url = cabinetId != null 
      ? `/items/${itemcode}/minmax?cabinet_id=${cabinetId}`
      : `/items/${itemcode}/minmax`;
    const response = await api.patch(url, data);
    return response.data;
  },
};

// =========================================== Medical Supplies API ===========================================
export const medicalSuppliesApi = {
  create: async (data: any): Promise<ApiResponse<any>> => {
    const response = await api.post('/medical-supplies', data);
    return response.data;
  },

  getAll: async (query?: {
    page?: number;
    limit?: number;
    keyword?: string;
    patient_hn?: string;  // แก้จาก hn เป็น patient_hn ให้ตรงกับ backend
    hn?: string;  // เก็บไว้เพื่อ backward compatibility
    an?: string;
    sort_by?: string;
    sort_order?: string;
    startDate?: string;
    endDate?: string;
    user_name?: string;
    first_name?: string;
    lastname?: string;
    assession_no?: string;
    department_code?: string;
    department_name?: string;  // ชื่อแผนก (เช็คกับ DepName/DepName2)
    print_date?: string;       // วันที่พิมพ์บิล
    time_print_date?: string;  // เวลาที่พิมพ์บิล
  }): Promise<PaginatedResponse<any>> => {
    const response = await api.get('/medical-supplies', { params: query });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.get(`/medical-supplies/${id}`);
    return response.data;
  },

  update: async (id: number, data: any): Promise<ApiResponse<any>> => {
    const response = await api.put(`/medical-supplies/${id}`, data);
    return response.data;
  },

  updatePrintInfo: async (id: number, data: {
    print_location?: string;
    print_date?: Date;
    time_print_date?: Date;
  }): Promise<ApiResponse<any>> => {
    const response = await api.patch(`/medical-supplies/${id}/print-info`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse> => {
    const response = await api.delete(`/medical-supplies/${id}`);
    return response.data;
  },

  getStatistics: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/medical-supplies/statistics/all');
    return response.data;
  },

  getLogs: async (query?: {
    page?: number;
    limit?: number;
    usage_id?: number;
    action?: string;
    method?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ success: boolean; data: any[]; total: number; page: number; limit: number; totalPages: number }> => {
    const response = await api.get('/medical-supplies/logs', { params: query });
    return response.data;
  },

  // Quantity Management APIs
  getSupplyItemById: async (itemId: number): Promise<ApiResponse<any>> => {
    const response = await api.get(`/medical-supply-items/${itemId}`);
    return response.data;
  },

  getSupplyItemsByUsageId: async (usageId: number): Promise<ApiResponse<any>> => {
    const response = await api.get(`/medical-supply-items/usage/${usageId}`);
    return response.data;
  },

  recordItemUsedWithPatient: async (data: {
    item_id: number;
    qty_used: number;
    recorded_by_user_id?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post('/medical-supply-items/record-used', data);
    return response.data;
  },

  recordItemReturn: async (data: {
    item_id: number;
    qty_returned: number;
    return_reason: string;
    return_by_user_id: string;
    return_note?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post('/medical-supply-items/record-return', data);
    return response.data;
  },

  getPendingItems: async (query?: {
    department_code?: string;
    patient_hn?: string;
    item_status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const response = await api.get('/medical-supply-items/pending', { params: query });
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
    const response = await api.get('/medical-supply-items/return-history', { params: query });
    return response.data;
  },

  getItemStocksForReturnToCabinet: async (filters?: {
    itemCode?: string;
    itemTypeId?: number;
    rfidCode?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (filters?.itemCode) queryParams.append('itemCode', filters.itemCode);
    if (filters?.itemTypeId) queryParams.append('itemTypeId', filters.itemTypeId.toString());
    if (filters?.rfidCode) queryParams.append('rfidCode', filters.rfidCode);
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    const response = await api.get(`/medical-supply-items/return-to-cabinet?${queryParams.toString()}`);
    return response.data;
  },

  recordStockReturn: async (data: {
    items: Array<{ item_stock_id: number; return_reason: string; return_note?: string }>;
    return_by_user_id?: string;
    stock_id?: number;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post('/medical-supply-items/record-stock-return', data);
    return response.data;
  },

  returnItemsToCabinet: async (rowIds: number[]): Promise<ApiResponse<any>> => {
    const response = await api.post('/medical-supply-items/return-to-cabinet', { rowIds });
    return response.data;
  },

  getItemStocksForDispenseFromCabinet: async (filters?: {
    itemCode?: string;
    itemTypeId?: number;
    rfidCode?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (filters?.itemCode) queryParams.append('itemCode', filters.itemCode);
    if (filters?.itemTypeId) queryParams.append('itemTypeId', filters.itemTypeId.toString());
    if (filters?.rfidCode) queryParams.append('rfidCode', filters.rfidCode);
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    const response = await api.get(`/medical-supply-items/dispense-from-cabinet?${queryParams.toString()}`);
    return response.data;
  },

  dispenseItemsFromCabinet: async (rowIds: number[]): Promise<ApiResponse<any>> => {
    const response = await api.post('/medical-supply-items/dispense-from-cabinet', { rowIds });
    return response.data;
  },

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
    const response = await api.get('/medical-supply-items/returned-items', { params: query });
    return response.data;
  },

  getQuantityStatistics: async (departmentCode?: string): Promise<ApiResponse<any>> => {
    const params = departmentCode ? { department_code: departmentCode } : {};
    const response = await api.get('/medical-supply-items/statistics', { params });
    return response.data;
  },

  // Item Comparison APIs
  getDispensedItems: async (query?: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    departmentId?: string;
    cabinetId?: string;
  }): Promise<ApiResponse<any> & {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  }> => {
    const response = await api.get('/medical-supplies-dispensed-items', { params: query });
    return response.data;
  },

  /** ดาวน์โหลดรายงานเบิกจากตู้ (Excel/PDF) โดยไม่เปิดแท็บใหม่ */
  downloadDispensedItemsExcel: async (params?: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    departmentId?: string;
    cabinetId?: string;
  }): Promise<void> => {
    const queryParams = new URLSearchParams();
    if (params?.keyword) queryParams.append('keyword', params.keyword);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
    if (params?.cabinetId) queryParams.append('cabinetId', params.cabinetId);
    const response = await api.get(
      `/medical-supplies-dispensed-items/export/excel?${queryParams.toString()}`,
      { responseType: 'blob' },
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dispensed_items_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  downloadDispensedItemsPdf: async (params?: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    departmentId?: string;
    cabinetId?: string;
  }): Promise<void> => {
    const queryParams = new URLSearchParams();
    if (params?.keyword) queryParams.append('keyword', params.keyword);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
     if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
     if (params?.cabinetId) queryParams.append('cabinetId', params.cabinetId);
    const response = await api.get(
      `/medical-supplies-dispensed-items/export/pdf?${queryParams.toString()}`,
      { responseType: 'blob' },
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dispensed_items_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

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
    const response = await api.get('/medical-supplies-comparison', { params: query });
    return response.data;
  },

  /** สรุปโดยรวม: จำนวนเบิก, จำนวนใช้, ผลต่าง (สำหรับ Dashboard) */
  getDispensedVsUsageSummary: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<{ total_dispensed: number; total_used: number; difference: number }>> => {
    const response = await api.get('/medical-supplies-comparison/summary', { params });
    return response.data;
  },

  /** ดาวน์โหลดรายงานเปรียบเทียบการเบิกและใช้ (Excel/PDF) โดยไม่เปิดแท็บใหม่ */
  downloadMedicalSuppliesComparisonExcel: async (params?: {
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
    const response = await api.get(
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

  downloadMedicalSuppliesComparisonPdf: async (params?: {
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
    const response = await api.get(
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

  getUsageByItemCode: async (query?: {
    itemCode?: string;
    startDate?: string;
    endDate?: string;
    first_name?: string;
    lastname?: string;
    assession_no?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const response = await api.get('/medical-supplies-usage-by-item', { params: query });
    return response.data;
  },

  getUsageByOrderItemCode: async (query?: {
    orderItemCode?: string;
    startDate?: string;
    endDate?: string;
    first_name?: string;
    lastname?: string;
    assession_no?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> => {
    const response = await api.get('/medical-supplies-usage-by-order-item', { params: query });
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
    const response = await api.get('/medical-supplies-usage-by-item-code', { params: query });
    return response.data;
  },

  handleCrossDayCancelBill: async (data: {
    en: string;
    hn: string;
    oldPrintDate: string;
    newPrintDate: string;
    cancelItems: Array<{
      assession_no: string;
      item_code: string;
      qty: number;
      status?: string; // Status = Discontinue สำหรับรายการที่ยกเลิก
    }>;
    newItems?: Array<{
      item_code: string;
      item_description: string;
      assession_no: string;
      qty: number;
      uom: string;
      item_status?: string; // Status = Verified สำหรับรายการใหม่
    }>;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post('/medical-supplies/cancel-bill/cross-day', data);
    return response.data;
  },

  handleCancelBill: async (data: {
    usageId: number;
    supplyItemIds: number[];
    oldPrintDate: string;
    newPrintDate: string;
    newItems?: Array<{
      item_code: string;
      item_description: string;
      assession_no: string;
      qty: number;
      uom: string;
      item_status?: string;
    }>;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post('/medical-supplies/cancel-bill', data);
    return response.data;
  },
};

// Reports API
export const vendingReportsApi = {
  // Get data (JSON)
  getVendingMappingData: async (params?: { startDate?: string; endDate?: string; printDate?: string }): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (params?.printDate) queryParams.append('printDate', params.printDate);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    const response = await api.get(`/reports/vending-mapping/data?${queryParams.toString()}`);
    return response.data;
  },
  getUnmappedDispensedData: async (params?: { startDate?: string; endDate?: string; groupBy?: 'day' | 'month' }): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.groupBy) queryParams.append('groupBy', params.groupBy);
    const response = await api.get(`/reports/unmapped-dispensed/data?${queryParams.toString()}`);
    return response.data;
  },
  getUnusedDispensedData: async (params?: { date?: string }): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    const response = await api.get(`/reports/unused-dispensed/data?${queryParams.toString()}`);
    return response.data;
  },
  getCancelBillReportData: async (params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    const response = await api.get(`/reports/cancel-bill/data?${queryParams.toString()}`);
    return response.data;
  },
  /** ดาวน์โหลดรายงานเบิกใช้กับคนไข้ (Excel/PDF) โดยไม่เปิดแท็บใหม่ */
  downloadDispensedItemsForPatientsExcel: async (params?: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    patientHn?: string;
    departmentCode?: string;
    usageType?: string;
  }): Promise<void> => {
    const queryParams = new URLSearchParams();
    if (params?.keyword) queryParams.append('keyword', params.keyword);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.patientHn) queryParams.append('patientHn', params.patientHn);
    if (params?.departmentCode) queryParams.append('departmentCode', params.departmentCode);
    if (params?.usageType) queryParams.append('usageType', params.usageType);
    const response = await api.get(
      `/reports/dispensed-items-for-patients/export/excel?${queryParams.toString()}`,
      { responseType: 'blob' },
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dispensed_items_for_patients_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  downloadDispensedItemsForPatientsPdf: async (params?: {
    keyword?: string;
    startDate?: string;
    endDate?: string;
    patientHn?: string;
    departmentCode?: string;
    usageType?: string;
  }): Promise<void> => {
    const queryParams = new URLSearchParams();
    if (params?.keyword) queryParams.append('keyword', params.keyword);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.patientHn) queryParams.append('patientHn', params.patientHn);
    if (params?.departmentCode) queryParams.append('departmentCode', params.departmentCode);
    if (params?.usageType) queryParams.append('usageType', params.usageType);
    const response = await api.get(
      `/reports/dispensed-items-for-patients/export/pdf?${queryParams.toString()}`,
      { responseType: 'blob' },
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dispensed_items_for_patients_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  // Download reports
  downloadVendingMappingExcel: async (params: { startDate?: string; endDate?: string; printDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params.printDate) queryParams.append('printDate', params.printDate);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    const response = await api.get(`/reports/vending-mapping/excel?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },
  downloadVendingMappingPDF: async (params: { startDate?: string; endDate?: string; printDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params.printDate) queryParams.append('printDate', params.printDate);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    const response = await api.get(`/reports/vending-mapping/pdf?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },
  downloadUnmappedDispensedExcel: async (params: { startDate?: string; endDate?: string; groupBy?: 'day' | 'month' }) => {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.groupBy) queryParams.append('groupBy', params.groupBy);
    const response = await api.get(`/reports/unmapped-dispensed/excel?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },
  downloadUnusedDispensedExcel: async (params: { date?: string }) => {
    const queryParams = new URLSearchParams();
    if (params.date) queryParams.append('date', params.date);
    const response = await api.get(`/reports/unused-dispensed/excel?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },
  downloadReturnReportExcel: async (params?: {
    date_from?: string;
    date_to?: string;
    return_reason?: string;
    department_code?: string;
    patient_hn?: string;
  }): Promise<void> => {
    const queryParams = new URLSearchParams();
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.return_reason) queryParams.append('return_reason', params.return_reason);
    if (params?.department_code) queryParams.append('department_code', params.department_code);
    if (params?.patient_hn) queryParams.append('patient_hn', params.patient_hn);
    const response = await api.get(`/reports/return/excel?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `return_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  downloadReturnReportPdf: async (params?: {
    date_from?: string;
    date_to?: string;
    return_reason?: string;
    department_code?: string;
    patient_hn?: string;
  }): Promise<void> => {
    const queryParams = new URLSearchParams();
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.return_reason) queryParams.append('return_reason', params.return_reason);
    if (params?.department_code) queryParams.append('department_code', params.department_code);
    if (params?.patient_hn) queryParams.append('patient_hn', params.patient_hn);
    const response = await api.get(`/reports/return/pdf?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `return_report_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  downloadCancelBillReportExcel: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<void> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    const response = await api.get(`/reports/cancel-bill/excel?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cancel_bill_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  downloadCancelBillReportPdf: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<void> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    const response = await api.get(`/reports/cancel-bill/pdf?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cancel_bill_report_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  downloadReturnToCabinetReportExcel: async (params?: {
    keyword?: string;
    itemTypeId?: number;
    startDate?: string;
    endDate?: string;
    departmentId?: string;
    cabinetId?: string;
  }): Promise<void> => {
    const queryParams = new URLSearchParams();
    if (params?.keyword) queryParams.append('keyword', params.keyword);
    if (params?.itemTypeId) queryParams.append('itemTypeId', params.itemTypeId.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
    if (params?.cabinetId) queryParams.append('cabinetId', params.cabinetId);
    const response = await api.get(`/reports/return-to-cabinet/excel?${queryParams.toString()}`, {
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
    departmentId?: string;
    cabinetId?: string;
  }): Promise<void> => {
    const queryParams = new URLSearchParams();
    if (params?.keyword) queryParams.append('keyword', params.keyword);
    if (params?.itemTypeId) queryParams.append('itemTypeId', params.itemTypeId.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
    if (params?.cabinetId) queryParams.append('cabinetId', params.cabinetId);
    const response = await api.get(`/reports/return-to-cabinet/pdf?${queryParams.toString()}`, {
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

export const reportsApi = {
  // Comparison Report
  exportComparisonExcel: async (usageId: number): Promise<Blob> => {
    const response = await api.get(`/reports/comparison/${usageId}/excel`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportComparisonPDF: async (usageId: number): Promise<Blob> => {
    const response = await api.get(`/reports/comparison/${usageId}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Equipment Usage Report
  exportEquipmentUsageExcel: async (params?: {
    dateFrom?: string;
    dateTo?: string;
    hospital?: string;
    department?: string;
    usageIds?: number[];
  }): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params?.hospital) queryParams.append('hospital', params.hospital);
    if (params?.department) queryParams.append('department', params.department);
    if (params?.usageIds && params.usageIds.length > 0) {
      queryParams.append('usageIds', params.usageIds.join(','));
    }

    const response = await api.get(`/reports/equipment-usage/excel?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportEquipmentUsagePDF: async (params?: {
    dateFrom?: string;
    dateTo?: string;
    hospital?: string;
    department?: string;
    usageIds?: number[];
  }): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params?.hospital) queryParams.append('hospital', params.hospital);
    if (params?.department) queryParams.append('department', params.department);
    if (params?.usageIds && params.usageIds.length > 0) {
      queryParams.append('usageIds', params.usageIds.join(','));
    }

    const response = await api.get(`/reports/equipment-usage/pdf?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Equipment Disbursement Report
  exportEquipmentDisbursementExcel: async (params?: {
    dateFrom?: string;
    dateTo?: string;
    hospital?: string;
    department?: string;
  }): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params?.hospital) queryParams.append('hospital', params.hospital);
    if (params?.department) queryParams.append('department', params.department);

    const response = await api.get(`/reports/equipment-disbursement/excel?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportEquipmentDisbursementPDF: async (params?: {
    dateFrom?: string;
    dateTo?: string;
    hospital?: string;
    department?: string;
  }): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params?.hospital) queryParams.append('hospital', params.hospital);
    if (params?.department) queryParams.append('department', params.department);

    const response = await api.get(`/reports/equipment-disbursement/pdf?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Cabinet Stock Report (รายงานสต๊อกอุปกรณ์ในตู้)
  downloadCabinetStockExcel: async (params?: { cabinetId?: number; cabinetCode?: string; departmentId?: number }): Promise<void> => {
    const queryParams = new URLSearchParams();
    if (params?.cabinetId != null) queryParams.append('cabinetId', params.cabinetId.toString());
    if (params?.cabinetCode) queryParams.append('cabinetCode', params.cabinetCode);
    if (params?.departmentId != null) queryParams.append('departmentId', params.departmentId.toString());
    const response = await api.get(`/reports/cabinet-stock/excel?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cabinet_stock_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  downloadCabinetStockPdf: async (params?: { cabinetId?: number; cabinetCode?: string; departmentId?: number }): Promise<void> => {
    const queryParams = new URLSearchParams();
    if (params?.cabinetId != null) queryParams.append('cabinetId', params.cabinetId.toString());
    if (params?.cabinetCode) queryParams.append('cabinetCode', params.cabinetCode);
    if (params?.departmentId != null) queryParams.append('departmentId', params.departmentId.toString());
    const response = await api.get(`/reports/cabinet-stock/pdf?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cabinet_stock_report_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

// =========================== Staff User API ===========================
export const staffUserApi = {
  createStaffUser: async (data: {
    email: string;
    fname: string;
    lname: string;
    role: string; // Keep for backward compatibility, will be converted to role_code
    department_id?: number | null;
    password?: string;
    expires_at?: string;
  }): Promise<ApiResponse<any>> => {
    // Convert role to role_code for API
    const requestData: any = {
      ...data,
      role_code: data.role,
      role: undefined,
    };
    delete requestData.role;
    if (data.department_id !== undefined) requestData.department_id = data.department_id;
    const response = await api.post('/staff-users', requestData);
    return response.data;
  },

  getAllStaffUsers: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/staff-users');
    return response.data;
  },

  getStaffUserById: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.get(`/staff-users/${id}`);
    return response.data;
  },

  updateStaffUser: async (
    id: number,
    data: {
      email?: string;
      fname?: string;
      lname?: string;
      role?: string;
      department_id?: number | null;
      password?: string;
      is_active?: boolean;
      expires_at?: string;
    }
  ): Promise<ApiResponse<any>> => {
    const payload: any = { ...data };
    if (data.role !== undefined) payload.role_code = data.role;
    const response = await api.put(`/staff-users/${id}`, payload);
    return response.data;
  },

  deleteStaffUser: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/staff-users/${id}`);
    return response.data;
  },

  regenerateClientSecret: async (
    id: number,
    data?: { expires_at?: string }
  ): Promise<ApiResponse<any>> => {
    const response = await api.post(`/staff-users/${id}/regenerate-secret`, data || {});
    return response.data;
  },

  staffUserLogin: async (data: {
    email: string;
    password: string;
    roleType?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post('/staff-users/login', data);
    return response.data;
  },

  getStaffProfile: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/staff/profile');
    return response.data;
  },

  updateStaffProfile: async (data: {
    fname?: string;
    lname?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await api.put('/staff/profile', data);
    return response.data;
  },
};

// =========================== Staff Role Permissions API ===========================
export const staffRolePermissionApi = {
  getAll: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/staff-role-permissions');
    return response.data;
  },

  getByRole: async (role: string): Promise<ApiResponse<any[]>> => {
    const response = await api.get(`/staff-role-permissions/${role}`);
    return response.data;
  },

  upsert: async (data: {
    role_code?: string;
    role_id?: number;
    menu_href: string;
    can_access: boolean;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post('/staff-role-permissions', data);
    return response.data;
  },

  bulkUpdate: async (permissions: Array<{
    role_code?: string;
    role_id?: number;
    menu_href: string;
    can_access: boolean;
  }>): Promise<ApiResponse<any>> => {
    const response = await api.put('/staff-role-permissions/bulk', { permissions });
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/staff-role-permissions/${id}`);
    return response.data;
  },
};

// =========================== Staff Roles API ===========================
export const staffRoleApi = {
  getAll: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/staff-roles');
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.get(`/staff-roles/${id}`);
    return response.data;
  },

  create: async (data: {
    code: string;
    name: string;
    description?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post('/staff-roles', data);
    return response.data;
  },

  update: async (
    id: number,
    data: {
      name?: string;
      description?: string;
      is_active?: boolean;
    }
  ): Promise<ApiResponse<any>> => {
    const response = await api.put(`/staff-roles/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/staff-roles/${id}`);
    return response.data;
  },
};

// =========================== Categories API ===========================
export const categoriesApi = {
  getAll: async (params?: { page?: number; limit?: number; parentId?: string }): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/categories', { params });
    return response.data;
  },

  getById: async (id: number | string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    description?: string;
    slug?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post('/categories', data);
    return response.data;
  },

  update: async (
    id: number | string,
    data: {
      name?: string;
      description?: string;
      slug?: string;
      is_active?: boolean;
    }
  ): Promise<ApiResponse<any>> => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: number | string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

// Department API
export const departmentApi = {
  getAll: async (params?: { page?: number; limit?: number; keyword?: string; isCancel?: boolean }): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/departments', { params });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  create: async (data: any): Promise<ApiResponse<any>> => {
    const response = await api.post('/departments', data);
    return response.data;
  },

  update: async (id: number, data: any): Promise<ApiResponse<any>> => {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  },
};

// =========================== ItemStock API ===========================
export const itemStockApi = {
  getAll: async (params?: { page?: number; limit?: number; keyword?: string; sort_by?: string; sort_order?: string }): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/item-stocks', { params });
    return response.data;
  },
};

// =========================== Cabinet API ===========================
export const cabinetApi = {
  getAll: async (params?: { page?: number; limit?: number; keyword?: string; sort_by?: string; sort_order?: string }): Promise<PaginatedResponse<any>> => {
    const response = await api.get('/cabinets', { params });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.get(`/cabinets/${id}`);
    return response.data;
  },

  create: async (data: { cabinet_name?: string; cabinet_code?: string; cabinet_type?: string; stock_id?: number; cabinet_status?: string }): Promise<ApiResponse<any>> => {
    const response = await api.post('/cabinets', data);
    return response.data;
  },

  update: async (id: number, data: { cabinet_name?: string; cabinet_code?: string; cabinet_type?: string; stock_id?: number; cabinet_status?: string }): Promise<ApiResponse<any>> => {
    const response = await api.put(`/cabinets/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/cabinets/${id}`);
    return response.data;
  },
};

// =========================== Cabinet Department Mapping API ===========================
export const cabinetDepartmentApi = {
  getAll: async (params?: { cabinetId?: number; departmentId?: number; status?: string; keyword?: string }): Promise<ApiResponse<any[]>> => {
    // Convert camelCase to snake_case for API
    const apiParams: any = {};
    if (params?.cabinetId !== undefined) apiParams.cabinet_id = params.cabinetId;
    if (params?.departmentId !== undefined) apiParams.department_id = params.departmentId;
    if (params?.status !== undefined) apiParams.status = params.status;
    if (params?.keyword !== undefined && params.keyword !== "") apiParams.keyword = params.keyword;
    
    const response = await api.get('/cabinet-departments', { params: apiParams });
    return response.data;
  },

  create: async (data: any): Promise<ApiResponse<any>> => {
    const response = await api.post('/cabinet-departments', data);
    return response.data;
  },

  update: async (id: number, data: any): Promise<ApiResponse<any>> => {
    const response = await api.put(`/cabinet-departments/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/cabinet-departments/${id}`);
    return response.data;
  },

  getItemStocksByCabinet: async (cabinetId: number, params?: { page?: number; limit?: number; keyword?: string }): Promise<ApiResponse<any>> => {
    const response = await api.get('/item-stocks/in-cabinet', { 
      params: { ...params, cabinet_id: cabinetId } 
    });
    return response.data;
  },
};

export default api;
