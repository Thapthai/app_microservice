// Common API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  requiresTwoFactor?: boolean;
}

export interface PaginatedResponse<T> {
  success?: boolean;
  data: T[];
  total: number;
  page: number;
  lastPage: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

