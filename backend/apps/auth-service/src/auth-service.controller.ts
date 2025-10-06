import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthServiceService } from './auth-service.service';
import {
  LoginDto,
  RegisterDto,
  OAuth2LoginDto,
  ApiKeyCreateDto,
  RefreshTokenDto,
  OAuth2Provider,
  Enable2FADto,
  Verify2FASetupDto,
  Disable2FADto,
  Verify2FADto,
  Generate2FABackupCodesDto,
  SendEmailOTPDto,
  LoginWith2FADto,
  TwoFactorType,
  ChangePasswordDto,
  UpdateUserProfileDto,
  ResetPasswordDto,
  ConfirmResetPasswordDto
} from './dto/auth.dto';

@Controller()
export class AuthServiceController {
  constructor(private readonly authServiceService: AuthServiceService) { }

  @MessagePattern('auth.register')
  async register(@Payload() registerDto: RegisterDto) {
    return this.authServiceService.register(registerDto);
  }

  @MessagePattern('auth.login')
  async login(@Payload() loginDto: LoginDto) {
    return this.authServiceService.login(loginDto);
  }

  @MessagePattern('auth.validate')
  async validateToken(@Payload() token: string) {
    return this.authServiceService.validateToken(token);
  }

  // ================================ OAuth 2.0 Endpoints ================================

  @MessagePattern('auth.oauth2.getAuthUrl')
  async getOAuth2AuthUrl(@Payload() data: { provider: OAuth2Provider; state?: string }) {
    return this.authServiceService.getOAuth2AuthUrl(data.provider, data.state);
  }

  @MessagePattern('auth.oauth2.login')
  async oauth2Login(@Payload() oauth2LoginDto: OAuth2LoginDto) {
    return this.authServiceService.oauth2Login(oauth2LoginDto);
  }

  // ================================ 2FA Endpoints ================================

  @MessagePattern('auth.2fa.enable')
  async enable2FA(@Payload() data: { user_id: number; password: string }) {
    return this.authServiceService.enable2FA(data);
  }

  @MessagePattern('auth.2fa.verify-setup')
  async verify2FASetup(@Payload() data: { user_id: number; secret: string; token: string }) {
    return this.authServiceService.verify2FASetup(data);
  }

  @MessagePattern('auth.2fa.disable')
  async disable2FA(@Payload() data: { user_id: number; password: string; token?: string }) {
    return this.authServiceService.disable2FA(data.user_id, data.password, data.token);
  }

  // ================================ API Key Endpoints ================================

  @MessagePattern('auth.apikey.create')
  async createApiKey(@Payload() data: { user_id: number; apiKeyDto: ApiKeyCreateDto }) {
    return this.authServiceService.createApiKey(data.user_id, data.apiKeyDto);
  }

  @MessagePattern('auth.apikey.list')
  async listApiKeys(@Payload() user_id: number) {
    return this.authServiceService.listApiKeys(user_id);
  }

  @MessagePattern('auth.apikey.revoke')
  async revokeApiKey(@Payload() data: { user_id: number; apiKeyId: number }) {
    return this.authServiceService.revokeApiKey(data.user_id, data.apiKeyId);
  }

  // ================================ Token Management ================================

  @MessagePattern('auth.token.refresh')
  async refresh_tokens(@Payload() refreshTokenDto: RefreshTokenDto) {
    return this.authServiceService.refresh_tokens(refreshTokenDto);
  }

  // ================================ 2FA Endpoints ================================

  @MessagePattern('auth.2fa.setup')
  async setup2FA(@Payload() data: { user_id: number; enable2FADto: Enable2FADto }) {
    return this.authServiceService.setupTOTP(data.user_id, data.enable2FADto.password);
  }

  @MessagePattern('auth.2fa.verify-setup')
  async verifyAndEnable2FA(@Payload() data: { user_id: number; verifyDto: Verify2FASetupDto }) {
    return this.authServiceService.verifyAndEnable2FA(
      data.user_id,
      data.verifyDto.secret,
      data.verifyDto.token
    );
  }

  @MessagePattern('auth.2fa.verify')
  async verify2FA(@Payload() data: { user_id: number; verifyDto: Verify2FADto }) {
    return this.authServiceService.verify2FA(
      data.user_id,
      data.verifyDto.token,
      data.verifyDto.type || 'totp'
    );
  }

  @MessagePattern('auth.2fa.send-email-otp')
  async sendEmailOTP(@Payload() data: { user_id: number; purpose?: string }) {
    return this.authServiceService.sendEmailOTP(data.user_id, data.purpose);
  }

  @MessagePattern('auth.2fa.regenerate-backup-codes')
  async regenerateBackupCodes(@Payload() data: { user_id: number; generateDto: Generate2FABackupCodesDto }) {
    return this.authServiceService.regenerateBackupCodes(data.user_id, data.generateDto.password);
  }

  @MessagePattern('auth.2fa.status')
  async get2FAStatus(@Payload() user_id: number) {
    return this.authServiceService.get2FAStatus(user_id);
  }

  @MessagePattern('auth.login.2fa')
  async loginWith2FA(@Payload() loginWith2FADto: LoginWith2FADto) {
    return this.authServiceService.loginWith2FA(
      loginWith2FADto.tempToken,
      loginWith2FADto.code,
      loginWith2FADto.type
    );
  }

  // ================================ User Management Endpoints ================================

  @MessagePattern('auth.user.profile')
  async getUserProfile(@Payload() user_id: number) {
    return this.authServiceService.getUserProfile(user_id);
  }

  @MessagePattern('auth.user.update-profile')
  async updateUserProfile(@Payload() data: { user_id: number; updateUserProfileDto: UpdateUserProfileDto }) {
    return this.authServiceService.updateUserProfile(
      data.user_id,
      {
        name: data.updateUserProfileDto.name,
        email: data.updateUserProfileDto.email,
        preferred_auth_method: data.updateUserProfileDto.preferred_auth_method,
      },
      data.updateUserProfileDto.currentPassword
    );
  }

  @MessagePattern('auth.user.change-password')
  async changePassword(@Payload() data: { user_id: number; changePasswordDto: ChangePasswordDto }) {
 
    return this.authServiceService.changePassword(
      data.user_id,
      data.changePasswordDto.currentPassword,
      data.changePasswordDto.newPassword,
      data.changePasswordDto.confirmPassword
    );
  }

  @MessagePattern('auth.password.reset-request')
  async requestPasswordReset(@Payload() resetPasswordDto: ResetPasswordDto) {
    return this.authServiceService.requestPasswordReset(resetPasswordDto.email);
  }

  // Note: Confirm reset password would need additional implementation
  // for token storage and validation in the database schema
  @MessagePattern('auth.password.reset-confirm')
  async confirmPasswordReset(@Payload() confirmResetPasswordDto: ConfirmResetPasswordDto) {
    // This would need additional implementation for token validation
    return { success: false, message: 'Password reset confirmation not yet implemented' };
  }
}
