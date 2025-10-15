# 🚀 POSE Full-Stack Deployment Guide

Complete deployment guide for both Backend and Frontend.

---

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Full Stack Deployment](#full-stack-deployment)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              Client Browser                      │
│         http://<SERVER_IP>:30100                │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│         Frontend (Next.js)                       │
│         - Port: 3100 (Container)                │
│         - NodePort: 30100 (K3s)                 │
│         - LoadBalancer: 10.11.9.84              │
└──────────────────┬──────────────────────────────┘
                   │ API Calls
                   ▼
┌─────────────────────────────────────────────────┐
│         Gateway API                              │
│         - Port: 3000                            │
│         - LoadBalancer: 10.11.9.84:3000         │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────┐      ┌──────────────┐
│ Auth Service │      │ Item Service │
│  Port: 3001  │      │  Port: 3002  │
└──────────────┘      └──────────────┘
        ▼                     ▼
┌──────────────┐      ┌──────────────┐
│Email Service │      │Category Svc  │
│  Port: 3003  │      │  Port: 3004  │
└──────────────┘      └──────────────┘
        │
        ▼
┌──────────────────────────────────┐
│         Database & Redis          │
└──────────────────────────────────┘
```

---

## ✅ Prerequisites

### **Server Requirements**
- **RAM:** 8GB+ (minimum 4GB)
- **CPU:** 4+ cores (minimum 2)
- **Disk:** 20GB+ free space
- **OS:** Ubuntu 20.04+, Debian 10+, CentOS 7+

### **Software Requirements**
- Docker (for building images)
- K3s (installed)
- kubectl (configured)
- Git

### **Verify Prerequisites**
```bash
# Check Docker
docker --version

# Check K3s
sudo systemctl status k3s
kubectl get nodes

# Check available resources
free -h
df -h
```

---

## 🎯 Backend Deployment

### **Quick Deploy**
```bash
cd /path/to/app_microservice/backend

# 1. Build images
docker build --target production -f docker/Dockerfile.auth -t backend-auth-service:latest .
docker build --target production -f docker/Dockerfile.gateway -t backend-gateway-api:latest .
docker build --target production -f docker/Dockerfile.item -t backend-item-service:latest .
docker build --target production -f docker/Dockerfile.email -t backend-email-service:latest .
docker build --target production -f docker/Dockerfile.category -t backend-category-service:latest .

# 2. Import to K3s
docker save \
  backend-gateway-api:latest \
  backend-auth-service:latest \
  backend-item-service:latest \
  backend-email-service:latest \
  backend-category-service:latest \
  | sudo k3s ctr images import -

# 3. Deploy
kubectl create namespace pose-microservices
kubectl apply -f k8s/base/

# 4. Verify
kubectl get pods -n pose-microservices
kubectl get svc -n pose-microservices
```

### **Access Backend**
```bash
# Gateway API
http://10.11.9.84:3000/api

# Or via server IP
http://<SERVER_IP>:3000/api
```

---

## 🎨 Frontend Deployment

### **Quick Deploy**
```bash
cd /path/to/app_microservice/frontend

# 1. Build image
docker build -f docker/Dockerfile -t frontend-pose:latest .

# 2. Import to K3s
docker save frontend-pose:latest | sudo k3s ctr images import -

# 3. Update API URL in k8s/frontend-deployment.yaml
# Edit: NEXT_PUBLIC_API_URL to match your Gateway IP

# 4. Deploy
kubectl apply -f k8s/frontend-deployment.yaml

# 5. Verify
kubectl get pods -n pose-microservices -l app=frontend
kubectl get svc -n pose-microservices frontend-service
```

### **Or Use Makefile**
```bash
cd frontend
make full-deploy
```

### **Access Frontend**
```bash
# Via NodePort
http://<SERVER_IP>:30100

# Via LoadBalancer (if available)
http://<LOADBALANCER_IP>
```

---

## 🚀 Full Stack Deployment

### **Complete Workflow**

#### **1. Prepare Server**
```bash
# Install K3s (if not installed)
curl -sfL https://get.k3s.io | sh -

# Setup kubectl
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
echo 'export KUBECONFIG=/etc/rancher/k3s/k3s.yaml' >> ~/.bashrc

# Create namespace
kubectl create namespace pose-microservices
```

#### **2. Deploy Backend**
```bash
cd backend

# Build all backend services
for service in auth gateway item email category; do
  docker build --target production \
    -f docker/Dockerfile.$service \
    -t backend-$service-service:latest .
done

# Import to K3s
docker save \
  backend-gateway-api:latest \
  backend-auth-service:latest \
  backend-item-service:latest \
  backend-email-service:latest \
  backend-category-service:latest \
  | sudo k3s ctr images import -

# Deploy
kubectl apply -f k8s/base/

# Wait for ready
kubectl wait --for=condition=ready pod -l tier=backend -n pose-microservices --timeout=300s
```

#### **3. Deploy Frontend**
```bash
cd ../frontend

# Build frontend
docker build -f docker/Dockerfile -t frontend-pose:latest .

# Import to K3s
docker save frontend-pose:latest | sudo k3s ctr images import -

# Deploy
kubectl apply -f k8s/frontend-deployment.yaml

# Wait for ready
kubectl wait --for=condition=ready pod -l app=frontend -n pose-microservices --timeout=300s
```

#### **4. Verify Full Stack**
```bash
# Check all pods
kubectl get pods -n pose-microservices

# Expected output:
# NAME                              READY   STATUS    RESTARTS   AGE
# auth-service-xxx                  1/1     Running   0          2m
# gateway-api-xxx                   1/1     Running   0          2m
# item-service-xxx                  1/1     Running   0          2m
# email-service-xxx                 1/1     Running   0          2m
# category-service-xxx              1/1     Running   0          2m
# frontend-xxx                      1/1     Running   0          1m
# redis-xxx                         1/1     Running   0          2m

# Check services
kubectl get svc -n pose-microservices

# Test backend
curl http://<SERVER_IP>:3000/api

# Test frontend
curl http://<SERVER_IP>:30100
```

#### **5. Test End-to-End**
```bash
# Open browser
http://<SERVER_IP>:30100

# Test flows:
# 1. Register new user
# 2. Login
# 3. Create item
# 4. View items
# 5. Edit item
# 6. Delete item
```

---

## 📊 Monitoring

### **Deploy Monitoring Stack** (Optional)

```bash
cd backend

# Install Prometheus & Grafana
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace pose-monitoring \
  --create-namespace \
  -f k8s/monitoring/prometheus-values.yaml

# Wait for ready
kubectl wait --for=condition=ready pod -n pose-monitoring --all --timeout=300s

# Access Grafana
# Port: 30001
# User: admin
# Pass: admin123
```

### **Monitor Resources**
```bash
# CPU & Memory usage
kubectl top pods -n pose-microservices

# Logs
kubectl logs -n pose-microservices -l tier=backend -f
kubectl logs -n pose-microservices -l app=frontend -f

# Events
kubectl get events -n pose-microservices --sort-by='.lastTimestamp'
```

---

## 🔄 Update Workflow

### **Update Backend**
```bash
cd backend

# Pull latest code
git pull origin main

# Rebuild specific service (e.g., item-service)
docker build --target production -f docker/Dockerfile.item -t backend-item-service:latest .

# Import to K3s
docker save backend-item-service:latest | sudo k3s ctr images import -

# Restart deployment
kubectl delete pod -n pose-microservices -l app=item-service

# Verify
kubectl get pods -n pose-microservices -l app=item-service
```

### **Update Frontend**
```bash
cd frontend

# Pull latest code
git pull origin main

# Rebuild
docker build -f docker/Dockerfile -t frontend-pose:latest .

# Import
docker save frontend-pose:latest | sudo k3s ctr images import -

# Restart
kubectl delete pod -n pose-microservices -l app=frontend

# Or use Makefile
make k8s-build
make k8s-import
make k8s-restart
```

---

## 🐛 Troubleshooting

### **Common Issues**

#### **1. Pods Pending/OOMKilled**
```bash
# Check node resources
kubectl top nodes

# Reduce resource requests
# Edit deployments:
# backend/k8s/base/*-deployment.yaml
# frontend/k8s/frontend-deployment.yaml

resources:
  requests:
    memory: "64Mi"
    cpu: "50m"
  limits:
    memory: "256Mi"
    cpu: "200m"
```

#### **2. Cannot access services**
```bash
# Check if LoadBalancer IP assigned
kubectl get svc -n pose-microservices

# If EXTERNAL-IP is <pending>, use NodePort:
# Backend: http://<SERVER_IP>:3000
# Frontend: http://<SERVER_IP>:30100
```

#### **3. Frontend cannot connect to Backend**
```bash
# Check Gateway IP
kubectl get svc -n pose-microservices gateway-service

# Update frontend deployment
# Edit: frontend/k8s/frontend-deployment.yaml
env:
  - name: NEXT_PUBLIC_API_URL
    value: "http://<CORRECT_GATEWAY_IP>:3000/api"

# Apply and restart
kubectl apply -f frontend/k8s/frontend-deployment.yaml
kubectl delete pod -n pose-microservices -l app=frontend
```

#### **4. Database connection issues**
```bash
# Check database pod
kubectl get pods -n pose-microservices | grep -E "(mysql|postgres)"

# If using external database, check connectivity
kubectl exec -n pose-microservices -l app=auth-service -- sh -c "nc -zv <DB_HOST> <DB_PORT>"
```

#### **5. Redis connection issues**
```bash
# Check Redis pod
kubectl get pods -n pose-microservices -l app=redis

# Test connection
kubectl exec -n pose-microservices -l app=redis -- redis-cli ping
# Should return: PONG
```

---

## 🎯 Production Checklist

### **Pre-deployment**
- [ ] Server meets resource requirements
- [ ] K3s installed and running
- [ ] kubectl configured
- [ ] Database ready (if external)
- [ ] Environment variables configured

### **Backend Deployment**
- [ ] All backend images built
- [ ] Images imported to K3s
- [ ] Namespace created
- [ ] ConfigMaps/Secrets created (if any)
- [ ] All pods running (1/1 Ready)
- [ ] Services accessible
- [ ] Gateway API responds

### **Frontend Deployment**
- [ ] Frontend image built
- [ ] Image imported to K3s
- [ ] API URL configured correctly
- [ ] Pod running (1/1 Ready)
- [ ] Service accessible
- [ ] Can access via browser

### **Testing**
- [ ] Register new user works
- [ ] Login works
- [ ] Create item works
- [ ] Read items works
- [ ] Update item works
- [ ] Delete item works
- [ ] No errors in browser console
- [ ] No errors in pod logs

### **Monitoring** (Optional)
- [ ] Monitoring stack deployed
- [ ] Prometheus scraping metrics
- [ ] Grafana accessible
- [ ] Dashboards showing data

---

## 📈 Scaling

### **Horizontal Scaling**
```bash
# Scale backend services
kubectl scale deployment/gateway-api -n pose-microservices --replicas=3
kubectl scale deployment/item-service -n pose-microservices --replicas=2

# Scale frontend
kubectl scale deployment/frontend -n pose-microservices --replicas=2

# Verify
kubectl get pods -n pose-microservices
```

### **Resource Adjustments**
```bash
# Edit deployment files
# Increase limits based on monitoring data

resources:
  requests:
    memory: "256Mi"
    cpu: "200m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

---

## 🔐 Security Considerations

1. **Secrets Management**
   - Use Kubernetes Secrets for sensitive data
   - Don't commit secrets to git

2. **Network Policies**
   - Restrict pod-to-pod communication
   - Use namespaces for isolation

3. **RBAC**
   - Create service accounts with minimal permissions
   - Avoid using default service account

4. **Image Security**
   - Scan images for vulnerabilities
   - Use specific tags (not `:latest`)
   - Run as non-root user

---

## 📚 Documentation Links

- **Backend:** `backend/k8s/README-PRODUCTION.md`
- **Frontend:** `frontend/DEPLOYMENT-GUIDE.md`
- **Docker (Backend):** `backend/docker/README.md`
- **Docker (Frontend):** `frontend/docker/README.md`
- **Monitoring:** `backend/k8s/monitoring/DEPLOYMENT-GUIDE.md`
- **API Testing:** `backend/API-TESTING-SCENARIOS.md`

---

## 🆘 Getting Help

1. Check pod status: `kubectl get pods -n pose-microservices`
2. Check logs: `kubectl logs -n pose-microservices <pod-name>`
3. Check events: `kubectl get events -n pose-microservices`
4. Review documentation in respective directories
5. Run health checks: `make health`

---

## 🎉 Success!

If all pods show `Running` and `1/1 Ready`, and you can:
- Access frontend at `http://<SERVER_IP>:30100`
- Register and login
- Perform CRUD operations
- No errors in logs or browser console

**Congratulations! Your full stack is deployed! 🚀**

---

**Happy Deploying! 🎯**

