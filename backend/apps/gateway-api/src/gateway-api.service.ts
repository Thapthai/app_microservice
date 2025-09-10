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
}
