import { Module } from '@nestjs/common';
import { CategoryServiceController } from './category-service.controller';
import { CategoryServiceService } from './category-service.service';
import { PrismaService } from './prisma.service';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [PrometheusModule.register({
    defaultMetrics: {
      enabled: true,
    },
  })],
  controllers: [CategoryServiceController],
  providers: [CategoryServiceService, PrismaService],
})
export class CategoryServiceModule { }
