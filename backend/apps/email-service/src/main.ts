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
  const metricsApp = await NestFactory.create(EmailServiceModule);
  await metricsApp.listen(9103);
}
bootstrap();
