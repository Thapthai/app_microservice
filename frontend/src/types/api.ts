// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
}

// Auth Response Types
export interface AuthResponse {
  user: User;
  token: string;
  accessToken?: string;
}

// User Types
export interface User {
  id: number;
  email: string;
  name: string;
  twoFactorEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

// Item Types
export interface Item {
  id: number;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: number;
  user?: User;
}

export interface CreateItemDto {
  name: string;
  description?: string;
  price: number;
  quantity?: number;
  category?: string;
  userId: number;
}

export interface UpdateItemDto {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  category?: string;
  isActive?: boolean;
}

export interface GetItemsQuery {
  userId?: number;
  category?: string;
  isActive?: boolean;
}
