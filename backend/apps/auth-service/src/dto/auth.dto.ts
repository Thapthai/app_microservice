import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum, IsUrl } from 'class-validator';

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
  preferredAuthMethod?: AuthMethod;
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

  @IsOptional()
  @IsUrl()
  redirectUri?: string;
}

export class ApiKeyCreateDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string; // ISO date string
}

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

export class RevokeTokenDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsOptional()
  @IsEnum(AuthMethod)
  tokenType?: AuthMethod;
}

// ================================ 2FA DTOs ================================

export enum TwoFactorType {
  TOTP = 'totp',
  EMAIL_OTP = 'email_otp',
  BACKUP_CODE = 'backup_code'
}

export class Enable2FADto {
  @IsNotEmpty()
  @IsString()
  password: string; // Current password for verification

  @IsOptional()
  @IsEnum(TwoFactorType)
  type?: TwoFactorType;
}

export class Verify2FASetupDto {
  @IsNotEmpty()
  @IsString()
  secret: string; // TOTP secret

  @IsNotEmpty()
  @IsString()
  token: string; // 6-digit code from authenticator app
}

export class Disable2FADto {
  @IsNotEmpty()
  @IsString()
  password: string; // Current password for verification

  @IsOptional()
  @IsString()
  token?: string; // 2FA token or backup code
}

export class Verify2FADto {
  @IsNotEmpty()
  @IsString()
  token: string; // 6-digit code

  @IsOptional()
  @IsEnum(TwoFactorType)
  type?: TwoFactorType;
}

export class Generate2FABackupCodesDto {
  @IsNotEmpty()
  @IsString()
  password: string; // Current password for verification
}

export class SendEmailOTPDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  purpose?: string; // 'login', '2fa_setup', etc.
}

export class LoginWith2FADto {
  @IsNotEmpty()
  @IsString()
  tempToken: string; // Temporary token from first login step

  @IsNotEmpty()
  @IsString()
  code: string; // 2FA code

  @IsOptional()
  @IsEnum(TwoFactorType)
  type?: TwoFactorType;
}
