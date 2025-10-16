import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from './prisma.service';
import {
  LoginDto,
  RegisterDto,
  ApiKeyCreateDto,
  RefreshTokenDto,
  FirebaseLoginDto,
  AuthMethod
} from './dto/auth.dto';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { TOTPService } from './services/totp.service';
import { EmailOTPService } from './services/email-otp.service';
import { FirebaseService } from './services/firebase.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthServiceService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private apiKeyStrategy: ApiKeyStrategy,
    private totpService: TOTPService,
    private emailOTPService: EmailOTPService,
    private firebaseService: FirebaseService,
    @Inject('EMAIL_SERVICE') private readonly emailClient: ClientProxy,
  ) { }

  async register(registerDto: RegisterDto) {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: registerDto.email },
      });

      if (existingUser) {
        return { success: false, message: 'User already exists' };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      // Create user
      const newUser = await this.prisma.user.create({
        data: {
          email: registerDto.email,
          password: hashedPassword,
          name: registerDto.name,
        },
      });

      // Generate JWT token
      const payload = { sub: newUser.id, email: newUser.email, name: newUser.name };
      const token = this.jwtService.sign(payload);

      // Send welcome email (async, don't wait for it)
      this.sendWelcomeEmail(newUser.email, newUser.name).catch(error => {
        console.error('Failed to send welcome email:', error);
      });

      return {
        success: true,
        message: 'User registered successfully',
        data: {
          user: { id: newUser.id, email: newUser.email, name: newUser.name },
          token,
        },
      };
    } catch (error) {
      return { success: false, message: 'Registration failed', error: error.message };
    }
  }

  async login(loginDto: LoginDto) {
    try {
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email: loginDto.email },
      });

      if (!user) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Check if user is active
      if (!user.is_active) {
        return { success: false, message: 'Account is deactivated' };
      }

      // Verify password (check if user has password for non-OAuth users)
      if (!user.password) {
        return { success: false, message: 'Please use OAuth login for this account' };
      }

      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Check if 2FA is enabled
      if (user.two_factor_enabled) {
        // Generate temporary token for 2FA step
        const tempPayload = {
          sub: user.id,
          email: user.email,
          temp2FA: true,
          iat: Math.floor(Date.now() / 1000)
        };
        const tempToken = this.jwtService.sign(tempPayload, { expiresIn: '10m' });

        return {
          success: true,
          message: '2FA verification required',
          requiresTwoFactor: true,
          data: {
            tempToken,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              two_factor_enabled: true,
              preferred_auth_method: user.preferred_auth_method,
              hasPassword: !!user.password
            }
          }
        };
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { last_login_at: new Date() }
      });

      // Generate JWT token
      const payload = { sub: user.id, email: user.email, name: user.name };
      const token = this.jwtService.sign(payload);

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            profile_picture: user.profile_picture,
            email_verified: user.email_verified,
            two_factor_enabled: user.two_factor_enabled,
            preferred_auth_method: user.preferred_auth_method,
            hasPassword: !!user.password
          },
          token: token
        },
      };
    } catch (error) {
      return { success: false, message: 'Login failed', error: error.message };
    }
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            two_factor_enabled: user.two_factor_enabled,
            preferred_auth_method: user.preferred_auth_method,
            hasPassword: !!user.password
          },
        },
      };
    } catch (error) {
      return { success: false, message: 'Invalid token', error: error.message };
    }
  }

  // ================================ API Key Methods ================================

  async createApiKey(user_id: number, apiKeyDto: ApiKeyCreateDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: user_id }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const { key, hash, prefix } = this.apiKeyStrategy.generateApiKey();

      const apiKey = await this.prisma.apiKey.create({
        data: {
          user_id,
          name: apiKeyDto.name,
          description: apiKeyDto.description,
          key_hash: hash,
          prefix,
          expires_at: apiKeyDto.expires_at ? new Date(apiKeyDto.expires_at) : null
        }
      });

      // Send API key created email (async, don't wait for it)
      this.sendApiKeyCreatedEmail(user.email, user.name, {
        name: apiKey.name,
        prefix,
        expires_at: apiKey.expires_at
      }).catch(error => {
        console.error('Failed to send API key created email:', error);
      });

      return {
        success: true,
        message: 'API key created successfully',
        data: {
          id: apiKey.id,
          name: apiKey.name,
          key, // Only return the actual key once during creation
          prefix,
          expires_at: apiKey.expires_at
        }
      };
    } catch (error) {
      return { success: false, message: 'Failed to create API key', error: error.message };
    }
  }

  async listApiKeys(user_id: number) {
    try {
      const apiKeys = await this.prisma.apiKey.findMany({
        where: { user_id, is_active: true },
        select: {
          id: true,
          name: true,
          description: true,
          prefix: true,
          last_used_at: true,
          expires_at: true,
          created_at: true
        },
        orderBy: { created_at: 'desc' }
      });

      return {
        success: true,
        data: apiKeys
      };
    } catch (error) {
      return { success: false, message: 'Failed to list API keys', error: error.message };
    }
  }

  async revokeApiKey(user_id: number, apiKeyId: number) {
    try {
      const apiKey = await this.prisma.apiKey.findFirst({
        where: { id: apiKeyId, user_id }
      });

      if (!apiKey) {
        return { success: false, message: 'API key not found' };
      }

      await this.prisma.apiKey.update({
        where: { id: apiKeyId },
        data: { is_active: false }
      });

      return {
        success: true,
        message: 'API key revoked successfully'
      };
    } catch (error) {
      return { success: false, message: 'Failed to revoke API key', error: error.message };
    }
  }

  // ================================ Refresh Token Methods ================================

  async refresh_tokens(refreshTokenDto: RefreshTokenDto) {
    try {
      const refresh_token_record = await this.prisma.refreshToken.findUnique({
        where: { token: refreshTokenDto.refresh_token },
        include: { user: true }
      });

      if (!refresh_token_record || refresh_token_record.is_revoked) {
        return { success: false, message: 'Invalid refresh token' };
      }

      if (new Date() > refresh_token_record.expires_at) {
        return { success: false, message: 'Refresh token expired' };
      }

      // Revoke old refresh token
      await this.prisma.refreshToken.update({
        where: { id: refresh_token_record.id },
        data: { is_revoked: true }
      });

      // Generate new tokens
      const { access_token, refresh_token } = await this.generateTokens(refresh_token_record.user);

      return {
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          access_token,
          refresh_token,
          user: {
            id: refresh_token_record.user.id,
            email: refresh_token_record.user.email,
            name: refresh_token_record.user.name
          }
        }
      };
    } catch (error) {
      return { success: false, message: 'Token refresh failed', error: error.message };
    }
  }

  // ================================ Helper Methods ================================

  private async generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email, name: user.name };
    const access_token = this.jwtService.sign(payload);

    // Generate refresh token
    const refresh_token = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 30); // 30 days

    await this.prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token: refresh_token,
        expires_at
      }
    });

    return { access_token, refresh_token };
  }

  // ================================ Email Helper Methods ================================

  private async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      await this.emailClient.send('email.sendWelcome', {
        email,
        name,
        additionalData: {
          registrationDate: new Date().toISOString()
        }
      }).toPromise();
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }
  }

  private async sendLoginNotificationEmail(email: string, name: string, loginDetails: any): Promise<void> {
    try {
      await this.emailClient.send('email.sendLoginNotification', {
        email,
        name,
        loginDetails
      }).toPromise();
    } catch (error) {
      console.error('Failed to send login notification email:', error);
    }
  }

  private async sendApiKeyCreatedEmail(email: string, name: string, keyDetails: any): Promise<void> {
    try {
      await this.emailClient.send('email.sendApiKeyCreated', {
        email,
        name,
        keyDetails
      }).toPromise();
    } catch (error) {
      console.error('Failed to send API key created email:', error);
    }
  }

  private async sendOAuthLinkedEmail(email: string, name: string, provider: string): Promise<void> {
    try {
      await this.emailClient.send('email.sendOAuthLinked', {
        email,
        name,
        provider
      }).toPromise();
    } catch (error) {
      console.error('Failed to send OAuth linked email:', error);
    }
  }

  // ================================ 2FA Methods ================================

  async setupTOTP(user_id: number, password: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: user_id }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Verify current password
      if (user.password && !(await bcrypt.compare(password, user.password))) {
        return { success: false, message: 'Invalid password' };
      }

      // Check if 2FA is already enabled
      if (user.two_factor_enabled) {
        return { success: false, message: '2FA is already enabled' };
      }

      // Generate TOTP setup
      const totpSetup = await this.totpService.generateTOTPSetup(user.email);

      return {
        success: true,
        message: 'TOTP setup generated',
        data: {
          secret: totpSetup.secret,
          qrCodeUrl: totpSetup.qrCodeUrl,
          qrCodeDataURL: totpSetup.qrCodeDataURL,
          backup_codes: totpSetup.backup_codes
        }
      };
    } catch (error) {
      return { success: false, message: 'Failed to setup TOTP', error: error.message };
    }
  }

  async verifyAndEnable2FA(user_id: number, secret: string, token: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: user_id }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Verify TOTP token
      if (!this.totpService.verifyTOTP(token, secret)) {
        return { success: false, message: 'Invalid TOTP code' };
      }

      // Generate and hash backup codes
      const backup_codes = this.totpService.generateBackupCodes();
      const hashedBackupCodes = this.totpService.hashBackupCodes(backup_codes);

      // Enable 2FA
      await this.prisma.user.update({
        where: { id: user_id },
        data: {
          two_factor_enabled: true,
          two_factor_secret: secret,
          backup_codes: JSON.stringify(hashedBackupCodes),
          two_factor_verified_at: new Date()
        }
      });

      return {
        success: true,
        message: '2FA enabled successfully',
        data: {
          backup_codes: backup_codes // Show backup codes once
        }
      };
    } catch (error) {
      return { success: false, message: 'Failed to enable 2FA', error: error.message };
    }
  }

  async enable2FA(enable2FADto: { user_id: number; password: string }) {
    try {
      const { user_id, password } = enable2FADto;

      if (!user_id) {
        return { success: false, message: 'User ID is required' };
      }

      const user = await this.prisma.user.findUnique({
        where: { id: user_id }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      if (user.two_factor_enabled) {
        return { success: false, message: '2FA is already enabled' };
      }

      // Verify current password (only for JWT users with password)
      if (user.password && password) {
        if (!(await bcrypt.compare(password, user.password))) {
          return { success: false, message: 'Invalid password' };
        }
      } else if (user.password && !password) {
        return { success: false, message: 'Password required for JWT users' };
      }
      // OAuth/Firebase users (user.password is null) can enable 2FA without password

      // Generate TOTP setup
      const totpSetup = await this.totpService.generateTOTPSetup(user.email);

      return {
        success: true,
        message: '2FA setup initiated',
        data: {
          qrCodeUrl: totpSetup.qrCodeDataURL,
          secret: totpSetup.secret
        }
      };
    } catch (error) {
      return { success: false, message: 'Failed to enable 2FA', error: error.message };
    }
  }

  async verify2FASetup(verify2FASetupDto: { user_id: number; secret: string; token: string }) {
    try {
      const { user_id, secret, token } = verify2FASetupDto;

      const user = await this.prisma.user.findUnique({
        where: { id: user_id }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Verify the TOTP token
      const isValidToken = this.totpService.verifyTOTP(token, secret);
      if (!isValidToken) {
        return { success: false, message: 'Invalid verification code' };
      }

      // Generate backup codes
      const backup_codes = this.totpService.generateBackupCodes();
      const hashedBackupCodes = this.totpService.hashBackupCodes(backup_codes);

      // Enable 2FA for the user
      await this.prisma.user.update({
        where: { id: user_id },
        data: {
          two_factor_enabled: true,
          two_factor_secret: secret,
          backup_codes: JSON.stringify(hashedBackupCodes)
        }
      });

      return {
        success: true,
        message: '2FA enabled successfully',
        data: {
          backup_codes: backup_codes
        }
      };
    } catch (error) {
      return { success: false, message: 'Failed to verify 2FA setup', error: error.message };
    }
  }

  async disable2FA(user_id: number, password: string, token?: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: user_id }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      if (!user.two_factor_enabled) {
        return { success: false, message: '2FA is not enabled' };
      }

      // Verify current password (only for JWT users with password)
      if (user.password && password) {
        if (!(await bcrypt.compare(password, user.password))) {
          return { success: false, message: 'Invalid password' };
        }
      } else if (user.password && !password) {
        return { success: false, message: 'Password required for JWT users' };
      }
      // OAuth/Firebase users (user.password is null) can disable 2FA without password

      // If token provided, verify it
      if (token) {
        const isValidTOTP = user.two_factor_secret &&
          this.totpService.verifyTOTP(token, user.two_factor_secret);
        const isValidBackup = user.backup_codes &&
          this.totpService.verifyBackupCode(token, user.backup_codes);

        if (!isValidTOTP && !isValidBackup) {
          return { success: false, message: 'Invalid 2FA code' };
        }
      }

      // Disable 2FA
      await this.prisma.user.update({
        where: { id: user_id },
        data: {
          two_factor_enabled: false,
          two_factor_secret: null,
          backup_codes: null,
          two_factor_verified_at: null
        }
      });

      return {
        success: true,
        message: '2FA disabled successfully'
      };
    } catch (error) {
      return { success: false, message: 'Failed to disable 2FA', error: error.message };
    }
  }

  async verify2FA(user_id: number, token: string, type: string = 'totp') {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: user_id }
      });

      if (!user || !user.two_factor_enabled) {
        return { success: false, message: '2FA not enabled for this user' };
      }

      let isValid = false;

      switch (type) {
        case 'totp':
          if (user.two_factor_secret) {
            isValid = this.totpService.verifyTOTP(token, user.two_factor_secret);
          }
          break;

        case 'email_otp':
          const emailResult = await this.emailOTPService.verifyEmailOTP(user_id, token);
          isValid = emailResult.success;
          break;

        case 'backup_code':
          if (user.backup_codes) {
            isValid = this.totpService.verifyBackupCode(token, user.backup_codes);

            // Remove used backup code
            if (isValid) {
              const updatedCodes = this.totpService.removeUsedBackupCode(token, user.backup_codes);
              await this.prisma.user.update({
                where: { id: user_id },
                data: { backup_codes: updatedCodes }
              });
            }
          }
          break;
      }

      return {
        success: isValid,
        message: isValid ? '2FA verified successfully' : 'Invalid 2FA code'
      };
    } catch (error) {
      return { success: false, message: 'Failed to verify 2FA', error: error.message };
    }
  }

  async sendEmailOTP(user_id: number, purpose: string = 'login') {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: user_id }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Check rate limiting
      const canRequest = await this.emailOTPService.canRequestNewOTP(user_id);
      if (!canRequest.canRequest) {
        return {
          success: false,
          message: `Please wait ${canRequest.waitTime} seconds before requesting a new OTP`
        };
      }

      // Send OTP
      const result = await this.emailOTPService.sendEmailOTP(user_id, user.email, purpose);
      return result;
    } catch (error) {
      return { success: false, message: 'Failed to send email OTP', error: error.message };
    }
  }

  async regenerateBackupCodes(user_id: number, password: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: user_id }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      if (!user.two_factor_enabled) {
        return { success: false, message: '2FA is not enabled' };
      }

      // Verify current password
      if (user.password && !(await bcrypt.compare(password, user.password))) {
        return { success: false, message: 'Invalid password' };
      }

      // Generate new backup codes
      const backup_codes = this.totpService.generateBackupCodes();
      const hashedBackupCodes = this.totpService.hashBackupCodes(backup_codes);

      await this.prisma.user.update({
        where: { id: user_id },
        data: { backup_codes: JSON.stringify(hashedBackupCodes) }
      });

      return {
        success: true,
        message: 'Backup codes regenerated successfully',
        data: { backup_codes: backup_codes }
      };
    } catch (error) {
      return { success: false, message: 'Failed to regenerate backup codes', error: error.message };
    }
  }

  async get2FAStatus(user_id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: user_id },
        select: {
          two_factor_enabled: true,
          two_factor_verified_at: true,
          backup_codes: true
        }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      return {
        success: true,
        data: {
          enabled: user.two_factor_enabled,
          verifiedAt: user.two_factor_verified_at,
          backupCodesCount: user.backup_codes ? JSON.parse(user.backup_codes).length : 0
        }
      };
    } catch (error) {
      return { success: false, message: 'Failed to get 2FA status', error: error.message };
    }
  }

  async loginWith2FA(tempToken: string, code: string, type: string = 'totp') {
    try {
      // Verify temporary token
      let payload;
      try {
        payload = this.jwtService.verify(tempToken);
      } catch (error) {
        return { success: false, message: 'Invalid or expired temporary token' };
      }

      if (!payload.temp2FA) {
        return { success: false, message: 'Invalid temporary token' };
      }

      const user_id = payload.sub;

      // Verify 2FA code
      const verify2FAResult = await this.verify2FA(user_id, code, type);
      if (!verify2FAResult.success) {
        return verify2FAResult;
      }

      // Get user info
      const user = await this.prisma.user.findUnique({
        where: { id: user_id }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user_id },
        data: { last_login_at: new Date() }
      });

      // Generate final JWT token
      const finalPayload = { sub: user.id, email: user.email, name: user.name };
      const token = this.jwtService.sign(finalPayload);

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            two_factor_enabled: user.two_factor_enabled,
            preferred_auth_method: user.preferred_auth_method,
            hasPassword: !!user.password
          },
          token,
        },
      };
    } catch (error) {
      return { success: false, message: 'Failed to complete 2FA login', error: error.message };
    }
  }

  // ================================ User Management Methods ================================

  async changePassword(user_id: number, currentPassword: string, newPassword: string, confirmPassword: string) {
    try {
      // Validate that new password and confirm password match
      if (newPassword !== confirmPassword) {
        return { success: false, message: 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน' };
      }

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { id: user_id },
      });

      if (!user) {
        return { success: false, message: 'ไม่พบผู้ใช้งาน' };
      }

      // Check if user has password (for OAuth users)
      if (!user.password) {
        return { success: false, message: 'ผู้ใช้งาน OAuth ไม่สามารถเปลี่ยนรหัสผ่านได้' };
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return { success: false, message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' };
      }

      // Check if new password is different from current password
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return { success: false, message: 'รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านปัจจุบัน' };
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await this.prisma.user.update({
        where: { id: user_id },
        data: {
          password: hashedNewPassword,
          updated_at: new Date()
        },
      });

      return {
        success: true,
        message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว',
      };
    } catch (error) {
      return { success: false, message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน', error: error.message };
    }
  }

  async updateUserProfile(user_id: number, updateData: { name?: string; email?: string; preferred_auth_method?: string }, currentPassword?: string) {
    try {
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { id: user_id },
      });

      if (!user) {
        return { success: false, message: 'ไม่พบผู้ใช้งาน' };
      }

      // Verify current password for security (only for JWT users with password)
      if (user.password && currentPassword) {
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
          return { success: false, message: 'รหัสผ่านไม่ถูกต้อง' };
        }
      } else if (user.password && !currentPassword) {
        // JWT user must provide password
        return { success: false, message: 'กรุณาใส่รหัสผ่านเพื่อยืนยันการเปลี่ยนแปลง' };
      }
      // OAuth/Firebase users (user.password is null) can update without password

      // Check if email is being changed and if it's already taken
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email: updateData.email },
        });

        if (existingUser) {
          return { success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' };
        }
      }

      // Prepare update data
      const dataToUpdate: any = {
        updated_at: new Date(),
      };

      if (updateData.name) {
        dataToUpdate.name = updateData.name;
      }

      if (updateData.email) {
        dataToUpdate.email = updateData.email;
        // If email is changed, mark as unverified
        dataToUpdate.email_verified = false;
      }

      if (updateData.preferred_auth_method) {
        dataToUpdate.preferred_auth_method = updateData.preferred_auth_method;
        dataToUpdate.updated_at = new Date();
      }

      // Update user
      const updatedUser = await this.prisma.user.update({
        where: { id: user_id },
        data: dataToUpdate,
      });

      return {
        success: true,
        message: 'อัพเดตข้อมูลผู้ใช้งานเรียบร้อยแล้ว',
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          preferred_auth_method: updatedUser.preferred_auth_method,
          email_verified: updatedUser.email_verified,
          two_factor_enabled: updatedUser.two_factor_enabled,
        },
      };
    } catch (error) {
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัพเดตข้อมูล', error: error.message };
    }
  }

  async getUserProfile(user_id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: user_id },
        select: {
          id: true,
          email: true,
          name: true,
          is_active: true,
          email_verified: true,
          preferred_auth_method: true,
          two_factor_enabled: true,
          last_login_at: true,
          created_at: true,
          updated_at: true,
          // Don't include password or sensitive data
        },
      });

      if (!user) {
        return { success: false, message: 'ไม่พบผู้ใช้งาน' };
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      return { success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน', error: error.message };
    }
  }

  async requestPasswordReset(email: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Don't reveal if email exists or not for security
        return { success: true, message: 'หากอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้' };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Store reset token (you might want to create a separate table for this)
      // For now, we'll use a simple approach with user table
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          // You might need to add these fields to your User model
          // resetToken: resetToken,
          // resetTokenExpiry: resetTokenExpiry,
        },
      });

      // Send reset email via email service
      try {
        await this.emailClient.send('email.send-password-reset', {
          email: user.email,
          name: user.name,
          resetToken: resetToken,
        }).toPromise();
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
      }

      return { success: true, message: 'หากอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้' };
    } catch (error) {
      return { success: false, message: 'เกิดข้อผิดพลาดในการขอรีเซ็ตรหัสผ่าน', error: error.message };
    }
  }

  // =========================================================================================
  // ================================ Firebase Authentication ================================
  // =========================================================================================

  async firebaseLogin(firebaseLoginDto: FirebaseLoginDto) {
    try {
      // Verify Firebase ID token
      const decodedToken = await this.firebaseService.verifyIdToken(firebaseLoginDto.idToken);

      const { uid, email, name, picture } = decodedToken;

      // Create refresh token helper
      const createRefreshToken = async (userId: number) => {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await this.prisma.refreshToken.create({
          data: {
            user_id: userId,
            token,
            expires_at: expiresAt
          }
        });

        return token;
      };

      if (!email) {
        return { success: false, message: 'Email not found in Firebase token' };
      }

      // Check if user exists
      let user = await this.prisma.user.findUnique({
        where: { email }
      });

      // Create user if not exists
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email,
            name: name || email.split('@')[0],
            password: null, // No password for Firebase users
            email_verified: true, // Firebase already verified
            preferred_auth_method: AuthMethod.FIREBASE,
            firebase_uid: uid,
            profile_picture: picture
          }
        });
      } else {
        // Update Firebase UID if not set
        if (!user.firebase_uid) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: {
              firebase_uid: uid,
              email_verified: true
            }
          });
        }

        // Update last login
        await this.prisma.user.update({
          where: { id: user.id },
          data: { last_login_at: new Date() }
        });
      }

      // Generate JWT token
      const payload = {
        sub: user.id,  // Standard JWT claim for user ID
        userId: user.id,
        email: user.email,
        name: user.name,
        authMethod: AuthMethod.FIREBASE
      };

      const accessToken = this.jwtService.sign(payload);

      // Create refresh token
      const refreshToken = await createRefreshToken(user.id);
      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            profile_picture: user.profile_picture,
            email_verified: user.email_verified,
            preferred_auth_method: user.preferred_auth_method,
            two_factor_enabled: user.two_factor_enabled || false,
            hasPassword: !!user.password
          },
          token: accessToken, // For backward compatibility
        }
      };
    } catch (error) {
      console.error('Firebase login error:', error);
      return { success: false, message: 'Firebase authentication failed', error: error.message };
    }
  }
}
