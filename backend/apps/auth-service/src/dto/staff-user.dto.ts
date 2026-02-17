import { IsEmail, IsString, IsOptional, IsBoolean, IsDateString, MinLength, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStaffUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  fname: string;

  @IsString()
  @MinLength(2)
  lname: string;

  @IsString()
  @IsOptional()
  role_code?: string; // 'it1', 'it2', 'it3', 'warehouse1', 'warehouse2', 'warehouse3' (for backward compatibility)

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  role_id?: number; // ID of StaffRole (preferred)

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  department_id?: number; // ID of Department

  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string; // Optional, will default to 'password123'

  @IsDateString()
  @IsOptional()
  expires_at?: string; // Client credential expiration
}

export class UpdateStaffUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(2)
  @IsOptional()
  fname?: string;

  @IsString()
  @MinLength(2)
  @IsOptional()
  lname?: string;

  @IsString()
  @IsOptional()
  role_code?: string; // 'it1', 'it2', 'it3', 'warehouse1', 'warehouse2', 'warehouse3' (for backward compatibility)

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  role_id?: number; // ID of StaffRole (preferred)

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  department_id?: number | null; // ID of Department (null to clear)

  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsDateString()
  @IsOptional()
  expires_at?: string;
}

export class StaffUserResponseDto {
  id: number;
  email: string;
  fname: string;
  lname: string;
  role_id: number;
  role?: {
    id: number;
    code: string;
    name: string;
    description: string | null;
  };
  department_id?: number | null;
  department?: { ID: number; DepName: string | null; DepName2: string | null } | null;
  client_id: string;
  expires_at: Date | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class RegenerateClientSecretDto {
  @IsDateString()
  @IsOptional()
  expires_at?: string;
}

