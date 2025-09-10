import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthServiceController } from './auth-service.controller';
import { AuthServiceService } from './auth-service.service';
import { PrismaService } from './prisma.service';
import { OAuth2Strategy } from './strategies/oauth2.strategy';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { AuthGuard } from './guards/auth.guard';

@Module({
  imports: [
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
    OAuth2Strategy,
    ApiKeyStrategy,
    AuthGuard
  ],
  exports: [AuthGuard, OAuth2Strategy, ApiKeyStrategy],
})
export class AuthServiceModule {}
