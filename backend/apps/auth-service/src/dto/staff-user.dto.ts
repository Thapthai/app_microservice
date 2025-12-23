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

