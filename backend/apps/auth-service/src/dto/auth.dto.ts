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
