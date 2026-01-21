import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GatewayApiController } from './gateway-api.controller';
import { GatewayApiService } from './gateway-api.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ClientCredentialGuard } from './guards/client-credential.guard';
import { FlexibleAuthGuard } from './guards/flexible-auth.guard';
import { MetricsModule } from '../../../libs/metrics/metrics.module';

@Module({
  imports: [
    MetricsModule,
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.AUTH_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.AUTH_SERVICE_PORT || '3001', 10),
        },
      },
      {
        name: 'ITEM_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.ITEM_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.ITEM_SERVICE_PORT || '3002', 10),
        },
      },
      {
        name: 'EMAIL_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.EMAIL_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.EMAIL_SERVICE_PORT || '3003', 10),
        },
      },
      {
        name: 'CATEGORY_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.CATEGORY_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.CATEGORY_SERVICE_PORT || '3004', 10),
        },
      },
      {
        name: 'MEDICAL_SUPPLIES_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.MEDICAL_SUPPLIES_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.MEDICAL_SUPPLIES_SERVICE_PORT || '3008', 10),
        },
      },
      {
        name: 'REPORT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.REPORT_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.REPORT_SERVICE_PORT || '3006', 10),
        },
      },
      {
        name: 'DEPARTMENT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.DEPARTMENT_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.DEPARTMENT_SERVICE_PORT || '3011', 10),
        },
      }, 
    ]),
  ],
  controllers: [GatewayApiController],
  providers: [GatewayApiService, JwtAuthGuard, ClientCredentialGuard, FlexibleAuthGuard],
})
export class GatewayApiModule { }
