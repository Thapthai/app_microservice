# 🐳 Frontend Docker Configuration

This directory contains Docker configuration files for the POSE Frontend (Next.js).

---

## 📁 Directory Structure

```
docker/
├── README.md                      # This file
├── Dockerfile                     # Multi-stage production Dockerfile
├── docker-compose.yml             # Production compose file
└── docker-compose.dev.yml         # Development compose file
```

---

## 🚀 Quick Start

### **Development Mode**
```bash
# From frontend/ directory
make dev

# Or manually
npm run dev
```

### **Production Mode (Docker)**
```bash
# From frontend/ directory
make prod

# Or manually
docker compose -f docker/docker-compose.yml up -d --build
```

### **Production Mode (K3s)**
```bash
# Full deployment workflow
make full-deploy

# Or step by step
make k8s-build    # Build image
make k8s-import   # Import to K3s
make k8s-deploy   # Deploy to K3s
```

---

## 📝 Dockerfile

### **Multi-Stage Build**

The Dockerfile uses a 3-stage build process:

1. **Dependencies Stage** - Install production dependencies
2. **Builder Stage** - Build Next.js application
3. **Production Stage** - Run the optimized application

**Benefits:**
- ✅ Smaller final image (~200MB vs ~1GB)
- ✅ Faster builds with layer caching
- ✅ More secure (no source code in production)
- ✅ Standalone output (no need for node_modules)

### **Build Process**
```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Builder
FROM node:20-alpine AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
CMD ["node", "server.js"]
```

---

## 🔧 Docker Compose Files

### **docker-compose.yml** (Production)
- Uses standalone Next.js output
- Port: 3100
- Optimized for production
- Includes health checks

### **docker-compose.dev.yml** (Development)
- Hot reload with volume mounts
- Port: 3001
- Development mode
- Source code synchronization

---

## 🌐 Environment Variables

### **Required Variables**

Create `.env.local` file:
```bash
# API Gateway URL
NEXT_PUBLIC_API_URL=http://10.11.9.84:3000/api

# Optional: Node Environment
NODE_ENV=production

# Optional: Port
PORT=3100
```

### **Production (K3s)**
Set in `k8s/frontend-deployment.yaml`:
```yaml
env:
  - name: NEXT_PUBLIC_API_URL
    value: "http://10.11.9.84:3000/api"
  - name: NODE_ENV
    value: "production"
```

---

## 🛠️ Usage with Makefile

### **Local Development**
```bash
make dev              # Start dev server (npm run dev)
make setup            # Create .env.local
```

### **Docker Commands**
```bash
make build            # Build Docker image
make build-no-cache   # Build without cache
make up ENV=prod      # Start production container
make down             # Stop container
make logs             # View logs
make status           # Show status
make clean            # Clean up
```

### **K3s Commands**
```bash
make k8s-build        # Build image
make k8s-import       # Import to K3s
make k8s-deploy       # Deploy to K3s
make k8s-delete       # Delete from K3s
make k8s-restart      # Restart deployment
make k8s-status       # Show K3s status
make k8s-logs         # View K3s logs
make full-deploy      # Full workflow
```

### **Health Check**
```bash
make health           # Check if frontend is running
```

---

## 🏗️ Building for K3s

### **Step-by-Step Process**

#### **1. Build Docker Image**
```bash
cd /path/to/frontend

# Build image
docker build -f docker/Dockerfile -t frontend-pose:latest .

# Or use Makefile
make k8s-build
```

#### **2. Import to K3s**
```bash
# Import image to K3s containerd
docker save frontend-pose:latest | sudo k3s ctr images import -

# Verify import
sudo k3s ctr images ls | grep frontend-pose

# Or use Makefile
make k8s-import
```

#### **3. Deploy to K3s**
```bash
# Deploy
kubectl apply -f k8s/frontend-deployment.yaml

# Check status
kubectl get pods -n pose-microservices -l app=frontend
kubectl get svc -n pose-microservices frontend-service

# Or use Makefile
make k8s-deploy
```

