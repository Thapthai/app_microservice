import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { HousekeepingServiceController } from './housekeeping-service.controller';
import { HousekeepingServiceService } from './housekeeping-service.service';
import { PrismaService, ArchivePrismaService } from './prisma.service';
import { HousekeepingLoggerService } from './logger/housekeeping-logger.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  controllers: [HousekeepingServiceController],
  providers: [
    HousekeepingServiceService,
    PrismaService,
    ArchivePrismaService,
    HousekeepingLoggerService,
  ],
})
export class HousekeepingServiceModule {}
