import { IsEmail, IsNotEmpty, IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

export enum EmailTemplate {
  WELCOME = 'welcome',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  LOGIN_NOTIFICATION = 'login_notification',
  API_KEY_CREATED = 'api_key_created',
  OAUTH_LINKED = 'oauth_linked',
  SECURITY_ALERT = 'security_alert',
  EMAIL_OTP = 'email_otp'
}

export enum EmailPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export class SendEmailDto {
  @IsEmail()
  to: string;

  @IsOptional()
  @IsEmail()
  from?: string;

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  html?: string;

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  bcc?: string[];

  @IsOptional()
  @IsEnum(EmailPriority)
  priority?: EmailPriority;

  @IsOptional()
  attachments?: any[];
}

export class SendTemplateEmailDto {
  @IsEmail()
  to: string;

  @IsNotEmpty()
  @IsEnum(EmailTemplate)
  template: EmailTemplate;

  @IsOptional()
  templateData?: Record<string, any>;

  @IsOptional()
  @IsEnum(EmailPriority)
  priority?: EmailPriority;

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  bcc?: string[];
}

export class BulkEmailDto {
  @IsArray()
  @IsEmail({}, { each: true })
  recipients: string[];

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  html?: string;

  @IsOptional()
  @IsEnum(EmailTemplate)
  template?: EmailTemplate;

  @IsOptional()
  templateData?: Record<string, any>;

  @IsOptional()
  @IsEnum(EmailPriority)
  priority?: EmailPriority;
}

export class EmailStatusDto {
  @IsNotEmpty()
  @IsString()
  messageId: string;
}
