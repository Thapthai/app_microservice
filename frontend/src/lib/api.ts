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
      window.location.href = '/auth/login';
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
};

// Items API
export const itemsApi = {
  create: async (data: CreateItemDto): Promise<ApiResponse<Item>> => {
    const response = await api.post('/items', data);
    return response.data;
  },

  getAll: async (query?: GetItemsQuery): Promise<PaginatedResponse<Item>> => {
    const response = await api.get('/items', { params: query });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Item>> => {
    const response = await api.get(`/items/${id}`);
    return response.data;
  },

  update: async (id: number, data: UpdateItemDto): Promise<ApiResponse<Item>> => {
    const response = await api.put(`/items/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse> => {
    const response = await api.delete(`/items/${id}`);
    return response.data;
  },
};

export default api;
