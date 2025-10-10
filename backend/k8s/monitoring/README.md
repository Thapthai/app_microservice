# Monitoring Stack Documentation

Complete monitoring solution สำหรับ microservices architecture

## 📊 Overview

Monitoring stack นี้ให้ข้อมูลครบถ้วนสำหรับการ monitor:

### 1. **Node Exporter - Full System Metrics**
- CPU usage (all cores, per process)
- Memory usage (total, available, cached, swap)
- Disk usage (per mount point, I/O stats)
- Network traffic (per interface, errors, dropped packets)
- System load (1min, 5min, 15min averages)
- Process stats (running, blocked, zombie)

### 2. **Load Balancer (Traefik)**
- Requests per second (total, per service, per route)
- Response times (p50, p95, p99)
- HTTP status codes distribution
- Backend health status
- Connection counts
- Error rates

### 3. **Application Metrics (NestJS)**
- HTTP requests (total, rate, per endpoint)
- Request latency (p50, p95, p99)
- Error rates (4xx, 5xx)
- Memory usage (heap, RSS)
- CPU usage
- Event loop lag
- Active handles
- Business metrics (custom)

### 4. **Service Monitoring**
- Service health status (up/down)
- Service uptime percentage
- Request counts (per service, per endpoint)
- Service restarts
- Most called endpoints
- Error rates per service
- Resource usage per service

## 🚀 Quick Start

```bash
# 1. Deploy monitoring stack
cd /var/www/app_microservice/backend

# 2. Install Prometheus + Grafana
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace pose-monitoring \
  --values k8s/monitoring/prometheus-values.yaml \
  --create-namespace

# 3. Deploy ServiceMonitors
kubectl apply -f k8s/monitoring/application-servicemonitor.yaml
kubectl apply -f k8s/monitoring/traefik-servicemonitor.yaml

# 4. Deploy Grafana Dashboards
kubectl apply -f k8s/monitoring/grafana-dashboards.yaml
kubectl -n pose-monitoring rollout restart deployment kube-prometheus-stack-grafana

# 5. Access Grafana
# http://YOUR_SERVER_IP:30001
# Username: admin
# Password: admin123
```

## 📁 Files Structure

```
k8s/monitoring/
├── prometheus-values.yaml              # Prometheus Helm values (90d retention)
├── application-servicemonitor.yaml     # NestJS services monitoring
├── traefik-servicemonitor.yaml         # Load balancer monitoring
├── grafana-dashboards.yaml             # Pre-configured dashboards
├── nestjs-metrics-setup.md             # How to add metrics to NestJS
├── DEPLOYMENT-GUIDE.md                 # Complete deployment guide
└── README.md                           # This file
```

## 🎯 Features

### **Prometheus Configuration**
- ✅ 90 days retention
- ✅ 50GB storage
- ✅ 30s scrape interval
- ✅ Optimized for 7.8GB RAM server
- ✅ Auto-discovery ServiceMonitors
- ✅ Custom scrape configs

### **Grafana Dashboards**
- ✅ Node Exporter Full - Complete system metrics
- ✅ Load Balancer - Traefik metrics
- ✅ Application Services - NestJS microservices
- ✅ Service Health & Requests - Uptime and usage

### **Exporters**
- ✅ Node Exporter - System metrics
- ✅ Kube State Metrics - Kubernetes metrics
- ✅ prom-client - Application metrics

## 📊 Metrics Examples

### System Metrics
```promql
# CPU Usage
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory Usage %
100 * (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes))

# Disk I/O
irate(node_disk_read_bytes_total[5m])
irate(node_disk_written_bytes_total[5m])

# Network Traffic
irate(node_network_receive_bytes_total[5m])
irate(node_network_transmit_bytes_total[5m])
```

### Application Metrics
```promql
# Request Rate (per service)
sum(rate(http_requests_total[5m])) by (service)

# Error Rate
sum(rate(http_requests_total{status_code=~"5.."}[5m])) by (service) / 
sum(rate(http_requests_total[5m])) by (service) * 100

# Response Time p95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) by (service)

# Memory Usage
process_resident_memory_bytes{job=~".*-service"} / 1024 / 1024  # in MB
```

### Service Health
```promql
# Service Up/Down
up{job=~".*-service"}

# Uptime %
avg_over_time(up{job=~".*-service"}[24h]) * 100

# Restart Count
increase(kube_pod_container_status_restarts_total[24h])

# Request Count (24h)
sum(increase(http_requests_total[24h])) by (service)
```

## 🔧 Configuration

### Adjust Retention Period

แก้ไข `prometheus-values.yaml`:
```yaml
prometheus:
  prometheusSpec:
    retention: 90d          # เปลี่ยนเป็น 30d, 60d, 180d
    retentionSize: "50GB"   # เปลี่ยนตามความจุ
```

### Adjust Resource Limits

แก้ไข `prometheus-values.yaml`:
```yaml
prometheus:
  prometheusSpec:
    resources:
      requests:
        memory: 1Gi     # เพิ่ม/ลดตาม RAM ที่มี
      limits:
        memory: 2Gi
```

