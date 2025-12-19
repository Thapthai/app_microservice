import axios from 'axios';
import { getSession } from 'next-auth/react';
import type { ApiResponse, PaginatedResponse } from '@/types/common';
import type { AuthResponse, User, RegisterDto, LoginDto } from '@/types/auth';
import type { Item, CreateItemDto, UpdateItemDto, GetItemsQuery, Category, GetCategoriesQuery } from '@/types/item';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token from NextAuth session
api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    const session = await getSession();


    if (session && (session as any).accessToken) {
      const token = (session as any).accessToken;
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ No access token found in session');
    }
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Redirect to login page on unauthorized
      // Use basePath if configured (Next.js will handle this automatically)
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      window.location.href = `${basePath}/auth/login`;
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

// Categories API
export const categoriesApi = {
  getAll: async (query?: GetCategoriesQuery): Promise<PaginatedResponse<Category>> => {
    const response = await api.get('/categories', { params: query });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Category>> => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  getBySlug: async (slug: string): Promise<ApiResponse<Category>> => {
    const response = await api.get(`/categories/slug/${slug}`);
    return response.data;
  },

  create: async (data: { name: string; description?: string; slug?: string; is_active?: boolean }): Promise<ApiResponse<Category>> => {
    const response = await api.post('/categories', data);
    return response.data;
  },

  update: async (id: number, data: { name?: string; description?: string; slug?: string; is_active?: boolean }): Promise<ApiResponse<Category>> => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse> => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

// Items API
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
};

// Medical Supplies API
export const medicalSuppliesApi = {
  create: async (data: any): Promise<ApiResponse<any>> => {
    const response = await api.post('/medical-supplies', data);
    return response.data;
  },

  getAll: async (query?: {
    page?: number;
    limit?: number;
    keyword?: string;
    hn?: string;
    an?: string;
    sort_by?: string;
    sort_order?: string;
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
};

export default api;
