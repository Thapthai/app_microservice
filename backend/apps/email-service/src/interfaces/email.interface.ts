export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  message: string;
  error?: string;
}

export interface EmailTemplate {
  subject: string;
  text?: string;
  html?: string;
}

export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
}

export interface EmailQueue {
  id: string;
  to: string;
  subject: string;
  template?: string;
  templateData?: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  scheduledAt?: Date;
  sentAt?: Date;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled';
  error?: string;
}
