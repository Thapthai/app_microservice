# Docker Registry Setup Guide
## การใช้ Docker Registry สำหรับ Production

---

## 🎯 Overview

แทนที่จะใช้ K3s หรือ Kubernetes สามารถใช้ Docker Compose + Docker Registry ได้:

```
[Dev Machine] 
    ↓ build & push
[Docker Registry]
    ↓ pull
[Production Server]
    ↓ docker-compose up
[Application Running]
```

**ข้อดี:**
- ✅ ใช้ RAM น้อย (~1.3 GB แทน ~1.8 GB)
- ✅ ง่ายกว่า Kubernetes
- ✅ เหมาะกับ server RAM 2 GB
- ✅ Deploy ใหม่ง่าย (pull + restart)

---

## 📋 ตัวเลือก Registry

### ตัวเลือกที่ 1: Docker Hub (แนะนำ - ฟรี, ง่าย)

**Free Tier:**
- ✅ Unlimited public repositories
- ✅ 1 private repository ฟรี
- ✅ ไม่ต้องตั้ง server

**Paid Plan ($5/month):**
- ✅ Unlimited private repositories

---

### ตัวเลือกที่ 2: GitHub Container Registry (ฟรี)

**Free Tier:**
- ✅ Unlimited public repositories
- ✅ 500 MB storage ฟรีสำหรับ private
- ✅ รวมกับ GitHub repository

---

### ตัวเลือกที่ 3: Private Registry (ยาก, ต้องจัดการเอง)

**ต้องการ:**
- Server สำหรับ registry
- SSL certificate
- Authentication setup

---

## 🚀 Setup: ใช้ Docker Hub (แนะนำ)

### 1. เตรียม Docker Hub Account

```bash
# สมัคร Docker Hub (ถ้ายังไม่มี)
# https://hub.docker.com/signup

# Login บนเครื่อง Dev
docker login
# Username: YOUR_USERNAME
# Password: YOUR_PASSWORD
```

---

### 2. บนเครื่อง Dev: Build & Push Images

```bash
cd /Users/night/Desktop/POSE/app_microservice/backend

# Build images
docker build -f Dockerfile.gateway -t YOUR_USERNAME/pose-gateway:latest .
docker build -f Dockerfile.auth -t YOUR_USERNAME/pose-auth:latest .
docker build -f Dockerfile.item -t YOUR_USERNAME/pose-item:latest .
docker build -f Dockerfile.category -t YOUR_USERNAME/pose-category:latest .
docker build -f Dockerfile.email -t YOUR_USERNAME/pose-email:latest .

# Push to Docker Hub
docker push YOUR_USERNAME/pose-gateway:latest
docker push YOUR_USERNAME/pose-auth:latest
docker push YOUR_USERNAME/pose-item:latest
docker push YOUR_USERNAME/pose-category:latest
docker push YOUR_USERNAME/pose-email:latest
```

**หมายเหตุ:** เปลี่ยน `YOUR_USERNAME` เป็น Docker Hub username ของคุณ

---

### 3. แก้ไข docker-compose.prod.yml

```bash
# แก้ไขไฟล์ docker-compose.prod.yml
nano docker-compose.prod.yml

# เปลี่ยน YOUR_USERNAME ทั้งหมดเป็น Docker Hub username ของคุณ
# ตัวอย่าง:
#   image: YOUR_USERNAME/pose-gateway:latest
#   → image: johndoe/pose-gateway:latest
```

---

### 4. บน Production Server: Pull & Run

```bash
# 1. Login Docker Hub (ถ้าเป็น private repo)
docker login

# 2. Copy ไฟล์ที่จำเป็น
# - docker-compose.prod.yml
# - nginx.conf
# - .env

# 3. Pull images
docker-compose -f docker-compose.prod.yml pull

# 4. Start services
docker-compose -f docker-compose.prod.yml up -d

# 5. ตรวจสอบ
docker ps
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 🔄 Update Application (Deploy ใหม่)

### บนเครื่อง Dev

```bash
cd /Users/night/Desktop/POSE/app_microservice/backend

# 1. แก้ไข code

# 2. Build image ใหม่
docker build -f Dockerfile.gateway -t YOUR_USERNAME/pose-gateway:latest .

# 3. Push
docker push YOUR_USERNAME/pose-gateway:latest
```

### บน Production Server

```bash
cd /var/www/app_microservice/backend

# 1. Pull image ใหม่
docker-compose -f docker-compose.prod.yml pull gateway-api

# 2. Restart service
docker-compose -f docker-compose.prod.yml up -d gateway-api

# 3. ตรวจสอบ
docker-compose -f docker-compose.prod.yml logs -f gateway-api
```

---

## 📦 Script สำหรับ Build & Push (เครื่อง Dev)

สร้างไฟล์ `build-push.sh`:

```bash
#!/bin/bash

