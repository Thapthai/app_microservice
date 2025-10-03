import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class GatewayApiService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('ITEM_SERVICE') private readonly itemClient: ClientProxy,
    @Inject('EMAIL_SERVICE') private readonly emailClient: ClientProxy,
  ) { }

  getHello(): string {
    return 'Gateway API is running!';
  }

  async register(registerDto: RegisterDto) {
    return this.authClient.send('auth.register', registerDto).toPromise();
  }

  async login(loginDto: LoginDto) {
    return this.authClient.send('auth.login', loginDto).toPromise();
  }

  async validateToken(token: string) {
    return this.authClient.send('auth.validate', token).toPromise();
  }

  async getOAuthUrl(provider: string, state?: string) {
    return this.authClient.send('auth.oauth2.getAuthUrl', { provider, state }).toPromise();
  }

  async oauthLogin(data: { provider: string; code: string; state?: string; redirectUri?: string }) {
    return this.authClient.send('auth.oauth2.login', data).toPromise();
  }

  // ==================================== Item Service Methods ====================================
  async createItem(createItemDto: any) {
    return this.itemClient.send('item.create', createItemDto).toPromise();
  }

  async findAllItems(page: number, limit: number, keyword?: string) {
    const query = { page, limit, keyword };
    return this.itemClient.send('item.findAll', query).toPromise();
  }

  async findOneItem(id: number) {
    return this.itemClient.send('item.findOne', id).toPromise();
  }

  async updateItem(id: number, updateItemDto: any) {
    return this.itemClient.send('item.update', { id, updateItemDto }).toPromise();
  }

  async removeItem(id: number) {
    return this.itemClient.send('item.remove', id).toPromise();
  }

  async findItemsByUser(userId: number) {
    return this.itemClient.send('item.findByUser', userId).toPromise();
  }

  // ==================================== Email Service Methods ====================================

  async sendEmail(emailData: any) {
    return this.emailClient.send('email.send', emailData).toPromise();
  }

  async sendTemplateEmail(templateData: any) {
    return this.emailClient.send('email.sendTemplate', templateData).toPromise();
  }

  async sendWelcomeEmail(email: string, name: string, additionalData?: any) {
    return this.emailClient.send('email.sendWelcome', { email, name, additionalData }).toPromise();
  }

  async sendEmailVerification(email: string, name: string, verificationCode: string, verificationUrl: string) {
    return this.emailClient.send('email.sendVerification', {
      email,
      name,
      verificationCode,
      verificationUrl
    }).toPromise();
  }

  async sendPasswordReset(email: string, name: string, resetCode: string, resetUrl: string) {
    return this.emailClient.send('email.sendPasswordReset', {
      email,
      name,
      resetCode,
      resetUrl
    }).toPromise();
  }

  async testEmailConnection() {
    return this.emailClient.send('email.testConnection', {}).toPromise();
  }

  // ================================ 2FA Methods ================================

  async enable2FA(token: string, password: string) {
    // First validate the token to get user info
    const tokenValidation = await this.validateToken(token);

    if (!tokenValidation.success) {
      throw new Error('Invalid token');
    }

    const userId = tokenValidation.data.user.id;
    return this.authClient.send('auth.2fa.enable', { userId, password }).toPromise();
  }

  async verify2FASetup(token: string, secret: string, totpToken: string) {
    // First validate the token to get user info
    const tokenValidation = await this.validateToken(token);
    if (!tokenValidation.success) {
      throw new Error('Invalid token');
    }

    const userId = tokenValidation.data.user.id;
    return this.authClient.send('auth.2fa.verify-setup', {
      userId,
      verifyDto: {
        secret,
        token: totpToken
      }
    }).toPromise();
  }

  async disable2FA(token: string, password: string, totpToken?: string) {
    // First validate the token to get user info
    const tokenValidation = await this.validateToken(token);
    if (!tokenValidation.success) {
      throw new Error('Invalid token');
    }

    const userId = tokenValidation.data.user.id;
    return this.authClient.send('auth.2fa.disable', { userId, password, token: totpToken }).toPromise();
  }

  async loginWith2FA(tempToken: string, code: string, type?: string) {
    return this.authClient.send('auth.login.2fa', { tempToken, code, type }).toPromise();
  }

  // ================================ User Management Methods ================================

  async getUserProfile(userId: number) {
    return this.authClient.send('auth.user.profile', userId).toPromise();
  }

  async updateUserProfile(userId: number, updateUserProfileDto: any) {
    return this.authClient.send('auth.user.update-profile', {
      userId,
      updateUserProfileDto
    }).toPromise();
  }

  async changePassword(userId: number, changePasswordDto: any) {
 
    return this.authClient.send('auth.user.change-password', {
      userId,
      changePasswordDto
    }).toPromise();
  }

  async requestPasswordReset(resetPasswordDto: any) {
    return this.authClient.send('auth.password.reset-request', resetPasswordDto).toPromise();
  }
}
