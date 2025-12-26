import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CategoryServiceModule } from './category-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CategoryServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: 3004,
      },
    },
  );
  
  await app.listen();
  const metricsApp = await NestFactory.create(CategoryServiceModule);
  await metricsApp.listen(9105);
}
bootstrap();
