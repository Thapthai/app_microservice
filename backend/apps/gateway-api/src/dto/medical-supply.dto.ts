import { IsString, IsOptional, IsNumber, IsArray, IsObject, IsInt, IsEnum, Min } from 'class-validator';

// Enums
export enum ItemStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  COMPLETED = 'COMPLETED',
}

export enum ReturnReason {
  UNWRAPPED_UNUSED = 'UNWRAPPED_UNUSED',
  EXPIRED = 'EXPIRED',
  CONTAMINATED = 'CONTAMINATED',
  DAMAGED = 'DAMAGED',
}

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

// ==========================================
// Quantity Management DTOs
// ==========================================

// บันทึกการใช้กับคนไข้
export class RecordItemUsedWithPatientDto {
  @IsInt()
  item_id: number;

  @IsInt()
  @Min(1)
  qty_used: number;

  @IsOptional()
  @IsString()
  recorded_by_user_id?: string;
}

// บันทึกการคืนอุปกรณ์
export class RecordItemReturnDto {
  @IsInt()
  item_id: number;

  @IsInt()
  @Min(1)
  qty_returned: number;

  @IsEnum(ReturnReason)
  return_reason: ReturnReason;

  @IsString()
  return_by_user_id: string;

  @IsOptional()
  @IsString()
  return_note?: string;
}

// Query รายการที่รอดำเนินการ
export class GetPendingItemsQueryDto {
  @IsOptional()
  @IsString()
  department_code?: string;

  @IsOptional()
  @IsString()
  patient_hn?: string;

  @IsOptional()
  @IsEnum(ItemStatus)
  item_status?: ItemStatus;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

// Query ประวัติการคืน
export class GetReturnHistoryQueryDto {
  @IsOptional()
  @IsString()
  department_code?: string;

  @IsOptional()
  @IsString()
  patient_hn?: string;

  @IsOptional()
  @IsEnum(ReturnReason)
  return_reason?: ReturnReason;

  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
