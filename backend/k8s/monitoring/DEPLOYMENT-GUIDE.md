# Complete Monitoring Stack Deployment Guide

คู่มือการติดตั้ง Monitoring Stack แบบครบถ้วน พร้อม 90 วันการเก็บ log

## 📋 สิ่งที่จะได้

1. ✅ **Node Exporter** - Full system metrics (CPU, Memory, Disk, Network)
2. ✅ **Load Balancer** - Traefik metrics (requests, response times, status codes)
3. ✅ **Application Metrics** - NestJS services (requests, latency, errors)
4. ✅ **Service Monitoring** - Health, uptime, request counts
5. ✅ **Prometheus** - 90 days retention
6. ✅ **Grafana** - Pre-configured dashboards

---

```bash
# ดู RAM
free -h

# ดู CPU
top
# กด 'q' เพื่อออก

# หรือดูแบบสรุป
top -bn1 | head -20

# เช็ค ทั้งหมด  
kubectl get pods -A -o wide

# Port mapping ของแต่ละ service จะอยู่ใน service object
kubectl get svc -A
```

## 🚀 ขั้นตอนการติดตั้ง

### **1. เตรียม Namespace**

```bash
# สร้าง namespace สำหรับ monitoring
kubectl create namespace pose-monitoring

# Label namespace เพื่อให้ ServiceMonitor ทำงาน
kubectl label namespace pose-monitoring monitoring=enabled
kubectl label namespace pose-microservices monitoring=enabled
kubectl label namespace kube-system monitoring=enabled
```

### **2. เพิ่ม Prometheus Helm Repository**

```bash
# เพิ่ม repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# ตรวจสอบว่าเพิ่มสำเร็จ
helm search repo prometheus
```

### **3. ติดตั้ง Prometheus Stack**

```bash
cd /var/www/app_microservice/backend

# ติดตั้งด้วย custom values
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace pose-monitoring \
  --values k8s/monitoring/prometheus-values.yaml \
  --wait

# ตรวจสอบการติดตั้ง
kubectl -n pose-monitoring get pods
```

**ผลลัพธ์ที่คาดหวัง:**

```
NAME                                                        READY   STATUS    RESTARTS   AGE
alertmanager-kube-prometheus-stack-alertmanager-0           2/2     Running   0          2m
kube-prometheus-stack-grafana-xxx                           3/3     Running   0          2m
kube-prometheus-stack-kube-state-metrics-xxx                1/1     Running   0          2m
kube-prometheus-stack-operator-xxx                          1/1     Running   0          2m
kube-prometheus-stack-prometheus-node-exporter-xxx          1/1     Running   0          2m
prometheus-kube-prometheus-stack-prometheus-0               2/2     Running   0          2m
```

### **4. ติดตั้ง Application ServiceMonitors**

```bash
cd /var/www/app_microservice/backend

# Deploy ServiceMonitors สำหรับ applications
kubectl apply -f k8s/monitoring/application-servicemonitor.yaml

# Deploy Traefik ServiceMonitor
kubectl apply -f k8s/monitoring/traefik-servicemonitor.yaml

# ตรวจสอบ ServiceMonitors
kubectl -n pose-microservices get servicemonitors
kubectl -n kube-system get servicemonitors
```

### **5. ติดตั้ง Grafana Dashboards**

```bash
cd /var/www/app_microservice/backend

# Apply dashboards ConfigMap
kubectl apply -f k8s/monitoring/grafana-dashboards.yaml

# Restart Grafana เพื่อโหลด dashboards
kubectl -n pose-monitoring rollout restart deployment kube-prometheus-stack-grafana

# รอให้ Grafana พร้อม
kubectl -n pose-monitoring rollout status deployment kube-prometheus-stack-grafana
```

### **6. เปิดใช้งาน Metrics ใน NestJS Apps**

ดู instructions ใน `nestjs-metrics-setup.md` เพื่อ:

1. ติดตั้ง `prom-client`
2. เพิ่ม MetricsModule ในแต่ละ service
3. Rebuild และ redeploy services

```bash
cd /var/www/app_microservice/backend

# ติดตั้ง dependencies (ติดตั้งไว้แล้ว)
npm install

# Build services
npm run build:all

# Build Docker images
docker build -f Dockerfile.auth -t auth-service:latest .
docker build -f Dockerfile.gateway -t gateway-api:latest .
docker build -f Dockerfile.item -t item-service:latest .
docker build -f Dockerfile.email -t email-service:latest .
docker build -f Dockerfile.category -t category-service:latest .

# Deploy services ใหม่
kubectl rollout restart deployment -n pose-microservices
```

---

## 🌐 เข้าถึง Monitoring UIs

### **Grafana**

```
URL: http://YOUR_SERVER_IP:30001
Username: admin
Password: admin123
```

### **Prometheus**

```
URL: http://YOUR_SERVER_IP:30090
```

### **Alertmanager**

```
URL: http://YOUR_SERVER_IP:30093
```

---

## 📊 Grafana Dashboards

หลังจากเข้า Grafana จะมี dashboards พร้อมใช้งาน:

1. **Node Exporter Full** - System metrics (CPU, Memory, Disk, Network)
2. **Database Query Performance** - Query times, connections, slow queries
3. **Load Balancer (Traefik)** - Requests/sec, response times, status codes
4. **Application Services** - Service health, request rates, errors, memory
5. **Service Health & Requests** - Uptime, request counts, top endpoints

---

## 🔍 ตรวจสอบการทำงาน

### **1. ตรวจสอบ Prometheus Targets**

```bash
# Port-forward Prometheus
kubectl port-forward -n pose-monitoring svc/kube-prometheus-stack-prometheus 9090:9090

# เปิด browser: http://localhost:9090/targets
```

