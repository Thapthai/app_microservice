# Monitoring Setup Guide
# คู่มือการตั้งค่า Monitoring

---

## 📊 ภาพรวม Monitoring Stack

ระบบ Monitoring นี้ครอบคลุม 4 ส่วนหลัก:

1. **Node Metrics** - Server/Hardware (CPU, RAM, Disk, Network)
2. **Load Balancer Metrics** - Traefik (Requests, Response Time, Traffic)
3. **Database Metrics** - Redis (Connections, Memory, Commands)
4. **Application Metrics** - NestJS Services (Custom metrics)

---

## 📁 ไฟล์ใน monitoring/

```
monitoring/
├── kustomization.yaml          → Kustomize config
├── traefik-metrics.yaml        → Load Balancer metrics
├── redis-metrics.yaml          → Database metrics
├── application-metrics.yaml    → Application metrics
└── README.md                   → คู่มือนี้
```

---

## 🚀 การติดตั้ง

### ขั้นตอนที่ 1: ติดตั้ง Prometheus + Grafana

```bash
# Add Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Create namespace
kubectl create namespace nline-monitoring

# Install kube-prometheus-stack (⚠️ ต้องมี hostNetwork=false แก้ port conflict)
helm upgrade --install kube-prometheus-stack \
  prometheus-community/kube-prometheus-stack \
  -n nline-monitoring \
  --set prometheus.prometheusSpec.retention=7d \
  --set prometheus.prometheusSpec.resources.requests.memory=512Mi \
  --set grafana.adminPassword=admin123 \
  --set prometheus-node-exporter.hostNetwork=false \
  --wait

# Patch services to use fixed NodePort (ต้องอยู่ในช่วง 30000-32767)
kubectl -n nline-monitoring patch svc kube-prometheus-stack-grafana \
  -p '{"spec":{"type":"NodePort","ports":[{"port":80,"targetPort":3000,"nodePort":30001,"name":"http-web"}]}}'

kubectl -n nline-monitoring patch svc kube-prometheus-stack-prometheus \
  -p '{"spec":{"type":"NodePort","ports":[{"port":9090,"targetPort":9090,"nodePort":30090,"name":"http-web"}]}}'
```

### ขั้นตอนที่ 2: Apply Custom Metrics

```bash
# Go to backend directory
cd /var/www/app_microservice/backend

# Apply all monitoring configs
kubectl apply -k k8s/monitoring/

# Check status
kubectl -n nline-monitoring get servicemonitor
kubectl -n pose-microservices get pods | grep redis-exporter
```

---

## 📊 ตรวจสอบการทำงาน

### 1. Prometheus Targets

เปิด Prometheus UI: `http://YOUR_SERVER_IP:9090`

ไปที่: **Status → Targets**

ควรเห็น targets เหล่านี้ (สีเขียว = UP):
- ✅ `serviceMonitor/nline-monitoring/traefik/0`
- ✅ `serviceMonitor/nline-monitoring/redis/0`
- ✅ `serviceMonitor/nline-monitoring/gateway-api/0`
- ✅ `serviceMonitor/nline-monitoring/auth-service/0`
- ✅ `serviceMonitor/nline-monitoring/item-service/0`
- ✅ `serviceMonitor/nline-monitoring/category-service/0`
- ✅ `serviceMonitor/nline-monitoring/email-service/0`

### 2. Grafana Dashboards

เปิด Grafana: `http://YOUR_SERVER_IP:3001`
Login: `admin` / `admin123`

#### Import Dashboards:

**Node Metrics:**
- Built-in: **Node Exporter Full**

**Load Balancer:**
- Import ID: **11462** (Traefik 2.x)

**Redis:**
- Import ID: **11835** (Redis Dashboard for Prometheus)

**Application:**
- Import ID: **315** (Kubernetes cluster monitoring)
- Import ID: **12006** (Kubernetes API Server)

---

## 🔍 ตัวอย่าง Queries

### Node Metrics (Hardware)

```promql
# CPU Usage
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory Usage
node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes

# Disk Usage
(node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100
```

### Traefik (Load Balancer)

```promql
# Request Rate
rate(traefik_entrypoint_requests_total[5m])

# Response Time
traefik_entrypoint_request_duration_seconds_sum

# HTTP Status Codes
traefik_service_requests_total{code=~"2.*|4.*|5.*"}
```

### Redis (Database)

```promql
# Connected Clients
redis_connected_clients

# Memory Usage
redis_memory_used_bytes

# Commands Per Second
rate(redis_commands_processed_total[5m])

# Keys Total
redis_db_keys
```

### Application Metrics

```promql
# HTTP Requests
rate(http_requests_total{namespace="pose-microservices"}[5m])

# Pod CPU Usage
rate(container_cpu_usage_seconds_total{namespace="pose-microservices"}[5m])

# Pod Memory Usage
container_memory_working_set_bytes{namespace="pose-microservices"}
```

---

## ⚠️ หมายเหตุสำหรับ Application Metrics

**NestJS Services ต้องเพิ่ม Prometheus metrics endpoint:**

ติดตั้ง package:
```bash
npm install @willsoto/nestjs-prometheus prom-client
```

เพิ่มใน `main.ts`:
```typescript
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

// In module imports
PrometheusModule.register({
  defaultMetrics: {
    enabled: true,
  },
})
```

Metrics จะอยู่ที่: `http://service:port/metrics`

---

## 🗑️ การลบ Monitoring

```bash
# Uninstall Helm
helm uninstall kube-prometheus-stack -n nline-monitoring

# Delete PVCs
kubectl -n nline-monitoring delete pvc --all

# Delete custom resources
kubectl delete -k k8s/monitoring/

# Delete redis-exporter (in pose-microservices namespace)
kubectl -n pose-microservices delete deployment redis-exporter
kubectl -n pose-microservices delete svc redis-exporter

# Delete namespace
kubectl delete namespace nline-monitoring
```

---

## 📚 Dashboard IDs สำหรับ Grafana

| Dashboard | ID | คำอธิบาย |
|-----------|----|----|
| **Node Exporter Full** | Built-in | Server hardware metrics |
| **Traefik** | 11462 | Load Balancer metrics |
| **Traefik** | 4475 | Traefik Official Dashboard |
| **Redis** | 11835 | Redis Dashboard |
| **Redis** | 763 | Redis Metrics |
| **Kubernetes** | 315 | Kubernetes cluster |
| **Kubernetes** | 7249 | Kubernetes Cluster Monitoring |

---

## 🎯 URLs

- **Grafana:** `http://YOUR_SERVER_IP:30001` (admin/admin123)
- **Prometheus:** `http://YOUR_SERVER_IP:30090`
- **Gateway API:** `http://10.11.9.84:3000`

---

## 📞 Troubleshooting

### ServiceMonitor ไม่ทำงาน

```bash
# เช็ค ServiceMonitor
kubectl -n nline-monitoring get servicemonitor

# เช็ค labels ของ service
kubectl -n pose-microservices get svc --show-labels

# เช็ค Prometheus logs
kubectl -n nline-monitoring logs prometheus-kube-prometheus-stack-prometheus-0 -c prometheus
```

### Redis Exporter ไม่ทำงาน

```bash
# เช็ค pod
kubectl -n pose-microservices get pods | grep redis-exporter

# เช็ค logs
kubectl -n pose-microservices logs deployment/redis-exporter

# Test connection
kubectl -n pose-microservices exec -it deployment/redis-exporter -- wget -qO- http://localhost:9121/metrics
```

---

**สำเร็จ!** 🎉 Monitoring Stack พร้อมใช้งาน

