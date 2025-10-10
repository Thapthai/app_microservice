# Zero Downtime Deployment Guide

คู่มือการ deploy services แบบไม่มี downtime - ใช้งานได้ตลอดเวลา

## 📋 Overview

Zero Downtime Deployment คือการ deploy version ใหม่โดยที่ service ยังคงให้บริการได้ตลอดเวลา ไม่มีช่วงที่ API ไม่สามารถใช้งานได้

### ✅ สิ่งที่ได้

- **0 second downtime** - Service ทำงานได้ตลอด
- **Gradual rollout** - Deploy ทีละ pod
- **Auto rollback** - Rollback อัตโนมัติถ้ามีปัญหา
- **Health checks** - ตรวจสอบ pod ก่อนให้บริการ
- **Traffic control** - ควบคุมการส่ง traffic ไป pod ใหม่

---

## 🎯 Strategy Overview

Kubernetes ใช้ **Rolling Update** strategy:

```
Step 1: [Old Pod 1] [Old Pod 2]           ← Running
Step 2: [Old Pod 1] [Old Pod 2] [New Pod 1] ← Creating new
Step 3: [Old Pod 1] [New Pod 1]           ← Old Pod 2 terminating
Step 4: [Old Pod 1] [New Pod 1] [New Pod 2] ← Creating new
Step 5: [New Pod 1] [New Pod 2]           ← Complete!
```

---

## 🔧 Item Service Zero Downtime Deployment

### **ขั้นตอนที่ 1: ตั้งค่า Deployment Strategy**

ไฟล์ `k8s/base/item-deployment.yaml` ควรมีการตั้งค่าแบบนี้:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: item-service
  namespace: pose-microservices
spec:
  replicas: 2  # ≥2 สำหรับ zero downtime
  
  # Rolling Update Strategy
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # สร้าง pod ใหม่ได้ +1 pod
      maxUnavailable: 0  # ไม่ให้ pod เก่าตายก่อนที่ใหม่จะพร้อม
  
  selector:
    matchLabels:
      app: item-service
  
  template:
    metadata:
      labels:
        app: item-service
    spec:
      containers:
      - name: item-service
        image: backend-item-service:latest
        ports:
        - containerPort: 3002
        
        # Environment variables
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: pose-config
              key: NODE_ENV
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: pose-secrets
              key: DATABASE_URL
        
        # Resource limits (ถ้าจำเป็น)
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        
        # Liveness Probe - ตรวจว่า pod ยังทำงานอยู่
        livenessProbe:
          tcpSocket:
            port: 3002
          initialDelaySeconds: 30  # รอ 30 วิก่อนเช็ค
          periodSeconds: 10        # เช็คทุก 10 วิ
          timeoutSeconds: 5
          failureThreshold: 3      # ล้มเหลว 3 ครั้ง = restart pod
        
        # Readiness Probe - ตรวจว่า pod พร้อมรับ traffic
        readinessProbe:
          tcpSocket:
            port: 3002
          initialDelaySeconds: 10  # รอ 10 วิก่อนเช็ค
          periodSeconds: 5         # เช็คทุก 5 วิ
          timeoutSeconds: 3
          successThreshold: 1      # ผ่าน 1 ครั้ง = พร้อมใช้งาน
          failureThreshold: 3      # ล้มเหลว 3 ครั้ง = ยังไม่พร้อม
        
        # Graceful Shutdown
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"]  # รอ 15 วิก่อน kill pod
        
        imagePullPolicy: IfNotPresent
      
      # Graceful shutdown period
      terminationGracePeriodSeconds: 30
```

### **ขั้นตอนที่ 2: Deploy แบบ Zero Downtime**

```bash
# 1. Build image ใหม่
cd /var/www/app_microservice/backend
docker build -f Dockerfile.item -t backend-item-service:latest .

# 2. Tag image ด้วย version (แนะนำ)
docker tag backend-item-service:latest backend-item-service:v1.2.0

# 3. Import เข้า k3s
docker save backend-item-service:latest -o /tmp/item-service.tar
sudo k3s ctr images import /tmp/item-service.tar
rm /tmp/item-service.tar

# 4. Apply deployment (Kubernetes จะทำ rolling update อัตโนมัติ)
kubectl apply -f k8s/base/item-deployment.yaml

# 5. ดู rolling update แบบ real-time
kubectl -n pose-microservices rollout status deployment item-service

# 6. ตรวจสอบ pods
kubectl -n pose-microservices get pods -l app=item-service -w
```

### **ขั้นตอนที่ 3: ตรวจสอบการ Deploy**

```bash
# ดู rollout history
kubectl -n pose-microservices rollout history deployment item-service

# ดู status
kubectl -n pose-microservices get deployment item-service

# ดู pods และ age
kubectl -n pose-microservices get pods -l app=item-service -o wide

# ดู events
kubectl -n pose-microservices describe deployment item-service

