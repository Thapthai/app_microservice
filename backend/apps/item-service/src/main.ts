import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ItemServiceModule } from './item-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ItemServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: 3002,
      },
    },
  );

  await app.listen();
  console.log('Item Service is listening on port 3002');
  const metricsApp = await NestFactory.create(ItemServiceModule);
  await metricsApp.listen(9102);
  console.log('Item service metrics available at http://localhost:9102/metrics');
}
bootstrap();
