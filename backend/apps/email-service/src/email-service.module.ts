import { Module } from '@nestjs/common';
import { EmailServiceController } from './email-service.controller';
import { EmailServiceService } from './email-service.service';
import { MetricsModule } from '../../../libs/metrics/metrics.module';

@Module({
  imports: [MetricsModule],
  controllers: [EmailServiceController],
  providers: [EmailServiceService],
})
export class EmailServiceModule {}
