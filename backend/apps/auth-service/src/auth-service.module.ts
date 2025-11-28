import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthServiceController } from './auth-service.controller';
import { AuthServiceService } from './auth-service.service';
import { PrismaService } from './prisma.service';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { ClientCredentialStrategy } from './strategies/client-credential.strategy';
import { AuthGuard } from './guards/auth.guard';
import { TOTPService } from './services/totp.service';
import { EmailOTPService } from './services/email-otp.service';
import { FirebaseService } from './services/firebase.service';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
    ClientsModule.register([
      {
        name: 'EMAIL_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3003,
        },
      },
    ]),
  ],
  controllers: [AuthServiceController],
  providers: [
    AuthServiceService,
    PrismaService,
    ApiKeyStrategy,
    ClientCredentialStrategy,
    AuthGuard,
    TOTPService,
    EmailOTPService,
    FirebaseService
  ],
  exports: [AuthGuard, ApiKeyStrategy, ClientCredentialStrategy],
})
export class AuthServiceModule { }
