import { Module } from '@nestjs/common';
import { MedicalSuppliesServiceController } from './medical-supplies-service.controller';
import { MedicalSuppliesServiceService } from './medical-supplies-service.service';
import { PrometheusModule } from "@willsoto/nestjs-prometheus";

@Module({
  imports: [PrometheusModule.register({
    defaultMetrics: {
      enabled: true,
    },
  })],
  controllers: [MedicalSuppliesServiceController],
  providers: [MedicalSuppliesServiceService],
})
export class MedicalSuppliesServiceModule {}