# Configuration
DOCKER_USERNAME="YOUR_USERNAME"  # เปลี่ยนเป็น username ของคุณ
VERSION="latest"

# Services
SERVICES=("gateway" "auth" "item" "category" "email")

echo "=== Building and pushing images ==="

for service in "${SERVICES[@]}"; do
  echo ""
  echo ">>> Building $service..."
  docker build -f Dockerfile.$service -t $DOCKER_USERNAME/pose-$service:$VERSION .
  
  echo ">>> Pushing $service..."
  docker push $DOCKER_USERNAME/pose-$service:$VERSION
done

echo ""
echo "=== Done! ==="
echo "All images pushed to Docker Hub"
```

ใช้งาน:

```bash
# ให้สิทธิ์ execute
chmod +x build-push.sh

# Run
./build-push.sh
```

---

## 📦 Script สำหรับ Deploy (Production Server)

สร้างไฟล์ `deploy.sh`:

```bash
#!/bin/bash

echo "=== Pulling latest images ==="
docker-compose -f docker-compose.prod.yml pull

echo ""
echo "=== Restarting services ==="
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "=== Checking status ==="
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "=== Deployment complete! ==="
echo "View logs: docker-compose -f docker-compose.prod.yml logs -f"
```

ใช้งาน:

```bash
# ให้สิทธิ์ execute
chmod +x deploy.sh

# Run
./deploy.sh
```

---

## 🔒 ใช้ Private Repository

### 1. บน Docker Hub

- สร้าง repository เป็น **Private**
- หรือ upgrade เป็น Pro plan ($5/month)

### 2. บน Production Server

```bash
# Login Docker Hub
docker login
# Username: YOUR_USERNAME
# Password: YOUR_PASSWORD

# หรือใช้ Access Token (ปลอดภัยกว่า)
# 1. สร้าง Access Token ที่ https://hub.docker.com/settings/security
# 2. Login ด้วย token
docker login -u YOUR_USERNAME -p YOUR_ACCESS_TOKEN
```

---

## 📊 เปรียบเทียบ: Docker Compose vs K3s

| Feature | Docker Compose | K3s |
|---------|----------------|-----|
| **RAM Usage** | ~1.3 GB | ~1.8 GB |
| **ความยาก** | ง่าย ⭐ | ยาก ⭐⭐⭐ |
| **Auto-restart** | ✅ | ✅ |
| **Load Balancing** | ❌ (ใช้ nginx) | ✅ |
| **Auto-scaling** | ❌ | ✅ |
| **Rolling Update** | ❌ | ✅ |
| **Health Checks** | ✅ | ✅ |
| **Monitoring** | Basic | Prometheus/Grafana |
| **เหมาะกับ** | Small-Medium | Medium-Large |

---

## 💡 คำแนะนำ

### ใช้ Docker Compose เมื่อ:
- ✅ Server มี RAM 2 GB
- ✅ Application ไม่ซับซ้อนมาก
- ✅ ต้องการความง่าย
- ✅ ไม่ต้องการ auto-scaling

### ใช้ K3s เมื่อ:
- ✅ Server มี RAM 4 GB+
- ✅ ต้องการ Kubernetes features
- ✅ ต้องการ auto-scaling
- ✅ ต้องการ monitoring แบบเต็ม

---

## 🔧 Troubleshooting

### ปัญหา: Push ช้า

```bash
# ลด image size ด้วย multi-stage build
# ดูตัวอย่างใน Dockerfile.* ที่มีอยู่แล้ว
```

### ปัญหา: Pull ล้มเหลวบน server

```bash
# ตรวจสอบ login
docker login

# ตรวจสอบ network
ping hub.docker.com

# Pull ทีละ image
docker pull YOUR_USERNAME/pose-gateway:latest
```

### ปัญหา: Container ไม่ start

```bash
# ดู logs
docker-compose -f docker-compose.prod.yml logs SERVICE_NAME

# ตรวจสอบ .env
cat .env

# ตรวจสอบ database connection
docker-compose -f docker-compose.prod.yml exec gateway-api ping DATABASE_HOST
```

---

## 📚 Resources

- [Docker Hub](https://hub.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

---

## ✅ Checklist สำหรับ Production

- [ ] สมัคร Docker Hub account
- [ ] Build images บนเครื่อง dev
- [ ] Push images ไปยัง Docker Hub
- [ ] แก้ไข docker-compose.prod.yml (เปลี่ยน YOUR_USERNAME)
- [ ] Copy ไฟล์ไปยัง production server:
  - [ ] docker-compose.prod.yml
  - [ ] nginx.conf
  - [ ] .env
- [ ] Login Docker Hub บน production server
- [ ] Pull images
- [ ] Start services
- [ ] ตรวจสอบ logs
- [ ] ทดสอบ API endpoint

---

**หมายเหตุ:** ถ้าใช้วิธีนี้ไม่ต้องติดตั้ง K3s บน production server เลย!
