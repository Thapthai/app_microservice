import { Module } from '@nestjs/common';
import { DepartmentServiceController } from './department-service.controller';
import { DepartmentServiceService } from './department-service.service';
import { PrismaService } from './prisma.service';
import { PrometheusModule } from "@willsoto/nestjs-prometheus";


@Module({
  imports: [PrometheusModule.register({
    defaultMetrics: {
      enabled: true,
    },
  })],
  controllers: [DepartmentServiceController],
  providers: [DepartmentServiceService, PrismaService],
})
export class DepartmentServiceModule { }
