import { NestFactory } from '@nestjs/core';
import { HousekeepingServiceModule } from './housekeeping-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';


async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    HousekeepingServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: 3007,
      },
    },
  );

  await app.listen();
  console.log('Housekeeping Service is listening on port 3007');
  const metricsApp = await NestFactory.create(HousekeepingServiceModule);
  await metricsApp.listen(9107);
  console.log('Housekeeping service metrics available at http://localhost:9107/metrics');
}
bootstrap();
