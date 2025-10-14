import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { EmailServiceModule } from './email-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    EmailServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: 3003,
      },
    },
  );
  
  await app.listen();
  console.log('Email Service is listening on port 3003');
  const metricsApp = await NestFactory.create(EmailServiceModule);
  await metricsApp.listen(9103);
  console.log('Email service metrics available at http://localhost:9103/metrics');
}
bootstrap();
