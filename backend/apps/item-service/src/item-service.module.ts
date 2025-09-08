import { Module } from '@nestjs/common';
import { ItemServiceController } from './item-service.controller';
import { ItemServiceService } from './item-service.service';
import { PrismaService } from './prisma.service';

@Module({
  imports: [],
  controllers: [ItemServiceController],
  providers: [ItemServiceService, PrismaService],
})
export class ItemServiceModule {}
