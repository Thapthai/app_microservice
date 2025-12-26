import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ItemServiceModule } from './item-service.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Create HTTP application
  const httpApp = await NestFactory.create(ItemServiceModule);
  httpApp.useGlobalPipes(new ValidationPipe({ 
    transform: true,
    whitelist: false, // Don't strip extra properties
    forbidNonWhitelisted: false, // Allow extra properties
  }));
  httpApp.enableCors();
  
  // Connect TCP microservice
  httpApp.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 3002,
    },
  });

  await httpApp.startAllMicroservices();
  await httpApp.listen(3009);
}
bootstrap();