**ควรเห็น targets:**

- node-exporter (1/1)
- kube-state-metrics (1/1)
- auth-service (1/1)
- item-service (1/1)
- category-service (1/1)
- email-service (1/1)
- gateway-api (1/1)
- traefik (1/1)

### **2. ตรวจสอบ ServiceMonitors**

```bash
# ดู ServiceMonitors ทั้งหมด
kubectl get servicemonitors -A

# ตรวจสอบว่า Prometheus scrape ServiceMonitors
kubectl -n pose-monitoring logs prometheus-kube-prometheus-stack-prometheus-0 -c prometheus | grep servicemonitor
```

### **3. ทดสอบ Metrics Endpoints**

```bash
# ทดสอบ auth-service metrics
kubectl port-forward -n pose-microservices svc/auth-service 8080:8080
curl http://localhost:8080/metrics

# ทดสอบ gateway-api metrics
kubectl port-forward -n pose-microservices svc/gateway-api 8080:8080
curl http://localhost:8080/metrics
```

---

## 🐛 Troubleshooting

### **ปัญหา: Prometheus Pods Pending**

**สาเหตุ:** ไม่มี storage หรือ resource ไม่พอ

**วิธีแก้:**

```bash
# ตรวจสอบ PVC
kubectl -n pose-monitoring get pvc

# ถ้า PVC pending ตรวจสอบ StorageClass
kubectl get storageclass

# ถ้าไม่มี local-path ให้สร้าง:
kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/master/deploy/local-path-storage.yaml
```

### **ปัญหา: ServiceMonitor ไม่ scrape**

**สาเหตุ:** Prometheus ไม่เห็น ServiceMonitor

**วิธีแก้:**

```bash
# ตรวจสอบ namespace labels
kubectl get namespace pose-microservices --show-labels

# เพิ่ม label ถ้าไม่มี
kubectl label namespace pose-microservices monitoring=enabled

# Restart Prometheus
kubectl -n pose-monitoring delete pod -l app.kubernetes.io/name=prometheus
```

### **ปัญหา: NestJS metrics ไม่มี**

**สาเหตุ:** ยังไม่ได้เพิ่ม PrometheusModule หรือ metrics port

**วิธีแก้:**

1. ตรวจสอบว่าติดตั้ง `@willsoto/nestjs-prometheus` แล้ว
2. ตรวจสอบว่าเพิ่ม PrometheusModule ใน module
3. ตรวจสอบว่าเปิด HTTP server port 8080 สำหรับ metrics
4. ตรวจสอบว่า Service มี port `http: 8080`
5. Rebuild และ redeploy service

```bash
# ทดสอบว่า metrics endpoint ทำงาน
kubectl port-forward -n pose-microservices svc/auth-service 8080:8080
curl http://localhost:8080/metrics
```

### **ปัญหา: Grafana Dashboards ไม่แสดง**

**วิธีแก้:**

```bash
# ตรวจสอบ ConfigMap
kubectl -n pose-monitoring get configmap grafana-dashboards

# Restart Grafana
kubectl -n pose-monitoring rollout restart deployment kube-prometheus-stack-grafana

# Import dashboards manually ใน Grafana UI:
# Dashboard → Import → Upload JSON file
```

### **ปัญหา: Memory เต็ม**

**สาเหตุ:** Prometheus ใช้ memory เยอะเพราะเก็บ 90 วัน

**วิธีแก้:**

```bash
# ลด retention period
helm upgrade kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace pose-monitoring \
  --set prometheus.prometheusSpec.retention=30d \
  --set prometheus.prometheusSpec.retentionSize=20GB \
  --reuse-values

# หรือลด scrape interval
helm upgrade kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace pose-monitoring \
  --set prometheus.prometheusSpec.scrapeInterval=1m \
  --reuse-values
```

---

## 📈 ตัวอย่าง Prometheus Queries

### **Node Metrics**

```promql
# CPU usage
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage
100 * (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes))

# Disk usage
100 - ((node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100)
```

### **Application Metrics**

```promql
# Request rate
sum(rate(http_requests_total[5m])) by (service)

# Error rate
sum(rate(http_requests_total{status_code=~"5.."}[5m])) by (service)

# Response time p95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) by (service)
```

---

## 🔄 การอัพเดท Monitoring Stack

```bash
cd /var/www/app_microservice/backend

# อัพเดท Helm values
helm upgrade kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace pose-monitoring \
  --values k8s/monitoring/prometheus-values.yaml

# อัพเดท ServiceMonitors
kubectl apply -f k8s/monitoring/application-servicemonitor.yaml
kubectl apply -f k8s/monitoring/traefik-servicemonitor.yaml

# อัพเดท Dashboards
kubectl apply -f k8s/monitoring/grafana-dashboards.yaml
kubectl -n pose-monitoring rollout restart deployment kube-prometheus-stack-grafana
```

---

## 🗑️ การถอนการติดตั้ง

```bash
# Uninstall Helm chart
helm uninstall kube-prometheus-stack -n pose-monitoring

# ลบ PVCs (ข้อมูล Prometheus และ Grafana จะหายไป!)
kubectl -n pose-monitoring delete pvc --all

# ลบ ServiceMonitors
kubectl delete -f k8s/monitoring/application-servicemonitor.yaml
kubectl delete -f k8s/monitoring/traefik-servicemonitor.yaml

# ลบ namespace
kubectl delete namespace pose-monitoring
```

---

## 📚 เอกสารเพิ่มเติม

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Kube Prometheus Stack](https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack)
- [prom-client](https://github.com/siimon/prom-client)
