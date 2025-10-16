import type { User } from './auth';

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
  page?: number;
  limit?: number;
  keyword?: string;
  userId?: number;
  category?: string;
  isActive?: boolean;
}

