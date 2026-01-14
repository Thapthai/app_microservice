import { IsString, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStaffRolePermissionDto {
  @IsString()
  @IsOptional()
  role_code?: string; // 'it1', 'it2', 'it3', 'warehouse1', 'warehouse2', 'warehouse3' (for backward compatibility)

  @IsString()
  @IsOptional()
  role_id?: number; // ID of StaffRole (preferred)

  @IsString()
  menu_href: string; // Menu href path, e.g., '/staff/dashboard'

  @IsBoolean()
  @IsOptional()
  can_access?: boolean;
}

export class UpdateStaffRolePermissionDto {
  @IsBoolean()
  @IsOptional()
  can_access?: boolean;
}

export class BulkUpdateStaffRolePermissionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStaffRolePermissionDto)
  permissions: CreateStaffRolePermissionDto[];
}

export class StaffRolePermissionResponseDto {
  id: number;
  role_id: number;
  role?: {
    id: number;
    code: string;
    name: string;
  };
  menu_href: string;
  can_access: boolean;
  created_at: Date;
  updated_at: Date;
}
