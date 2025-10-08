# POSE Microservices - Development Guide (Minikube)
# คู่มือพัฒนา POSE Microservices (Minikube)

---

## 📋 Table of Contents / สารบัญ
- [Prerequisites / ข้อกำหนดเบื้องต้น](#prerequisites--ข้อกำหนดเบื้องต้น)
- [🔧 Setup Minikube](#-setup-minikube)
- [🚀 Deploy Application](#-deploy-application)
- [⚙️ Resource Management (CPU & RAM)](#️-resource-management-cpu--ram--การจัดการทรัพยากร)
- [🔍 Monitoring (Prometheus + Grafana)](#-monitoring-prometheus--grafana--การมอนิเตอร์)
- [🐛 Troubleshooting](#-troubleshooting--การแก้ปัญหา)

---

## Prerequisites / ข้อกำหนดเบื้องต้น

**Required / จำเป็น:**
- Docker Desktop (with sufficient resources)
  - Docker Desktop (ที่มีทรัพยากรเพียงพอ)
- kubectl (configured for your cluster)
  - kubectl (ตั้งค่าสำหรับ cluster ของคุณ)
- minikube (with docker driver)
  - minikube (ใช้ docker driver)

**Recommended Resources / ทรัพยากรที่แนะนำ:**
- CPU: 4+ cores
- RAM: 6-8 GB
- Disk: 20+ GB free space

**Optional / ไม่บังคับ:**
- Helm (for monitoring)
  - Helm (สำหรับ monitoring)

---

## 🔧 Setup Minikube

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

---

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

---

### 3. Setup Secrets / ตั้งค่าข้อมูลลับ

**⚠️ สำคัญ: ต้องตั้งค่าก่อน Deploy!**

**วิธีที่ 1: ใช้ stringData (แนะนำ - ง่ายที่สุด)**

```bash
# 1. Copy template (จาก project root)
cp backend/k8s/base/secrets.yaml.example backend/k8s/base/secrets.yaml

# 2. แก้ไขค่าใน backend/k8s/base/secrets.yaml
# - DATABASE_URL: ใส่ connection string ของฐานข้อมูลคุณ
# - JWT_SECRET: สร้างด้วย openssl rand -base64 32
# - SMTP_USER/PASS: ใส่ Gmail และ App Password
# - GOOGLE_CLIENT_ID/SECRET: จาก Google Cloud Console
# - MICROSOFT_CLIENT_ID/SECRET: จาก Azure Portal

# 3. ไฟล์ secrets.yaml จะไม่ถูก commit (อยู่ใน .gitignore แล้ว)
```

**วิธีที่ 2: ใช้ env file (สำหรับอัปเดตภายหลัง)**

```bash
# สร้างไฟล์ env.secrets (plain text) - จาก backend directory
cd backend
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

---

## 🚀 Deploy Application

### 1. Deploy Application / Deploy แอปพลิเคชัน

```bash
# Deploy development overlay / Deploy โหมดพัฒนา (จาก backend directory)
cd backend
kubectl apply -k k8s/overlays/development

# Wait for all pods to be ready / รอให้ pods พร้อม
kubectl -n pose-microservices wait --for=condition=available --timeout=300s deployment --all

# Check status / ตรวจสอบสถานะ
kubectl -n pose-microservices get pods,svc
```

---

### 2. Access API / เข้าถึง API

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

---

### 3. Update Secrets (Optional) / อัปเดต Secrets (ถ้าต้องการ)

**ถ้าต้องการเปลี่ยนค่า secrets หลัง deploy แล้ว:**

```bash
# วิธีที่ 1: แก้ไข secrets.yaml แล้ว apply ใหม่
nano backend/k8s/base/secrets.yaml
kubectl apply -f backend/k8s/base/secrets.yaml
kubectl -n pose-microservices rollout restart deployment

# วิธีที่ 2: ใช้ env file (เร็วกว่า)
cd backend
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

---

### 4. Testing / ทดสอบ

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

---

### 5. Stop & Cleanup / หยุดและทำความสะอาด

```bash
# Stop tunnel (Ctrl+C in tunnel terminal)
# หยุด tunnel (กด Ctrl+C ในเทอร์มินัลที่รัน tunnel)

# Delete resources / ลบทรัพยากร (จาก backend directory)
cd backend
kubectl delete -k k8s/overlays/development
kubectl delete namespace pose-microservices

# Stop minikube (optional) / หยุด minikube (ถ้าต้องการ)
minikube stop
```

---

## ⚙️ Resource Management (CPU & RAM) / การจัดการทรัพยากร

### ทำไมต้องกำหนด Resource Limits?

การกำหนด **requests** และ **limits** สำหรับ CPU และ RAM มีความสำคัญเพราะ:

1. **Resource Requests** - ทรัพยากรขั้นต่ำที่ pod ต้องการ (Kubernetes จะจองให้)
2. **Resource Limits** - ทรัพยากรสูงสุดที่ pod สามารถใช้ได้ (ป้องกันไม่ให้ใช้เกิน)

**ผลกระทบถ้าไม่กำหนด:**
- ❌ Pods อาจใช้ทรัพยากรมากเกินไป ทำให้ node ล้ม
- ❌ Kubernetes ไม่รู้ว่าควรจัดสรร pod ไปที่ node ไหน
- ❌ ไม่มี QoS (Quality of Service) ที่ชัดเจน

---

### 1. ตัวอย่างการกำหนด Resources

**แก้ไขไฟล์ deployment (เช่น `backend/k8s/base/gateway-deployment.yaml`):**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gateway-api
  namespace: pose-microservices
spec:
  replicas: 1
  selector:
    matchLabels:
      app: gateway-api
  template:
    metadata:
      labels:
        app: gateway-api
    spec:
      containers:
      - name: gateway-api
        image: backend-gateway-api:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 3000
        env:
        - name: PORT
          value: "3000"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: pose-secrets
              key: JWT_SECRET
        # 🔥 เพิ่ม Resource Limits ตรงนี้
        resources:
          requests:
            cpu: "100m"        # ขั้นต่ำ 0.1 CPU core
            memory: "128Mi"    # ขั้นต่ำ 128 MB RAM
          limits:
            cpu: "500m"        # สูงสุด 0.5 CPU core
            memory: "512Mi"    # สูงสุด 512 MB RAM
        # Health checks
        livenessProbe:
          httpGet:
            path: /api
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

---

### 2. คำแนะนำ Resource Limits สำหรับแต่ละ Service

| Service | CPU Request | CPU Limit | Memory Request | Memory Limit | หมายเหตุ |
|---------|-------------|-----------|----------------|--------------|----------|
| **Gateway API** | 100m | 500m | 128Mi | 512Mi | รับ traffic หลัก |
| **Auth Service** | 100m | 500m | 256Mi | 512Mi | ใช้ JWT, bcrypt (CPU intensive) |
| **Item Service** | 50m | 300m | 128Mi | 256Mi | CRUD ทั่วไป |
| **Category Service** | 50m | 300m | 128Mi | 256Mi | CRUD ทั่วไป |
| **Email Service** | 50m | 200m | 128Mi | 256Mi | ส่ง email (I/O bound) |
| **Redis** | 100m | 500m | 128Mi | 512Mi | In-memory cache |

**หน่วย CPU:**
- `1000m` = 1 CPU core
- `500m` = 0.5 CPU core
- `100m` = 0.1 CPU core

**หน่วย Memory:**
- `Mi` = Mebibyte (1 Mi = 1.048576 MB)
- `Gi` = Gibibyte (1 Gi = 1.073741824 GB)
- ตัวอย่าง: `512Mi` ≈ 536.87 MB

---

### 3. ตรวจสอบ Resource Usage

**ดูการใช้งานปัจจุบัน:**

```bash
# ดู CPU และ Memory ของทุก pods
kubectl -n pose-microservices top pods

# ตัวอย่างผลลัพธ์:
# NAME                              CPU(cores)   MEMORY(bytes)
# gateway-api-xxx                   50m          180Mi
# auth-service-xxx                  80m          250Mi
# item-service-xxx                  20m          120Mi
```

**ดู Resource Limits ที่กำหนดไว้:**

```bash
# ดู limits ของ pod
kubectl -n pose-microservices describe pod <pod-name> | grep -A 10 "Limits:"

# ดูทุก deployments
kubectl -n pose-microservices get deployments -o custom-columns=\
NAME:.metadata.name,\
CPU-REQ:.spec.template.spec.containers[0].resources.requests.cpu,\
CPU-LIM:.spec.template.spec.containers[0].resources.limits.cpu,\
MEM-REQ:.spec.template.spec.containers[0].resources.requests.memory,\
MEM-LIM:.spec.template.spec.containers[0].resources.limits.memory
```

**ดูการใช้งานแบบ real-time:**

```bash
# Watch mode (อัปเดตทุก 2 วินาที)
watch kubectl -n pose-microservices top pods

# หรือใช้ Grafana Dashboard (ดูส่วน Monitoring)
```

---

### 4. Horizontal Pod Autoscaling (HPA)

**สร้าง HPA สำหรับ Gateway API:**

```bash
# สร้าง HPA (scale ตาม CPU usage)
kubectl -n pose-microservices autoscale deployment gateway-api \
  --cpu-percent=70 \
  --min=1 \
  --max=5

# ตรวจสอบ
kubectl -n pose-microservices get hpa

# ดูรายละเอียด
kubectl -n pose-microservices describe hpa gateway-api
```

**หรือใช้ไฟล์ YAML:**

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: gateway-api-hpa
  namespace: pose-microservices
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: gateway-api
  minReplicas: 1
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70  # Scale เมื่อ CPU > 70%
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80  # Scale เมื่อ Memory > 80%
```

---

## 🔍 Monitoring (Prometheus + Grafana) / การมอนิเตอร์

### ติดตั้ง kube-prometheus-stack

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

---

### เข้าถึง Prometheus และ Grafana

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
# Login: admin / prom-operator
```

---

### 3. ใช้งาน Prometheus

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

---

### 4. ใช้งาน Grafana

เปิดเบราว์เซอร์: http://localhost:3001

**Login:**
- Username: `admin`
- Password: `prom-operator`

**วิธีดู Dashboards:**

1. คลิก **Dashboards** (เมนูซ้าย) → **Browse**
2. เลือก Dashboard ที่ต้องการ:
   - **Kubernetes / Compute Resources / Cluster** - ดูภาพรวม cluster
   - **Kubernetes / Compute Resources / Namespace (Pods)** - ดูแต่ละ namespace
   - **Kubernetes / Compute Resources / Pod** - ดูแต่ละ pod

**ดู POSE Microservices:**
1. เข้า **"Kubernetes / Compute Resources / Namespace (Pods)"**
2. เลือก Namespace: **`pose-microservices`**
3. จะเห็น CPU Usage, Memory Usage, Network I/O, Disk I/O

---

## 🐛 Troubleshooting / การแก้ปัญหา

### Pods ค้าง (Pending)
```bash
# ตรวจสอบ events
kubectl -n pose-microservices describe pod <pod-name>

# แก้ไข: เพิ่มทรัพยากรให้ minikube
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
# ตรวจสอบว่าอิมเมจถูกโหลดหรือยัง
minikube ssh -- "sudo crictl images | grep backend"

# โหลดอิมเมจใหม่
minikube image load backend-gateway-api:latest
```

### ไม่สามารถเข้า API ได้
```bash
# ตรวจสอบ service
kubectl -n pose-microservices get svc

# ตรวจสอบ tunnel (ต้องเปิดค้างไว้)
# เปิด terminal ใหม่แล้วรัน: minikube tunnel

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
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)

---

**สำหรับ Production Deployment ดูที่:** [README-PRODUCTION.md](./README-PRODUCTION.md)

**สำหรับคำถามหรือปัญหา กรุณาเปิด issue ใน repository**
