import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsOptional()
  DepName?: string;

  @IsString()
  @IsOptional()
  DepName2?: string;

  @IsInt()
  @IsOptional()
  IsCancel?: number;

  @IsInt()
  @IsOptional()
  DivID?: number;

  @IsInt()
  @IsOptional()
  PriorityNo?: number;

  @IsInt()
  @IsOptional()
  IsRepeat?: number;

  @IsInt()
  @IsOptional()
  IsAutomaticPayout?: number;

  @IsInt()
  @IsOptional()
  Is_Bnew?: number;

  @IsString()
  @IsOptional()
  Floor?: string;

  @IsInt()
  @IsOptional()
  package?: number;

  @IsString()
  @IsOptional()
  Tel?: string;

  @IsInt()
  @IsOptional()
  IsReceiveManual?: number;

  @IsInt()
  @IsOptional()
  IsNoCopyPayout?: number;

  @IsInt()
  @IsOptional()
  sort?: number;

  @IsInt()
  @IsOptional()
  B_IDimed?: number;

  @IsString()
  @IsOptional()
  DepNameimed?: string;

  @IsInt()
  @IsOptional()
  LendingLimitDay?: number;

  @IsInt()
  @IsOptional()
  IsMainDep?: number;

  @IsString()
  @IsOptional()
  ItemPrefix?: string;

  @IsInt()
  @IsOptional()
  B_ID?: number;

  @IsInt()
  @IsOptional()
  IsAutoStock?: number;

  @IsInt()
  @IsOptional()
  IsGroupHoldFromHN?: number;

  @IsInt()
  @IsOptional()
  ExpiringSoonDay?: number;

  @IsInt()
  @IsOptional()
  IsToStock?: number;

  @IsInt()
  @IsOptional()
  IsLaundy?: number;

  @IsInt()
  @IsOptional()
  IsLoaner?: number;

  @IsInt()
  @IsOptional()
  IsStock?: number;

  @IsString()
  @IsOptional()
  RefDepID?: string;
}

export class UpdateDepartmentDto extends CreateDepartmentDto {}

export class CreateCabinetDepartmentDto {
  @IsInt()
  cabinet_id: number;

  @IsInt()
  department_id: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateCabinetDepartmentDto {
  @IsInt()
  cabinet_id: number;

  @IsInt()
  department_id: number;
  
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
