import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { GatewayApiModule } from './gateway-api.module';

async function bootstrap() {
  const app = await NestFactory.create(GatewayApiModule);
  
  // Set global API prefix with version
  app.setGlobalPrefix('api/v1');
  
  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: false,  // Don't strip extra properties (Gateway forwards data)
    forbidNonWhitelisted: false,  // Allow extra properties
    transform: true,
  }));

  // Enable CORS
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
