import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';

export interface EmailOTPResult {
  success: boolean;
  message: string;
  expiresIn?: number; // minutes
}

@Injectable()
export class EmailOTPService {
  constructor(
    private prisma: PrismaService,
    @Inject('EMAIL_SERVICE') private readonly emailClient: ClientProxy,
  ) {}

  /**
   * Generate and send Email OTP
   */
  async sendEmailOTP(user_id: number, email: string, purpose: string = 'login'): Promise<EmailOTPResult> {
    try {
      // Generate 6-digit OTP
      const otp = this.generateOTP();
      
      // Set expiration time (5 minutes)
      const expires_at = new Date();
      expires_at.setMinutes(expires_at.getMinutes() + 5);

      // Save OTP to database
      await this.prisma.twoFactorToken.create({
        data: {
          user_id,
          token: otp,
          type: 'email_otp',
          expires_at,
        },
      });

      // Get user info
      const user = await this.prisma.user.findUnique({
        where: { id: user_id },
        select: { name: true, email: true }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Send OTP via email service
      const emailResult = await this.sendOTPEmail(email, user.name, otp, purpose);
      
      if (!emailResult.success) {
        return { success: false, message: 'Failed to send OTP email' };
      }

      return {
        success: true,
        message: 'OTP sent to your email',
        expiresIn: 5
      };
    } catch (error) {
      console.error('Send Email OTP error:', error);
      return { success: false, message: 'Failed to send OTP' };
    }
  }

  /**
   * Verify Email OTP
   */
  async verifyEmailOTP(user_id: number, inputOTP: string): Promise<{ success: boolean; message: string }> {
    try {
      // Find valid OTP token
      const otpRecord = await this.prisma.twoFactorToken.findFirst({
        where: {
          user_id,
          token: inputOTP,
          type: 'email_otp',
          isUsed: false,
          expires_at: {
            gt: new Date()
          }
        }
      });

      if (!otpRecord) {
        return { success: false, message: 'Invalid or expired OTP' };
      }

      // Mark OTP as used
      await this.prisma.twoFactorToken.update({
        where: { id: otpRecord.id },
        data: { isUsed: true }
      });

      return { success: true, message: 'OTP verified successfully' };
    } catch (error) {
      console.error('Verify Email OTP error:', error);
      return { success: false, message: 'OTP verification failed' };
    }
  }

  /**
   * Clean up expired OTP tokens
   */
  async cleanupExpiredTokens(user_id?: number): Promise<void> {
    try {
      const where = {
        type: 'email_otp',
        expires_at: {
          lt: new Date()
        },
        ...(user_id && { user_id })
      };

      await this.prisma.twoFactorToken.deleteMany({ where });
    } catch (error) {
      console.error('Cleanup expired tokens error:', error);
    }
  }

  /**
   * Generate 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP via email service
   */
  private async sendOTPEmail(email: string, name: string, otp: string, purpose: string): Promise<{ success: boolean; message: string }> {
    try {
      const templateData = {
        name,
        email,
        otp,
        purpose,
        expiresIn: '5',
        appName: process.env.APP_NAME || 'POSE Microservice',
        supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com'
      };

      // Send via email service
      const result = await this.emailClient.send('email.sendTemplate', {
        to: email,
        template: 'email_otp',
        templateData
      }).toPromise();

      return result;
    } catch (error) {
      console.error('Send OTP email error:', error);
      return { success: false, message: 'Failed to send email' };
    }
  }

  /**
   * Get remaining attempts for user
   */
  async getRemainingAttempts(user_id: number): Promise<number> {
    try {
      const maxAttempts = 5;
      const timeWindow = 15; // minutes

      const recentAttempts = await this.prisma.twoFactorToken.count({
        where: {
          user_id,
          type: 'email_otp',
          created_at: {
            gt: new Date(Date.now() - timeWindow * 60 * 1000)
          }
        }
      });

      return Math.max(0, maxAttempts - recentAttempts);
    } catch (error) {
      console.error('Get remaining attempts error:', error);
      return 0;
    }
  }

  /**
   * Check if user can request new OTP (rate limiting)
   */
  async canRequestNewOTP(user_id: number): Promise<{ canRequest: boolean; waitTime?: number }> {
    try {
      const cooldownPeriod = 1; // 1 minute between requests

      const lastOTP = await this.prisma.twoFactorToken.findFirst({
        where: {
          user_id,
          type: 'email_otp'
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      if (!lastOTP) {
        return { canRequest: true };
      }

      const timeSinceLastRequest = Date.now() - lastOTP.created_at.getTime();
      const cooldownMs = cooldownPeriod * 60 * 1000;

      if (timeSinceLastRequest < cooldownMs) {
        const waitTime = Math.ceil((cooldownMs - timeSinceLastRequest) / 1000);
        return { canRequest: false, waitTime };
      }

      return { canRequest: true };
    } catch (error) {
      console.error('Can request new OTP error:', error);
      return { canRequest: false };
    }
  }
}
