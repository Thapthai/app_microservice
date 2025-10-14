import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AuthServiceModule } from './auth-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: 3001,
      },
    },
  );

  await app.listen();
  console.log('Auth Service is listening on port 3001');
  const metricsApp = await NestFactory.create(AuthServiceModule);
  await metricsApp.listen(9101);
  console.log('Auth service metrics available at http://localhost:9101/metrics');
}
bootstrap();