#### **4. Access Frontend**
```bash
# Get LoadBalancer IP
kubectl get svc -n pose-microservices frontend-service

# Access via NodePort
http://<SERVER_IP>:30100

# Or use LoadBalancer IP
http://<LOADBALANCER_IP>
```

---

## 🔄 Update Workflow

### **For Docker Compose**
```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild and restart
make up-build ENV=prod

# 3. Check status
make status ENV=prod
```

### **For K3s**
```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild image
make k8s-build

# 3. Import to K3s
make k8s-import

# 4. Restart deployment (K8s will use new image)
kubectl delete pod -n pose-microservices -l app=frontend

# Or use Makefile
make k8s-restart

# 5. Verify
make k8s-status
```

---

## 📊 Resource Usage

### **Docker Image Size**
```
REPOSITORY           TAG        SIZE
frontend-pose        latest     ~200MB
```

### **K3s Resources**
```yaml
requests:
  memory: "128Mi"
  cpu: "100m"
limits:
  memory: "512Mi"
  cpu: "500m"
```

---

## 🔍 Troubleshooting

### **Issue: Build fails with "Cannot find module"**
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Rebuild
make build-no-cache
```

### **Issue: "output: 'standalone' not working"**
Make sure `next.config.js` has:
```javascript
module.exports = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
}
```

### **Issue: Cannot access frontend in K3s**
```bash
# Check pod status
kubectl get pods -n pose-microservices -l app=frontend

# Check pod logs
kubectl logs -n pose-microservices -l app=frontend

# Check service
kubectl get svc -n pose-microservices frontend-service

# Check if image exists
sudo k3s ctr images ls | grep frontend-pose
```

### **Issue: Environment variables not working**
```bash
# Check pod environment
kubectl exec -n pose-microservices <pod-name> -- env | grep NEXT_PUBLIC

# Update deployment
kubectl apply -f k8s/frontend-deployment.yaml

# Restart
kubectl rollout restart deployment/frontend -n pose-microservices
```

### **Issue: Port 3100 already in use**
```bash
# Check what's using the port
sudo lsof -i :3100

# Stop the process
kill <PID>

# Or change port in deployment
```

---

## 🔐 Security Best Practices

1. **Non-root user** - Dockerfile runs as `nextjs` user
2. **Multi-stage build** - No build tools in production image
3. **Health checks** - Automatic restart on failure
4. **Resource limits** - Prevent resource exhaustion
5. **Read-only filesystem** - (Can be enabled in K8s)

---

## 📈 Performance Optimization

### **Next.js Configuration**
```javascript
// next.config.js
module.exports = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  compress: true,
  poweredByHeader: false,
}
```

### **Docker Build Cache**
```bash
# Use BuildKit for faster builds
export DOCKER_BUILDKIT=1

# Build with cache
docker build -f docker/Dockerfile -t frontend-pose:latest .
```

### **K3s Optimization**
```yaml
# Use horizontal pod autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-hpa
spec:
  scaleTargetRef:
    kind: Deployment
    name: frontend
  minReplicas: 1
  maxReplicas: 5
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

---

## 🎯 Production Checklist

- [ ] Build image successfully
- [ ] Import to K3s
- [ ] Deploy to K3s
- [ ] Health checks passing
- [ ] Environment variables set correctly
- [ ] Can access via LoadBalancer/NodePort
- [ ] API calls work (check browser console)
- [ ] Monitor logs for errors
- [ ] Set up resource limits
- [ ] Enable monitoring (if available)

---

## 📚 Additional Resources

- **Next.js Standalone Build**: https://nextjs.org/docs/advanced-features/output-file-tracing
- **Docker Multi-stage Builds**: https://docs.docker.com/build/building/multi-stage/
- **K3s Documentation**: https://docs.k3s.io/

---

**Happy Deploying! 🚀**

