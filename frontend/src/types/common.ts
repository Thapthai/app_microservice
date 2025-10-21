// Common API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  requiresTwoFactor?: boolean;
}

export interface ItemsStats {
  total_value: number;
  total_items: number;
  active_items: number;
  inactive_items: number;
}

export interface PaginatedResponse<T> {
  success?: boolean;
  data: T[];
  total: number;
  page: number;
  lastPage: number;
  stats?: ItemsStats;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

