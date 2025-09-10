import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EmailServiceService } from './email-service.service';
import { SendEmailDto, SendTemplateEmailDto, BulkEmailDto } from './dto/email.dto';

@Controller()
export class EmailServiceController {
  constructor(private readonly emailServiceService: EmailServiceService) {}

  @MessagePattern('email.send')
  async sendEmail(@Payload() sendEmailDto: SendEmailDto) {
    return this.emailServiceService.sendEmail(sendEmailDto);
  }

  @MessagePattern('email.sendTemplate')
  async sendTemplateEmail(@Payload() sendTemplateEmailDto: SendTemplateEmailDto) {
    return this.emailServiceService.sendTemplateEmail(sendTemplateEmailDto);
  }

  @MessagePattern('email.sendBulk')
  async sendBulkEmail(@Payload() bulkEmailDto: BulkEmailDto) {
    return this.emailServiceService.sendBulkEmail(bulkEmailDto);
  }

  @MessagePattern('email.sendWelcome')
  async sendWelcomeEmail(@Payload() data: { email: string; name: string; additionalData?: any }) {
    return this.emailServiceService.sendWelcomeEmail(data.email, data.name, data.additionalData);
  }

  @MessagePattern('email.sendVerification')
  async sendEmailVerification(@Payload() data: { 
    email: string; 
    name: string; 
    verificationCode: string; 
    verificationUrl: string 
  }) {
    return this.emailServiceService.sendEmailVerification(
      data.email, 
      data.name, 
      data.verificationCode, 
      data.verificationUrl
    );
  }

  @MessagePattern('email.sendPasswordReset')
  async sendPasswordReset(@Payload() data: { 
    email: string; 
    name: string; 
    resetCode: string; 
    resetUrl: string 
  }) {
    return this.emailServiceService.sendPasswordReset(
      data.email, 
      data.name, 
      data.resetCode, 
      data.resetUrl
    );
  }

  @MessagePattern('email.sendLoginNotification')
  async sendLoginNotification(@Payload() data: { 
    email: string; 
    name: string; 
    loginDetails: any 
  }) {
    return this.emailServiceService.sendLoginNotification(
      data.email, 
      data.name, 
      data.loginDetails
    );
  }

  @MessagePattern('email.sendApiKeyCreated')
  async sendApiKeyCreated(@Payload() data: { 
    email: string; 
    name: string; 
    keyDetails: any 
  }) {
    return this.emailServiceService.sendApiKeyCreated(
      data.email, 
      data.name, 
      data.keyDetails
    );
  }

  @MessagePattern('email.sendOAuthLinked')
  async sendOAuthLinked(@Payload() data: { 
    email: string; 
    name: string; 
    provider: string 
  }) {
    return this.emailServiceService.sendOAuthLinked(
      data.email, 
      data.name, 
      data.provider
    );
  }

  @MessagePattern('email.sendSecurityAlert')
  async sendSecurityAlert(@Payload() data: { 
    email: string; 
    name: string; 
    alertDetails: any 
  }) {
    return this.emailServiceService.sendSecurityAlert(
      data.email, 
      data.name, 
      data.alertDetails
    );
  }

  @MessagePattern('email.testConnection')
  async testConnection() {
    return this.emailServiceService.testConnection();
  }
}
