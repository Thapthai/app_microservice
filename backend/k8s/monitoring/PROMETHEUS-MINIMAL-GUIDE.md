# 📊 Prometheus Minimal - คู่มือติดตั้งแบบประหยัด RAM

> **สำหรับ Production Server ที่มี RAM จำกัด (4-8GB)**  
> ใช้ RAM เพียง **~150MB** - ไม่กระทบระบบหลัก

---

## 🎯 คุณสมบัติ

- ✅ เก็บ Metrics จาก NestJS Services ทุกตัว
- ✅ ใช้ RAM เพียง **128-256MB**
- ✅ เก็บข้อมูลย้อนหลัง **3 วัน**
- ✅ เข้าถึงผ่าน Web UI (Port 30090)
- ✅ รองรับ PromQL queries
- ❌ ไม่มี Grafana Dashboard (ประหยัด RAM 400MB+)
- ❌ ไม่มี Alertmanager (ประหยัด RAM 100MB+)
- ❌ ไม่มี Node Exporter (ประหยัด RAM 50MB+)

---

## 📋 ข้อกำหนด

- K3s cluster ที่ทำงานอยู่
- Services ต้องมี `/metrics` endpoint (prom-client)
- Services ต้องมี label `app` ที่ตรงกับ: `gateway-api`, `auth-service`, `item-service`, `email-service`, `category-service`

---

## 🚀 ขั้นตอนการติดตั้ง

### **1. ตรวจสอบ Metrics Endpoint**

ก่อนติดตั้ง ให้แน่ใจว่า services มี `/metrics` endpoint:

```bash
# ตรวจสอบว่า services มี metrics
kubectl exec -n pose-microservices \
  $(kubectl get pod -n pose-microservices -l app=gateway-api -o jsonpath='{.items[0].metadata.name}') \
  -- curl -s http://localhost:3000/metrics | head -20

# ควรเห็น metrics แบบนี้:
# http_requests_total{method="GET",route="/api",status_code="200",service="gateway-api"} 42
# http_request_duration_seconds_bucket{le="0.01",method="GET"} 10
```

---

### **2. ลบ Monitoring เก่า (ถ้ามี)**

```bash
# ลบ Prometheus Stack เต็มรูปแบบ (ถ้าเคยติดตั้ง)
helm uninstall kube-prometheus-stack -n pose-monitoring 2>/dev/null || echo "ไม่มี helm release"

# ลบ namespace เก่า
kubectl delete namespace pose-monitoring

# รอให้ลบเสร็จ
sleep 10
```

---

### **3. Deploy Prometheus Minimal**

```bash
cd /var/www/app_microservice/backend

# Pull code ล่าสุด (ถ้ายังไม่ได้ pull)
git pull origin main

# Apply Prometheus Minimal
kubectl apply -f k8s/monitoring/prometheus-minimal.yaml

# รอให้ pod พร้อม (ประมาณ 30 วินาที)
kubectl -n pose-monitoring rollout status deployment prometheus
```

---

### **4. ตรวจสอบการติดตั้ง**

```bash
# ดู pods
kubectl -n pose-monitoring get pods

# ควรเห็น:
# NAME                          READY   STATUS    RESTARTS   AGE
# prometheus-xxxxxxxxxx-xxxxx   1/1     Running   0          1m

# ดู resource usage
kubectl top pods -n pose-monitoring

# ควรเห็น RAM ใช้ประมาณ 100-150Mi
```

---

### **5. เข้าใช้งาน Prometheus Web UI**

```bash
# เช็ค External IP ของ server
kubectl get nodes -o wide

# เปิดเบราว์เซอร์:
# http://YOUR_SERVER_IP:30090
```

---

## 🔍 การใช้งาน Prometheus

### **Targets Status**

ตรวจสอบว่า Prometheus scrape metrics จาก services สำเร็จ:

1. เข้า: `http://YOUR_SERVER_IP:30090/targets`
2. ควรเห็น targets ทั้งหมด status **UP**:
   - `gateway-api`
   - `auth-service`
   - `item-service`
   - `email-service`
   - `category-service`

---

### **Query Metrics**

เข้า: `http://YOUR_SERVER_IP:30090/graph`

#### **1. Total Requests per Service**

```promql
sum(rate(http_requests_total[5m])) by (service)
```

#### **2. Request Rate (requests/second)**

```promql
rate(http_requests_total[5m])
```

#### **3. Error Rate (5xx responses)**

```promql
rate(http_requests_total{status_code=~"5.."}[5m])
```

#### **4. Average Response Time**

