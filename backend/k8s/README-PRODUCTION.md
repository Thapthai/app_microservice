# POSE Microservices - Production Guide (K3s)
# คู่มือ Production POSE Microservices (K3s)

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

### 2. ตั้งค่า kubectl (ไม่ต้องใช้ sudo)

```bash
# สร้าง directory สำหรับ kubeconfig
mkdir -p ~/.kube

# Copy kubeconfig
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config

# เปลี่ยน ownership
sudo chown $(id -u):$(id -g) ~/.kube/config

# Set permission
chmod 600 ~/.kube/config

# Export KUBECONFIG (เพิ่มใน .bashrc หรือ .zshrc)
echo 'export KUBECONFIG=~/.kube/config' >> ~/.bashrc
source ~/.bashrc

# ทดสอบ (ไม่ต้องใช้ sudo)
kubectl get nodes
kubectl cluster-info
```

---

### 3. เตรียม Docker Images

**⚠️ สำคัญ:** K3s ใช้ **containerd** (ไม่ใช่ Docker) ต้อง import images เข้า K3s

```bash
# 1. ตรวจสอบ images ที่มี
docker images | grep backend

# 2. Import ทั้งหมดในคำสั่งเดียว
docker save \
  backend-gateway-api:latest \
  backend-auth-service:latest \
  backend-item-service:latest \
  backend-email-service:latest \
  backend-category-service:latest \
  redis:7-alpine \
  | sudo k3s ctr images import -

# 3. ตรวจสอบว่า import สำเร็จ
sudo k3s ctr images ls | grep -E "(backend|redis)"
```

**ผลลัพธ์ควรเห็น 6 images:**
- backend-gateway-api:latest
- backend-auth-service:latest
- backend-item-service:latest
- backend-email-service:latest
- backend-category-service:latest
- redis:7-alpine

---

## 🚀 Deploy Application

### 1. Setup Secrets

```bash
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

kubectl create namespace nline-monitoring

helm upgrade --install kube-prometheus-stack \
  prometheus-community/kube-prometheus-stack \
  -n nline-monitoring \
  --set prometheus.prometheusSpec.retention=7d \
  --set prometheus.prometheusSpec.resources.requests.memory=512Mi \
  --set grafana.adminPassword=admin123 \
  --set prometheus-node-exporter.hostNetwork=false \
  --wait

# 2. Configure NodePort (Fixed ports - ต้องอยู่ในช่วง 30000-32767)
kubectl -n nline-monitoring patch svc kube-prometheus-stack-grafana \
  -p '{"spec":{"type":"NodePort","ports":[{"port":80,"targetPort":3000,"nodePort":30001,"name":"http-web"}]}}'

kubectl -n nline-monitoring patch svc kube-prometheus-stack-prometheus \
  -p '{"spec":{"type":"NodePort","ports":[{"port":9090,"targetPort":9090,"nodePort":30090,"name":"http-web"}]}}'
 
# 3. Apply custom monitoring configs (Traefik, Redis, Application)
kubectl apply -k k8s/monitoring/

# 4. Check status
kubectl -n nline-monitoring get pods
kubectl -n nline-monitoring get servicemonitor
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

```bash
# 1. Rebuild image (จาก backend directory)
cd backend
docker build -f Dockerfile.auth -t backend-auth-service:latest .

# 2. Import ใหม่
docker save backend-auth-service:latest | sudo k3s ctr images import -

# 3. Restart deployment
kubectl -n pose-microservices rollout restart deployment/auth-service

# 4. ตรวจสอบ rollout
kubectl -n pose-microservices rollout status deployment/auth-service

# 5. ดู logs
kubectl -n pose-microservices logs -l app=auth-service --tail=50
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
kubectl -n nline-monitoring get pods

# ดู logs
kubectl -n nline-monitoring logs -l app.kubernetes.io/name=prometheus --tail=50
kubectl -n nline-monitoring logs -l app.kubernetes.io/name=grafana --tail=50

# Restart
kubectl -n nline-monitoring rollout restart deployment kube-prometheus-stack-grafana
kubectl -n nline-monitoring rollout restart statefulset prometheus-kube-prometheus-stack-prometheus
```

---

## 🔥 Complete Setup Script

```bash
#!/bin/bash
# setup-k3s-production.sh - Complete K3s Production Setup

