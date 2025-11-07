import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsObject, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

// Supply Item Input (for creating usage)
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

// Supply Item Response
export interface SupplyItemResponse {
  id: number;
  supply_code: string;
  supply_name: string;
  supply_category: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  expiry_date?: string;
}

// Create DTO
export class CreateMedicalSupplyUsageDto {
  @IsString()
  patient_hn: string;

  @IsString()
  patient_name_th: string;

  @IsString()
  patient_name_en: string;

  @IsArray()
  @IsObject({ each: true })
  supplies: SupplyItemInput[];

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

// Query DTO
export class GetMedicalSupplyUsagesQueryDto {
  @IsOptional()
  @IsString()
  patient_hn?: string;

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
  patient_hn: string;
  patient_name_th: string;
  patient_name_en: string;
  supply_items: SupplyItemResponse[];  // Changed from supplies to supply_items
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
  created_at: Date;
  updated_at: Date;
}
