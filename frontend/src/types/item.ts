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

// Item Types (Updated to match backend schema)
export interface Item {
  // Primary Key
  itemcode: string; // Primary key (changed from id)
  
  // Basic Information
  itemname?: string;
  Alternatename?: string;
  Barcode?: string;
  Description?: string;
  
  // Pricing
  CostPrice?: number; // Decimal in DB
  SalePrice?: number;
  UsagePrice?: number;
  
  // Stock
  stock_balance?: number;
  stock_min?: number;
  stock_max?: number;
  Minimum?: number;
  Maximum?: number;
  
  // Status & Flags
  item_status?: number; // 0 = active, etc.
  IsSet?: string; // '0' or '1'
  IsReuse?: string;
  IsNormal?: string;
  IsSpecial?: string;
  IsStock?: boolean;
  IsCancel?: number;
  IsSingle?: boolean;
  fixcost?: boolean;
  
  // IDs
  itemtypeID?: number;
  UnitID?: number;
  DepartmentID?: number;
  SupllierID?: number;
  warehouseID?: number;
  procedureID?: number;
  
  // Images
  Picture?: string;
  Picture2?: string;
  Picture3?: string;
  Picture4?: string;
  Picture5?: string;
  Picweb?: string;
  
  // Dates
  CreateDate?: string;
  ModiflyDate?: string;
  
  // Other
  weight?: number;
  Note?: string;
  RefNo?: string;
  SapCode?: string;
  InternalCode?: string;
  ManufacturerName?: string;
  SuplierName?: string;
  UserCreate?: number;
  UserModify?: number;
  
  // Legacy fields (for backward compatibility)
  category?: Category;
}

export interface CreateItemDto {
  // Required
  itemcode: string; // Primary key, required
  
  // Basic Info
  itemname?: string;
  Alternatename?: string;
  Barcode?: string;
  Description?: string;
  
  // Pricing
  CostPrice?: number;
  SalePrice?: number;
  UsagePrice?: number;
  
  // Stock
  stock_balance?: number;
  stock_min?: number;
  stock_max?: number;
  Minimum?: number;
  Maximum?: number;
  
  // Status
  item_status?: number;
  IsSet?: string;
  IsReuse?: string;
  IsNormal?: string;
  IsSpecial?: string;
  IsStock?: boolean;
  
  // IDs
  itemtypeID?: number;
  UnitID?: number;
  DepartmentID?: number;
  SupllierID?: number;
  warehouseID?: number;
  
  // Images
  picture?: File; // For file upload
  Picture?: string; // For existing path
  
  // Other
  weight?: number;
  Note?: string;
  RefNo?: string;
  SapCode?: string;
  ManufacturerName?: string;
  SuplierName?: string;
}

export interface UpdateItemDto {
  // All fields optional for update
  itemname?: string;
  Alternatename?: string;
  Barcode?: string;
  Description?: string;
  
  // Pricing
  CostPrice?: number;
  SalePrice?: number;
  UsagePrice?: number;
  
  // Stock
  stock_balance?: number;
  stock_min?: number;
  stock_max?: number;
  Minimum?: number;
  Maximum?: number;
  
  // Status
  item_status?: number;
  IsSet?: string;
  IsReuse?: string;
  IsNormal?: string;
  IsSpecial?: string;
  IsStock?: boolean;
  
  // IDs
  itemtypeID?: number;
  UnitID?: number;
  DepartmentID?: number;
  SupllierID?: number;
  warehouseID?: number;
  
  // Images
  picture?: File;
  Picture?: string;
  
  // Other
  weight?: number;
  Note?: string;
  RefNo?: string;
  SapCode?: string;
  ManufacturerName?: string;
  SuplierName?: string;
}

export interface GetItemsQuery {
  page?: number;
  limit?: number;
  keyword?: string;
  item_status?: number;
  itemtypeID?: number;
  warehouseID?: number;
  sort_by?: 'itemname' | 'itemcode' | 'CostPrice' | 'stock_balance' | 'CreateDate';
  sort_order?: 'asc' | 'desc';
}

