# 🚀 POSE Microservices - Deployment Summary

Quick reference for deploying the complete POSE application.

---

## 📦 What You Get

### **Backend (Microservices)**
- ✅ Gateway API
- ✅ Auth Service
- ✅ Item Service
- ✅ Email Service
- ✅ Category Service
- ✅ Redis
- ✅ Monitoring (Prometheus + Grafana)

### **Frontend**
- ✅ Next.js application
- ✅ Responsive UI
- ✅ Authentication
- ✅ CRUD operations

---

## ⚡ Quick Start

### **Backend**
```bash
cd backend

# Build images
docker build --target production -f docker/Dockerfile.auth -t backend-auth-service:latest .
docker build --target production -f docker/Dockerfile.gateway -t backend-gateway-api:latest .
docker build --target production -f docker/Dockerfile.item -t backend-item-service:latest .
docker build --target production -f docker/Dockerfile.email -t backend-email-service:latest .
docker build --target production -f docker/Dockerfile.category -t backend-category-service:latest .

# Import to K3s
docker save backend-gateway-api:latest backend-auth-service:latest backend-item-service:latest backend-email-service:latest backend-category-service:latest | sudo k3s ctr images import -

# Deploy
kubectl create namespace pose-microservices
kubectl apply -f k8s/base/
```

### **Frontend**
```bash
cd frontend

# One command deployment
make full-deploy

# Or manual
docker build -f docker/Dockerfile -t frontend-pose:latest .
docker save frontend-pose:latest | sudo k3s ctr images import -
kubectl apply -f k8s/frontend-deployment.yaml
```

---

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | `http://<SERVER_IP>:30100` | Web application |
| **Backend API** | `http://<SERVER_IP>:3000/api` | REST API |
| **Grafana** | `http://<SERVER_IP>:30001` | Monitoring (admin/admin123) |
| **Prometheus** | `http://<SERVER_IP>:30090` | Metrics |

---

## 📁 Project Structure

```
app_microservice/
├── backend/
│   ├── docker/              # Docker files
│   ├── k8s/                 # K8s manifests
│   ├── apps/                # Microservices
│   ├── libs/                # Shared libraries
│   └── Makefile             # Automation
│
├── frontend/
│   ├── docker/              # Docker files
│   ├── k8s/                 # K8s manifests
│   ├── src/                 # Source code
│   └── Makefile             # Automation
│
└── FULL-STACK-DEPLOYMENT.md # This guide
```

---

## 🔍 Verify Deployment

```bash
# Check all pods
kubectl get pods -n pose-microservices

# Expected: All pods Running (1/1 Ready)
# - auth-service
# - gateway-api
# - item-service
# - email-service
# - category-service
# - frontend
# - redis

# Test backend
curl http://<SERVER_IP>:3000/api

# Test frontend
curl http://<SERVER_IP>:30100

# Open browser
http://<SERVER_IP>:30100
```

---

## 🔄 Update Services

### **Backend Service**
```bash
cd backend
docker build --target production -f docker/Dockerfile.<service> -t backend-<service>-service:latest .
docker save backend-<service>-service:latest | sudo k3s ctr images import -
kubectl delete pod -n pose-microservices -l app=<service>
```

### **Frontend**
```bash
cd frontend
make k8s-build
make k8s-import
make k8s-restart
```

---

## 📊 Monitoring

```bash
# View logs
kubectl logs -n pose-microservices -l app=<service> -f

# Resource usage
kubectl top pods -n pose-microservices

# Events
kubectl get events -n pose-microservices
```

---

## 🐛 Common Issues

### **Pods Pending**
```bash
# Reduce resource requests in deployment files
resources:
  requests:
    memory: "64Mi"
    cpu: "50m"
```

### **Frontend can't reach Backend**
```bash
# Check Gateway IP
kubectl get svc -n pose-microservices gateway-service

# Update frontend/k8s/frontend-deployment.yaml
env:
  - name: NEXT_PUBLIC_API_URL
    value: "http://<GATEWAY_IP>:3000/api"
```

### **Image not found**
```bash
# Verify import
sudo k3s ctr images ls | grep -E "(backend|frontend)"

# Reimport if needed
docker save <image>:latest | sudo k3s ctr images import -
```

---

## 📚 Full Documentation

- **Backend Deployment:** `backend/k8s/README-PRODUCTION.md`
- **Frontend Deployment:** `frontend/DEPLOYMENT-GUIDE.md`
- **Full Stack Guide:** `FULL-STACK-DEPLOYMENT.md`
- **API Testing:** `backend/API-TESTING-SCENARIOS.md`
- **Monitoring Setup:** `backend/k8s/monitoring/DEPLOYMENT-GUIDE.md`

---

## ✅ Production Checklist

- [ ] K3s installed and running
- [ ] Backend images built and imported
- [ ] Frontend image built and imported
- [ ] All pods running (1/1 Ready)
- [ ] Services accessible
- [ ] Can register/login
- [ ] Can perform CRUD operations
- [ ] No errors in logs
- [ ] Monitoring deployed (optional)

---

## 🎯 Success Criteria

✅ **Backend:** `curl http://<SERVER_IP>:3000/api` returns response  
✅ **Frontend:** Browser shows login page at `http://<SERVER_IP>:30100`  
✅ **Integration:** Can register, login, create/edit/delete items  
✅ **Monitoring:** Grafana shows metrics (optional)  

---

**Your POSE application is now deployed! 🎉**

For detailed instructions, see `FULL-STACK-DEPLOYMENT.md`
