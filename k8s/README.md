## POSE Microservices - Kubernetes Guide
## คู่มือ Kubernetes สำหรับ POSE Microservices

---

## 📋 Table of Contents / สารบัญ
- [Prerequisites / ข้อกำหนดเบื้องต้น](#prerequisites--ข้อกำหนดเบื้องต้น)
- [🔧 Development (Local - Minikube)](#-development-local---minikube)
- [🚀 Production Deployment](#-production-deployment)
- [🔍 Monitoring](#-monitoring-prometheus--grafana--การมอนิเตอร์)
  - [ติดตั้ง kube-prometheus-stack](#-monitoring-prometheus--grafana--การมอนิเตอร์)
  - [ใช้งาน Prometheus](#3-ใช้งาน-prometheus)
  - [ใช้งาน Grafana](#4-ใช้งาน-grafana)
- [🐛 Troubleshooting / การแก้ปัญหา](#-troubleshooting--การแก้ปัญหา)
  - [Monitoring Issues](#monitoring-issues--ปัญหาเกี่ยวกับ-monitoring)
  - [Application Issues](#application-issues--ปัญหาเกี่ยวกับ-application)

---

## Prerequisites / ข้อกำหนดเบื้องต้น

**Required / จำเป็น:**
- Docker (images built as `backend-*-service:latest` and `backend-gateway-api:latest`)
  - Docker (อิมเมจถูก build แล้วเป็น `backend-*-service:latest` และ `backend-gateway-api:latest`)
- kubectl (configured for your cluster)
  - kubectl (ตั้งค่าสำหรับ cluster ของคุณ)
- **For Dev:** minikube (with docker driver)
  - **สำหรับ Dev:** minikube (ใช้ docker driver)
- **For Production:** Kubernetes cluster (GKE, EKS, AKS, etc.)
  - **สำหรับ Production:** Kubernetes cluster (GKE, EKS, AKS, ฯลฯ)

**Optional / ไม่บังคับ:**
- Helm (for monitoring)
  - Helm (สำหรับ monitoring)

---

## 🔧 Development (Local - Minikube)

### 1. Start Minikube / เริ่ม Minikube

```bash
# Start minikube / เริ่ม minikube
minikube start --cpus=4 --memory=6144

# Enable required addons / เปิด addons ที่จำเป็น
minikube addons enable ingress
minikube addons enable default-storageclass
minikube addons enable storage-provisioner
minikube addons enable metrics-server

# Verify / ตรวจสอบ
minikube status
kubectl cluster-info
```

**หาก `minikube start` ล้มเหลว (K8S_APISERVER_MISSING, connection refused):**

<details>
<summary>คลิกเพื่อดูวิธีแก้ปัญหา</summary>

1. **ทำความสะอาดและรีสตาร์ท:**
   ```bash
   minikube stop
   minikube delete --all --purge
   # รีสตาร์ท Docker Desktop และตรวจสอบ Resources: CPUs ≥ 4, RAM ≥ 6-8GB
   ```

2. **เริ่มด้วย K8s เวอร์ชันเสถียร:**
   ```bash
   minikube start --driver=docker --kubernetes-version=v1.30.4 --cpus=4 --memory=6144 --wait=all --wait-timeout=8m
   kubectl cluster-info
   minikube status
   ```

3. **เปิด addons หลัง apiserver พร้อม:**
   ```bash
   minikube addons enable ingress
   minikube addons enable default-storageclass
   minikube addons enable storage-provisioner
   kubectl -n ingress-nginx get pods
   ```

4. **ตรวจสอบ logs:**
   ```bash
   minikube logs --file=./minikube.log
   ```

5. **ลองใช้ K8s เวอร์ชันเก่ากว่า:**
   ```bash
   minikube delete --all --purge
   minikube start --driver=docker --kubernetes-version=v1.29.10 --cpus=4 --memory=6144 --wait=all --wait-timeout=8m
   ```

</details>

### 2. Load Docker Images / โหลดอิมเมจ Docker

```bash
# Backend services / บริการ Backend
minikube image load backend-gateway-api:latest
minikube image load backend-auth-service:latest
minikube image load backend-item-service:latest
minikube image load backend-email-service:latest
minikube image load backend-category-service:latest

# Redis (optional - will auto-pull from Docker Hub)
# Redis (ไม่บังคับ - จะดึงจาก Docker Hub อัตโนมัติ)
minikube image load redis:7-alpine

# Verify / ตรวจสอบ
minikube ssh -- "sudo crictl images | egrep '(backend-|redis)'"
```

**หมายเหตุ:** NGINX Ingress Controller มาจาก addon ไม่ต้องโหลด

### 3. Setup Secrets / ตั้งค่าข้อมูลลับ

**⚠️ สำคัญ: ต้องตั้งค่าก่อน Deploy!**

**วิธีที่ 1: ใช้ stringData (แนะนำ - ง่ายที่สุด)**

```bash
# 1. Copy template
cp k8s/base/secrets.yaml.example k8s/base/secrets.yaml

# 2. แก้ไขค่าใน k8s/base/secrets.yaml
# - DATABASE_URL: ใส่ connection string ของฐานข้อมูลคุณ
# - JWT_SECRET: สร้างด้วย openssl rand -base64 32
# - SMTP_USER/PASS: ใส่ Gmail และ App Password
# - GOOGLE_CLIENT_ID/SECRET: จาก Google Cloud Console
# - MICROSOFT_CLIENT_ID/SECRET: จาก Azure Portal

# 3. ไฟล์ secrets.yaml จะไม่ถูก commit (อยู่ใน .gitignore แล้ว)
```

**วิธีที่ 2: ใช้ env file (สำหรับอัปเดตภายหลัง)**

```bash
# สร้างไฟล์ env.secrets (plain text)
cat > k8s/env.secrets << EOF
DATABASE_URL=mysql://user:pass@host:3306/dbname
JWT_SECRET=your-jwt-secret
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
EOF

# Apply โดยตรง (Kubernetes จะ encode ให้เอง)
kubectl -n pose-microservices create secret generic pose-secrets \
  --from-env-file=k8s/env.secrets \
  --dry-run=client -o yaml | kubectl apply -f -

# ลบไฟล์หลังใช้งาน (เพื่อความปลอดภัย)
rm k8s/env.secrets
```

**หมายเหตุความปลอดภัย:**
- `secrets.yaml` ถูก **ignore จาก git** แล้ว (ไม่ commit ขึ้น repo)
- Base64 **ไม่ใช่การเข้ารหัส** แต่เป็น encoding (ถอดกลับได้ง่าย)
- สำหรับ production ควรใช้ **Sealed Secrets** หรือ **External Secrets Operator**

### 4. Deploy Application / Deploy แอปพลิเคชัน

```bash
# Deploy development overlay / Deploy โหมดพัฒนา
kubectl apply -k k8s/overlays/development

# Wait for all pods to be ready / รอให้ pods พร้อม
kubectl -n pose-microservices wait --for=condition=available --timeout=300s deployment --all

# Check status / ตรวจสอบสถานะ
kubectl -n pose-microservices get pods,svc
```

### 5. Access API / เข้าถึง API

**วิธีที่ 1: ใช้ LoadBalancer + minikube tunnel (แนะนำ)**

```bash
# Terminal 1: เปิด tunnel (ต้องเปิดค้างไว้)
minikube tunnel

# Terminal 2: ทดสอบ API
curl http://localhost:3000/api
# หรือเปิดเบราว์เซอร์ http://localhost:3000/api
```

**ผลลัพธ์ที่คาดหวัง:**
```
Gateway API is running!
```

**วิธีที่ 2: ใช้ Port Forward (ไม่ต้อง tunnel)**

```bash
# เปิด port forward (ต้องเปิดค้างไว้)
kubectl -n pose-microservices port-forward svc/gateway-service 3000:3000

# Terminal อื่น: ทดสอบ API
curl http://localhost:3000/api
```

### 6. Update Secrets (Optional) / อัปเดต Secrets (ถ้าต้องการ)

**ถ้าต้องการเปลี่ยนค่า secrets หลัง deploy แล้ว:**

```bash
# วิธีที่ 1: แก้ไข secrets.yaml แล้ว apply ใหม่
nano k8s/base/secrets.yaml
kubectl apply -f k8s/base/secrets.yaml
kubectl -n pose-microservices rollout restart deployment

# วิธีที่ 2: ใช้ env file (เร็วกว่า)
cat > k8s/env.secrets << EOF
DATABASE_URL=mysql://user:pass@host:3306/dbname
JWT_SECRET=your-new-jwt-secret
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EOF

kubectl -n pose-microservices create secret generic pose-secrets \
  --from-env-file=k8s/env.secrets \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl -n pose-microservices rollout restart deployment
rm k8s/env.secrets
```

**ดูค่า Secret ที่ deploy แล้ว:**

```bash
# ดู secret (base64)
kubectl -n pose-microservices get secret pose-secrets -o yaml

# Decode ค่าเฉพาะ
kubectl -n pose-microservices get secret pose-secrets -o jsonpath='{.data.DATABASE_URL}' | base64 -d
```

### 7. Testing / ทดสอบ

**ใช้ curl:**
```bash
# Health check
curl http://localhost:3000/api

# Register user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**ใช้ Postman:**
- Base URL: `http://localhost:3000`
- Endpoints: `/api`, `/auth/register`, `/auth/login`, `/items`, etc.

### 8. Stop & Cleanup / หยุดและทำความสะอาด

```bash
# Stop tunnel (Ctrl+C in tunnel terminal)
# หยุด tunnel (กด Ctrl+C ในเทอร์มินัลที่รัน tunnel)

# Delete resources / ลบทรัพยากร
kubectl delete -k k8s/overlays/development
kubectl delete namespace pose-microservices

# Stop minikube (optional) / หยุด minikube (ถ้าต้องการ)
minikube stop
```

---

## 🚀 Production Deployment

### 1. Prerequisites / ข้อกำหนดเบื้องต้น

- Kubernetes cluster (GKE, EKS, AKS, etc.)
- kubectl configured to access your cluster
- Container registry (GHCR, ECR, GCR, Docker Hub)
- Domain name with DNS configured
- SSL/TLS certificates (optional, use cert-manager)

### 2. Push Images to Registry / Push อิมเมจไปยัง Registry

```bash
# Tag images / ติด tag อิมเมจ
docker tag backend-gateway-api:latest your-registry/backend-gateway-api:v1.0.0
docker tag backend-auth-service:latest your-registry/backend-auth-service:v1.0.0
docker tag backend-item-service:latest your-registry/backend-item-service:v1.0.0
docker tag backend-email-service:latest your-registry/backend-email-service:v1.0.0
docker tag backend-category-service:latest your-registry/backend-category-service:v1.0.0

# Push to registry / Push ไปยัง registry
docker push your-registry/backend-gateway-api:v1.0.0
docker push your-registry/backend-auth-service:v1.0.0
docker push your-registry/backend-item-service:v1.0.0
docker push your-registry/backend-email-service:v1.0.0
docker push your-registry/backend-category-service:v1.0.0
```

### 3. Update Production Overlay / อัปเดต Production Overlay

**แก้ไข `k8s/overlays/production/kustomization.yaml`:**

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - ../../base

namespace: pose-microservices

# Update image references / อัปเดตอ้างอิงอิมเมจ
images:
  - name: backend-gateway-api
    newName: your-registry/backend-gateway-api
    newTag: v1.0.0
  - name: backend-auth-service
    newName: your-registry/backend-auth-service
    newTag: v1.0.0
  - name: backend-item-service
    newName: your-registry/backend-item-service
    newTag: v1.0.0
  - name: backend-email-service
    newName: your-registry/backend-email-service
    newTag: v1.0.0
  - name: backend-category-service
    newName: your-registry/backend-category-service
    newTag: v1.0.0

# Production resource limits / ขีดจำกัดทรัพยากรโปรดักชัน
replicas:
  - name: gateway-api
    count: 3
  - name: auth-service
    count: 2
  - name: item-service
    count: 2
```

### 4. Configure Secrets / ตั้งค่าข้อมูลลับ

```bash
# Create production secrets / สร้าง secrets โปรดักชัน
kubectl create namespace pose-microservices

kubectl -n pose-microservices create secret generic pose-secrets \
  --from-literal=DATABASE_URL="mysql://user:pass@prod-host:3306/dbname" \
  --from-literal=JWT_SECRET="your-production-secret" \
  --from-literal=REDIS_URL="redis://redis-service:6379"

# If using private registry / ถ้าใช้ private registry
kubectl -n pose-microservices create secret docker-registry regcred \
  --docker-server=your-registry \
  --docker-username=your-username \
  --docker-password=your-password \
  --docker-email=your-email
```

### 5. Update Ingress / อัปเดต Ingress

**แก้ไข `k8s/base/ingress.yaml` สำหรับโปรดักชัน:**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: pose-ingress
  namespace: pose-microservices
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.yourdomain.com
    secretName: pose-tls
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: gateway-service
            port:
              number: 3000
```

### 6. Deploy to Production / Deploy ไปยังโปรดักชัน

```bash
# Apply production overlay / Apply overlay โปรดักชัน
kubectl apply -k k8s/overlays/production

# Wait for rollout / รอการ deploy
kubectl -n pose-microservices rollout status deployment --timeout=600s

# Verify / ตรวจสอบ
kubectl -n pose-microservices get pods,svc,ingress
```

### 7. Verify Production / ตรวจสอบโปรดักชัน

```bash
# Test API / ทดสอบ API
curl https://api.yourdomain.com/api

# Check logs / ตรวจสอบ logs
kubectl -n pose-microservices logs -l app=gateway-api --tail=100

# Monitor resources / มอนิเตอร์ทรัพยากร
kubectl -n pose-microservices top pods
```

---

## 🔍 Monitoring (Prometheus + Grafana) / การมอนิเตอร์

**ติดตั้ง kube-prometheus-stack:**

```bash
# Create monitoring namespace / สร้าง namespace monitoring
kubectl create namespace monitoring

# Add Helm repo / เพิ่ม Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install stack / ติดตั้ง stack
helm upgrade --install kube-prometheus-stack \
  prometheus-community/kube-prometheus-stack \
  -n monitoring --wait

# Check status / ตรวจสอบสถานะ
kubectl -n monitoring get pods
```

**เข้าถึง Prometheus และ Grafana:**

**⚠️ หมายเหตุ:** ถ้า `minikube tunnel` รันอยู่แล้ว ให้เปิด **terminal ใหม่** สำหรับ port-forward

**1. ดึง Grafana Password:**
```bash
# ดึง password ของ Grafana admin user
kubectl -n monitoring get secret kube-prometheus-stack-grafana -o jsonpath="{.data.admin-password}" | base64 -d && echo ""
# Default: prom-operator
```

**2. Port-Forward Services:**
```bash
# Terminal ใหม่ 1: Prometheus
kubectl -n monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090
# เปิดเบราว์เซอร์: http://localhost:9090

# Terminal ใหม่ 2: Grafana
kubectl -n monitoring port-forward svc/kube-prometheus-stack-grafana 3001:80
# เปิดเบราว์เซอร์: http://localhost:3001
# Login: admin / prom-operator (หรือ password ที่ได้จากคำสั่งข้างบน)
# (ใช้ port 3001 เพราะ 3000 ถูกใช้โดย API แล้ว)
```

**หรือถ้าไม่ได้ใช้ tunnel สามารถใช้ port 3000 สำหรับ Grafana ได้:**
```bash
kubectl -n monitoring port-forward svc/kube-prometheus-stack-grafana 3000:80
# เปิด http://localhost:3000
```

**3. ใช้งาน Prometheus:**

เปิดเบราว์เซอร์: http://localhost:9090

**ทดสอบ Queries:**
```promql
# ดูว่า services ทำงานหรือไม่
up

# ดู pods ใน pose-microservices
kube_pod_info{namespace="pose-microservices"}

# นับจำนวน pods
count(kube_pod_info{namespace="pose-microservices"})

# ดู CPU usage
rate(container_cpu_usage_seconds_total{namespace="pose-microservices"}[5m])

# ดู Memory usage
container_memory_working_set_bytes{namespace="pose-microservices"}
```

**ตรวจสอบ Targets:**
1. คลิก **Status** (เมนูบน)
2. เลือก **Targets**
3. จะเห็นรายการ services ทั้งหมดที่ Prometheus กำลัง monitor

**4. ใช้งาน Grafana:**

เปิดเบราว์เซอร์: http://localhost:3001

**Login:**
- Username: `admin`
- Password: `prom-operator` (หรือจากคำสั่ง get secret ข้างบน)

**วิธีดู Dashboards:**

**ก. ใช้ Built-in Dashboards (แนะนำ - ง่ายที่สุด):**
1. คลิก **Dashboards** (เมนูซ้าย) → **Browse**
2. เลือก Dashboard ที่ต้องการ:
   - **Kubernetes / Compute Resources / Cluster** - ดูภาพรวม cluster
   - **Kubernetes / Compute Resources / Namespace (Pods)** - ดูแต่ละ namespace
   - **Kubernetes / Compute Resources / Pod** - ดูแต่ละ pod
   - **Node Exporter / Nodes** - ดู node metrics

**ดู POSE Microservices:**
1. เข้า **"Kubernetes / Compute Resources / Namespace (Pods)"**
2. เลือก Namespace: **`pose-microservices`**
3. จะเห็น:
   - ✅ CPU Usage ของแต่ละ pod
   - ✅ Memory Usage
   - ✅ Network I/O
   - ✅ Disk I/O

**ข. Import NGINX Ingress Dashboard (ถ้าต้องการ):**
1. เข้า Grafana → **Dashboards** → **Import**
2. ใส่ Dashboard ID: **9614**
3. เลือก Datasource: **Prometheus**
4. คลิก **Import**

**หมายเหตุ:** Dashboard 9614 จะแสดงข้อมูลเมื่อ:
- NGINX Ingress Controller ถูกเปิดใช้งาน (`minikube addons enable ingress`)
- มีการใช้งาน API ผ่าน Ingress (ไม่ใช่ port-forward หรือ LoadBalancer)

**ค. ใช้ Explore (สำหรับ custom queries):**
1. คลิก **Explore** (เมนูซ้าย)
2. เลือก Datasource: **Prometheus**
3. พิมพ์ query (เช่น `up{namespace="pose-microservices"}`)
4. คลิก **Run query**

**ตัวอย่าง Metrics ที่น่าสนใจ:**
```promql
# Pod status
kube_pod_status_phase{namespace="pose-microservices", phase="Running"}

# Pod restarts
kube_pod_container_status_restarts_total{namespace="pose-microservices"}

# Network traffic (receive)
rate(container_network_receive_bytes_total{namespace="pose-microservices"}[5m])

# Network traffic (transmit)
rate(container_network_transmit_bytes_total{namespace="pose-microservices"}[5m])
```

**5. สิ่งที่ Prometheus + Grafana แสดง:**

**✅ แสดง (Infrastructure Metrics):**
- CPU, Memory, Network, Disk usage ของ pods
- Pod status (Running, Pending, Failed)
- Container restarts
- Node resources
- Kubernetes cluster health
- NGINX Ingress metrics (ถ้าเปิด ingress addon)

**❌ ไม่แสดง (Application Metrics):**
- จำนวน API calls ที่ user เรียกใช้
- Response time ของแต่ละ endpoint
- Business metrics (users registered, items created)

**ถ้าต้องการ Application Metrics:**
- ต้องเพิ่ม metrics library ใน NestJS (เช่น `@willsoto/nestjs-prometheus`)
- Export custom metrics จาก application
- Prometheus จะ scrape metrics เหล่านั้น

---

## 🐛 Troubleshooting / การแก้ปัญหา

### Monitoring Issues / ปัญหาเกี่ยวกับ Monitoring

#### Prometheus port-forward หลุด (lost connection to pod)
```bash
# ปัญหา: error: lost connection to pod
# สาเหตุ: Prometheus restart หรือ network timeout

# วิธีแก้: รัน port-forward ใหม่
kubectl -n monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090

# ทดสอบว่าพร้อมใช้งาน
curl http://localhost:9090/-/healthy
# ควรได้: Prometheus Server is Healthy.
```

#### Prometheus แสดง "Prometheus is starting and replaying the write-ahead log (WAL)"
```bash
# ปัญหา: Prometheus กำลัง loading data
# วิธีแก้: รอ 10-30 วินาที แล้วลองใหม่

# ตรวจสอบสถานะ
curl http://localhost:9090/-/healthy

# ถ้าพร้อมแล้ว จะได้: Prometheus Server is Healthy.
```

#### Prometheus Query Error: "Network error or unable to reach the server"
```bash
# สาเหตุ: port-forward หลุดหรือ Prometheus ยังไม่พร้อม

# 1. ตรวจสอบ port-forward ยังรันอยู่หรือไม่
ps aux | grep "port-forward.*9090"

# 2. รัน port-forward ใหม่
kubectl -n monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090

# 3. Refresh หน้าเบราว์เซอร์ (F5 หรือ Cmd+R)
```

#### Grafana Dashboard 9614 (NGINX Ingress) แสดง N/A
```bash
# สาเหตุ: NGINX Ingress Controller ไม่ได้เปิดใช้งาน

# วิธีแก้: เปิด ingress addon
minikube addons enable ingress

# ตรวจสอบว่า ingress controller ทำงาน
kubectl -n ingress-nginx get pods

# รอให้ pod พร้อม แล้ว refresh Grafana
```

**หมายเหตุ:** Dashboard 9614 จะแสดงข้อมูลเมื่อมีการใช้งาน API **ผ่าน Ingress** เท่านั้น  
ถ้าใช้ `minikube tunnel` (LoadBalancer) หรือ `port-forward` จะไม่มีข้อมูล

**ทางเลือก:** ใช้ Dashboard อื่นแทน:
- **315** - Kubernetes cluster monitoring
- **6417** - Kubernetes Cluster (Prometheus)
- **Kubernetes / Compute Resources / Namespace (Pods)** - Built-in dashboard

#### Grafana ไม่สามารถเชื่อมต่อ Prometheus
```bash
# ตรวจสอบ Data Source ใน Grafana:
# 1. เข้า Grafana → Configuration (⚙️) → Data Sources
# 2. คลิก "Prometheus"
# 3. ตรวจสอบ URL: http://kube-prometheus-stack-prometheus.monitoring.svc:9090
# 4. คลิก "Save & Test" ควรเห็น "Data source is working"

# ถ้าไม่ work ตรวจสอบ Prometheus service
kubectl -n monitoring get svc kube-prometheus-stack-prometheus

# ทดสอบเชื่อมต่อจากภายใน cluster
kubectl -n monitoring run test --rm -it --image=curlimages/curl -- sh
curl http://kube-prometheus-stack-prometheus:9090/-/healthy
```

#### Port conflict (Address already in use)
```bash
# ปัญหา: bind: address already in use

# หา process ที่ใช้ port
lsof -i :9090  # สำหรับ Prometheus
lsof -i :3001  # สำหรับ Grafana

# ปิด process เก่า
kill <PID>

# หรือใช้ port อื่น
kubectl -n monitoring port-forward svc/kube-prometheus-stack-prometheus 9091:9090
kubectl -n monitoring port-forward svc/kube-prometheus-stack-grafana 3002:80
```

---

### Application Issues / ปัญหาเกี่ยวกับ Application

### Pods ค้าง (Pending)
```bash
# ตรวจสอบ events
kubectl -n pose-microservices describe pod <pod-name>

# แก้ไข: เพิ่มทรัพยากรให้ minikube หรือลด replicas
minikube start --cpus=4 --memory=8192
```

### CrashLoopBackOff
```bash
# ดู logs
kubectl -n pose-microservices logs <pod-name>

# ตรวจสอบ DATABASE_URL และการเชื่อมต่อ
kubectl -n pose-microservices get secret pose-secrets -o yaml
```

### ImagePullBackOff
```bash
# ตรวจสอบว่าอิมเมจถูกโหลดหรือยัง (minikube)
minikube ssh -- "sudo crictl images | grep backend"

# โหลดอิมเมจใหม่
minikube image load backend-gateway-api:latest
```

### ไม่สามารถเข้า API ได้
```bash
# ตรวจสอบ service
kubectl -n pose-microservices get svc

# ตรวจสอบ tunnel (minikube)
# ต้องเปิด minikube tunnel ค้างไว้ในเทอร์มินัลแยก

# ทดสอบภายใน cluster
kubectl -n pose-microservices run test --rm -it --image=curlimages/curl -- sh
curl http://gateway-service:3000/api
```

### ดู Logs ทั้งหมด
```bash
# Logs ของ gateway
kubectl -n pose-microservices logs -l app=gateway-api --tail=100 -f

# Logs ของ auth service
kubectl -n pose-microservices logs -l app=auth-service --tail=100 -f
```

---

## 📚 Additional Resources / แหล่งข้อมูลเพิ่มเติม

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [Kustomize Documentation](https://kustomize.io/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)

---

**สำหรับคำถามหรือปัญหา กรุณาเปิด issue ใน repository**