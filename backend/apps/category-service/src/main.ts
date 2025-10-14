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
  console.log('Category Service is listening on port 3004');
  const metricsApp = await NestFactory.create(CategoryServiceModule);
  await metricsApp.listen(9104);
  console.log('Category service metrics available at http://localhost:9104/metrics');
}
bootstrap();
