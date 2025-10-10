# NestJS Application Metrics Setup

เพื่อให้ ServiceMonitor ดึงข้อมูลได้ ต้องเพิ่ม Prometheus metrics ใน NestJS apps

## 1. ติดตั้ง Dependencies

```bash
cd /var/www/app_microservice/backend
npm install --save @willsoto/nestjs-prometheus prom-client
```

## 2. เพิ่ม Metrics Module ในแต่ละ Service

### สำหรับ Auth Service

แก้ไข `apps/auth-service/src/auth-service.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    // เพิ่ม Prometheus module
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
      path: '/metrics',
      defaultLabels: {
        app: 'auth-service',
      },
    }),
    // ... other imports
  ],
  // ... rest of module config
})
export class AuthServiceModule {}
```

### สำหรับ Item Service

แก้ไข `apps/item-service/src/item-service.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
      path: '/metrics',
      defaultLabels: {
        app: 'item-service',
      },
    }),
    // ... other imports
  ],
  // ... rest of module config
})
export class ItemServiceModule {}
```

### สำหรับ Category Service

แก้ไข `apps/category-service/src/category-service.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
      path: '/metrics',
      defaultLabels: {
        app: 'category-service',
      },
    }),
    // ... other imports
  ],
  // ... rest of module config
})
export class CategoryServiceModule {}
```

### สำหรับ Email Service

แก้ไข `apps/email-service/src/email-service.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
      path: '/metrics',
      defaultLabels: {
        app: 'email-service',
      },
    }),
    // ... other imports
  ],
  // ... rest of module config
})
export class EmailServiceModule {}
```

### สำหรับ Gateway API

แก้ไข `apps/gateway-api/src/gateway-api.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
      path: '/metrics',
      defaultLabels: {
        app: 'gateway-api',
      },
    }),
    // ... other imports
  ],
  // ... rest of module config
})
export class GatewayApiModule {}
```

## 3. เพิ่ม Custom Metrics (Optional)

สร้างไฟล์ `shared/metrics/metrics.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('http_requests_total') 
    public httpRequestsTotal: Counter<string>,
    
    @InjectMetric('http_request_duration_seconds') 
    public httpRequestDuration: Histogram<string>,
    
    @InjectMetric('active_connections') 
    public activeConnections: Gauge<string>,
  ) {}

  recordRequest(method: string, path: string, statusCode: number) {
    this.httpRequestsTotal.inc({
      method,
      path,
      status_code: statusCode.toString(),
    });
  }

  recordDuration(method: string, path: string, duration: number) {
    this.httpRequestDuration.observe(
      { method, path },
      duration / 1000, // Convert to seconds
    );
  }
}
```

## 4. เพิ่ม HTTP Metrics Port ใน Deployments

แก้ไข service definitions ให้เปิด metrics port:

### Example: `k8s/base/services.yaml`

```yaml
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: pose-microservices
  labels:
    app: auth-service
spec:
  type: ClusterIP
  ports:
  - port: 3001
    targetPort: 3001
    protocol: TCP
    name: tcp        # TCP port for microservice
  - port: 8080
    targetPort: 8080
    protocol: TCP
    name: http       # HTTP port for metrics
  selector:
    app: auth-service
```

## 5. อัพเดท Main.ts ให้รองรับ HTTP Metrics

เนื่องจาก NestJS microservices ใช้ TCP transport ต้องเพิ่ม HTTP server สำหรับ metrics:

### Example: `apps/auth-service/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AuthServiceModule } from './auth-service.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

async function bootstrap() {
  // Create TCP microservice
  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: 3001,
      },
    },
  );

  // Create HTTP server for metrics
  const expressApp = express();
  const httpApp = await NestFactory.create(
    AuthServiceModule,
    new ExpressAdapter(expressApp),
  );
  
  await httpApp.init();
  expressApp.listen(8080, '0.0.0.0', () => {
    console.log('Metrics server listening on port 8080');
  });

  // Start microservice
  await microservice.listen();
  console.log('Auth Service is listening on port 3001');
}
bootstrap();
```

## 6. Metrics ที่จะได้รับ

### Default Metrics:
- `process_cpu_user_seconds_total` - CPU usage
- `process_resident_memory_bytes` - Memory usage
- `nodejs_heap_size_total_bytes` - Heap size
- `nodejs_eventloop_lag_seconds` - Event loop lag
- `nodejs_active_handles_total` - Active handles
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration

### Custom Metrics (ถ้าเพิ่ม):
- Request counts by endpoint
- Error rates
- Business metrics (logins, registrations, etc.)
- Database query counts
- Cache hit/miss rates

## 7. ทดสอบ Metrics

```bash
# ทดสอบผ่าน port-forward
kubectl port-forward -n pose-microservices svc/auth-service 8080:8080

# เรียกดู metrics
curl http://localhost:8080/metrics
```

## 8. Rebuild และ Deploy

```bash
cd /var/www/app_microservice/backend

# Build all services
npm run build

# Build และ deploy แต่ละ service
./deploy-all-services.sh
```

