# 🐳 Docker Configuration Files

This directory contains all Docker-related configuration files for the POSE Microservices project.

---

## 📁 Directory Structure

```
docker/
├── README.md                      # This file
├── Dockerfile.auth                # Auth service Dockerfile
├── Dockerfile.gateway             # Gateway API Dockerfile
├── Dockerfile.item                # Item service Dockerfile
├── Dockerfile.email               # Email service Dockerfile
├── Dockerfile.category            # Category service Dockerfile
├── docker-compose.yml             # Production compose file
├── docker-compose.dev.yml         # Development compose file
├── docker-compose.prod.yml        # Alternative production compose
├── docker-deploy.sh               # Deployment script
├── nginx.conf                     # Nginx reverse proxy config
├── DOCKER-SETUP.md                # Docker setup guide
└── DOCKER-REGISTRY-SETUP.md       # Docker registry guide
```

---

## 🚀 Quick Start

### **Development Mode**
```bash
# From backend/ directory
make dev

# Or manually
docker-compose -f docker/docker-compose.dev.yml up -d --build
```

### **Production Mode**
```bash
# From backend/ directory
make prod

# Or manually
docker-compose -f docker/docker-compose.yml up -d --build
```

---

## 📝 Dockerfiles

### **Multi-Stage Build**
All Dockerfiles use multi-stage builds:
- **Builder Stage:** Compiles TypeScript code
- **Production Stage:** Runs the compiled JavaScript

**Benefits:**
- ✅ No need to install Node.js on server
- ✅ Smaller final image size
- ✅ Faster builds with layer caching
- ✅ More secure (no build tools in production)

### **Example: Dockerfile.auth**
```dockerfile
# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:auth

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/apps/auth-service/main.js"]
```

---

## 🔧 Docker Compose Files

### **docker-compose.yml** (Production)
- Uses `target: production` for all services
- Optimized for production deployment
- Includes health checks
- Uses environment variables from `.env`

### **docker-compose.dev.yml** (Development)
- Includes volume mounts for hot reload
- Exposes additional ports for debugging
- Uses development configurations

### **docker-compose.prod.yml** (Alternative)
- Alternative production setup
- May include additional production-specific configs

---

## 🌐 Nginx Configuration

### **nginx.conf**
Reverse proxy configuration that:
- Routes `/api/*` to Gateway API
- Routes direct service access endpoints
- Load balancing (if needed)
- SSL termination (if configured)

**Endpoints:**
```
http://localhost:3000/api/          → gateway-api:3000
http://localhost:3000/auth-direct/  → auth-service:3001
http://localhost:3000/items-direct/ → item-service:3002
http://localhost:3000/email-direct/ → email-service:3003
```

---

## 🛠️ Usage with Makefile

The project includes a Makefile for easier Docker management:

```bash
# Show all commands
make help

# Development
make dev              # Start dev environment
make up ENV=dev       # Start dev services
make down ENV=dev     # Stop dev services
make logs ENV=dev     # View dev logs

# Production
make prod             # Start prod environment
make up ENV=prod      # Start prod services
make down ENV=prod    # Stop prod services
make logs ENV=prod    # View prod logs

# Building
make build            # Build all services (respects ENV)
make build-service SERVICE=auth-service

# Health checks
make health           # Check service health via nginx
make health-direct    # Check services directly

# Cleanup
make clean            # Clean containers and networks
make clean-volumes    # Remove all volumes (⚠️ deletes data)
```

---

## 🏗️ Building Images for K3s/K8s

### **1. Build Images**
```bash
cd /path/to/backend

# Build all services
docker build --target production -f docker/Dockerfile.auth -t backend-auth-service:latest .
docker build --target production -f docker/Dockerfile.gateway -t backend-gateway-api:latest .
docker build --target production -f docker/Dockerfile.item -t backend-item-service:latest .
docker build --target production -f docker/Dockerfile.email -t backend-email-service:latest .
docker build --target production -f docker/Dockerfile.category -t backend-category-service:latest .
```

### **2. Import to K3s**
```bash
# Save images to tar
docker save \
  backend-gateway-api:latest \
  backend-auth-service:latest \
  backend-item-service:latest \
  backend-email-service:latest \
  backend-category-service:latest \
  | sudo k3s ctr images import -
```

### **3. Verify Import**
```bash
sudo k3s ctr images ls | grep backend
```

---

## 🔄 Update Workflow

### **For Docker Compose Deployment**
```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild and restart
make up-build ENV=prod

# 3. Check status
make status ENV=prod
```

### **For K3s/K8s Deployment**
```bash
# 1. Pull and build
git pull origin main
docker build --target production -f docker/Dockerfile.auth -t backend-auth-service:latest .

# 2. Import to K3s
docker save backend-auth-service:latest | sudo k3s ctr images import -

# 3. Delete old pods (K8s will create new ones)
kubectl delete pod -n pose-microservices -l app=auth-service

# 4. Verify
kubectl get pods -n pose-microservices
```

---

## 📊 Image Sizes

Optimized multi-stage builds result in smaller images:

```
REPOSITORY                    SIZE
backend-gateway-api          ~200MB
backend-auth-service         ~200MB
backend-item-service         ~200MB
backend-email-service        ~180MB
backend-category-service     ~180MB
```

---

## 🔐 Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Database
DATABASE_URL=mysql://user:pass@host:3306/db

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# SMTP (for email service)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@example.com

# Node Environment
NODE_ENV=production
```

---

## 🐛 Troubleshooting

### **Issue: Cannot find Dockerfile**
```bash
# Make sure you're in the backend/ directory
cd /path/to/backend

# Check if Dockerfiles exist
ls -la docker/Dockerfile.*
```

### **Issue: Build fails with "Cannot find module"**
```bash
# Clean Docker cache
docker builder prune -a

# Rebuild without cache
docker build --no-cache --target production -f docker/Dockerfile.auth -t backend-auth-service:latest .
```

### **Issue: Service won't start in K3s**
```bash
# Check pod logs
kubectl logs -n pose-microservices -l app=auth-service

# Check if image exists in K3s
sudo k3s ctr images ls | grep backend-auth-service

# If not, re-import
docker save backend-auth-service:latest | sudo k3s ctr images import -
```

### **Issue: Port already in use**
```bash
# Check what's using the port
sudo lsof -i :3000

# Stop all containers
docker stop $(docker ps -aq)

# Try again
make up ENV=prod
```

---

## 📚 Additional Documentation

- **[DOCKER-SETUP.md](./DOCKER-SETUP.md)** - Detailed Docker setup guide
- **[DOCKER-REGISTRY-SETUP.md](./DOCKER-REGISTRY-SETUP.md)** - Docker registry configuration
- **[../k8s/README-PRODUCTION.md](../k8s/README-PRODUCTION.md)** - K3s production deployment guide

---

## 🎯 Best Practices

1. **Always use multi-stage builds** for smaller images
2. **Use `.dockerignore`** to exclude unnecessary files
3. **Tag images properly** for version control
4. **Use environment variables** for configuration
5. **Health checks** in docker-compose files
6. **Resource limits** in production
7. **Security scanning** with `docker scan`
8. **Regular updates** of base images

---

## 🔍 Useful Commands

```bash
# View running containers
docker ps

# View all containers
docker ps -a

# View images
docker images

# View logs
docker logs <container-name> -f

# Execute command in container
docker exec -it <container-name> sh

# Remove stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Full cleanup (⚠️ removes everything)
docker system prune -a --volumes
```

---

**Happy Dockerizing! 🐳**