# ทดสอบ API
curl http://10.11.9.84:3000/api/items
```

---

## 🔄 Rollback (ถ้ามีปัญหา)

### **Automatic Rollback**

Kubernetes จะ rollback อัตโนมัติถ้า:
- Readiness probe ล้มเหลวต่อเนื่อง
- Pod ไม่สามารถ start ได้
- Container crash loop

### **Manual Rollback**

```bash
# Rollback ไป version ก่อนหน้า
kubectl -n pose-microservices rollout undo deployment item-service

# Rollback ไป revision เฉพาะ
kubectl -n pose-microservices rollout undo deployment item-service --to-revision=2

# ดู rollout history
kubectl -n pose-microservices rollout history deployment item-service

# ดู details ของ revision
kubectl -n pose-microservices rollout history deployment item-service --revision=3
```

---

## 📦 Deployment Scripts

Scripts อยู่ใน `k8s/scripts/`:
- `deploy-item-service.sh` - Deploy item-service
- `deploy-all-services.sh` - Deploy ทุก services

ดูวิธีใช้ใน `k8s/scripts/README.md`

---

## 🔍 Health Checks Configuration

### **TCP Health Check (สำหรับ Microservices)**

```yaml
livenessProbe:
  tcpSocket:
    port: 3002
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  tcpSocket:
    port: 3002
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  successThreshold: 1
  failureThreshold: 3
```

### **HTTP Health Check (สำหรับ Gateway API)**

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 60
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/ready
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 5
```

---

## ⚙️ Advanced Strategies

### **1. Blue-Green Deployment**

Deploy version ใหม่ทั้งหมด แล้วค่อย switch traffic

### **2. Canary Deployment**

Deploy version ใหม่ให้ traffic เพียง 10-20% ก่อน

### **3. A/B Testing**

ใช้ Ingress/Service Mesh เพื่อแยก traffic ตาม header

---

## 📊 Monitoring During Deployment

### **Watch Pods**
```bash
kubectl -n pose-microservices get pods -l app=item-service -w
```

### **Watch Rollout**
```bash
kubectl -n pose-microservices rollout status deployment item-service -w
```

### **Monitor Logs**
```bash
kubectl -n pose-microservices logs -l app=item-service -f --tail=100
```

### **Check Metrics** (ถ้ามี Prometheus)
```promql
# Error rate during deployment
rate(http_requests_total{status_code=~"5..",service="item-service"}[5m])

# Response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{service="item-service"}[5m]))

# Pod restarts
increase(kube_pod_container_status_restarts_total{pod=~"item-service.*"}[10m])
```

---

## 🐛 Troubleshooting

### **ปัญหา: Pods ไม่ Ready**

```bash
# ดู events
kubectl -n pose-microservices describe pod <pod-name>

# ดู logs
kubectl -n pose-microservices logs <pod-name>

# เช็ค readiness probe
kubectl -n pose-microservices get pods -l app=item-service -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")]}'
```

**แก้ไข:**
- เพิ่ม `initialDelaySeconds` ของ readinessProbe
- ตรวจสอบว่า service start ได้จริง
- เช็ค resource limits

### **ปัญหา: Rolling Update Stuck**

```bash
# Pause/Resume rollout
kubectl -n pose-microservices rollout pause deployment item-service
kubectl -n pose-microservices rollout resume deployment item-service

# Restart rollout
kubectl -n pose-microservices rollout restart deployment item-service
```

### **ปัญหา: ImagePullBackOff**

```bash
# ตรวจสอบว่า image มีใน k3s
sudo k3s ctr images ls | grep item-service

# Import ใหม่
docker save backend-item-service:latest -o /tmp/item.tar
sudo k3s ctr images import /tmp/item.tar
```

---

## ✅ Best Practices

1. **ใช้ Replicas ≥ 2** - อย่างน้อย 2 pods
2. **ตั้งค่า maxUnavailable = 0** - ไม่ให้ pod เก่าตายก่อน
3. **ใช้ Health Checks** - Liveness และ Readiness probes
4. **Graceful Shutdown** - ให้เวลา pod shutdown อย่างถูกต้อง
5. **Resource Limits** - กำหนด requests และ limits
6. **Use Tags/Versions** - Tag image ด้วย version
7. **Test Before Deploy** - Unit tests, Integration tests
8. **Monitor After Deploy** - Error rates, Response times

---

## 📚 Summary

**Zero Downtime Deployment ทำได้โดย:**

1. ✅ ใช้ **Rolling Update** strategy
2. ✅ ตั้ง **replicas ≥ 2**
3. ✅ ตั้ง **maxUnavailable = 0**
4. ✅ ใช้ **Readiness Probe**
5. ✅ ใช้ **Graceful Shutdown**
6. ✅ Monitor และ **Rollback** ถ้าจำเป็น

**ผลลัพธ์:**
- 🎯 0 second downtime
- 🚀 Deploy ได้ทุกเวลา
- 🔄 Rollback ง่าย
- 📊 Monitor ได้
- ✅ Production ready

Happy Deploying! 🚀
