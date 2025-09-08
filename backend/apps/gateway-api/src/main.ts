import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { GatewayApiModule } from './gateway-api.module';

async function bootstrap() {
  const app = await NestFactory.create(GatewayApiModule);
  
  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Enable CORS
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
  console.log('Gateway API is running on port 3000');
}
bootstrap();
