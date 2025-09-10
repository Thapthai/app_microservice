import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
import * as crypto from 'crypto';

@Injectable()
export class AuthServiceService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private oauth2Strategy: OAuth2Strategy,
    private apiKeyStrategy: ApiKeyStrategy,
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

      // Verify password (check if user has password for non-OAuth users)
      if (!user.password) {
        return { success: false, message: 'Please use OAuth login for this account' };
      }
      
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Generate JWT token
      const payload = { sub: user.id, email: user.email, name: user.name };
      const token = this.jwtService.sign(payload);

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: { id: user.id, email: user.email, name: user.name },
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
}
