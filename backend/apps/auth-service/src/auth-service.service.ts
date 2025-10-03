import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from './prisma.service';
import {
  LoginDto,
  RegisterDto,
  OAuth2LoginDto,
  ApiKeyCreateDto,
  RefreshTokenDto,
  AuthMethod,
  OAuth2Provider
} from './dto/auth.dto';
import { OAuth2Strategy, OAuth2UserInfo } from './strategies/oauth2.strategy';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { TOTPService } from './services/totp.service';
import { EmailOTPService } from './services/email-otp.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthServiceService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private oauth2Strategy: OAuth2Strategy,
    private apiKeyStrategy: ApiKeyStrategy,
    private totpService: TOTPService,
    private emailOTPService: EmailOTPService,
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
      if (!user.isActive) {
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
      if (user.twoFactorEnabled) {
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
              twoFactorEnabled: true,
              preferredAuthMethod: user.preferredAuthMethod,
              hasPassword: !!user.password
            }
          }
        };
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
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
            twoFactorEnabled: user.twoFactorEnabled,
            preferredAuthMethod: user.preferredAuthMethod,
            hasPassword: !!user.password
          },
          token,
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
            twoFactorEnabled: user.twoFactorEnabled,
            preferredAuthMethod: user.preferredAuthMethod,
            hasPassword: !!user.password
          },
        },
      };
    } catch (error) {
      return { success: false, message: 'Invalid token', error: error.message };
    }
  }

  // ================================ OAuth 2.0 Methods ================================

  async getOAuth2AuthUrl(provider: OAuth2Provider, state?: string) {
    try {
      const authUrl = this.oauth2Strategy.getAuthUrl(provider, state);
      return {
        success: true,
        data: { authUrl, provider, state }
      };
    } catch (error) {
      return { success: false, message: 'Failed to generate OAuth URL', error: error.message };
    }
  }

  async oauth2Login(oauth2LoginDto: OAuth2LoginDto) {
    try {
      // Exchange code for access token
      const tokenData = await this.oauth2Strategy.exchangeCodeForToken(
        oauth2LoginDto.provider,
        oauth2LoginDto.code
      );

      if (!tokenData.access_token) {
        return { success: false, message: 'Failed to get access token' };
      }

      // Get user info from provider
      const userInfo = await this.oauth2Strategy.getUserInfo(
        oauth2LoginDto.provider,
        tokenData.access_token
      );

      // Find or create user
      let user = await this.prisma.user.findUnique({
        where: { email: userInfo.email }
      });

      if (!user) {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            email: userInfo.email,
            name: userInfo.name,
            preferredAuthMethod: AuthMethod.OAUTH2,
            emailVerified: true
          }
        });
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Create or update OAuth account
      await this.prisma.oAuthAccount.upsert({
        where: {
          provider_providerId: {
            provider: oauth2LoginDto.provider,
            providerId: userInfo.id
          }
        },
        update: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: tokenData.expires_in ?
            new Date(Date.now() + tokenData.expires_in * 1000) : null,
          tokenType: tokenData.token_type
        },
        create: {
          userId: user.id,
          provider: oauth2LoginDto.provider,
          providerId: userInfo.id,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: tokenData.expires_in ?
            new Date(Date.now() + tokenData.expires_in * 1000) : null,
          tokenType: tokenData.token_type
        }
      });

      // Generate JWT tokens
      const { accessToken, refreshToken } = await this.generateTokens(user);

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            twoFactorEnabled: user.twoFactorEnabled || false,
            preferredAuthMethod: user.preferredAuthMethod,
            hasPassword: !!user.password
          },
          token: accessToken
        }
      };
    } catch (error) {
      return { success: false, message: 'OAuth login failed', error: error.message };
    }
  }

  // ================================ API Key Methods ================================

  async createApiKey(userId: number, apiKeyDto: ApiKeyCreateDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const { key, hash, prefix } = this.apiKeyStrategy.generateApiKey();

      const apiKey = await this.prisma.apiKey.create({
        data: {
          userId,
          name: apiKeyDto.name,
          description: apiKeyDto.description,
          keyHash: hash,
          prefix,
          expiresAt: apiKeyDto.expiresAt ? new Date(apiKeyDto.expiresAt) : null
        }
      });

      // Send API key created email (async, don't wait for it)
      this.sendApiKeyCreatedEmail(user.email, user.name, {
        name: apiKey.name,
        prefix,
        expiresAt: apiKey.expiresAt
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
          expiresAt: apiKey.expiresAt
        }
      };
    } catch (error) {
      return { success: false, message: 'Failed to create API key', error: error.message };
    }
  }

  async listApiKeys(userId: number) {
    try {
      const apiKeys = await this.prisma.apiKey.findMany({
        where: { userId, isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          prefix: true,
          lastUsedAt: true,
          expiresAt: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        data: apiKeys
      };
    } catch (error) {
      return { success: false, message: 'Failed to list API keys', error: error.message };
    }
  }

  async revokeApiKey(userId: number, apiKeyId: number) {
    try {
      const apiKey = await this.prisma.apiKey.findFirst({
        where: { id: apiKeyId, userId }
      });

      if (!apiKey) {
        return { success: false, message: 'API key not found' };
      }

      await this.prisma.apiKey.update({
        where: { id: apiKeyId },
        data: { isActive: false }
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

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    try {
      const refreshTokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshTokenDto.refreshToken },
        include: { user: true }
      });

      if (!refreshTokenRecord || refreshTokenRecord.isRevoked) {
        return { success: false, message: 'Invalid refresh token' };
      }

      if (new Date() > refreshTokenRecord.expiresAt) {
        return { success: false, message: 'Refresh token expired' };
      }

      // Revoke old refresh token
      await this.prisma.refreshToken.update({
        where: { id: refreshTokenRecord.id },
        data: { isRevoked: true }
      });

      // Generate new tokens
      const { accessToken, refreshToken } = await this.generateTokens(refreshTokenRecord.user);

      return {
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          accessToken,
          refreshToken,
          user: {
            id: refreshTokenRecord.user.id,
            email: refreshTokenRecord.user.email,
            name: refreshTokenRecord.user.name
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
    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt
      }
    });

    return { accessToken, refreshToken };
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

  async setupTOTP(userId: number, password: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Verify current password
      if (user.password && !(await bcrypt.compare(password, user.password))) {
        return { success: false, message: 'Invalid password' };
      }

      // Check if 2FA is already enabled
      if (user.twoFactorEnabled) {
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
          backupCodes: totpSetup.backupCodes
        }
      };
    } catch (error) {
      return { success: false, message: 'Failed to setup TOTP', error: error.message };
    }
  }

  async verifyAndEnable2FA(userId: number, secret: string, token: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Verify TOTP token
      if (!this.totpService.verifyTOTP(token, secret)) {
        return { success: false, message: 'Invalid TOTP code' };
      }

      // Generate and hash backup codes
      const backupCodes = this.totpService.generateBackupCodes();
      const hashedBackupCodes = this.totpService.hashBackupCodes(backupCodes);

      // Enable 2FA
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: secret,
          backupCodes: JSON.stringify(hashedBackupCodes),
          twoFactorVerifiedAt: new Date()
        }
      });

      return {
        success: true,
        message: '2FA enabled successfully',
        data: {
          backupCodes // Show backup codes once
        }
      };
    } catch (error) {
      return { success: false, message: 'Failed to enable 2FA', error: error.message };
    }
  }

  async enable2FA(enable2FADto: { userId: number; password: string }) {
    try {
      const { userId, password } = enable2FADto;

      if (!userId) {
        return { success: false, message: 'User ID is required' };
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      if (user.twoFactorEnabled) {
        return { success: false, message: '2FA is already enabled' };
      }

      // Verify current password
      if (user.password && !(await bcrypt.compare(password, user.password))) {
        return { success: false, message: 'Invalid password' };
      }

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

  async verify2FASetup(verify2FASetupDto: { userId: number; secret: string; token: string }) {
    try {
      const { userId, secret, token } = verify2FASetupDto;

      const user = await this.prisma.user.findUnique({
        where: { id: userId }
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
      const backupCodes = this.totpService.generateBackupCodes();
      const hashedBackupCodes = this.totpService.hashBackupCodes(backupCodes);

      // Enable 2FA for the user
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: secret,
          backupCodes: JSON.stringify(hashedBackupCodes)
        }
      });

      return {
        success: true,
        message: '2FA enabled successfully',
        data: {
          backupCodes
        }
      };
    } catch (error) {
      return { success: false, message: 'Failed to verify 2FA setup', error: error.message };
    }
  }

  async disable2FA(userId: number, password: string, token?: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      if (!user.twoFactorEnabled) {
        return { success: false, message: '2FA is not enabled' };
      }

      // Verify current password
      if (user.password && !(await bcrypt.compare(password, user.password))) {
        return { success: false, message: 'Invalid password' };
      }

      // If token provided, verify it
      if (token) {
        const isValidTOTP = user.twoFactorSecret &&
          this.totpService.verifyTOTP(token, user.twoFactorSecret);
        const isValidBackup = user.backupCodes &&
          this.totpService.verifyBackupCode(token, user.backupCodes);

        if (!isValidTOTP && !isValidBackup) {
          return { success: false, message: 'Invalid 2FA code' };
        }
      }

      // Disable 2FA
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          backupCodes: null,
          twoFactorVerifiedAt: null
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

  async verify2FA(userId: number, token: string, type: string = 'totp') {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user || !user.twoFactorEnabled) {
        return { success: false, message: '2FA not enabled for this user' };
      }

      let isValid = false;

      switch (type) {
        case 'totp':
          if (user.twoFactorSecret) {
            isValid = this.totpService.verifyTOTP(token, user.twoFactorSecret);
          }
          break;

        case 'email_otp':
          const emailResult = await this.emailOTPService.verifyEmailOTP(userId, token);
          isValid = emailResult.success;
          break;

        case 'backup_code':
          if (user.backupCodes) {
            isValid = this.totpService.verifyBackupCode(token, user.backupCodes);

            // Remove used backup code
            if (isValid) {
              const updatedCodes = this.totpService.removeUsedBackupCode(token, user.backupCodes);
              await this.prisma.user.update({
                where: { id: userId },
                data: { backupCodes: updatedCodes }
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

  async sendEmailOTP(userId: number, purpose: string = 'login') {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Check rate limiting
      const canRequest = await this.emailOTPService.canRequestNewOTP(userId);
      if (!canRequest.canRequest) {
        return {
          success: false,
          message: `Please wait ${canRequest.waitTime} seconds before requesting a new OTP`
        };
      }

      // Send OTP
      const result = await this.emailOTPService.sendEmailOTP(userId, user.email, purpose);
      return result;
    } catch (error) {
      return { success: false, message: 'Failed to send email OTP', error: error.message };
    }
  }

  async regenerateBackupCodes(userId: number, password: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      if (!user.twoFactorEnabled) {
        return { success: false, message: '2FA is not enabled' };
      }

      // Verify current password
      if (user.password && !(await bcrypt.compare(password, user.password))) {
        return { success: false, message: 'Invalid password' };
      }

      // Generate new backup codes
      const backupCodes = this.totpService.generateBackupCodes();
      const hashedBackupCodes = this.totpService.hashBackupCodes(backupCodes);

      await this.prisma.user.update({
        where: { id: userId },
        data: { backupCodes: JSON.stringify(hashedBackupCodes) }
      });

      return {
        success: true,
        message: 'Backup codes regenerated successfully',
        data: { backupCodes }
      };
    } catch (error) {
      return { success: false, message: 'Failed to regenerate backup codes', error: error.message };
    }
  }

  async get2FAStatus(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          twoFactorEnabled: true,
          twoFactorVerifiedAt: true,
          backupCodes: true
        }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      return {
        success: true,
        data: {
          enabled: user.twoFactorEnabled,
          verifiedAt: user.twoFactorVerifiedAt,
          backupCodesCount: user.backupCodes ? JSON.parse(user.backupCodes).length : 0
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

      const userId = payload.sub;

      // Verify 2FA code
      const verify2FAResult = await this.verify2FA(userId, code, type);
      if (!verify2FAResult.success) {
        return verify2FAResult;
      }

      // Get user info
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() }
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
            twoFactorEnabled: user.twoFactorEnabled,
            preferredAuthMethod: user.preferredAuthMethod,
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

  async changePassword(userId: number, currentPassword: string, newPassword: string, confirmPassword: string) {

    console.log("userId", userId);
    console.log("currentPassword", currentPassword);
    console.log("newPassword", newPassword);
    console.log("confirmPassword", confirmPassword);


    try {
      // Validate that new password and confirm password match
      if (newPassword !== confirmPassword) {
        return { success: false, message: 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน' };
      }

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
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
        where: { id: userId },
        data: {
          password: hashedNewPassword,
          updatedAt: new Date()
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

  async updateUserProfile(userId: number, updateData: { name?: string; email?: string; preferredAuthMethod?: string }, currentPassword: string) {
    try {
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return { success: false, message: 'ไม่พบผู้ใช้งาน' };
      }

      // Verify current password for security
      if (user.password) {
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
          return { success: false, message: 'รหัสผ่านไม่ถูกต้อง' };
        }
      }

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
        updatedAt: new Date(),
      };

      if (updateData.name) {
        dataToUpdate.name = updateData.name;
      }

      if (updateData.email) {
        dataToUpdate.email = updateData.email;
        // If email is changed, mark as unverified
        dataToUpdate.emailVerified = false;
      }

      if (updateData.preferredAuthMethod) {
        dataToUpdate.preferredAuthMethod = updateData.preferredAuthMethod;
      }

      // Update user
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
      });

      return {
        success: true,
        message: 'อัพเดตข้อมูลผู้ใช้งานเรียบร้อยแล้ว',
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          preferredAuthMethod: updatedUser.preferredAuthMethod,
          emailVerified: updatedUser.emailVerified,
          twoFactorEnabled: updatedUser.twoFactorEnabled,
        },
      };
    } catch (error) {
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัพเดตข้อมูล', error: error.message };
    }
  }

  async getUserProfile(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          emailVerified: true,
          preferredAuthMethod: true,
          twoFactorEnabled: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
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
}