set -e

echo "=== Installing K3s ==="
curl -sfL https://get.k3s.io | sh -

echo "=== Setup kubectl ==="
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
chmod 600 ~/.kube/config
export KUBECONFIG=~/.kube/config

echo "=== Waiting for K3s to be ready ==="
sleep 10
kubectl wait --for=condition=Ready nodes --all --timeout=60s

echo "=== Importing Docker images ==="
docker save \
  backend-gateway-api:latest \
  backend-auth-service:latest \
  backend-item-service:latest \
  backend-email-service:latest \
  backend-category-service:latest \
  redis:7-alpine \
  | sudo k3s ctr images import -

echo "=== Verifying images ==="
sudo k3s ctr images ls | grep -E "(backend|redis)"

echo "=== Creating namespace ==="
kubectl create namespace pose-microservices

echo "=== Creating secrets ==="
kubectl -n pose-microservices create secret generic pose-secrets \
  --from-literal=DATABASE_URL="mysql://root:password@your-db-host:3306/dbname" \
  --from-literal=JWT_SECRET="$(openssl rand -base64 32)" \
  --from-literal=SMTP_USER="your-email@gmail.com" \
  --from-literal=SMTP_PASS="your-app-password" \
  --from-literal=GOOGLE_CLIENT_ID="your-google-client-id" \
  --from-literal=GOOGLE_CLIENT_SECRET="your-google-client-secret" \
  --from-literal=MICROSOFT_CLIENT_ID="your-microsoft-client-id" \
  --from-literal=MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"

echo "=== Deploying application ==="
cd /var/www/app_microservice/backend
kubectl apply -k k8s/overlays/development

echo "=== Waiting for deployments ==="
kubectl -n pose-microservices wait --for=condition=available --timeout=300s deployment --all

echo "=== Installing Prometheus + Grafana ==="
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
kubectl create namespace nline-monitoring
helm upgrade --install kube-prometheus-stack \
  prometheus-community/kube-prometheus-stack \
  -n nline-monitoring \
  --set prometheus.prometheusSpec.retention=7d \
  --set grafana.adminPassword=admin123 \
  --wait

echo "=== Deployment complete! ==="
echo ""
kubectl -n pose-microservices get pods,svc
echo ""
kubectl -n nline-monitoring get pods

echo ""
echo "=== API Endpoints ==="
EXTERNAL_IP=$(kubectl -n pose-microservices get svc gateway-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
NODEPORT=$(kubectl -n pose-microservices get svc gateway-service -o jsonpath='{.spec.ports[0].nodePort}')
SERVER_IP=$(hostname -I | awk '{print $1}')

echo "LoadBalancer: http://$EXTERNAL_IP:3000/api"
echo "NodePort: http://$SERVER_IP:$NODEPORT/api"

echo ""
echo "=== Monitoring ==="
echo "Grafana: kubectl -n nline-monitoring port-forward svc/kube-prometheus-stack-grafana 3001:80"
echo "Prometheus: kubectl -n nline-monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090"

echo ""
echo "Test with: curl http://$EXTERNAL_IP:3000/api"
```

บันทึกเป็น `setup-k3s-production.sh` แล้วรัน:
```bash
chmod +x setup-k3s-production.sh
./setup-k3s-production.sh
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

### ❌ ไม่ควรทำ:

1. **ไม่ backup** - อาจเสียข้อมูลเมื่อมีปัญหา
2. **ไม่ monitor disk space** - disk เต็มจะทำให้ pods ไม่ทำงาน
3. **ใช้ default secrets** - เปลี่ยน JWT_SECRET และ Grafana password
4. **ไม่ test ก่อน deploy** - ควร test ใน development ก่อน

---

## 📚 Additional Resources / แหล่งข้อมูลเพิ่มเติม

- [K3s Documentation](https://docs.k3s.io/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)

---

**สำหรับ Development (Local) ดูที่:** [README-DEVELOPMENT.md](./README-DEVELOPMENT.md)

**สำหรับคำถามหรือปัญหา กรุณาเปิด issue ใน repository**