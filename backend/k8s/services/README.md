# ⚡ Backend Services - Quick Update Guide

คู่มือสำหรับ Update Backend Services บน K3s แบบรวดเร็ว

---

## 📋 สารบัญ

1. [🔄 Quick Update แต่ละ Service](#-quick-update-แต่ละ-service)
2. [🚀 Update ทุก Services พร้อมกัน](#-update-ทุก-services-พร้อมกัน)

---

## 🔄 Quick Update แต่ละ Service

### **📡 Update Gateway API**

```bash
cd /var/www/app_microservice/backend/k8s/services
chmod +x update-gateway.sh
./update-gateway.sh
```

**เวลา:** ~2-3 นาที

---

### **📦 Update Item Service**

```bash
cd /var/www/app_microservice/backend/k8s/services
chmod +x update-item.sh
./update-item.sh
```

**เวลา:** ~2-3 นาที

---

### **🔐 Update Auth Service**

```bash
cd /var/www/app_microservice/backend/k8s/services
chmod +x update-auth.sh
./update-auth.sh
```

**เวลา:** ~2-3 นาที

---

### **📂 Update Category Service**

```bash
cd /var/www/app_microservice/backend/k8s/services
chmod +x update-category.sh
./update-category.sh
```

**เวลา:** ~2-3 นาที

---

### **📧 Update Email Service**

```bash
cd /var/www/app_microservice/backend/k8s/services
chmod +x update-email.sh
./update-email.sh
```

**เวลา:** ~2-3 นาที

---

## 🚀 Update ทุก Services พร้อมกัน

### **วิธีใช้:**

```bash
cd /var/www/app_microservice/backend/k8s/services
chmod +x update-all.sh
./update-all.sh
```

**Services ที่จะ Update:**
- ✅ Gateway API
- ✅ Item Service
- ✅ Auth Service
- ✅ Category Service
- ✅ Email Service

**เวลา:** ~8-12 นาที (ขึ้นอยู่กับจำนวน services)

---

## 📊 สรุปการใช้งาน

| Service | Script | คำสั่ง | เวลา |
|---------|--------|--------|------|
| **Gateway API** | `update-gateway.sh` | `./update-gateway.sh` | 2-3 นาที |
| **Item Service** | `update-item.sh` | `./update-item.sh` | 2-3 นาที |
| **Auth Service** | `update-auth.sh` | `./update-auth.sh` | 2-3 นาที |
| **Category Service** | `update-category.sh` | `./update-category.sh` | 2-3 นาที |
| **Email Service** | `update-email.sh` | `./update-email.sh` | 2-3 นาที |
| **All Services** | `update-all.sh` | `./update-all.sh` | 8-12 นาที |

---

**อัพเดทล่าสุด:** 2025-01-21  
**Version:** 1.0.0

