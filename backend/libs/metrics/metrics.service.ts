import { Injectable } from '@nestjs/common';
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  public httpRequestsTotal: Counter<string>;
  public httpRequestDuration: Histogram<string>;

  constructor() {
    // Collect default metrics (CPU, Memory, etc.)
    collectDefaultMetrics({ prefix: 'nestjs_' });

    // HTTP Requests Total
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'service'],
    });

    // HTTP Request Duration
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code', 'service'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  getContentType(): string {
    return register.contentType;
  }
}

