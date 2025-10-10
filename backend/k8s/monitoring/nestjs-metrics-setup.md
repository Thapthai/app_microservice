# NestJS Metrics Setup Guide

Guide สำหรับเพิ่ม Prometheus metrics ใน NestJS microservices

---

## 📊 Overview

```
NestJS App (Port 3001-3004)
    ↓
GET /metrics → Expose Prometheus metrics
    ↓
ServiceMonitor → Config Prometheus scraping
    ↓
Prometheus → Scrape metrics every 30s
    ↓
Grafana → Visualize dashboards
```

---

## 🎯 Metrics ที่ Export

### **Default Metrics (prom-client)**
- `process_cpu_user_seconds_total` - CPU usage
- `process_resident_memory_bytes` - Memory usage
- `nodejs_heap_size_total_bytes` - Heap size
- `nodejs_heap_size_used_bytes` - Heap used
- `nodejs_eventloop_lag_seconds` - Event loop lag

### **Custom Application Metrics**
- `http_requests_total` - Total HTTP requests (with method, route, status_code, service labels)
- `http_request_duration_seconds` - Request duration histogram (buckets: 0.01, 0.05, 0.1, 0.5, 1, 2, 5 seconds)

---

## 📋 ขั้นตอนการติดตั้ง

### **1. Install Dependencies**

```bash
cd /var/www/app_microservice/backend
npm install prom-client
```

### **2. Build Services**

```bash
# Build all services
npm run build:all

# Or build individually
npm run build:gateway
npm run build:auth
npm run build:item
npm run build:category
npm run build:email
```

### **3. Rebuild Docker Images**

```bash
# Auth Service
docker build -f Dockerfile.auth -t auth-service:latest .
docker save auth-service:latest -o auth-service.tar
sudo k3s ctr images import auth-service.tar

# Item Service
docker build -f Dockerfile.item -t item-service:latest .
docker save item-service:latest -o item-service.tar
sudo k3s ctr images import item-service.tar

# Gateway API
docker build -f Dockerfile.gateway -t gateway-api:latest .
docker save gateway-api:latest -o gateway-api.tar
sudo k3s ctr images import gateway-api.tar

# Category Service
docker build -f Dockerfile.category -t category-service:latest .
docker save category-service:latest -o category-service.tar
sudo k3s ctr images import category-service.tar

# Email Service
docker build -f Dockerfile.email -t email-service:latest .
docker save email-service:latest -o email-service.tar
sudo k3s ctr images import email-service.tar
```

### **4. Deploy ServiceMonitor**

```bash
# Apply ServiceMonitor
kubectl apply -f k8s/monitoring/application-servicemonitor.yaml

# Verify ServiceMonitor
kubectl -n pose-monitoring get servicemonitor nestjs-applications

# Check Prometheus targets
kubectl -n pose-monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090
# Open: http://localhost:9090/targets
# Look for: pose-microservices/* endpoints
```

### **5. Restart Services (Zero Downtime)**

```bash
# Restart all services
kubectl -n pose-microservices rollout restart deployment gateway-api
kubectl -n pose-microservices rollout restart deployment auth-service
kubectl -n pose-microservices rollout restart deployment item-service
kubectl -n pose-microservices rollout restart deployment category-service
kubectl -n pose-microservices rollout restart deployment email-service

# Check rollout status
kubectl -n pose-microservices rollout status deployment gateway-api
kubectl -n pose-microservices rollout status deployment auth-service
kubectl -n pose-microservices rollout status deployment item-service
kubectl -n pose-microservices rollout status deployment category-service
kubectl -n pose-microservices rollout status deployment email-service
```

---

## ✅ Verification

### **1. Test Metrics Endpoint**

```bash
# Port-forward to a service
kubectl -n pose-microservices port-forward svc/item-service 3002:3002

# Test metrics endpoint
curl http://localhost:3002/metrics
```

**Expected output:**
```
# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.
# TYPE process_cpu_user_seconds_total counter
process_cpu_user_seconds_total 0.123

# HELP process_resident_memory_bytes Resident memory size in bytes.
# TYPE process_resident_memory_bytes gauge
process_resident_memory_bytes 45678912

# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/items",status_code="200",service="item-service"} 42
```

### **2. Check Prometheus Targets**

```bash
# Port-forward Prometheus
kubectl -n pose-monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090
```

Open browser: `http://localhost:9090/targets`

Look for targets:
- `pose-microservices/gateway-api:3000`
- `pose-microservices/auth-service:3001`
- `pose-microservices/item-service:3002`
- `pose-microservices/email-service:3003`
- `pose-microservices/category-service:3004`

Status should be **UP** (green)

### **3. Query Metrics in Prometheus**

Open: `http://localhost:9090/graph`

Try these queries:
```promql
# Request rate
rate(http_requests_total[5m])

# Request duration (p95)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Memory usage by service
process_resident_memory_bytes{job=~".*-service"}

# Error rate (5xx errors)
rate(http_requests_total{status_code=~"5.."}[5m])
```

### **4. View in Grafana**

```bash
# Access Grafana
# URL: http://YOUR_SERVER_IP:30001
# Login: admin / admin123
```

1. Go to **Explore**
2. Select **Prometheus** data source
3. Try queries:
   ```promql
   rate(http_requests_total{service="item-service"}[5m])
   ```

---

## 🔧 Troubleshooting

### **Metrics endpoint returns 404**

```bash
# Check if MetricsModule is imported
# Check logs
kubectl -n pose-microservices logs -l app=item-service --tail=50
```

### **Prometheus not scraping**

```bash
# Check ServiceMonitor
kubectl -n pose-monitoring get servicemonitor nestjs-applications -o yaml

# Check Prometheus config
kubectl -n pose-monitoring get prometheus kube-prometheus-stack-prometheus -o yaml | grep serviceMonitorSelector

# Check service labels
kubectl -n pose-microservices get svc --show-labels
```

### **Targets show "down" in Prometheus**

```bash
# Check if pods are running
kubectl -n pose-microservices get pods

# Check service endpoints
kubectl -n pose-microservices get endpoints

# Test metrics from within cluster
kubectl -n pose-microservices exec -it <pod-name> -- curl http://item-service:3002/metrics
```

---

## 📊 Metrics Endpoints

| Service | URL | Port |
|---------|-----|------|
| Gateway API | `http://gateway-service:3000/metrics` | 3000 |
| Auth Service | `http://auth-service:3001/metrics` | 3001 |
| Item Service | `http://item-service:3002/metrics` | 3002 |
| Email Service | `http://email-service:3003/metrics` | 3003 |
| Category Service | `http://category-service:3004/metrics` | 3004 |

---

## 📈 Next Steps

1. **Create Grafana Dashboards** - Import or create custom dashboards
2. **Add Custom Metrics** - Track business-specific metrics
3. **Setup Alerts** - Configure Alertmanager rules
4. **Add Tracing** - Integrate with Jaeger/Tempo

---

## 📚 References

- [prom-client Documentation](https://github.com/siimon/prom-client)
- [Prometheus ServiceMonitor](https://prometheus-operator.dev/docs/operator/design/#servicemonitor)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)
