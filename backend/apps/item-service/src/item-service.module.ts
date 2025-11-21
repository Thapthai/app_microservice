import { Module } from '@nestjs/common';
import { ItemServiceController } from './item-service.controller';
import { ItemHttpController } from './item-http.controller';
import { ItemServiceService } from './item-service.service';
import { PrismaService } from './prisma.service';
import { PrometheusModule } from "@willsoto/nestjs-prometheus";

@Module({
  imports: [PrometheusModule.register({
    defaultMetrics: {
      enabled: true,
    },
  })],
  controllers: [ItemServiceController, ItemHttpController],
  providers: [ItemServiceService, PrismaService],
})
export class ItemServiceModule { }
