import { IsEmail, IsString, IsOptional, IsBoolean, IsDateString, MinLength } from 'class-validator';

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

  @IsString()
  @IsOptional()
  role_id?: number; // ID of StaffRole (preferred)

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

  @IsString()
  @IsOptional()
  role_id?: number; // ID of StaffRole (preferred)

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

