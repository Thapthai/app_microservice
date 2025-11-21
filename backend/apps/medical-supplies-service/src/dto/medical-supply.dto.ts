import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsObject, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

// Order Item Input (New Format from API Spec)
export interface OrderItemInput {
  ItemCode: string;          // Order Item Code (S4214JELCO018)
  ItemDescription: string;   // Order Item Description (JELCO IV NO,18)
  AssessionNo: string;       // Assession No. (17938884/109)
  ItemStatus?: string;       // Order Item Status (Verified, Update, etc.)
  QTY: string | number;      // Quantity (can be string or number)
  UOM: string;               // Unit of Measure (Each)
}

// Legacy Supply Item Input (for backward compatibility)
export interface SupplyItemInput {
  supply_code: string;
  supply_name: string;
  supply_category: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  expiry_date?: string;
}

// Order Item Response
export interface OrderItemResponse {
  id: number;
  order_item_code: string;
  order_item_description: string;
  assession_no: string;
  order_item_status: string;
  qty: number;
  uom: string;
  // Legacy fields
  supply_code?: string;
  supply_name?: string;
  supply_category?: string;
  unit?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  expiry_date?: string;
}

// Create DTO (New Format)
export class CreateMedicalSupplyUsageDto {
  @IsOptional()
  @IsString()
  Hospital?: string; // VTN01

  @IsOptional()
  @IsString()
  EN?: string; // Episode Number (EZ5-000584)

  @IsOptional()
  @IsString()
  HN?: string; // Hospital Number (20-010334)

  @IsOptional()
  @IsString()
  FirstName?: string; // ชื่อจริง

  @IsOptional()
  @IsString()
  Lastname?: string; // นามสกุล

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  Order?: OrderItemInput[]; // Order Items

  // Legacy fields (optional for backward compatibility)
  @IsOptional()
  @IsString()
  patient_hn?: string;

  @IsOptional()
  @IsString()
  patient_name_th?: string;

  @IsOptional()
  @IsString()
  patient_name_en?: string;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  supplies?: SupplyItemInput[];

  @IsOptional()
  @IsString()
  usage_datetime?: string;

  @IsOptional()
  @IsString()
  usage_type?: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  department_code?: string;

  @IsOptional()
  @IsString()
  recorded_by_user_id?: string;

  @IsOptional()
  @IsString()
  billing_status?: string;

  @IsOptional()
  @IsNumber()
  billing_subtotal?: number;

  @IsOptional()
  @IsNumber()
  billing_tax?: number;

  @IsOptional()
  @IsNumber()
  billing_total?: number;

  @IsOptional()
  @IsString()
  billing_currency?: string;
}

// Update DTO
export class UpdateMedicalSupplyUsageDto {
  @IsOptional()
  @IsString()
  Hospital?: string;

  @IsOptional()
  @IsString()
  EN?: string;

  @IsOptional()
  @IsString()
  FirstName?: string;

  @IsOptional()
  @IsString()
  Lastname?: string;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  Order?: OrderItemInput[];

  // Legacy fields
  @IsOptional()
  @IsString()
  patient_name_th?: string;

  @IsOptional()
  @IsString()
  patient_name_en?: string;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  supplies?: SupplyItemInput[];

  @IsOptional()
  @IsString()
  usage_datetime?: string;

  @IsOptional()
  @IsString()
  usage_type?: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  department_code?: string;

  @IsOptional()
  @IsString()
  recorded_by_user_id?: string;

  @IsOptional()
  @IsString()
  billing_status?: string;

  @IsOptional()
  @IsNumber()
  billing_subtotal?: number;

  @IsOptional()
  @IsNumber()
  billing_tax?: number;

  @IsOptional()
  @IsNumber()
  billing_total?: number;

  @IsOptional()
  @IsString()
  billing_currency?: string;
}

// Update Print Information DTO (สำหรับอัพเดตข้อมูล Print โดยใช้ usage_id)
export class UpdatePrintInfoDto {
  @IsOptional()
  @IsString()
  Twu?: string; // Patient Location when Ordered

  @IsOptional()
  @IsString()
  PrintLocation?: string; // Print Location when Ordered

  @IsOptional()
  @IsString()
  PrintDate?: string; // Print Date

  @IsOptional()
  @IsString()
  TimePrintDate?: string; // Time Print Date

  @IsOptional()
  @IsString()
  update?: string; // Print Date (แยกจาก Receipt/Invoice)
}

// Query DTO
export class GetMedicalSupplyUsagesQueryDto {
  @IsOptional()
  @IsString()
  patient_hn?: string;

  @IsOptional()
  @IsString()
  HN?: string; // Support both formats

  @IsOptional()
  @IsString()
  EN?: string; // Episode Number

  @IsOptional()
  @IsString()
  department_code?: string;

  @IsOptional()
  @IsString()
  billing_status?: string;

  @IsOptional()
  @IsString()
  usage_type?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

// Response Interface
export interface MedicalSupplyUsageResponse {
  id: number;
  hospital?: string;
  en?: string;
  patient_hn: string;
  first_name?: string;
  lastname?: string;
  patient_name_th?: string;
  patient_name_en?: string;
  supply_items: OrderItemResponse[];
  usage_datetime?: string;
  usage_type?: string;
  purpose?: string;
  department_code?: string;
  recorded_by_user_id?: string;
  billing_status?: string;
  billing_subtotal?: number;
  billing_tax?: number;
  billing_total?: number;
  billing_currency?: string;
  // Print Information (ข้อมูลการ Print - ระดับ Usage Record)
  twu?: string;             // Patient Location when Ordered
  print_location?: string;  // Print Location when Ordered
  print_date?: string;      // Print Date
  time_print_date?: string; // Time Print Date
  update?: string;          // Print Date (แยกจาก Receipt/Invoice)
  created_at: Date;
  updated_at: Date;
}
