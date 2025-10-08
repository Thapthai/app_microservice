# POSE Microservices - Kubernetes Guide
# คู่มือ Kubernetes สำหรับ POSE Microservices

---

## 📚 เลือกคู่มือที่เหมาะกับคุณ / Choose Your Guide

### 🔧 Development (Local Machine)
**สำหรับการพัฒนาบนเครื่อง Local ด้วย Minikube**

👉 **[README-DEVELOPMENT.md](./README-DEVELOPMENT.md)**

**เหมาะสำหรับ:**
- ✅ พัฒนาและทดสอบบนเครื่อง Local (Mac, Windows, Linux)
- ✅ เรียนรู้ Kubernetes
- ✅ ทดสอบ K8s manifests ก่อน deploy production
- ✅ Debug และ troubleshoot ในสภาพแวดล้อมที่ปลอดภัย

**สิ่งที่จะได้เรียนรู้:**
- ติดตั้งและใช้งาน Minikube
- Load Docker images เข้า Minikube
- Deploy application ด้วย Kustomize
- ใช้งาน Prometheus + Grafana สำหรับ monitoring
- Resource Management (CPU & RAM)
- Troubleshooting พื้นฐาน

---

### 🏭 Production (Server with K3s)
**สำหรับ Deploy บน Production Server ด้วย K3s**

👉 **[README-PRODUCTION.md](./README-PRODUCTION.md)**

**เหมาะสำหรับ:**
- ✅ Deploy บน production server (single node)
- ✅ ต้องการ Kubernetes แบบ lightweight
- ✅ RAM/CPU จำกัด (1-2 GB RAM, 1-2 CPU cores)
- ✅ ต้องการ built-in Load Balancer (Traefik)
- ✅ ต้องการ auto-update และ high availability

**สิ่งที่จะได้เรียนรู้:**
- ติดตั้ง K3s บน Linux server
- Import Docker images เข้า K3s containerd
- Deploy application บน production
- Backup & Restore cluster
- Update & Upgrade application
- Scaling และ Auto-scaling
- Production troubleshooting
- Best practices สำหรับ production

---

## 🆚 เปรียบเทียบ Minikube vs K3s

| Feature | Minikube (Development) | K3s (Production) |
|---------|------------------------|------------------|
| **วัตถุประสงค์** | Development/Testing | Production-ready |
| **RAM Usage** | 2-4 GB | 512 MB - 1 GB |
| **CPU Usage** | สูง (nested virtualization) | ต่ำ (native) |
| **Startup Time** | ช้า (1-2 นาที) | เร็ว (10-20 วินาที) |
| **Load Balancer** | ต้องใช้ `minikube tunnel` | ✅ Built-in (Traefik) |
| **Storage** | ต้องเปิด addon | ✅ Built-in (local-path) |
| **Production Use** | ❌ ไม่แนะนำ | ✅ แนะนำ |
| **High Availability** | ❌ | ✅ (multi-node) |
| **Certificate Rotation** | Manual | ✅ Automatic |

---

## 🚀 Quick Start

### สำหรับ Development (Minikube)

```bash
# 1. Start Minikube
minikube start --cpus=4 --memory=6144
minikube addons enable ingress metrics-server

# 2. Load images
minikube image load backend-gateway-api:latest
minikube image load backend-auth-service:latest
# ... (load other images)

# 3. Deploy (จาก backend directory)
cd backend
kubectl apply -k k8s/overlays/development

# 4. Access API (ต้องเปิด tunnel ค้างไว้)
minikube tunnel
curl http://localhost:3000/api
```

**📖 คู่มือเต็ม:** [README-DEVELOPMENT.md](./README-DEVELOPMENT.md)

---

### สำหรับ Production (K3s)

```bash
# 1. Install K3s
curl -sfL https://get.k3s.io | sh -

# 2. Setup kubectl
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config

# 3. Import images
docker save backend-gateway-api:latest backend-auth-service:latest \
  backend-item-service:latest backend-email-service:latest \
  backend-category-service:latest redis:7-alpine \
  | sudo k3s ctr images import -

# 4. Create secrets
kubectl create namespace pose-microservices
kubectl -n pose-microservices create secret generic pose-secrets \
  --from-literal=DATABASE_URL="mysql://user:pass@host:3306/db" \
  --from-literal=JWT_SECRET="$(openssl rand -base64 32)"

# 5. Deploy (จาก backend directory)
cd backend
kubectl apply -k k8s/overlays/development

# 6. Get API endpoint
kubectl -n pose-microservices get svc gateway-service
curl http://<EXTERNAL-IP>:3000/api
```

**📖 คู่มือเต็ม:** [README-PRODUCTION.md](./README-PRODUCTION.md)

---

## 📋 Prerequisites / ข้อกำหนดเบื้องต้น

### สำหรับ Development (Minikube)
- **Docker Desktop** (with 4+ CPU cores, 6-8 GB RAM)
- **kubectl** (command-line tool)
- **minikube** (latest version)
- **Helm** (optional, for monitoring)

### สำหรับ Production (K3s)
- **Linux Server** (Ubuntu 20.04+, Debian 10+, CentOS 7+)
- **RAM:** 1 GB+ (แนะนำ 2 GB+)
- **CPU:** 1 core+ (แนะนำ 2+ cores)
- **Disk:** 20 GB+ free space
- **Docker** (for building images)

---

## 📚 Additional Resources / แหล่งข้อมูลเพิ่มเติม

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Minikube Documentation](https://minikube.sigs.k8s.io/docs/)
- [K3s Documentation](https://docs.k3s.io/)
- [Kustomize Documentation](https://kustomize.io/)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)

---

## 🎯 สรุป / Summary

**เลือก Development (Minikube) เมื่อ:**
- ✅ พัฒนาบนเครื่อง Local
- ✅ เรียนรู้ Kubernetes
- ✅ ทดสอบ manifests

**เลือก Production (K3s) เมื่อ:**
- ✅ Deploy บน production server
- ✅ ต้องการ lightweight Kubernetes
- ✅ ทรัพยากรจำกัด (RAM/CPU)
- ✅ ต้องการ built-in Load Balancer

---

**สำหรับคำถามหรือปัญหา กรุณาเปิด issue ใน repository**