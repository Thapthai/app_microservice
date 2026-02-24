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
import {
  CreateStaffUserDto,
  UpdateStaffUserDto,
  StaffUserResponseDto,
  RegenerateClientSecretDto
} from './dto/staff-user.dto';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { ClientCredentialStrategy } from './strategies/client-credential.strategy';
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
    private clientCredentialStrategy: ClientCredentialStrategy,
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
      
      // Check if this is a staff user token
      if (payload.type === 'staff') {
        const staffUser = await this.prisma.staffUser.findUnique({
          where: { id: payload.sub },
        });

        if (!staffUser || !staffUser.is_active) {
          return { success: false, message: 'Staff user not found or inactive' };
        }

        return {
          success: true,
          data: {
            sub: staffUser.id,
            email: staffUser.email,
            fname: staffUser.fname,
            lname: staffUser.lname,
            type: 'staff',
          },
        };
      }

      // Regular user token
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

  // ================================ Client Credential Methods ================================

  async createClientCredential(user_id: number, clientCredentialDto: ApiKeyCreateDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: user_id }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const { client_id, client_secret, client_secret_hash } = this.clientCredentialStrategy.generateClientCredential();

      const clientCredential = await this.prisma.clientCredential.create({
        data: {
          user_id,
          name: clientCredentialDto.name,
          description: clientCredentialDto.description,
          client_id,
          client_secret_hash,
          expires_at: clientCredentialDto.expires_at ? new Date(clientCredentialDto.expires_at) : null
        }
      });

      return {
        success: true,
        message: 'Client credential created successfully',
        data: {
          id: clientCredential.id,
          name: clientCredential.name,
          client_id, // Only return the actual client_id once during creation
          client_secret, // Only return the actual client_secret once during creation
          expires_at: clientCredential.expires_at
        }
      };
    } catch (error) {
      return { success: false, message: 'Failed to create client credential', error: error.message };
    }
  }

  async listClientCredentials(user_id: number) {
    try {
      const clientCredentials = await this.prisma.clientCredential.findMany({
        where: { user_id, is_active: true },
        select: {
          id: true,
          name: true,
          description: true,
          client_id: true,
          last_used_at: true,
          expires_at: true,
          created_at: true
        },
        orderBy: { created_at: 'desc' }
      });

      return {
        success: true,
        data: clientCredentials
      };
    } catch (error) {
      return { success: false, message: 'Failed to list client credentials', error: error.message };
    }
  }

  async revokeClientCredential(user_id: number, credentialId: number) {
    try {
      const credential = await this.prisma.clientCredential.findFirst({
        where: { id: credentialId, user_id }
      });

      if (!credential) {
        return { success: false, message: 'Client credential not found' };
      }

      await this.prisma.clientCredential.update({
        where: { id: credentialId },
        data: { is_active: false }
      });

      return {
        success: true,
        message: 'Client credential revoked successfully'
      };
    } catch (error) {
      return { success: false, message: 'Failed to revoke client credential', error: error.message };
    }
  }

  /** Update client credential (e.g. set expires_at to null = ไม่มีวันหมดอายุ) */
  async updateClientCredential(
    user_id: number,
    credentialId: number,
    dto: { expires_at?: string | null },
  ) {
    try {
      const credential = await this.prisma.clientCredential.findFirst({
        where: { id: credentialId, user_id, is_active: true },
      });

      if (!credential) {
        return { success: false, message: 'Client credential not found' };
      }

      const data: { expires_at?: Date | null } = {};
      if (dto.expires_at !== undefined) {
        data.expires_at = dto.expires_at === null ? null : new Date(dto.expires_at);
      }

      if (Object.keys(data).length === 0) {
        return { success: true, message: 'No changes', data: { id: credential.id, expires_at: credential.expires_at } };
      }

      const updated = await this.prisma.clientCredential.update({
        where: { id: credentialId },
        data,
        select: { id: true, name: true, client_id: true, expires_at: true },
      });

      return {
        success: true,
        message: data.expires_at === null ? 'Client credential set to never expire (ไม่มีวันหมดอายุ)' : 'Client credential updated',
        data: updated,
      };
    } catch (error) {
      return { success: false, message: 'Failed to update client credential', error: error.message };
    }
  }

  async validateClientCredential(client_id: string, client_secret: string) {
    try {
     
      
      // Try Admin User first
      const credential = await this.prisma.clientCredential.findUnique({
        where: { client_id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              is_active: true,
              preferred_auth_method: true
            }
          }
        }
      });
 

      if (credential && credential.is_active && credential.user.is_active) {
        // Check if expired
        if (this.clientCredentialStrategy.isExpired(credential.expires_at)) {
          return { success: false, message: 'Client credential expired' };
        }

        // Verify client_secret
        const isValid = await this.clientCredentialStrategy.verifyClientSecret(client_secret, credential.client_secret_hash);
        if (!isValid) {
          return { success: false, message: 'Invalid client secret' };
        }

        // Update last used timestamp
        await this.prisma.clientCredential.update({
          where: { id: credential.id },
          data: { last_used_at: new Date() }
        });
 
        return {
          success: true,
          data: {
            user: credential.user,
            userType: 'admin',
            credential: {
              id: credential.id,
              name: credential.name,
              client_id: credential.client_id
            }
          }
        };
      }

      return { success: false, message: 'Invalid client credential' };
    } catch (error) {
      return { success: false, message: 'Failed to validate client credential', error: error.message };
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

  // ==================== Staff User Management ====================

  /**
   * Create a new staff user with client credentials
   */
  async createStaffUser(data: CreateStaffUserDto) {
    try {
      // Check if email already exists in StaffUser
      const existingStaff = await this.prisma.staffUser.findUnique({
        where: { email: data.email },
      });

      if (existingStaff) {
        return { success: false, message: 'อีเมลนี้ถูกใช้งานแล้วในระบบ Staff User' };
      }

      // Check if email already exists in User table (for ClientCredential FK)
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        return { success: false, message: 'อีเมลนี้ถูกใช้งานแล้วในระบบ กรุณาใช้อีเมลอื่น' };
      }

      // Default password if not provided
      const password = data.password || 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate unique client_id and client_secret (without staff_ prefix)
      const clientId = crypto.randomBytes(16).toString('hex');
      const clientSecret = crypto.randomBytes(32).toString('hex');
      // Store client_secret as plain text (not hashed)

      // Create User record for staff (required for ClientCredential foreign key)
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          name: `${data.fname} ${data.lname}`.trim(),
          password: null, // Staff users don't use User password
          is_active: true,
        },
      });

      // Create ClientCredential record
      const clientCredential = await this.prisma.clientCredential.create({
        data: {
          user_id: user.id,
          name: `Staff: ${data.fname} ${data.lname}`,
          description: `Client credential for staff user: ${data.email}`,
          client_id: clientId,
          client_secret_hash: clientSecret, // Store plain text (not hashed)
          expires_at: data.expires_at ? new Date(data.expires_at) : null,
        },
      });

      // Get role_id from role_code or use provided role_id
      let roleId: number;
      if (data.role_id) {
        roleId = data.role_id;
      } else if (data.role_code) {
        // Find role by code
        const role = await this.prisma.staffRole.findUnique({
          where: { code: data.role_code },
        });
        if (!role) {
          return { success: false, message: `Role with code '${data.role_code}' not found` };
        }
        roleId = role.id;
      } else {
        return { success: false, message: 'Either role_code or role_id must be provided' };
      }

      // Create staff user
      const staffUser = await this.prisma.staffUser.create({
        data: {
          email: data.email,
          fname: data.fname,
          lname: data.lname,
          role_id: roleId,
          department_id: data.department_id ?? undefined,
          password: hashedPassword,
          client_id: clientId,
          client_secret: clientSecret, // Store plain text (not hashed)
          expires_at: data.expires_at ? new Date(data.expires_at) : null,
        },
        include: {
          role: true,
          department: true,
        },
      });

      return {
        success: true,
        message: 'Staff user created successfully',
        data: {
          id: staffUser.id,
          email: staffUser.email,
          fname: staffUser.fname,
          lname: staffUser.lname,
          role_id: staffUser.role_id,
          role: staffUser.role ? {
            id: staffUser.role.id,
            code: staffUser.role.code,
            name: staffUser.role.name,
          } : null,
          department_id: staffUser.department_id ?? null,
          department_name: staffUser.department ? (staffUser.department.DepName ?? staffUser.department.DepName2) : null,
          client_id: clientId,
          client_secret: clientSecret, // Return plain text secret
          expires_at: staffUser.expires_at,
          is_active: staffUser.is_active,
          created_at: staffUser.created_at,
          client_credential_id: clientCredential.id,
        },
        warning: 'Please save the client_secret securely. It will not be shown again.',
      };
    } catch (error) {
      console.error('Create staff user error:', error);
      
      // Handle Prisma unique constraint errors
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        if (Array.isArray(target) && target.includes('email')) {
          return { 
            success: false, 
            message: 'อีเมลนี้ถูกใช้งานแล้วในระบบ กรุณาใช้อีเมลอื่น',
            error: 'Email already exists'
          };
        }
        return { 
          success: false, 
          message: `ข้อมูลซ้ำกัน: ${target?.join(', ') || 'unknown field'}`,
          error: error.message 
        };
      }
      
      // Handle other Prisma errors
      if (error.code && error.code.startsWith('P')) {
        return { 
          success: false, 
          message: 'เกิดข้อผิดพลาดในการสร้าง Staff User กรุณาตรวจสอบข้อมูล',
          error: error.message 
        };
      }
      
      return { 
        success: false, 
        message: error.message || 'ไม่สามารถสร้าง Staff User ได้',
        error: error.message 
      };
    }
  }

  /**
   * Get all staff users
   */
  async getAllStaffUsers() {
    try {
      const staffUsers = await this.prisma.staffUser.findMany({
        include: {
          role: true,
          department: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      return {
        success: true,
        data: staffUsers.map((user) => ({
          id: user.id,
          email: user.email,
          fname: user.fname,
          lname: user.lname,
          role_id: user.role_id,
          role: user.role ? user.role.code : null, // Return role code for backward compatibility
          role_name: user.role ? user.role.name : null,
          department_id: user.department_id ?? null,
          department_name: user.department ? (user.department.DepName ?? user.department.DepName2) : null,
          client_id: user.client_id,
          expires_at: user.expires_at,
          is_active: user.is_active,
          created_at: user.created_at,
          updated_at: user.updated_at,
        })),
      };
    } catch (error) {
      console.error('Get all staff users error:', error);
      return { success: false, message: 'Failed to retrieve staff users', error: error.message };
    }
  }

  /**
   * Get staff user by ID
   */
  async getStaffUserById(id: number) {
    try {
      const staffUser = await this.prisma.staffUser.findUnique({
        where: { id },
        include: {
          role: true,
          department: true,
        },
      });

      if (!staffUser) {
        return { success: false, message: 'Staff user not found' };
      }

      return {
        success: true,
        data: {
          id: staffUser.id,
          email: staffUser.email,
          fname: staffUser.fname,
          lname: staffUser.lname,
          role_id: staffUser.role_id,
          role: staffUser.role ? staffUser.role.code : null, // Return role code for backward compatibility
          role_name: staffUser.role ? staffUser.role.name : null,
          department_id: staffUser.department_id ?? null,
          department_name: staffUser.department ? (staffUser.department.DepName ?? staffUser.department.DepName2) : null,
          client_id: staffUser.client_id,
          expires_at: staffUser.expires_at,
          is_active: staffUser.is_active,
          created_at: staffUser.created_at,
          updated_at: staffUser.updated_at,
        },
      };
    } catch (error) {
      console.error('Get staff user error:', error);
      return { success: false, message: 'Failed to retrieve staff user', error: error.message };
    }
  }

  /**
   * Update staff user
   */
  async updateStaffUser(id: number, data: UpdateStaffUserDto) {
    try {
      const staffUser = await this.prisma.staffUser.findUnique({
        where: { id },
      });

      if (!staffUser) {
        return { success: false, message: 'Staff user not found' };
      }

      // Check email uniqueness if updating email
      if (data.email && data.email !== staffUser.email) {
        const existingStaff = await this.prisma.staffUser.findUnique({
          where: { email: data.email },
        });

        if (existingStaff) {
          return { success: false, message: 'Email already in use by another staff user' };
        }
      }

      // Get role_id from role_code or use provided role_id
      let roleId: number | undefined;
      if (data.role_id) {
        roleId = data.role_id;
      } else if (data.role_code) {
        // Find role by code
        const role = await this.prisma.staffRole.findUnique({
          where: { code: data.role_code },
        });
        if (!role) {
          return { success: false, message: `Role with code '${data.role_code}' not found` };
        }
        roleId = role.id;
      }

      // Prepare update data
      const updateData: any = {
        ...(data.email && { email: data.email }),
        ...(data.fname && { fname: data.fname }),
        ...(data.lname && { lname: data.lname }),
        ...(roleId !== undefined && { role_id: roleId }),
        ...(data.department_id !== undefined && { department_id: data.department_id === null ? null : data.department_id }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
        ...(data.expires_at && { expires_at: new Date(data.expires_at) }),
      };

      // Hash password if updating
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }

      const updatedStaff = await this.prisma.staffUser.update({
        where: { id },
        data: updateData,
        include: {
          role: true,
          department: true,
        },
      });

      return {
        success: true,
        message: 'Staff user updated successfully',
        data: {
          id: updatedStaff.id,
          email: updatedStaff.email,
          fname: updatedStaff.fname,
          lname: updatedStaff.lname,
          role_id: updatedStaff.role_id,
          role: updatedStaff.role ? updatedStaff.role.code : null, // Return role code for backward compatibility
          role_name: updatedStaff.role ? updatedStaff.role.name : null,
          department_id: updatedStaff.department_id ?? null,
          department_name: updatedStaff.department ? (updatedStaff.department.DepName ?? updatedStaff.department.DepName2) : null,
          client_id: updatedStaff.client_id,
          expires_at: updatedStaff.expires_at,
          is_active: updatedStaff.is_active,
          created_at: updatedStaff.created_at,
          updated_at: updatedStaff.updated_at,
        },
      };
    } catch (error) {
      console.error('Update staff user error:', error);
      return { success: false, message: 'Failed to update staff user', error: error.message };
    }
  }

  /**
   * Delete staff user
   */
  async deleteStaffUser(id: number) {
    try {
      const staffUser = await this.prisma.staffUser.findUnique({
        where: { id },
      });

      if (!staffUser) {
        return { success: false, message: 'Staff user not found' };
      }

      await this.prisma.staffUser.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Staff user deleted successfully',
      };
    } catch (error) {
      console.error('Delete staff user error:', error);
      return { success: false, message: 'Failed to delete staff user', error: error.message };
    }
  }

  /**
   * Regenerate client secret for staff user
   */
  async regenerateClientSecret(id: number, data?: RegenerateClientSecretDto) {
    try {
      const staffUser = await this.prisma.staffUser.findUnique({
        where: { id },
      });

      if (!staffUser) {
        return { success: false, message: 'Staff user not found' };
      }

      // Generate new client secret
      const newClientSecret = crypto.randomBytes(32).toString('hex');
      const hashedClientSecret = await bcrypt.hash(newClientSecret, 10);

      const updateData: any = {
        client_secret: hashedClientSecret,
      };

      if (data?.expires_at) {
        updateData.expires_at = new Date(data.expires_at);
      }

      await this.prisma.staffUser.update({
        where: { id },
        data: updateData,
      });

      return {
        success: true,
        message: 'Client secret regenerated successfully',
        data: {
          client_id: staffUser.client_id,
          client_secret: newClientSecret, // Return unhashed secret only once
        },
        warning: 'Please save the new client_secret securely. It will not be shown again.',
      };
    } catch (error) {
      console.error('Regenerate client secret error:', error);
      return { success: false, message: 'Failed to regenerate client secret', error: error.message };
    }
  }

  /**
   * Get staff user profile by ID (for self profile)
   */
  async getStaffUserProfile(id: number) {
    try {
      const staffUser = await this.prisma.staffUser.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          fname: true,
          lname: true,
          role: true,
          client_id: true,
          expires_at: true,
          is_active: true,
          created_at: true,
          updated_at: true,
        },
      });

      if (!staffUser) {
        return { success: false, message: 'Staff user not found' };
      }

      return {
        success: true,
        data: staffUser,
      };
    } catch (error) {
      console.error('Get staff user profile error:', error);
      return { success: false, message: 'Failed to retrieve staff user profile', error: error.message };
    }
  }

  /**
   * Update staff user profile (for self update)
   */
  async updateStaffUserProfile(id: number, data: { fname?: string; lname?: string; email?: string; currentPassword?: string; newPassword?: string }) {
    try {
      const staffUser = await this.prisma.staffUser.findUnique({
        where: { id },
      });

      if (!staffUser) {
        return { success: false, message: 'Staff user not found' };
      }

      // Validate current password if changing password
      if (data.newPassword) {
        if (!data.currentPassword) {
          return { success: false, message: 'Current password is required to change password' };
        }
        const isValidPassword = await bcrypt.compare(data.currentPassword, staffUser.password);
        if (!isValidPassword) {
          return { success: false, message: 'Current password is incorrect' };
        }
      }

      // Check email uniqueness if updating email
      if (data.email && data.email !== staffUser.email) {
        const existingStaff = await this.prisma.staffUser.findUnique({
          where: { email: data.email },
        });

        if (existingStaff) {
          return { success: false, message: 'Email already in use by another staff user' };
        }
      }

      // Prepare update data
      const updateData: any = {
        ...(data.email && { email: data.email }),
        ...(data.fname && { fname: data.fname }),
        ...(data.lname && { lname: data.lname }),
      };

      // Hash new password if provided
      if (data.newPassword) {
        updateData.password = await bcrypt.hash(data.newPassword, 10);
      }

      const updatedStaff = await this.prisma.staffUser.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          fname: true,
          lname: true,
          role: true,
          client_id: true,
          expires_at: true,
          is_active: true,
          created_at: true,
          updated_at: true,
        },
      });

      return {
        success: true,
        message: 'Profile updated successfully',
        data: updatedStaff,
      };
    } catch (error) {
      console.error('Update staff user profile error:', error);
      return { success: false, message: 'Failed to update profile', error: error.message };
    }
  }

  /**
   * Staff user login with email and password
   */
  async staffUserLogin(email: string, password: string) {
    try {
      const staffUser = await this.prisma.staffUser.findUnique({
        where: { email },
        include: {
          role: true,
          department: true,
        },
      });

      if (!staffUser || !staffUser.is_active) {
        return { success: false, message: 'Invalid credentials or inactive account' };
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, staffUser.password);
      if (!isValidPassword) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Generate JWT token
      const payload = {
        sub: staffUser.id,
        email: staffUser.email,
        fname: staffUser.fname,
        lname: staffUser.lname,
        type: 'staff',
      };

      const accessToken = this.jwtService.sign(payload);

      const departmentName = staffUser.department
        ? (staffUser.department.DepName ?? staffUser.department.DepName2)
        : null;

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: staffUser.id,
            email: staffUser.email,
            fname: staffUser.fname,
            lname: staffUser.lname,
            role: staffUser.role ? staffUser.role.code : null, // Return role code for backward compatibility
            role_id: staffUser.role_id,
            department_id: staffUser.department_id ?? null,
            department_name: departmentName,
            client_id: staffUser.client_id,
            is_active: staffUser.is_active,
          },
          access_token: accessToken,
          token_type: 'Bearer',
        },
      };
    } catch (error) {
      console.error('Staff user login error:', error);
      return { success: false, message: 'Login failed', error: error.message };
    }
  }

  /**
   * Get all role permissions
   */
  async getAllRolePermissions() {
    try {
      const permissions = await this.prisma.staffRolePermission.findMany({
        include: {
          role: true,
        },
        orderBy: [
          { role: { code: 'asc' } },
          { menu_href: 'asc' },
        ],
      });

      return {
        success: true,
        data: permissions,
      };
    } catch (error) {
      console.error('Get all role permissions error:', error);
      return { success: false, message: 'Failed to get role permissions', error: error.message };
    }
  }

  /**
   * Get permissions by role (accepts role code)
   */
  async getRolePermissionsByRole(role: string) {
    try {
      // Find role by code
      const roleRecord = await this.prisma.staffRole.findUnique({
        where: { code: role },
      });

      if (!roleRecord) {
        return { success: false, message: `Role with code '${role}' not found` };
      }

      const permissions = await this.prisma.staffRolePermission.findMany({
        where: { role_id: roleRecord.id },
        include: {
          role: true,
        },
        orderBy: { menu_href: 'asc' },
      });

      return {
        success: true,
        data: permissions,
      };
    } catch (error) {
      console.error('Get role permissions error:', error);
      return { success: false, message: 'Failed to get role permissions', error: error.message };
    }
  }

  /**
   * Create or update role permission
   */
  async upsertRolePermission(data: { role_code?: string; role_id?: number; menu_href: string; can_access: boolean }) {
    try {
      // Get role_id from role_code or use provided role_id
      let roleId: number;
      if (data.role_id) {
        roleId = data.role_id;
      } else if (data.role_code) {
        const role = await this.prisma.staffRole.findUnique({
          where: { code: data.role_code },
        });
        if (!role) {
          return { success: false, message: `Role with code '${data.role_code}' not found` };
        }
        roleId = role.id;
      } else {
        return { success: false, message: 'Either role_code or role_id must be provided' };
      }

      const permission = await this.prisma.staffRolePermission.upsert({
        where: {
          role_menu_href: {
            role_id: roleId,
            menu_href: data.menu_href,
          },
        },
        update: {
          can_access: data.can_access,
        },
        create: {
          role_id: roleId,
          menu_href: data.menu_href,
          can_access: data.can_access,
        },
        include: {
          role: true,
        },
      });

      return {
        success: true,
        message: 'Role permission saved successfully',
        data: permission,
      };
    } catch (error) {
      console.error('Upsert role permission error:', error);
      return { success: false, message: 'Failed to save role permission', error: error.message };
    }
  }

  /**
   * Bulk update role permissions
   */
  async bulkUpdateRolePermissions(permissions: Array<{ role_code?: string; role_id?: number; menu_href: string; can_access: boolean }>) {
    try {
      // Get all unique role codes and fetch role_ids
      const roleCodeToIdMap = new Map<string, number>();
      
      for (const perm of permissions) {
        if (perm.role_code && !roleCodeToIdMap.has(perm.role_code)) {
          const role = await this.prisma.staffRole.findUnique({
            where: { code: perm.role_code },
          });
          if (role) {
            roleCodeToIdMap.set(perm.role_code, role.id);
          }
        }
      }

      const results = await Promise.all(
        permissions.map(async (perm) => {
          let roleId: number;
          if (perm.role_id) {
            roleId = perm.role_id;
          } else if (perm.role_code) {
            const mappedRoleId = roleCodeToIdMap.get(perm.role_code);
            if (!mappedRoleId) {
              throw new Error(`Role with code '${perm.role_code}' not found`);
            }
            roleId = mappedRoleId;
          } else {
            throw new Error('Either role_code or role_id must be provided');
          }

          return this.prisma.staffRolePermission.upsert({
            where: {
              role_menu_href: {
                role_id: roleId,
                menu_href: perm.menu_href,
              },
            },
            update: {
              can_access: perm.can_access,
            },
            create: {
              role_id: roleId,
              menu_href: perm.menu_href,
              can_access: perm.can_access,
            },
            include: {
              role: true,
            },
          });
        })
      );

      return {
        success: true,
        message: 'Role permissions updated successfully',
        data: results,
      };
    } catch (error) {
      console.error('Bulk update role permissions error:', error);
      return { success: false, message: 'Failed to update role permissions', error: error.message };
    }
  }

  /**
   * Delete role permission
   */
  async deleteRolePermission(id: number) {
    try {
      await this.prisma.staffRolePermission.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Role permission deleted successfully',
      };
    } catch (error) {
      console.error('Delete role permission error:', error);
      return { success: false, message: 'Failed to delete role permission', error: error.message };
    }
  }

  // ==================== Staff Roles Management ====================

  /**
   * Get all staff roles
   */
  async getAllStaffRoles() {
    try {
      const roles = await this.prisma.staffRole.findMany({
        where: {
          is_active: true,
        },
        orderBy: {
          code: 'asc',
        },
      });

      return {
        success: true,
        data: roles,
      };
    } catch (error) {
      console.error('Get all staff roles error:', error);
      
      // Check if it's a database connection error
      if (error.code === 'P1001') {
        return { 
          success: false, 
          message: 'ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่อ', 
          error: 'Database connection error' 
        };
      }
      
      return { 
        success: false, 
        message: error.message || 'ไม่สามารถโหลดข้อมูลบทบาทได้', 
        error: error.message 
      };
    }
  }

  /**
   * Get staff role by ID
   */
  async getStaffRoleById(id: number) {
    try {
      const role = await this.prisma.staffRole.findUnique({
        where: { id },
      });

      if (!role) {
        return { success: false, message: 'Staff role not found' };
      }

      return {
        success: true,
        data: role,
      };
    } catch (error) {
      console.error('Get staff role by ID error:', error);
      return { success: false, message: 'Failed to get staff role', error: error.message };
    }
  }

  /**
   * Create staff role
   */
  async createStaffRole(data: { code: string; name: string; description?: string; is_active?: boolean }) {
    try {
      // Check if code already exists
      const existingRole = await this.prisma.staffRole.findUnique({
        where: { code: data.code },
      });

      if (existingRole) {
        return { success: false, message: 'Role with this code already exists' };
      }

      const role = await this.prisma.staffRole.create({
        data: {
          code: data.code,
          name: data.name,
          description: data.description,
          is_active: data.is_active !== undefined ? data.is_active : true,
        },
      });

      return {
        success: true,
        message: 'Staff role created successfully',
        data: role,
      };
    } catch (error) {
      console.error('Create staff role error:', error);
      return { success: false, message: 'Failed to create staff role', error: error.message };
    }
  }

  /**
   * Update staff role
   */
  async updateStaffRole(id: number, data: { name?: string; description?: string; is_active?: boolean }) {
    try {
      const role = await this.prisma.staffRole.findUnique({
        where: { id },
      });

      if (!role) {
        return { success: false, message: 'Staff role not found' };
      }

      const updatedRole = await this.prisma.staffRole.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.is_active !== undefined && { is_active: data.is_active }),
        },
      });

      return {
        success: true,
        message: 'Staff role updated successfully',
        data: updatedRole,
      };
    } catch (error) {
      console.error('Update staff role error:', error);
      return { success: false, message: 'Failed to update staff role', error: error.message };
    }
  }

  /**
   * Delete staff role
   */
  async deleteStaffRole(id: number) {
    try {
      // Check if role is being used by any staff users
      const staffUsersCount = await this.prisma.staffUser.count({
        where: { role_id: id },
      });

      if (staffUsersCount > 0) {
        return { success: false, message: `Cannot delete role. It is being used by ${staffUsersCount} staff user(s)` };
      }

      await this.prisma.staffRole.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Staff role deleted successfully',
      };
    } catch (error) {
      console.error('Delete staff role error:', error);
      return { success: false, message: 'Failed to delete staff role', error: error.message };
    }
  }
}
