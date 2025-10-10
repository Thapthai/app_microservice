# Complete Monitoring Stack Deployment Guide

คู่มือการติดตั้ง Monitoring Stack แบบครบถ้วน พร้อม 90 วันการเก็บ log

## 📋 สิ่งที่จะได้

1. ✅ **Node Exporter** - Full system metrics (CPU, Memory, Disk, Network)
2. ✅ **Database Monitoring** - PostgreSQL query performance และ statistics
3. ✅ **Load Balancer** - Traefik metrics (requests, response times, status codes)
4. ✅ **Application Metrics** - NestJS services (requests, latency, errors)
5. ✅ **Service Monitoring** - Health, uptime, request counts
6. ✅ **Prometheus** - 90 days retention
7. ✅ **Grafana** - Pre-configured dashboards

---

## 🚀 ขั้นตอนการติดตั้ง

### **1. เตรียม Namespace**

```bash
# สร้าง namespace สำหรับ monitoring
kubectl create namespace nline-monitoring

# Label namespace เพื่อให้ ServiceMonitor ทำงาน
kubectl label namespace nline-monitoring monitoring=enabled
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
  --namespace nline-monitoring \
  --values k8s/monitoring/prometheus-values.yaml \
  --wait

# ตรวจสอบการติดตั้ง
kubectl -n nline-monitoring get pods
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

### **4. ติดตั้ง MySQL Exporter**

```bash
cd /var/www/app_microservice/backend

# อัพเดท database connection string ใน secret
kubectl -n nline-monitoring edit secret mysql-exporter-secret

# แก้ไข data-source-name:
# Format: username:password@(hostname:port)/
# Example: exporter:your-password@(mysql.example.com:3306)/

# Deploy MySQL Exporter
kubectl apply -f k8s/monitoring/mysql-exporter.yaml

# ตรวจสอบ
kubectl -n nline-monitoring get pods -l app=mysql-exporter
kubectl -n nline-monitoring logs -l app=mysql-exporter
```

### **5. ติดตั้ง Application ServiceMonitors**

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

### **6. ติดตั้ง Grafana Dashboards**

```bash
cd /var/www/app_microservice/backend

# Apply dashboards ConfigMap
kubectl apply -f k8s/monitoring/grafana-dashboards.yaml

# Restart Grafana เพื่อโหลด dashboards
kubectl -n nline-monitoring rollout restart deployment kube-prometheus-stack-grafana

# รอให้ Grafana พร้อม
kubectl -n nline-monitoring rollout status deployment kube-prometheus-stack-grafana
```

### **7. เปิดใช้งาน Metrics ใน NestJS Apps**

ดู instructions ใน `nestjs-metrics-setup.md` เพื่อ:
1. ติดตั้ง `@willsoto/nestjs-prometheus`
2. เพิ่ม PrometheusModule ในแต่ละ service
3. เพิ่ม HTTP server สำหรับ metrics endpoint
4. Rebuild และ redeploy services

```bash
cd /var/www/app_microservice/backend

# ติดตั้ง dependencies
npm install --save @willsoto/nestjs-prometheus prom-client

# Rebuild services (ดู nestjs-metrics-setup.md สำหรับโค้ดที่ต้องแก้)
# ...

# Deploy services ใหม่
./deploy-all-services.sh
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
kubectl port-forward -n nline-monitoring svc/kube-prometheus-stack-prometheus 9090:9090

# เปิด browser: http://localhost:9090/targets
```

**ควรเห็น targets:**
- node-exporter (1/1)
- kube-state-metrics (1/1)
- mysql-exporter (1/1)
- auth-service (1/1)
- item-service (1/1)
- category-service (1/1)
- gateway-api (1/1)
- traefik (1/1)

### **2. ตรวจสอบ ServiceMonitors**

```bash
# ดู ServiceMonitors ทั้งหมด
kubectl get servicemonitors -A

# ตรวจสอบว่า Prometheus scrape ServiceMonitors
kubectl -n nline-monitoring logs prometheus-kube-prometheus-stack-prometheus-0 -c prometheus | grep servicemonitor
```

### **3. ทดสอบ Metrics Endpoints**

```bash
# ทดสอบ auth-service metrics
kubectl port-forward -n pose-microservices svc/auth-service 8080:8080
curl http://localhost:8080/metrics

