import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum, IsUrl, Matches, MinLength } from 'class-validator';

export enum AuthMethod {
  JWT = 'jwt',
  API_KEY = 'api_key',
  BASIC = 'basic',
  FIREBASE = 'firebase'
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).+$/, {
    message: 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักษรพิเศษ'
  })
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
  auth_method?: AuthMethod;
}

export class FirebaseLoginDto {
  @IsNotEmpty()
  @IsString()
  idToken: string; // Firebase ID token from frontend
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
  expires_at?: string; // ISO date string
}

/** Update client credential (e.g. set expires_at to null = ไม่มีวันหมดอายุ) */
export class UpdateClientCredentialDto {
  /** ISO date string, or null for never expire (ไม่มีวันหมดอายุ). Omit to leave unchanged. */
  @IsOptional()
  expires_at?: string | null;
}

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  refresh_token: string;
}

export class RevokeTokenDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsOptional()
  @IsEnum(AuthMethod)
  token_type?: AuthMethod;
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

// ================================ User Management DTOs ================================

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  currentPassword: string; // Current password for verification

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' })

  newPassword: string;

  @IsNotEmpty()
  @IsString()
  confirmPassword: string; // Must match newPassword
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
  currentPassword?: string; // Required only for JWT users with password
}

export class ResetPasswordDto {
  @IsEmail()
  email: string;
}

export class ConfirmResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  token: string; // Reset token from email

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).+$/, {
    message: 'รหัสผ่านใหม่ต้องมีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักษรพิเศษ'
  })
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  confirmPassword: string; // Must match newPassword
}
