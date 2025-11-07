import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { MedicalSuppliesServiceModule } from './medical-supplies-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    MedicalSuppliesServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: 3008,
      },
    },
  );

  await app.listen();
  console.log('Medical Supplies Service is listening on port 3008');
  const metricsApp = await NestFactory.create(MedicalSuppliesServiceModule);
  await metricsApp.listen(9108);
  console.log('Medical Supplies Service metrics available at http://localhost:9108/metrics');
}
bootstrap();