```promql
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

#### **5. 95th Percentile Response Time**

```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

#### **6. Requests by Status Code**

```promql
sum(rate(http_requests_total[5m])) by (status_code)
```

#### **7. Memory Usage (NestJS default metrics)**

```promql
nodejs_heap_size_used_bytes / 1024 / 1024
```

#### **8. CPU Usage**

```promql
rate(process_cpu_user_seconds_total[5m])
```

---

## 📊 ตัวอย่าง Dashboard (Text-based)

เนื่องจากไม่มี Grafana ให้ใช้ Prometheus Table View:

### **Service Health Dashboard**

```promql
# 1. Services ที่ทำงาน
up{job="nestjs-services"}

# 2. Total Requests (Last 5m)
sum by (service) (increase(http_requests_total[5m]))

# 3. Error Rate %
(sum by (service) (rate(http_requests_total{status_code=~"5.."}[5m])) / sum by (service) (rate(http_requests_total[5m]))) * 100

# 4. Avg Response Time (ms)
(rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])) * 1000
```

**วิธีใช้:**
1. เข้า `http://YOUR_SERVER_IP:30090`
2. ไปที่ tab **"Table"**
3. Paste query แล้วกด **Execute**
4. เห็นผลลัพธ์แบบตาราง

---

## 🔧 Configuration

### **เปลี่ยน Scrape Interval**

แก้ไข `prometheus-minimal.yaml`:

```yaml
data:
  prometheus.yml: |
    global:
      scrape_interval: 60s  # เปลี่ยนเป็น 30s, 120s ตามต้องการ
```

จากนั้น apply ใหม่:

```bash
kubectl apply -f k8s/monitoring/prometheus-minimal.yaml
kubectl -n pose-monitoring rollout restart deployment prometheus
```

---

### **เปลี่ยนระยะเวลาเก็บข้อมูล**

แก้ไข `prometheus-minimal.yaml`:

```yaml
args:
  - '--storage.tsdb.retention.time=3d'  # เปลี่ยนเป็น 1d, 7d, 14d
```

Apply ใหม่:

```bash
kubectl apply -f k8s/monitoring/prometheus-minimal.yaml
kubectl -n pose-monitoring rollout restart deployment prometheus
```

**หมายเหตุ:** เก็บนานขึ้น = ใช้ RAM มากขึ้น

---

### **เพิ่ม/ลด Resources**

แก้ไข `prometheus-minimal.yaml`:

```yaml
resources:
  requests:
    memory: "128Mi"  # เพิ่มถ้าต้องการ
    cpu: "50m"
  limits:
    memory: "256Mi"  # เพิ่มถ้าต้องการ
    cpu: "200m"
```

---

## 🛠️ Troubleshooting

### **ปัญหา: Targets ไม่ขึ้น (DOWN)**

```bash
# 1. เช็คว่า services มี label ถูกต้อง
kubectl -n pose-microservices get svc --show-labels

# ควรเห็น: app=gateway-api, app=auth-service, etc.

# 2. เช็คว่า services มี /metrics endpoint
kubectl exec -n pose-microservices \
  $(kubectl get pod -n pose-microservices -l app=gateway-api -o jsonpath='{.items[0].metadata.name}') \
  -- curl -s http://localhost:3000/metrics

# 3. เช็ค Prometheus logs
kubectl -n pose-monitoring logs -f $(kubectl get pod -n pose-monitoring -l app=prometheus -o jsonpath='{.items[0].metadata.name}')
```

---

### **ปัญหา: Prometheus Pod Pending**

```bash
# เช็คว่าทำไม Pending
kubectl -n pose-monitoring describe pod $(kubectl get pod -n pose-monitoring -l app=prometheus -o jsonpath='{.items[0].metadata.name}')

# มักเป็นเพราะ:
# 1. RAM ไม่พอ → ลด limits ใน yaml
# 2. CPU ไม่พอ → ลด limits ใน yaml
```

---

### **ปัญหา: Out of Memory (OOMKilled)**

```bash
# เพิ่ม memory limits
# แก้ไข prometheus-minimal.yaml:
resources:
  limits:
    memory: "512Mi"  # เพิ่มจาก 256Mi

# หรือลดระยะเวลาเก็บข้อมูล
args:
  - '--storage.tsdb.retention.time=1d'  # ลดจาก 3d
```

---

### **ปัญหา: ไม่เห็น Metrics**

