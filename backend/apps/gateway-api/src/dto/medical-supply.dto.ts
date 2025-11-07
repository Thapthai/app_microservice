import { IsString, IsOptional, IsNumber, IsArray, IsObject } from 'class-validator';

// Supply Item Interface
export interface SupplyItem {
  supply_code: string;
  supply_name: string;
  supply_category: string;
  quantity: number;
  unit: string;
  expiry_date?: string;
  unit_price?: number;
  total_price?: number;
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
  supplies: SupplyItem[];

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
  supplies?: SupplyItem[];

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