### Change Scrape Interval

แก้ไข `prometheus-values.yaml`:
```yaml
prometheus:
  prometheusSpec:
    scrapeInterval: 30s    # เปลี่ยนเป็น 15s, 1m, 2m
    evaluationInterval: 30s
```

## 📈 Grafana Dashboards

### Available Dashboards

1. **Node Exporter Full** (`uid: node-exporter-full`)
   - System overview
   - CPU, Memory, Disk, Network
   - Load average and processes

2. **Load Balancer** (`uid: load-balancer`)
   - Request rate
   - Response times
   - Status codes
   - Backend health

3. **Application Services** (`uid: application-services`)
   - Service health
   - Request rates
   - Error rates
   - Memory usage

4. **Service Health & Requests** (`uid: service-monitoring`)
   - Uptime percentage
   - Request counts
   - Service restarts
   - Top endpoints

### Import Custom Dashboards

1. Go to Grafana UI (http://YOUR_SERVER_IP:30001)
2. Navigate to **Dashboards → Import**
3. Upload JSON or paste dashboard ID
4. Select Prometheus as data source

### Popular Dashboard IDs
- Node Exporter Full: **1860**
- Kubernetes Cluster: **7249**
- Traefik: **4475**
- NestJS: Create custom or use provided

## 🔍 Monitoring Best Practices

### 1. Set Up Alerts

Create alert rules in Prometheus:
```yaml
# High CPU Usage
- alert: HighCPUUsage
  expr: 100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
  for: 5m
  annotations:
    summary: "High CPU usage detected"

# Service Down
- alert: ServiceDown
  expr: up{job=~".*-service"} == 0
  for: 1m
  annotations:
    summary: "Service {{ $labels.service }} is down"
```

### 2. Monitor Key Metrics

**Golden Signals:**
- **Latency** - Response times
- **Traffic** - Requests per second
- **Errors** - Error rates
- **Saturation** - Resource usage

### 3. Set Retention Based on Needs

- **Development**: 7-30 days
- **Staging**: 30-60 days
- **Production**: 90-365 days

### 4. Regular Backups

Backup Grafana dashboards and Prometheus data:
```bash
# Backup Grafana
kubectl -n pose-monitoring exec deployment/kube-prometheus-stack-grafana -- \
  tar -czf /tmp/grafana-backup.tar.gz /var/lib/grafana

# Copy to local
kubectl cp pose-monitoring/pod-name:/tmp/grafana-backup.tar.gz ./grafana-backup.tar.gz
```

## 🐛 Common Issues

### Issue: Prometheus OOMKilled

**Solution:**
1. Reduce retention: `retention: 30d`
2. Increase memory limits
3. Reduce scrape interval
4. Disable unnecessary metrics

### Issue: ServiceMonitor not working

**Solution:**
1. Check namespace labels: `kubectl label namespace pose-microservices monitoring=enabled`
2. Verify service selector matches
3. Check service port name matches ServiceMonitor
4. Restart Prometheus

### Issue: No application metrics

**Solution:**
1. Verify NestJS apps have PrometheusModule
2. Check /metrics endpoint works
3. Verify service has correct port (8080)
4. Check ServiceMonitor targets in Prometheus UI

## 📚 Documentation

- **DEPLOYMENT-GUIDE.md** - Complete deployment instructions
- **nestjs-metrics-setup.md** - How to add metrics to NestJS
- **prometheus-values.yaml** - Prometheus configuration
- **grafana-dashboards.yaml** - Dashboard definitions

## 🆘 Support

สำหรับปัญหาหรือคำถาม:
1. ดู DEPLOYMENT-GUIDE.md Troubleshooting section
2. ตรวจสอบ logs: `kubectl logs -n pose-monitoring <pod-name>`
3. ตรวจสอบ Prometheus targets: http://YOUR_SERVER_IP:30090/targets
4. ตรวจสอบ ServiceMonitors: `kubectl get servicemonitors -A`

## 🔄 Updates

เพื่ออัพเดท monitoring stack:
```bash
# Update Helm chart
helm upgrade kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace pose-monitoring \
  --values k8s/monitoring/prometheus-values.yaml

# Update ServiceMonitors
kubectl apply -f k8s/monitoring/

# Restart components if needed
kubectl -n pose-monitoring rollout restart deployment kube-prometheus-stack-grafana
```

---

## ✨ Summary

Monitoring stack นี้ให้ความสามารถในการ:

✅ **Monitor System** - CPU, Memory, Disk, Network (Node Exporter)  
✅ **Monitor Load Balancer** - Traefik requests, response times  
✅ **Monitor Applications** - NestJS services metrics  
✅ **Monitor Services** - Health, uptime, request counts  
✅ **90 Days Retention** - เก็บ logs ย้อนหลัง 90 วัน  
✅ **Beautiful Dashboards** - Grafana pre-configured dashboards  
✅ **Production Ready** - Optimized สำหรับ 7.8GB RAM server  

Happy Monitoring! 📊✨
