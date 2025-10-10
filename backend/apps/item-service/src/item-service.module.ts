import { Module } from '@nestjs/common';
import { ItemServiceController } from './item-service.controller';
import { ItemServiceService } from './item-service.service';
import { PrismaService } from './prisma.service';
import { MetricsModule } from '../../../libs/metrics/metrics.module';

@Module({
  imports: [MetricsModule],
  controllers: [ItemServiceController],
  providers: [ItemServiceService, PrismaService],
})
export class ItemServiceModule {}
