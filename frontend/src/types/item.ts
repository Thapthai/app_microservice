import type { User } from './auth';

// Category Types
export interface Category {
  id: number;
  name: string;
  description?: string;
  slug: string;
  image?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GetCategoriesQuery {
  page?: number;
  limit?: number;
  parentId?: string;
}

// Item Types
export interface Item {
  id: number;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category_id?: number;
  category?: Category;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateItemDto {
  name: string;
  description?: string;
  price: number;
  quantity?: number;
  category_id?: number;
  is_active?: boolean;
}

export interface UpdateItemDto {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  category_id?: number;
  is_active?: boolean;
}

export interface GetItemsQuery {
  page?: number;
  limit?: number;
  keyword?: string;
  category_id?: number;
  is_active?: boolean;
}

