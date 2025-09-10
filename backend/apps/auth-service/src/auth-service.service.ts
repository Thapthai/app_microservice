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
  ) {}

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
              twoFactorEnabled: true
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
            twoFactorEnabled: user.twoFactorEnabled 
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
          user: { id: user.id, email: user.email, name: user.name },
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
        message: 'OAuth login successful',
        data: {
          user: { id: user.id, email: user.email, name: user.name },
          accessToken,
          refreshToken,
          provider: oauth2LoginDto.provider
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
            twoFactorEnabled: user.twoFactorEnabled 
          },
          token,
        },
      };
    } catch (error) {
      return { success: false, message: 'Failed to complete 2FA login', error: error.message };
    }
  }
}
