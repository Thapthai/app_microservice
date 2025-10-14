import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    const startTime = Date.now();
    const method = request.method;
    const route = request.route?.path || request.url;
    const service = process.env.SERVICE_NAME || 'unknown';

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - startTime) / 1000;
          const statusCode = response.statusCode;

          // Record metrics
          this.metricsService.httpRequestsTotal.inc({
            method,
            route,
            status_code: statusCode.toString(),
            service,
          });

          this.metricsService.httpRequestDuration.observe(
            {
              method,
              route,
              status_code: statusCode.toString(),
              service,
            },
            duration,
          );
        },
        error: (error) => {
          const duration = (Date.now() - startTime) / 1000;
          const statusCode = error.status || 500;

          // Record error metrics
          this.metricsService.httpRequestsTotal.inc({
            method,
            route,
            status_code: statusCode.toString(),
            service,
          });

          this.metricsService.httpRequestDuration.observe(
            {
              method,
              route,
              status_code: statusCode.toString(),
              service,
            },
            duration,
          );
        },
      }),
    );
  }
}

