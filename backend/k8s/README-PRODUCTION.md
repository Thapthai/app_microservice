# POSE Microservices - Production Guide (K3s)
# คู่มือ Production POSE Microservices (K3s)

**Version:** 2.0  
**Last Updated:** January 2025

---

## 📋 Table of Contents / สารบัญ
- [Why K3s? / ทำไมต้อง K3s?](#why-k3s--ทำไมต้อง-k3s)
- [Prerequisites / ข้อกำหนดเบื้องต้น](#prerequisites--ข้อกำหนดเบื้องต้น)
- [🏭 Install K3s](#-install-k3s)
- [🚀 Deploy Application](#-deploy-application)
- [🔍 Monitoring Setup](#-monitoring-setup)
- [🔧 Maintenance](#-maintenance--การบำรุงรักษา)
- [🐛 Troubleshooting](#-troubleshooting--การแก้ปัญหา)

---

## Why K3s? / ทำไมต้อง K3s?

**K3s** คือ Lightweight Kubernetes ที่เหมาะสำหรับ production บน single server

### เปรียบเทียบ Minikube vs K3s

| Feature | Minikube | K3s |
|---------|----------|-----|
| **วัตถุประสงค์** | Development/Testing | Production-ready |
| **RAM Usage** | 2-4 GB | 512 MB - 1 GB |
| **CPU Usage** | สูง (nested virtualization) | ต่ำ (native) |
| **Startup Time** | ช้า (1-2 นาที) | เร็ว (10-20 วินาที) |
| **Load Balancer** | ต้องติดตั้งเอง | ✅ Built-in (Traefik) |
| **Storage** | ต้องตั้งค่า | ✅ Built-in (local-path) |
| **Production Use** | ❌ ไม่แนะนำ | ✅ แนะนำ |

---

## Prerequisites / ข้อกำหนดเบื้องต้น

**ข้อกำหนดขั้นต่ำ:**
- **RAM:** 2 GB+ (แนะนำ 4 GB+)
- **CPU:** 2+ cores
- **Disk:** 20 GB+ free space
- **Docker:** ติดตั้งแล้ว (สำหรับ build images)

**⚠️ หมายเหตุสำคัญ:**
- **ไม่ต้องติดตั้ง Node.js บน server** - Dockerfile จะ build TypeScript เองข้างใน
- **ไม่ต้องติดตั้ง npm บน server** - ใช้ Docker multi-stage build
- แค่มี **Docker** และ **K3s** ก็พอ!
- **OS:** Ubuntu 20.04+, Debian 10+, CentOS 7+, RHEL 8+

**Required Software:**
- Docker (for building images)
- kubectl (will be configured automatically)

---

## 🏭 Install K3s

### 1. ติดตั้ง K3s

```bash
# ติดตั้ง K3s
curl -sfL https://get.k3s.io | sh -

# ตรวจสอบสถานะ
sudo systemctl status k3s

# ดู nodes
sudo k3s kubectl get nodes
```

**ผลลัพธ์:**
```
NAME     STATUS   ROLES                  AGE   VERSION
server   Ready    control-plane,master   30s   v1.28.x+k3s1
```

---

### 2. Setup kubectl

```bash
# ตั้งค่า KUBECONFIG (เพื่อใช้ kubectl โดยไม่ต้อง sudo)
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

# เพิ่มใน bashrc เพื่อให้ใช้งานได้ตลอด
echo 'export KUBECONFIG=/etc/rancher/k3s/k3s.yaml' >> ~/.bashrc
source ~/.bashrc

# ทดสอบ
kubectl get nodes
kubectl cluster-info
```

---

### 3. Build และ Import Docker Images

**⚠️ สำคัญ:** 
- Dockerfile ใช้ **multi-stage build** - จะ build TypeScript เองข้างใน Docker
- **ไม่ต้องติดตั้ง Node.js บน server**
- K3s ใช้ **containerd** ต้อง import images เข้า K3s

```bash
cd /var/www/app_microservice/backend

# 1. Pull code ล่าสุด
git pull origin main

# 2. Build Docker images (Docker จะ build TypeScript ให้เอง)
docker build --target production -f docker/Dockerfile.auth -t backend-auth-service:latest .
docker build --target production -f docker/Dockerfile.gateway -t backend-gateway-api:latest .
docker build --target production -f docker/Dockerfile.item -t backend-item-service:latest .
docker build --target production -f docker/Dockerfile.email -t backend-email-service:latest .
docker build --target production -f docker/Dockerfile.category -t backend-category-service:latest .
docker build --target production -f docker/Dockerfile.medical-supplies -t backend-medical-supplies-service:latest .
docker build --target production -f docker/Dockerfile.report -t backend-report-service:latest .
docker build --target production -f docker/Dockerfile.department -t backend-department-service:latest .


# 3. Import images เข้า K3s
docker save \
  backend-gateway-api:latest \
  backend-auth-service:latest \
  backend-item-service:latest \
  backend-email-service:latest \
  backend-category-service:latest \
  backend-medical-supplies-service:latest \
  backend-report-service:latest \
  backend-department-service:latest \
  | sudo k3s ctr images import -

# 4. Pull Redis image
docker pull redis:7-alpine
docker save redis:7-alpine | sudo k3s ctr images import -

# 5. ตรวจสอบว่า import สำเร็จ
sudo k3s ctr images ls | grep -E "(backend|redis)"
```

**ผลลัพธ์ควรเห็น 8 images (7 backend services + 1 redis):**
- docker.io/library/backend-gateway-api:latest ✅
- docker.io/library/backend-auth-service:latest ✅
- docker.io/library/backend-item-service:latest ✅
- docker.io/library/backend-email-service:latest ✅
- docker.io/library/backend-category-service:latest ✅
- docker.io/library/backend-medical-supplies-service:latest ✅
- docker.io/library/backend-report-service:latest ✅
- docker.io/library/redis:7-alpine ✅

**📝 หมายเหตุ:** 
- ทุก service มี Dockerfile ที่สอดคล้องกัน (Dockerfile.{service-name})
- ทุก service deploy แยกกันและเชื่อมต่อผ่าน TCP microservices

**💡 Tips:**
- Build ใหม่เมื่อมีการแก้ code: รัน `docker build` และ `k3s ctr images import` อีกครั้ง
- ลบ pods เก่าเพื่อใช้ image ใหม่: `kubectl delete pod -n pose-microservices --all`

---

## 🚀 Deploy Application

### 📦 Services Overview

**Backend Services ที่ Deploy (7 services):**
1. **gateway-api** - API Gateway (Port 3000)
2. **auth-service** - Authentication Service (Port 3001)
3. **item-service** - Item Management Service (Port 3002)
4. **email-service** - Email Notification Service (Port 3003)
5. **category-service** - Category Management Service (Port 3004)
6. **medical-supplies-service** - Medical Supplies Service (Port 3008)
7. **report-service** - Report Generation Service (Port 3006)

**Infrastructure:**
- **redis** - Cache & Session Store (Port 6379)

**📝 หมายเหตุ:**
- ทุก service มี Dockerfile และ deployment.yaml ที่สอดคล้องกัน
- จำนวน Docker images ทั้งหมด: **8 images** (7 backend services + 1 redis)
- ทุก service เชื่อมต่อกันผ่าน TCP microservices และ gateway-api เป็น entry point

---

### 1. Setup Secrets

```bash

export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
# สร้าง namespace
kubectl create namespace pose-microservices

# สร้าง secrets
kubectl -n pose-microservices create secret generic pose-secrets \
  --from-literal=DATABASE_URL="mysql://user:pass@your-db-host:3306/dbname" \
  --from-literal=JWT_SECRET="$(openssl rand -base64 32)" \
  --from-literal=SMTP_USER="your-email@gmail.com" \
  --from-literal=SMTP_PASS="your-app-password" \
  --from-literal=GOOGLE_CLIENT_ID="your-google-client-id" \
  --from-literal=GOOGLE_CLIENT_SECRET="your-google-client-secret" \
  --from-literal=MICROSOFT_CLIENT_ID="your-microsoft-client-id" \
  --from-literal=MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"

# ตรวจสอบ
kubectl -n pose-microservices get secrets
```

**⚠️ สำคัญ:** ถ้า password มีอักขระพิเศษ (เช่น `$`, `@`, `#`) ต้อง URL encode:
```bash
# ตัวอย่าง: password "Pass$word123" → "Pass%24word123"
DATABASE_URL="mysql://user:password@localhost/dbname"
```

---

### 2. Deploy Application

```bash
# Deploy (จาก backend directory)
cd backend
kubectl apply -k k8s/overlays/development

#ลบ pod แล้วให้มันสร้างใหม่
kubectl delete pod -n pose-microservices --all

# รอให้ pods พร้อม
kubectl -n pose-microservices wait --for=condition=available --timeout=300s deployment --all

# ตรวจสอบ
kubectl -n pose-microservices get pods,svc
```

**ผลลัพธ์ที่คาดหวัง:**
```
NAME                                    READY   STATUS    RESTARTS   AGE
pod/auth-service-xxx                    1/1     Running   0          2m
pod/category-service-xxx                1/1     Running   0          2m
pod/email-service-xxx                   1/1     Running   0          2m
pod/gateway-api-xxx                     1/1     Running   0          2m
pod/item-service-xxx                    1/1     Running   0          2m
pod/medical-supplies-service-xxx        1/1     Running   0          2m
pod/report-service-xxx                   1/1     Running   0          2m
pod/redis-xxx                           1/1     Running   0          2m

NAME                       TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)
service/gateway-service    LoadBalancer   10.43.4.146     10.11.9.43    3000:31589/TCP
```

---

### 3. เข้าถึง API

K3s มี **Traefik** เป็น Load Balancer built-in

#### วิธีที่ 1: ใช้ LoadBalancer (แนะนำ)

```bash
# ตรวจสอบ External IP
kubectl -n pose-microservices get svc gateway-service

# เข้าถึงผ่าน LoadBalancer IP
curl http://YOUR_SERVER_IP:3000/api
```

#### วิธีที่ 2: ใช้ NodePort

```bash
# ดู NodePort
kubectl -n pose-microservices get svc gateway-service -o jsonpath='{.spec.ports[0].nodePort}'

# เข้าถึงผ่าน Server IP + NodePort
curl http://YOUR_SERVER_IP:31589/api
```

---

### 4. ทดสอบ API

```bash
# Health check
curl http://10.11.9.43:3000/api

# Register user
curl -X POST http://10.11.9.43:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# Login
curl -X POST http://10.11.9.43:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## 🔍 Monitoring Setup

POSE Microservices มีระบบ Monitoring ครบชุดสำหรับ Production:

### 📊 ครอบคลุม 4 ส่วนหลัก:
1. **Node Metrics** - Server/Hardware (CPU, RAM, Disk, Network)
2. **Load Balancer Metrics** - Traefik (Requests, Response Time, Traffic)
3. **Database Metrics** - Redis (Connections, Memory, Commands)
4. **Application Metrics** - NestJS Services (Custom metrics)

### 🚀 Quick Setup:

```bash
# 1. Install Prometheus + Grafana
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

kubectl create namespace pose-monitoring

helm upgrade --install kube-prometheus-stack \
  prometheus-community/kube-prometheus-stack \
  -n pose-monitoring \
  --set prometheus.prometheusSpec.retention=7d \
  --set prometheus.prometheusSpec.resources.requests.memory=512Mi \
  --set grafana.adminPassword=admin123 \
  --set prometheus-node-exporter.hostNetwork=false \
  --wait

# 2. Configure NodePort (Fixed ports - ต้องอยู่ในช่วง 30000-32767)
kubectl -n pose-monitoring patch svc kube-prometheus-stack-grafana \
  -p '{"spec":{"type":"NodePort","ports":[{"port":80,"targetPort":3000,"nodePort":30001,"name":"http-web"}]}}'

kubectl -n pose-monitoring patch svc kube-prometheus-stack-prometheus \
  -p '{"spec":{"type":"NodePort","ports":[{"port":9090,"targetPort":9090,"nodePort":30090,"name":"http-web"}]}}'
 
# 3. Apply custom monitoring configs (Traefik, Redis, Application)
kubectl apply -k k8s/monitoring/

# 4. Check status
kubectl -n pose-monitoring get pods
kubectl -n pose-monitoring get servicemonitor
```

### 🎯 Access URLs:

- **Grafana:** `http://YOUR_SERVER_IP:30001` (admin/admin123)
- **Prometheus:** `http://YOUR_SERVER_IP:30090`

### 📚 รายละเอียดเพิ่มเติม:

สำหรับคู่มือการใช้งาน Monitoring แบบละเอียด ดูที่:
- **[monitoring/README.md](monitoring/README.md)** - คู่มือ Monitoring ฉบับสมบูรณ์

เนื้อหาใน Monitoring README:
- ติดตั้งและตั้งค่า Prometheus + Grafana
- เพิ่ม Traefik, Redis, Application metrics
- Import Grafana dashboards
- ตัวอย่าง PromQL queries
- Troubleshooting

---

## 🔧 Maintenance / การบำรุงรักษา

### 1. ตรวจสอบสถานะ

```bash
# ดู pods
kubectl -n pose-microservices get pods

# ดู logs
kubectl -n pose-microservices logs -l app=gateway-api --tail=50 -f

# ดู resource usage
kubectl -n pose-microservices top pods

# ดู events
kubectl -n pose-microservices get events --sort-by='.lastTimestamp' | tail -20
```

---

### 2. Backup & Restore

#### Backup K3s Cluster

```bash
# Manual backup (รวม application + monitoring)
sudo k3s etcd-snapshot save --name backup-$(date +%Y%m%d-%H%M%S)

# List backups
sudo k3s etcd-snapshot list

# ดู backup location
ls -lh /var/lib/rancher/k3s/server/db/snapshots/
```

**หมายเหตุ:** K3s backup จะรวม:
- ✅ Application deployments
- ✅ Secrets และ ConfigMaps
- ✅ Prometheus + Grafana (ถ้าติดตั้งใน cluster)
- ✅ ทุกอย่างใน cluster

#### Restore from Backup

```bash
# Stop K3s
sudo systemctl stop k3s

# Restore
sudo k3s server --cluster-reset --cluster-reset-restore-path=/var/lib/rancher/k3s/server/db/snapshots/backup-20250108-120000

# Start K3s
sudo systemctl start k3s

# ตรวจสอบ
kubectl get nodes
kubectl -n pose-microservices get pods
kubectl -n monitoring get pods
```

---

### 3. Update Application

#### Update Single Service

```bash
# 1. Pull code ล่าสุด
cd /var/www/app_microservice/backend
git pull origin main

# 2. Rebuild image (ตัวอย่าง: auth-service)
docker build --target production -f docker/Dockerfile.auth -t backend-auth-service:latest .

# 3. Import ใหม่
docker save backend-auth-service:latest | sudo k3s ctr images import -

# 4. Restart deployment
kubectl -n pose-microservices rollout restart deployment/auth-service

# 5. ตรวจสอบ rollout
kubectl -n pose-microservices rollout status deployment/auth-service

# 6. ดู logs
kubectl -n pose-microservices logs -l app=auth-service --tail=50
```

#### Update All Services

```bash
# ใช้ script ที่มีอยู่แล้ว
cd /var/www/app_microservice/backend
chmod +x k8s/scripts/deploy-all-services.sh
./k8s/scripts/deploy-all-services.sh

# หรือ build และ import ทุก services ด้วยตัวเอง
docker build --target production -f docker/Dockerfile.auth -t backend-auth-service:latest .
docker build --target production -f docker/Dockerfile.gateway -t backend-gateway-api:latest .
docker build --target production -f docker/Dockerfile.item -t backend-item-service:latest .
docker build --target production -f docker/Dockerfile.email -t backend-email-service:latest .
docker build --target production -f docker/Dockerfile.category -t backend-category-service:latest .
docker build --target production -f docker/Dockerfile.medical-supplies -t backend-medical-supplies-service:latest .
docker build --target production -f docker/Dockerfile.report -t backend-report-service:latest .

docker save \
  backend-gateway-api:latest \
  backend-auth-service:latest \
  backend-item-service:latest \
  backend-email-service:latest \
  backend-category-service:latest \
  backend-medical-supplies-service:latest \
  backend-report-service:latest \
  | sudo k3s ctr images import -

# Restart all deployments
kubectl -n pose-microservices rollout restart deployment --all
```

---

### 4. Upgrade K3s

```bash
# ดูเวอร์ชันปัจจุบัน
k3s --version

# Backup ก่อน upgrade
sudo k3s etcd-snapshot save --name pre-upgrade-$(date +%Y%m%d)

# Upgrade
curl -sfL https://get.k3s.io | sh -

# ตรวจสอบ
kubectl get nodes
kubectl version
```

---

### 5. Cleanup & Maintenance

```bash
# ลบ unused images
sudo k3s crictl rmi --prune

# ดูพื้นที่ disk
df -h

# ดูขนาด K3s data
sudo du -sh /var/lib/rancher/k3s/

# ทำความสะอาด Docker (ถ้ามี)
docker system prune -a --volumes -f

# ทำความสะอาด system
sudo apt-get clean
sudo apt-get autoremove -y
```

---

## 🐛 Troubleshooting / การแก้ปัญหา

### 1. Pods ค้าง Pending

```bash
# ตรวจสอบ events
kubectl -n pose-microservices describe pod <pod-name>

# ตรวจสอบ node conditions
kubectl describe node

# แก้ไข: ตรวจสอบ disk space
df -h

# ถ้า disk เต็ม ให้ทำความสะอาด
docker system prune -a --volumes -f
sudo apt-get clean
sudo apt-get autoremove -y
```

---

### 2. ImagePullBackOff / ErrImagePull

```bash
# ตรวจสอบว่า images อยู่ใน K3s หรือไม่
sudo k3s ctr images ls | grep backend

# ถ้าไม่มี ให้ import ใหม่
docker save \
  backend-gateway-api:latest \
  backend-auth-service:latest \
  backend-item-service:latest \
  backend-email-service:latest \
  backend-category-service:latest \
  backend-medical-supplies-service:latest \
  | sudo k3s ctr images import -

# Restart pods
kubectl -n pose-microservices delete pods --all

# Watch pods
kubectl -n pose-microservices get pods -w
```

---

### 3. Disk Pressure (Node Taint)

```bash
# ตรวจสอบ disk usage
df -h

# ตรวจสอบ node taints
kubectl describe node | grep Taints

# ถ้าเห็น "node.kubernetes.io/disk-pressure"
# 1. ทำความสะอาด disk
docker system prune -a --volumes -f
sudo apt-get clean
sudo apt-get autoremove -y

# 2. ลบ taint (ชั่วคราว)
kubectl taint nodes <node-name> node.kubernetes.io/disk-pressure-

# 3. Restart pods
kubectl -n pose-microservices delete pods --all
```

---

### 4. CrashLoopBackOff

```bash
# ดู logs
kubectl -n pose-microservices logs <pod-name> --tail=100

# ดู previous logs (ถ้า pod restart)
kubectl -n pose-microservices logs <pod-name> --previous

# ตรวจสอบ DATABASE_URL
kubectl -n pose-microservices get secret pose-secrets -o jsonpath='{.data.DATABASE_URL}' | base64 -d

# ทดสอบ database connection
kubectl -n pose-microservices run test-db --rm -it --image=mysql:8 -- mysql -h YOUR_DB_HOST -u root -p
```

---

### 5. ไม่สามารถเข้า API ได้

```bash
# ตรวจสอบ pods
kubectl -n pose-microservices get pods

# ตรวจสอบ services
kubectl -n pose-microservices get svc

# ตรวจสอบ LoadBalancer IP
kubectl -n pose-microservices get svc gateway-service -o wide

# ทดสอบภายใน cluster
kubectl -n pose-microservices run test --rm -it --image=curlimages/curl -- sh
curl http://gateway-service:3000/api

# ทดสอบจากภายนอก
curl http://<EXTERNAL-IP>:3000/api
curl http://<SERVER-IP>:<NodePort>/api
```

---

### 6. K3s Service ไม่ทำงาน

```bash
# ตรวจสอบสถานะ K3s
sudo systemctl status k3s

# Restart K3s
sudo systemctl restart k3s

# ดู logs
sudo journalctl -u k3s -f

# ตรวจสอบ nodes
kubectl get nodes

# ตรวจสอบ system pods
kubectl -n kube-system get pods
```

---

### 7. Prometheus/Grafana ไม่ทำงาน

```bash
# ตรวจสอบ pods
kubectl -n pose-monitoring get pods

# ดู logs
kubectl -n pose-monitoring logs -l app.kubernetes.io/name=prometheus --tail=50
kubectl -n pose-monitoring logs -l app.kubernetes.io/name=grafana --tail=50

# Restart
kubectl -n pose-monitoring rollout restart deployment kube-prometheus-stack-grafana
kubectl -n pose-monitoring rollout restart statefulset prometheus-kube-prometheus-stack-prometheus
```

---

## 🔧 Troubleshooting

### **ปัญหา: Pods ไม่มี /metrics endpoint**

**สาเหตุ:** Docker images เป็นเวอร์ชันเก่าที่ยังไม่มี MetricsModule

**วิธีแก้:**
```bash
# 1. Rebuild images ใหม่
cd /var/www/app_microservice/backend
git pull origin main

docker build --target production -f docker/Dockerfile.item -t backend-item-service:latest .
docker build --target production -f docker/Dockerfile.auth -t backend-auth-service:latest .
docker build --target production -f docker/Dockerfile.gateway -t backend-gateway-api:latest .
docker build --target production -f docker/Dockerfile.email -t backend-email-service:latest .
docker build --target production -f docker/Dockerfile.category -t backend-category-service:latest .
docker build --target production -f docker/Dockerfile.medical-supplies -t backend-medical-supplies-service:latest .
docker build --target production -f docker/Dockerfile.report -t backend-report-service:latest .

# 2. Import เข้า k3s
docker save \
  backend-item-service:latest \
  backend-auth-service:latest \
  backend-gateway-api:latest \
  backend-email-service:latest \
  backend-category-service:latest \
  backend-medical-supplies-service:latest \
  backend-report-service:latest \
  | sudo k3s ctr images import -

# 3. ลบ pods เก่า
kubectl delete pod -n pose-microservices -l app=item-service

# 4. ทดสอบ metrics
kubectl exec -n pose-microservices $(kubectl get pod -n pose-microservices -l app=item-service -o jsonpath='{.items[0].metadata.name}') -- curl -s http://localhost:3002/metrics --max-time 5 | head -20
```

---

### **ปัญหา: kubectl error "tls: failed to verify certificate"**

**สาเหตุ:** ยังไม่ได้ตั้งค่า KUBECONFIG

**วิธีแก้:**
```bash
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
echo 'export KUBECONFIG=/etc/rancher/k3s/k3s.yaml' >> ~/.bashrc
source ~/.bashrc
```

---

### **ปัญหา: Image ใหม่ไม่ update ใน pods**

**สาเหตุ:** K3s ยังใช้ image เก่าที่ cache ไว้

**วิธีแก้:**
```bash
# 1. ลบ image เก่าใน k3s
sudo k3s ctr images rm docker.io/library/backend-item-service:latest

# 2. Import ใหม่
docker save backend-item-service:latest | sudo k3s ctr images import -

# 3. Delete pods
kubectl delete pod -n pose-microservices --all
```

---

### **ปัญหา: Build Docker ช้ามาก**

**แนะนำ:** ใช้ build cache หรือ build บน local แล้วส่งมา

**วิธีเร็วกว่า - Build บน Local (Mac/Windows):**
```bash
# บน Local
cd /path/to/app_microservice/backend
docker build --target production -f docker/Dockerfile.auth -t backend-auth-service:latest .
docker build --target production -f docker/Dockerfile.gateway -t backend-gateway-api:latest .
docker build --target production -f docker/Dockerfile.item -t backend-item-service:latest .
docker build --target production -f docker/Dockerfile.email -t backend-email-service:latest .
docker build --target production -f docker/Dockerfile.category -t backend-category-service:latest .
docker build --target production -f docker/Dockerfile.medical-supplies -t backend-medical-supplies-service:latest .
docker build --target production -f docker/Dockerfile.report -t backend-report-service:latest .

docker save \
  backend-gateway-api:latest \
  backend-auth-service:latest \
  backend-item-service:latest \
  backend-email-service:latest \
  backend-category-service:latest \
  backend-medical-supplies-service:latest \
  backend-report-service:latest \
  -o services.tar

# ส่งไป Server
scp services.tar root@YOUR_SERVER_IP:/tmp/

# บน Server
sudo k3s ctr images import /tmp/services.tar
kubectl delete pod -n pose-microservices --all
rm /tmp/services.tar
```

---

## 🎯 Best Practices

### ✅ ควรทำ:

1. **Backup เป็นประจำ** - ทำ K3s snapshot ก่อน update สำคัญ
2. **Monitor disk space** - ตรวจสอบ disk usage เป็นประจำ
3. **Set resource limits** - กำหนด CPU/RAM limits ทุก pods
4. **Update regularly** - Upgrade K3s ตาม security patches
5. **Use LoadBalancer** - เข้าถึง services ผ่าน LoadBalancer IP
6. **Monitor with Grafana** - ดู metrics เป็นประจำ
7. **Use deployment scripts** - ใช้ scripts ใน `k8s/scripts/` สำหรับ zero-downtime deployment
8. **Version control** - Tag Docker images ด้วย version numbers สำหรับ production

### ❌ ไม่ควรทำ:

1. **ไม่ backup** - อาจเสียข้อมูลเมื่อมีปัญหา
2. **ไม่ monitor disk space** - disk เต็มจะทำให้ pods ไม่ทำงาน
3. **ใช้ default secrets** - เปลี่ยน JWT_SECRET และ Grafana password
4. **ไม่ test ก่อน deploy** - ควร test ใน development ก่อน
5. **Delete pods โดยตรง** - ใช้ `kubectl rollout restart` แทนการ delete pods
6. **Build บน production server** - Build บน local แล้วส่ง images ไป server จะเร็วกว่า

---

## 📚 Additional Resources / แหล่งข้อมูลเพิ่มเติม

- [K3s Documentation](https://docs.k3s.io/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Monitoring Guide](./monitoring/DEPLOYMENT-GUIDE.md) - คู่มือ Monitoring แบบละเอียด
- [Zero Downtime Deployment](./ZERO-DOWNTIME-DEPLOYMENT.md) - คู่มือ Deploy แบบไม่มี downtime

---

## 📝 Changelog

### Version 2.0 (January 2025)
- ✅ เพิ่ม medical-supplies-service ใน build commands
- ✅ **เพิ่ม report-service:** สร้าง Dockerfile.report และ report-service-deployment.yaml
- ✅ แก้ไขจำนวน images จาก 6 เป็น 8 (7 backend services + 1 redis)
- ✅ เพิ่ม section สำหรับ update all services
- ✅ อัพเดท troubleshooting section ให้ครบถ้วน
- ✅ เพิ่ม best practices สำหรับ deployment
- ✅ ปรับปรุงคำแนะนำสำหรับ build บน local
- ✅ **ตรวจสอบและยืนยัน Services:** มี 7 backend services ที่ deploy จริง (auth, category, email, gateway, item, medical-supplies, report)
- ✅ **ยืนยัน Dockerfiles:** มี Dockerfile ครบทั้ง 7 services และสอดคล้องกับ deployments
- ✅ เพิ่ม Services Overview section เพื่อความชัดเจน

---

**สำหรับ Development (Local) ดูที่:** [README-DEVELOPMENT.md](./README-DEVELOPMENT.md)

**สำหรับคำถามหรือปัญหา กรุณาเปิด issue ใน repository**