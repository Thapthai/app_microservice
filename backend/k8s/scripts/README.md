# Deployment Scripts

Scripts สำหรับ deploy services แบบ Zero Downtime

## 📁 Files

- `deploy-item-service.sh` - Deploy item-service เท่านั้น
- `deploy-all-services.sh` - Deploy ทุก services พร้อมกัน

---

## 🚀 Usage

### **Deploy Item Service**

```bash
cd /var/www/app_microservice/backend

# Deploy version latest
chmod +x k8s/scripts/deploy-item-service.sh
./k8s/scripts/deploy-item-service.sh

# Deploy version เฉพาะ
./k8s/scripts/deploy-item-service.sh v1.2.0
```

### **Deploy All Services**

```bash
cd /var/www/app_microservice/backend

# Deploy ทุก services
chmod +x k8s/scripts/deploy-all-services.sh
./k8s/scripts/deploy-all-services.sh
```

---

## 📋 What Scripts Do

### **deploy-item-service.sh**

1. ✅ ตรวจสอบสถานะปัจจุบัน
2. ✅ Build Docker image
3. ✅ Import image เข้า k3s
4. ✅ ตรวจสอบ replicas (scale ถ้าน้อยกว่า 2)
5. ✅ Deploy ด้วย Rolling Update
6. ✅ Watch rollout progress
7. ✅ Verify pods
8. ✅ ตรวจสอบ logs
9. ✅ Test API endpoint
10. ✅ แสดง summary และ commands

### **deploy-all-services.sh**

1. ✅ Build ทุก services
2. ✅ Import images เข้า k3s
3. ✅ Deploy ทุก services พร้อมกัน
4. ✅ Watch rollout ทั้งหมด
5. ✅ แสดงสถานะสุดท้าย

---

## ✅ Features

- **Zero Downtime** - ไม่มี downtime ระหว่าง deploy
- **Auto Rollback** - Rollback อัตโนมัติถ้า deploy ล้มเหลว
- **Health Checks** - รอให้ pods ready ก่อนส่ง traffic
- **Progress Tracking** - ดู progress แบบ real-time
- **API Testing** - ทดสอบ API หลัง deploy
- **Error Handling** - จัดการ errors อย่างเหมาะสม

---

## 🔄 Rollback

ถ้า deploy แล้วมีปัญหา:

```bash
# Rollback item-service
kubectl -n pose-microservices rollout undo deployment item-service

# Rollback ไป revision เฉพาะ
kubectl -n pose-microservices rollout undo deployment item-service --to-revision=2

# ดู rollout history
kubectl -n pose-microservices rollout history deployment item-service
```

---

## 📊 Monitoring

### **Watch Pods**
```bash
kubectl -n pose-microservices get pods -w
```

### **Watch Specific Service**
```bash
kubectl -n pose-microservices get pods -l app=item-service -w
```

### **View Logs**
```bash
kubectl -n pose-microservices logs -l app=item-service -f
```

---

## 🐛 Troubleshooting

### **Script ไม่ทำงาน**

```bash
# ตรวจสอบ permissions
chmod +x k8s/scripts/*.sh

# รัน script ด้วย bash
bash k8s/scripts/deploy-item-service.sh
```

### **Build ล้มเหลว**

```bash
# ตรวจสอบ Dockerfile
docker build -f Dockerfile.item -t backend-item-service:latest .

# ดู logs
docker build -f Dockerfile.item -t backend-item-service:latest . 2>&1 | tee build.log
```

### **Import เข้า k3s ล้มเหลว**

```bash
# ตรวจสอบ k3s
sudo k3s ctr images ls

# ลอง import manual
docker save backend-item-service:latest -o /tmp/item.tar
sudo k3s ctr images import /tmp/item.tar
```

### **Rollout Stuck**

```bash
# Pause rollout
kubectl -n pose-microservices rollout pause deployment item-service

# ตรวจสอบ pods
kubectl -n pose-microservices describe pods -l app=item-service

# Resume หรือ rollback
kubectl -n pose-microservices rollout resume deployment item-service
# หรือ
kubectl -n pose-microservices rollout undo deployment item-service
```

---

## 💡 Tips

1. **Tag images ด้วย version** - ง่ายต่อการ rollback
   ```bash
   ./k8s/scripts/deploy-item-service.sh v1.2.0
   ```

2. **Test ใน staging ก่อน** - ลด risk ใน production

3. **Monitor หลัง deploy** - ดู error rates และ response times

4. **Keep rollout history** - ง่ายต่อการ rollback
   ```bash
   kubectl -n pose-microservices rollout history deployment item-service
   ```

5. **Use CI/CD** - Automate deployment process

---

## 📚 Related Docs

- `../ZERO-DOWNTIME-DEPLOYMENT.md` - คู่มือ Zero Downtime Deployment
- `../README-PRODUCTION.md` - Production deployment guide
- `../base/` - Kubernetes deployment files

---

## 🆘 Support

หากมีปัญหา:
1. ดู logs: `kubectl -n pose-microservices logs -l app=item-service`
2. ดู events: `kubectl -n pose-microservices describe deployment item-service`
3. ตรวจสอบ pods: `kubectl -n pose-microservices get pods -l app=item-service`
4. Rollback: `kubectl -n pose-microservices rollout undo deployment item-service`

