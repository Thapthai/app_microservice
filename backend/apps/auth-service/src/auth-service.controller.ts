import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthServiceService } from './auth-service.service';
import {
  LoginDto,
  RegisterDto,
  FirebaseLoginDto,
  ApiKeyCreateDto,
  UpdateClientCredentialDto,
  RefreshTokenDto,
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
import {
  CreateStaffUserDto,
  UpdateStaffUserDto,
  RegenerateClientSecretDto
} from './dto/staff-user.dto';

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

  // ================================ Firebase Authentication ================================

  @MessagePattern('auth.firebase.login')
  async firebaseLogin(@Payload() firebaseLoginDto: FirebaseLoginDto) {
    return this.authServiceService.firebaseLogin(firebaseLoginDto);
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

  // ================================ Client Credential Endpoints ================================

  @MessagePattern('auth.client-credential.create')
  async createClientCredential(@Payload() data: { user_id: number; clientCredentialDto: ApiKeyCreateDto }) {
    return this.authServiceService.createClientCredential(data.user_id, data.clientCredentialDto);
  }

  @MessagePattern('auth.client-credential.list')
  async listClientCredentials(@Payload() user_id: number) {
    return this.authServiceService.listClientCredentials(user_id);
  }

  @MessagePattern('auth.client-credential.revoke')
  async revokeClientCredential(@Payload() data: { user_id: number; credentialId: number }) {
    return this.authServiceService.revokeClientCredential(data.user_id, data.credentialId);
  }

  @MessagePattern('auth.client-credential.update')
  async updateClientCredential(@Payload() data: { user_id: number; credentialId: number; dto: UpdateClientCredentialDto }) {
    return this.authServiceService.updateClientCredential(data.user_id, data.credentialId, data.dto);
  }

  @MessagePattern('auth.client-credential.validate')
  async validateClientCredential(@Payload() data: { client_id: string; client_secret: string }) {
    return this.authServiceService.validateClientCredential(data.client_id, data.client_secret);
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

  // ================================ Staff User Management ================================

  @MessagePattern('auth.staff.create')
  async createStaffUser(@Payload() createStaffUserDto: CreateStaffUserDto) {
    return this.authServiceService.createStaffUser(createStaffUserDto);
  }

  @MessagePattern('auth.staff.getAll')
  async getAllStaffUsers() {
    return this.authServiceService.getAllStaffUsers();
  }

  @MessagePattern('auth.staff.getById')
  async getStaffUserById(@Payload() id: number) {
    return this.authServiceService.getStaffUserById(id);
  }

  @MessagePattern('auth.staff.update')
  async updateStaffUser(@Payload() payload: { id: number; data: UpdateStaffUserDto }) {
    return this.authServiceService.updateStaffUser(payload.id, payload.data);
  }

  @MessagePattern('auth.staff.delete')
  async deleteStaffUser(@Payload() id: number) {
    return this.authServiceService.deleteStaffUser(id);
  }

  @MessagePattern('auth.staff.regenerateSecret')
  async regenerateClientSecret(@Payload() payload: { id: number; data?: RegenerateClientSecretDto }) {
    return this.authServiceService.regenerateClientSecret(payload.id, payload.data);
  }

  @MessagePattern('auth.staff.login')
  async staffUserLogin(@Payload() payload: { email: string; password: string }) {
    return this.authServiceService.staffUserLogin(payload.email, payload.password);
  }

  @MessagePattern('auth.staff.getProfile')
  async getStaffUserProfile(@Payload() id: number) {
    return this.authServiceService.getStaffUserProfile(id);
  }

  @MessagePattern('auth.staff.updateProfile')
  async updateStaffUserProfile(@Payload() payload: { id: number; data: any }) {
    return this.authServiceService.updateStaffUserProfile(payload.id, payload.data);
  }

  // ==================== Staff Role Permissions ====================

  @MessagePattern('auth.staff.rolePermissions.getAll')
  async getAllRolePermissions() {
    return this.authServiceService.getAllRolePermissions();
  }

  @MessagePattern('auth.staff.rolePermissions.getByRole')
  async getRolePermissionsByRole(@Payload() role: string) {
    return this.authServiceService.getRolePermissionsByRole(role);
  }

  @MessagePattern('auth.staff.rolePermissions.upsert')
  async upsertRolePermission(@Payload() data: { role_code?: string; role_id?: number; menu_href: string; can_access: boolean }) {
    return this.authServiceService.upsertRolePermission(data);
  }

  @MessagePattern('auth.staff.rolePermissions.bulkUpdate')
  async bulkUpdateRolePermissions(@Payload() permissions: Array<{ role_code?: string; role_id?: number; menu_href: string; can_access: boolean }>) {
    return this.authServiceService.bulkUpdateRolePermissions(permissions);
  }

  @MessagePattern('auth.staff.rolePermissions.delete')
  async deleteRolePermission(@Payload() id: number) {
    return this.authServiceService.deleteRolePermission(id);
  }

  // ==================== Staff Roles Management ====================

  @MessagePattern('auth.staff.roles.getAll')
  async getAllStaffRoles() {
    return this.authServiceService.getAllStaffRoles();
  }

  @MessagePattern('auth.staff.roles.getById')
  async getStaffRoleById(@Payload() id: number) {
    return this.authServiceService.getStaffRoleById(id);
  }

  @MessagePattern('auth.staff.roles.create')
  async createStaffRole(@Payload() data: { code: string; name: string; description?: string; is_active?: boolean }) {
    return this.authServiceService.createStaffRole(data);
  }

  @MessagePattern('auth.staff.roles.update')
  async updateStaffRole(@Payload() payload: { id: number; data: { name?: string; description?: string; is_active?: boolean } }) {
    return this.authServiceService.updateStaffRole(payload.id, payload.data);
  }

  @MessagePattern('auth.staff.roles.delete')
  async deleteStaffRole(@Payload() id: number) {
    return this.authServiceService.deleteStaffRole(id);
  }
}