# ทดสอบ MySQL exporter
kubectl port-forward -n nline-monitoring svc/mysql-exporter 9104:9104
curl http://localhost:9104/metrics
```

---

## 🐛 Troubleshooting

### **ปัญหา: Prometheus Pods Pending**

**สาเหตุ:** ไม่มี storage หรือ resource ไม่พอ

**วิธีแก้:**
```bash
# ตรวจสอบ PVC
kubectl -n nline-monitoring get pvc

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
kubectl -n nline-monitoring delete pod -l app.kubernetes.io/name=prometheus
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

### **ปัญหา: MySQL Exporter Error**

**สาเหตุ:** Connection string ผิดหรือ permissions ไม่พอ

**วิธีแก้:**
```bash
# ดู logs
kubectl -n nline-monitoring logs -l app=mysql-exporter

# อัพเดท connection string
kubectl -n nline-monitoring edit secret mysql-exporter-secret

# Restart exporter
kubectl -n nline-monitoring rollout restart deployment mysql-exporter
```

**สร้าง user สำหรับ monitoring (ใน MySQL):**
```sql
CREATE USER 'exporter'@'%' IDENTIFIED BY 'secure_password' WITH MAX_USER_CONNECTIONS 3;
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'exporter'@'%';
FLUSH PRIVILEGES;
```

### **ปัญหา: Grafana Dashboards ไม่แสดง**

**วิธีแก้:**
```bash
# ตรวจสอบ ConfigMap
kubectl -n nline-monitoring get configmap grafana-dashboards

# Restart Grafana
kubectl -n nline-monitoring rollout restart deployment kube-prometheus-stack-grafana

# Import dashboards manually ใน Grafana UI:
# Dashboard → Import → Upload JSON file
```

### **ปัญหา: Memory เต็ม**

**สาเหตุ:** Prometheus ใช้ memory เยอะเพราะเก็บ 90 วัน

**วิธีแก้:**
```bash
# ลด retention period
helm upgrade kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace nline-monitoring \
  --set prometheus.prometheusSpec.retention=30d \
  --set prometheus.prometheusSpec.retentionSize=20GB \
  --reuse-values

# หรือลด scrape interval
helm upgrade kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace nline-monitoring \
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

### **Database Metrics**
```promql
# Active connections
pg_stat_activity_count

# Slow queries
sum(rate(pg_stat_statements_calls{mean_exec_time > 1000}[5m]))

# Database size
pg_database_size_size_bytes
```

---

## 🔄 การอัพเดท Monitoring Stack

```bash
cd /var/www/app_microservice/backend

# อัพเดท Helm values
helm upgrade kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace nline-monitoring \
  --values k8s/monitoring/prometheus-values.yaml

# อัพเดท ServiceMonitors
kubectl apply -f k8s/monitoring/application-servicemonitor.yaml
kubectl apply -f k8s/monitoring/traefik-servicemonitor.yaml

# อัพเดท Dashboards
kubectl apply -f k8s/monitoring/grafana-dashboards.yaml
kubectl -n nline-monitoring rollout restart deployment kube-prometheus-stack-grafana
```

---

## 🗑️ การถอนการติดตั้ง

```bash
# Uninstall Helm chart
helm uninstall kube-prometheus-stack -n nline-monitoring

# ลบ PVCs (ข้อมูล Prometheus และ Grafana จะหายไป!)
kubectl -n nline-monitoring delete pvc --all

# ลบ ServiceMonitors
kubectl delete -f k8s/monitoring/application-servicemonitor.yaml
kubectl delete -f k8s/monitoring/traefik-servicemonitor.yaml

# ลบ MySQL Exporter
kubectl delete -f k8s/monitoring/mysql-exporter.yaml

# ลบ namespace
kubectl delete namespace nline-monitoring
```

---

## 📚 เอกสารเพิ่มเติม

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Kube Prometheus Stack](https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack)
- [MySQL Exporter](https://github.com/prometheus/mysqld_exporter)
- [NestJS Prometheus](https://github.com/willsoto/nestjs-prometheus)

