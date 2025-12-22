import { NestFactory } from '@nestjs/core';
import { ReportServiceModule } from './report-service.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ReportServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0', // Listen on all interfaces for Kubernetes
        port: 3006, // Port for report-service
      },
    },
  );

  console.log('[Report Service] Starting on port 3006...');
  await app.listen();
  console.log('[Report Service] Microservice is listening on port 3006');
}
bootstrap();
