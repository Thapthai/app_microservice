import { Module } from '@nestjs/common';
import { ItemServiceController } from './item-service.controller';
import { ItemServiceService } from './item-service.service';
import { PrismaService } from './prisma.service';
import { PrometheusModule } from "@willsoto/nestjs-prometheus";

@Module({
  imports: [PrometheusModule.register({
    defaultMetrics: {
      enabled: true,
    },
  })],
  controllers: [ItemServiceController],
  providers: [ItemServiceService, PrismaService],
})
export class ItemServiceModule { }
