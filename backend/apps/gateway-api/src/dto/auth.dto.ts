import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum, MinLength, Matches } from 'class-validator';

export enum AuthMethod {
  JWT = 'jwt',
  OAUTH2 = 'oauth2',
  API_KEY = 'api_key',
  BASIC = 'basic'
}

export enum OAuth2Provider {
  GOOGLE = 'google',
  MICROSOFT = 'microsoft'
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(AuthMethod)
  preferred_auth_method?: AuthMethod;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsEnum(AuthMethod)
  authMethod?: AuthMethod;
}

export class OAuth2LoginDto {
  @IsNotEmpty()
  @IsEnum(OAuth2Provider)
  provider: OAuth2Provider;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  state?: string;
}

// ================================ User Management DTOs ================================

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' })

  newPassword: string;

  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(AuthMethod)
  preferred_auth_method?: AuthMethod;

  @IsOptional()  // Allow empty for OAuth/Firebase users
  @IsString()
  currentPassword?: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email: string;
}
