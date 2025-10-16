import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import {
  SendEmailDto,
  SendTemplateEmailDto,
  BulkEmailDto,
  EmailTemplate,
  EmailPriority
} from './dto/email.dto';
import { EmailConfig, EmailResult } from './interfaces/email.interface';
import { emailTemplates } from './templates';

@Injectable()
export class EmailServiceService {
  private readonly logger = new Logger(EmailServiceService.name);
  private transporter: nodemailer.Transporter;
  private emailConfig: EmailConfig;

  constructor() {
    // Load environment variables first
    dotenv.config();
    
    this.initializeEmailConfig();
    this.createTransporter();
  }

  private initializeEmailConfig() {  
    this.emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      },
      from: process.env.SMTP_FROM || 'noreply@example.com'
    };
    
  }

  private createTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.emailConfig.host,
      port: this.emailConfig.port,
      secure: this.emailConfig.secure,
      auth: this.emailConfig.auth,
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('SMTP connection failed:', error);
      } else {
        this.logger.log('SMTP server is ready to send emails');
      }
    });
  }

  async sendEmail(sendEmailDto: SendEmailDto): Promise<EmailResult> {
    try {
      const mailOptions: any = {
        from: sendEmailDto.from || this.emailConfig.from,
        to: sendEmailDto.to,
        cc: sendEmailDto.cc,
        bcc: sendEmailDto.bcc,
        subject: sendEmailDto.subject,
        text: sendEmailDto.text,
        html: sendEmailDto.html,
        attachments: sendEmailDto.attachments,
        priority: this.mapPriority(sendEmailDto.priority)
      };

      const result: any = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email sent successfully to ${sendEmailDto.to}, MessageID: ${result.messageId}`);

      return {
        success: true,
        messageId: result.messageId,
        message: 'Email sent successfully'
      };
    } catch (error) {
      this.logger.error(`Failed to send email to ${sendEmailDto.to}:`, error);

      return {
        success: false,
        message: 'Failed to send email',
        error: error.message
      };
    }
  }

  async sendTemplateEmail(sendTemplateEmailDto: SendTemplateEmailDto): Promise<EmailResult> {
    try {
      const template = emailTemplates[sendTemplateEmailDto.template];

      if (!template) {
        return {
          success: false,
          message: `Template ${sendTemplateEmailDto.template} not found`
        };
      }

      // Replace template variables
      const subject = this.replaceTemplateVariables(template.subject, sendTemplateEmailDto.templateData || {});
      const text = template.text ? this.replaceTemplateVariables(template.text, sendTemplateEmailDto.templateData || {}) : undefined;
      const html = template.html ? this.replaceTemplateVariables(template.html, sendTemplateEmailDto.templateData || {}) : undefined;

      const emailDto: SendEmailDto = {
        to: sendTemplateEmailDto.to,
        cc: sendTemplateEmailDto.cc,
        bcc: sendTemplateEmailDto.bcc,
        subject,
        text,
        html,
        priority: sendTemplateEmailDto.priority
      };

      return await this.sendEmail(emailDto);
    } catch (error) {
      this.logger.error(`Failed to send template email:`, error);

      return {
        success: false,
        message: 'Failed to send template email',
        error: error.message
      };
    }
  }

  async sendBulkEmail(bulkEmailDto: BulkEmailDto): Promise<EmailResult[]> {
    const results: EmailResult[] = [];

    for (const recipient of bulkEmailDto.recipients) {
      try {
        let result: EmailResult;

        if (bulkEmailDto.template) {
          result = await this.sendTemplateEmail({
            to: recipient,
            template: bulkEmailDto.template,
            templateData: bulkEmailDto.templateData,
            priority: bulkEmailDto.priority
          });
        } else {
          result = await this.sendEmail({
            to: recipient,
            subject: bulkEmailDto.subject,
            text: bulkEmailDto.text,
            html: bulkEmailDto.html,
            priority: bulkEmailDto.priority
          });
        }

        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          message: `Failed to send to ${recipient}`,
          error: error.message
        });
      }
    }

    return results;
  }

  async sendWelcomeEmail(email: string, name: string, additionalData?: any): Promise<EmailResult> {
    const templateData = {
      name,
      email,
      appName: process.env.APP_NAME || 'POSE Microservice',
      loginUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
      createdAt: new Date().toLocaleString('th-TH'),
      ...additionalData
    };

    return await this.sendTemplateEmail({
      to: email,
      template: EmailTemplate.WELCOME,
      templateData
    });
  }

  async sendEmailVerification(email: string, name: string, verificationCode: string, verificationUrl: string): Promise<EmailResult> {
    const templateData = {
      name,
      email,
      appName: process.env.APP_NAME || 'POSE Microservice',
      verificationCode,
      verificationUrl,
      expiresIn: '30',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com'
    };

    return await this.sendTemplateEmail({
      to: email,
      template: EmailTemplate.EMAIL_VERIFICATION,
      templateData,
      priority: EmailPriority.HIGH
    });
  }

  async sendPasswordReset(email: string, name: string, resetCode: string, resetUrl: string): Promise<EmailResult> {
    const templateData = {
      name,
      email,
      appName: process.env.APP_NAME || 'POSE Microservice',
      resetCode,
      resetUrl,
      expiresIn: '15',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com'
    };

    return await this.sendTemplateEmail({
      to: email,
      template: EmailTemplate.PASSWORD_RESET,
      templateData,
      priority: EmailPriority.URGENT
    });
  }

  async sendLoginNotification(email: string, name: string, loginDetails: any): Promise<EmailResult> {
    const templateData = {
      name,
      email,
      appName: process.env.APP_NAME || 'POSE Microservice',
      loginTime: loginDetails.loginTime || new Date().toLocaleString('th-TH'),
      device: loginDetails.device || 'Unknown Device',
      ipAddress: loginDetails.ipAddress || 'Unknown IP',
      location: loginDetails.location || 'Unknown Location'
    };

    return await this.sendTemplateEmail({
      to: email,
      template: EmailTemplate.LOGIN_NOTIFICATION,
      templateData
    });
  }

  async sendApiKeyCreated(email: string, name: string, keyDetails: any): Promise<EmailResult> {
    const templateData = {
      name,
      email,
      appName: process.env.APP_NAME || 'POSE Microservice',
      keyName: keyDetails.name,
      keyPrefix: keyDetails.prefix,
      createdAt: new Date().toLocaleString('th-TH'),
      expires_at: keyDetails.expires_at ? new Date(keyDetails.expires_at).toLocaleString('th-TH') : 'ไม่มีกำหนด'
    };

    return await this.sendTemplateEmail({
      to: email,
      template: EmailTemplate.API_KEY_CREATED,
      templateData
    });
  }

  async sendOAuthLinked(email: string, name: string, provider: string): Promise<EmailResult> {
    const templateData = {
      name,
      email,
      appName: process.env.APP_NAME || 'POSE Microservice',
      provider: provider.charAt(0).toUpperCase() + provider.slice(1)
    };

    return await this.sendTemplateEmail({
      to: email,
      template: EmailTemplate.OAUTH_LINKED,
      templateData
    });
  }

  async sendSecurityAlert(email: string, name: string, alertDetails: any): Promise<EmailResult> {
    const templateData = {
      name,
      email,
      appName: process.env.APP_NAME || 'POSE Microservice',
      alertMessage: alertDetails.message,
      timestamp: alertDetails.timestamp || new Date().toLocaleString('th-TH'),
      ipAddress: alertDetails.ipAddress || 'Unknown IP',
      location: alertDetails.location || 'Unknown Location'
    };

    return await this.sendTemplateEmail({
      to: email,
      template: EmailTemplate.SECURITY_ALERT,
      templateData,
      priority: EmailPriority.URGENT
    });
  }

  private replaceTemplateVariables(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  }

  private mapPriority(priority?: EmailPriority): string {
    const priorityMap = {
      [EmailPriority.LOW]: 'low',
      [EmailPriority.NORMAL]: 'normal',
      [EmailPriority.HIGH]: 'high',
      [EmailPriority.URGENT]: 'high'
    };

    return priorityMap[priority || EmailPriority.NORMAL];
  }

  async testConnection(): Promise<EmailResult> {
    try {
      await this.transporter.verify();
      return {
        success: true,
        message: 'SMTP connection successful'
      };
    } catch (error) {
      return {
        success: false,
        message: 'SMTP connection failed',
        error: error.message
      };
    }
  }
}
