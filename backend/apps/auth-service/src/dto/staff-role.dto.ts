import { IsString, IsBoolean, IsOptional, MinLength } from 'class-validator';

export class CreateStaffRoleDto {
  @IsString()
  @MinLength(2)
  code: string; // 'it1', 'it2', 'it3', 'warehouse1', 'warehouse2', 'warehouse3'

  @IsString()
  @MinLength(2)
  name: string; // 'IT 1', 'IT 2', 'Warehouse 1', etc.

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdateStaffRoleDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class StaffRoleResponseDto {
  id: number;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