```bash
# 1. ตรวจสอบว่า MetricsModule ถูก import ใน service
# ดูที่: backend/apps/*/src/*.module.ts
# ต้องมี: imports: [MetricsModule]

# 2. ตรวจสอบว่า /metrics route มี
curl http://localhost:3000/metrics  # gateway
curl http://localhost:3001/metrics  # auth
curl http://localhost:3002/metrics  # item
curl http://localhost:3003/metrics  # email
curl http://localhost:3004/metrics  # category

# 3. Restart services
kubectl -n pose-microservices rollout restart deployment gateway-api
kubectl -n pose-microservices rollout restart deployment auth-service
```

---

## 📈 เทียบกับ Full Stack

| คุณสมบัติ | Prometheus Minimal | Full Stack (kube-prometheus-stack) |
|-----------|-------------------|-----------------------------------|
| **RAM Usage** | ~150MB | ~1.5-2GB |
| **Pods** | 1 | 7-12 |
| **Metrics Collection** | ✅ | ✅ |
| **PromQL Queries** | ✅ | ✅ |
| **Grafana Dashboards** | ❌ | ✅ |
| **Alertmanager** | ❌ | ✅ |
| **Node Exporter** | ❌ | ✅ |
| **Service Discovery** | ✅ | ✅ |
| **แนะนำสำหรับ** | RAM 4-8GB | RAM 16GB+ |

---

## 🚀 ขั้นตอนถัดไป (Optional)

### **เพิ่ม Grafana บน Docker (แยกจาก K3s)**

ถ้าอยาก Dashboard สวยโดยไม่กระทบ K3s:

```bash
# ติดตั้ง Grafana บน Docker (นอก K3s)
docker run -d \
  --name grafana \
  --restart always \
  -p 3001:3000 \
  -e GF_SECURITY_ADMIN_PASSWORD=admin123 \
  grafana/grafana:latest

# เปิดเบราว์เซอร์:
# http://YOUR_SERVER_IP:3001

# เพิ่ม Data Source:
# Type: Prometheus
# URL: http://YOUR_SERVER_IP:30090
```

ใช้ RAM เพิ่มแค่ **~100MB** แต่ได้ Dashboard สวย!

---

### **ติดตั้ง Uptime Kuma (แนะนำ)**

สำหรับ Health Monitoring และ Alert:

```bash
# ติดตั้งบน Docker (นอก K3s)
docker run -d \
  --name uptime-kuma \
  --restart always \
  -p 3002:3001 \
  -v /var/uptime-kuma:/app/data \
  louislam/uptime-kuma:1

# เปิดเบราว์เซอร์:
# http://YOUR_SERVER_IP:3002

# เพิ่ม Monitors:
# - HTTP: http://YOUR_SERVER_IP:3000/api (Gateway)
# - HTTP: http://YOUR_SERVER_IP:3001/health (Auth)
# ฯลฯ
```

ใช้ RAM เพิ่มแค่ **~80MB** แต่ได้ Alert!

---

## 📞 API Access (Optional)

### **Query Metrics ผ่าน API**

```bash
# Current value
curl 'http://YOUR_SERVER_IP:30090/api/v1/query?query=up'

# Range query (last 5 minutes)
curl 'http://YOUR_SERVER_IP:30090/api/v1/query_range?query=rate(http_requests_total[5m])&start=2024-01-01T00:00:00Z&end=2024-01-01T00:05:00Z&step=15s'

# Series metadata
curl 'http://YOUR_SERVER_IP:30090/api/v1/series?match[]=http_requests_total'
```

---

## 🗑️ การถอนการติดตั้ง

```bash
# ลบ Prometheus Minimal
kubectl delete -f k8s/monitoring/prometheus-minimal.yaml

# หรือลบทั้ง namespace
kubectl delete namespace pose-monitoring
```

---

## 📚 Resources

- **Prometheus Documentation**: https://prometheus.io/docs/
- **PromQL Basics**: https://prometheus.io/docs/prometheus/latest/querying/basics/
- **API Reference**: https://prometheus.io/docs/prometheus/latest/querying/api/

---

## ✅ สรุป

**Prometheus Minimal เหมาะกับ:**
- ✅ Production server ที่มี RAM จำกัด
- ✅ ต้องการ metrics เบื้องต้น
- ✅ ใช้ PromQL queries
- ✅ ไม่ต้องการ Dashboard สวยมาก

**ไม่เหมาะกับ:**
- ❌ ต้องการ Grafana Dashboard
- ❌ ต้องการ Alert ซับซ้อน
- ❌ ต้องการ Node/Cluster monitoring

---

**🎉 เสร็จสิ้น - Prometheus Minimal พร้อมใช้งาน!**

Access: `http://YOUR_SERVER_IP:30090`

