# 🚀 POSE Microservices Application

Full-stack microservices application built with NestJS (Backend) and Next.js (Frontend), deployed on Kubernetes (K3s).

---

## 📋 Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Monitoring](#monitoring)
- [Development](#development)
- [Testing](#testing)
- [Documentation](#documentation)
- [Contributing](#contributing)

---

## 🎯 Overview

POSE (Point of Sale E-commerce) is a modern microservices-based application designed for scalability and maintainability. The application provides:

- **User Authentication & Authorization** (JWT-based)
- **Item Management** (CRUD operations)
- **Category Management**
- **Email Notifications**
- **Real-time Monitoring** (Prometheus + Grafana)

---

## 🏗️ Architecture

### **System Architecture**

```
┌─────────────────────────────────────────────────┐
│                   Client                         │
│            (Web Browser / Mobile)                │
└──────────────────┬──────────────────────────────┘
                   │ HTTP/HTTPS
                   ▼
┌─────────────────────────────────────────────────┐
│              Frontend (Next.js)                  │
│  - React 19 + TypeScript                        │
│  - Tailwind CSS + shadcn/ui                     │
│  - Port: 3100 (K3s NodePort: 30100)            │
└──────────────────┬──────────────────────────────┘
                   │ REST API
                   ▼
┌─────────────────────────────────────────────────┐
│           Gateway API (NestJS)                   │
│  - API Gateway Pattern                          │
│  - Request Routing                              │
│  - Port: 3000                                   │
└──────────────────┬──────────────────────────────┘
                   │ Microservices Communication
        ┌──────────┴──────────┬──────────┐
        ▼                     ▼          ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│Auth Service  │    │Item Service  │    │Email Service │
│  Port: 3001  │    │  Port: 3002  │    │  Port: 3003  │
│  Metrics:    │    │  Metrics:    │    │  Metrics:    │
│  9101        │    │  9102        │    │  9103        │
└──────┬───────┘    └──────┬───────┘    └──────────────┘
       │                   │
       └─────────┬─────────┘
                 ▼
       ┌──────────────────┐
       │Category Service  │
       │  Port: 3004      │
       │  Metrics: 9105   │
       └──────────────────┘
                 │
     ┌───────────┴───────────┐
     ▼                       ▼
┌─────────────┐      ┌─────────────┐
│  Database   │      │   Redis     │
│  (MySQL)    │      │  (Cache)    │
└─────────────┘      └─────────────┘
```

### **Monitoring Architecture**

```
┌─────────────────────────────────────────────────┐
│              Prometheus                          │
│  - Metrics Collection                           │
│  - Port: 9090 (K3s NodePort: 30090)            │
└──────────────────┬──────────────────────────────┘
                   │ Scrapes metrics from
        ┌──────────┴──────────┬──────────┐
        ▼                     ▼          ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│Gateway API   │    │Auth Service  │    │Item Service  │
│/metrics:3000 │    │/metrics:9101 │    │/metrics:9102 │
└──────────────┘    └──────────────┘    └──────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│                 Grafana                          │
│  - Data Visualization                           │
│  - Dashboards                                   │
│  - Port: 3001 (K3s NodePort: 30001)            │
└─────────────────────────────────────────────────┘
```

---

## ✨ Features

### **User Management**
- ✅ User Registration with email validation
- ✅ JWT-based Authentication
- ✅ Password hashing (bcrypt)
- ✅ Protected routes
- ✅ User profile management

### **Item Management**
- ✅ Create, Read, Update, Delete items
- ✅ Pagination support
- ✅ Search and filtering
- ✅ Category association
- ✅ Input validation

### **Category Management**
- ✅ Category CRUD operations
- ✅ Hierarchical categories (ready)
- ✅ Item-category relationships

### **Email Notifications**
- ✅ Welcome emails
- ✅ Password reset emails
- ✅ Template-based emails
- ✅ SMTP integration

### **Monitoring & Observability**
- ✅ Prometheus metrics
- ✅ Grafana dashboards
- ✅ Custom application metrics:
  - HTTP request count
  - Request duration
  - Error rates
- ✅ Resource monitoring (CPU, Memory)
- ✅ Health checks

### **Security**
- ✅ JWT authentication
- ✅ Password hashing
- ✅ Input validation (class-validator)
- ✅ CORS configuration
- ✅ Rate limiting (ready)
- ✅ SQL injection protection (Prisma ORM)

---

## 🛠️ Tech Stack

### **Backend**
- **Framework:** NestJS 10+ (Node.js + TypeScript)
- **ORM:** Prisma
- **Database:** MySQL
- **Cache:** Redis
- **Authentication:** JWT (Passport)
- **Validation:** class-validator, class-transformer
- **Documentation:** Swagger/OpenAPI (ready)
- **Monitoring:** prom-client (Prometheus)
- **Testing:** Jest

### **Frontend**
- **Framework:** Next.js 15 (React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui (Radix UI)
- **State Management:** React Context API
- **HTTP Client:** Axios
- **Form Handling:** react-hook-form + Zod
- **Notifications:** Sonner

### **Infrastructure**
- **Containerization:** Docker
- **Orchestration:** Kubernetes (K3s)
- **Monitoring:** Prometheus + Grafana
- **Reverse Proxy:** Nginx (optional)
- **CI/CD:** Ready for GitHub Actions

---

## 📁 Project Structure

```
app_microservice/
│
├── backend/                         # Backend microservices
│   ├── apps/                        # Microservice applications
│   │   ├── auth-service/           # Authentication service
│   │   ├── gateway-api/            # API Gateway
│   │   ├── item-service/           # Item management
│   │   ├── email-service/          # Email notifications
│   │   └── category-service/       # Category management
│   │
│   ├── libs/                        # Shared libraries
│   │   └── metrics/                # Custom metrics module
│   │       ├── metrics.controller.ts
│   │       ├── metrics.service.ts
│   │       ├── metrics.interceptor.ts
│   │       └── metrics.module.ts
│   │
│   ├── docker/                      # Docker configuration
│   │   ├── Dockerfile.auth
│   │   ├── Dockerfile.gateway
│   │   ├── Dockerfile.item
│   │   ├── Dockerfile.email
│   │   ├── Dockerfile.category
│   │   ├── docker-compose.yml      # Production
│   │   ├── docker-compose.dev.yml  # Development
│   │   ├── nginx.conf
│   │   ├── DOCKER-SETUP.md
│   │   └── README.md
│   │
│   ├── k8s/                         # Kubernetes manifests
│   │   ├── base/                   # Base configurations
│   │   │   ├── *-deployment.yaml
│   │   │   ├── services.yaml
│   │   │   ├── configmap.yaml
│   │   │   └── secrets.yaml.example
│   │   ├── monitoring/             # Monitoring stack
│   │   │   ├── prometheus-values.yaml
│   │   │   ├── grafana-dashboards.yaml
│   │   │   ├── application-servicemonitor.yaml
│   │   │   ├── DEPLOYMENT-GUIDE.md
│   │   │   └── README.md
│   │   └── README-PRODUCTION.md
│   │
│   ├── prisma/                      # Database schema
│   │   └── schema.prisma
│   │
│   ├── Makefile                     # Backend automation
│   ├── test-api.sh                  # API testing script
│   ├── API-TESTING-SCENARIOS.md     # Test scenarios
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                        # Frontend application
│   ├── src/
│   │   ├── app/                    # Next.js app directory
│   │   │   ├── auth/               # Auth pages
│   │   │   ├── dashboard/          # Dashboard
│   │   │   ├── items/              # Item pages
│   │   │   └── profile/            # User profile
│   │   ├── components/             # React components
│   │   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── Navbar.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── contexts/               # React contexts
│   │   │   └── AuthContext.tsx
│   │   ├── lib/                    # Utilities
│   │   │   ├── api.ts              # API client
│   │   │   ├── utils.ts
│   │   │   └── validations.ts
│   │   └── types/                  # TypeScript types
│   │       └── api.ts
│   │
│   ├── docker/                      # Docker configuration
│   │   ├── Dockerfile              # Multi-stage build
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.dev.yml
│   │   └── README.md
│   │
│   ├── k8s/                         # Kubernetes manifests
│   │   ├── frontend-deployment.yaml
│   │   └── README.md
│   │
│   ├── Makefile                     # Frontend automation
│   ├── DEPLOYMENT-GUIDE.md          # Deployment guide
│   ├── DOCKER-K8S-SETUP.md          # Quick reference
│   ├── next.config.js               # Next.js config
│   ├── package.json
│   └── tsconfig.json
│
├── DEPLOYMENT-SUMMARY.md            # Quick deployment reference
├── FULL-STACK-DEPLOYMENT.md         # Complete deployment guide
└── README.md                        # This file
```

---

## ⚡ Quick Start

### **Prerequisites**
- Node.js 20+
- Docker & Docker Compose
- K3s (for production deployment)
- MySQL (or use Docker)

### **Local Development**

#### **1. Backend**
```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma migrate dev

# Start all services
npm run start:dev

# Or start specific service
npm run start:dev auth-service
```

**Services will run on:**
- Gateway API: http://localhost:3000
- Auth Service: http://localhost:3001
- Item Service: http://localhost:3002
- Email Service: http://localhost:3003
- Category Service: http://localhost:3004

#### **2. Frontend**
```bash
cd frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit: NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Start development server
npm run dev
```

**Frontend will run on:** http://localhost:3001

#### **3. Access Application**
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000/api
- Swagger Docs: http://localhost:3000/api/docs (if enabled)

---

## 🚀 Deployment

### **Docker Compose Deployment**

#### **Backend**
```bash
cd backend

# Production
make prod

# Development
make dev

# View logs
make logs ENV=prod

# Stop
make down ENV=prod
```

#### **Frontend**
```bash
cd frontend

# Production
make prod

# Development
make up ENV=dev

# View logs
make logs ENV=prod

# Stop
make down ENV=prod
```

### **Kubernetes (K3s) Deployment**

#### **Quick Deploy (Recommended)**

**Backend:**
```bash
cd backend

# 1. Build images
docker build --target production -f docker/Dockerfile.auth -t backend-auth-service:latest .
docker build --target production -f docker/Dockerfile.gateway -t backend-gateway-api:latest .
docker build --target production -f docker/Dockerfile.item -t backend-item-service:latest .
docker build --target production -f docker/Dockerfile.email -t backend-email-service:latest .
docker build --target production -f docker/Dockerfile.category -t backend-category-service:latest .

# 2. Import to K3s
docker save backend-gateway-api:latest backend-auth-service:latest backend-item-service:latest backend-email-service:latest backend-category-service:latest | sudo k3s ctr images import -

# 3. Deploy
kubectl create namespace pose-microservices
kubectl apply -f k8s/base/

# 4. Verify
kubectl get pods -n pose-microservices
```

**Frontend:**
```bash
cd frontend

# One command deployment
make full-deploy

# Or manual
docker build -f docker/Dockerfile -t frontend-pose:latest .
docker save frontend-pose:latest | sudo k3s ctr images import -
kubectl apply -f k8s/frontend-deployment.yaml
```

#### **Deploy Monitoring** (Optional)
```bash
cd backend

# Install Prometheus & Grafana
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace pose-monitoring \
  --create-namespace \
  -f k8s/monitoring/prometheus-values.yaml

# Access Grafana
# http://<SERVER_IP>:30001
# Username: admin
# Password: admin123
```

### **Access Deployed Application**

| Service | URL | Port |
|---------|-----|------|
| Frontend | `http://<SERVER_IP>:30100` | NodePort 30100 |
| Backend API | `http://<SERVER_IP>:3000/api` | LoadBalancer |
| Grafana | `http://<SERVER_IP>:30001` | NodePort 30001 |
| Prometheus | `http://<SERVER_IP>:30090` | NodePort 30090 |

---

## 📖 API Documentation

### **Authentication Endpoints**

#### **Register User**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "John Doe"
}
```

#### **Login**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}

# Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### **Get Profile**
```bash
GET /api/auth/profile
Authorization: Bearer <access_token>
```

### **Item Endpoints**

#### **Get All Items**
```bash
GET /api/items?page=1&limit=10
```

#### **Get Single Item**
```bash
GET /api/items/:id
```

#### **Create Item**
```bash
POST /api/items
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Product Name",
  "description": "Product Description",
  "price": 99.99
}
```

#### **Update Item**
```bash
PATCH /api/items/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "price": 149.99
}
```

#### **Delete Item**
```bash
DELETE /api/items/:id
Authorization: Bearer <access_token>
```

### **Category Endpoints**

```bash
GET /api/categories              # Get all categories
POST /api/categories             # Create category (requires auth)
PATCH /api/categories/:id        # Update category (requires auth)
DELETE /api/categories/:id       # Delete category (requires auth)
```

**For complete API documentation, see:** `backend/API-TESTING-SCENARIOS.md`

---

## 📊 Monitoring

### **Prometheus Metrics**

Access Prometheus: `http://<SERVER_IP>:30090`

**Available Metrics:**
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration histogram
- `process_cpu_seconds_total` - CPU usage
- `process_resident_memory_bytes` - Memory usage

**Example Queries:**
```promql
# Total requests by service
sum(rate(http_requests_total[5m])) by (service)

# Request rate
rate(http_requests_total[5m])

# Error rate (5xx responses)
rate(http_requests_total{status_code=~"5.."}[5m])

# 95th percentile response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Requests per second by route
sum(rate(http_requests_total[5m])) by (route)
```

### **Grafana Dashboards**

Access Grafana: `http://<SERVER_IP>:30001`
- Username: `admin`
- Password: `admin123`

**Pre-configured Dashboards:**
1. **NestJS Microservices Overview**
   - Request rates by service
   - Response times
   - Error rates
   - Resource usage

2. **Individual Service Dashboards**
   - Gateway API metrics
   - Auth Service metrics
   - Item Service metrics

---

## 👨‍💻 Development

### **Backend Development**

#### **Add New Microservice**
```bash
# Generate new NestJS application
nest g app new-service

# Create Dockerfile
cp backend/docker/Dockerfile.auth backend/docker/Dockerfile.new-service
# Edit Dockerfile.new-service

# Create K8s deployment
cp backend/k8s/base/auth-deployment.yaml backend/k8s/base/new-service-deployment.yaml
# Edit new-service-deployment.yaml

# Add to Makefile, docker-compose, etc.
```

#### **Add Metrics to Service**
```typescript
// Import MetricsModule
import { MetricsModule } from '../../../libs/metrics/metrics.module';

@Module({
  imports: [MetricsModule],
  // ...
})
export class YourServiceModule {}
```

Metrics will be automatically collected for HTTP requests.

#### **Database Migrations**
```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### **Frontend Development**

#### **Add New Page**
```bash
# Create new route in src/app/
mkdir src/app/new-page
touch src/app/new-page/page.tsx
```

#### **Add New Component**
```bash
# Using shadcn/ui
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
```

#### **API Integration**
```typescript
// In src/lib/api.ts
export const apiClient = {
  // Add new API methods
  async getNewData() {
    return api.get('/new-endpoint');
  }
};
```

---

## 🧪 Testing

### **Backend Testing**

#### **Unit Tests**
```bash
# Run all tests
npm test

# Run specific service tests
npm test auth-service

# Coverage
npm run test:cov
```

#### **E2E Tests**
```bash
# Run e2e tests
npm run test:e2e

# Specific service
npm run test:e2e auth-service
```

#### **API Testing**
```bash
# Automated API tests
cd backend
./test-api.sh

# Manual testing with scenarios
# See: backend/API-TESTING-SCENARIOS.md
```

### **Frontend Testing**
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build test
npm run build
```

---

## 📚 Documentation

### **Main Documentation**
- **[DEPLOYMENT-SUMMARY.md](DEPLOYMENT-SUMMARY.md)** - Quick deployment reference
- **[FULL-STACK-DEPLOYMENT.md](FULL-STACK-DEPLOYMENT.md)** - Complete deployment guide

### **Backend Documentation**
- **[backend/docker/README.md](backend/docker/README.md)** - Docker configuration
- **[backend/k8s/README-PRODUCTION.md](backend/k8s/README-PRODUCTION.md)** - K8s production guide
- **[backend/API-TESTING-SCENARIOS.md](backend/API-TESTING-SCENARIOS.md)** - API testing guide
- **[backend/k8s/monitoring/DEPLOYMENT-GUIDE.md](backend/k8s/monitoring/DEPLOYMENT-GUIDE.md)** - Monitoring setup

### **Frontend Documentation**
- **[frontend/DEPLOYMENT-GUIDE.md](frontend/DEPLOYMENT-GUIDE.md)** - Complete deployment guide
- **[frontend/docker/README.md](frontend/docker/README.md)** - Docker configuration
- **[frontend/k8s/README.md](frontend/k8s/README.md)** - K8s deployment guide
- **[frontend/DOCKER-K8S-SETUP.md](frontend/DOCKER-K8S-SETUP.md)** - Quick reference

---

## 🔧 Troubleshooting

### **Common Issues**

#### **Backend: Cannot connect to database**
```bash
# Check database connection
# Edit backend/.env
DATABASE_URL="mysql://user:password@host:3306/database"

# Test connection
npx prisma db push
```

#### **Frontend: API calls failing**
```bash
# Check API URL in .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Or in K8s
kubectl exec -n pose-microservices -l app=frontend -- env | grep NEXT_PUBLIC
```

#### **K8s: Pods pending/crashing**
```bash
# Check pod status
kubectl get pods -n pose-microservices

# View logs
kubectl logs -n pose-microservices <pod-name>

# Describe pod
kubectl describe pod -n pose-microservices <pod-name>

# Check events
kubectl get events -n pose-microservices --sort-by='.lastTimestamp'
```

#### **K8s: Out of memory**
```bash
# Reduce resource requests
# Edit k8s/*-deployment.yaml
resources:
  requests:
    memory: "64Mi"
    cpu: "50m"
  limits:
    memory: "256Mi"
    cpu: "200m"
```

---

## 🤝 Contributing

### **Development Workflow**

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Test your changes**
   ```bash
   npm test
   npm run lint
   ```
5. **Commit your changes**
   ```bash
   git commit -m "feat: add new feature"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**

### **Commit Convention**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

---

## 📝 Environment Variables

### **Backend (.env)**
```bash
# Database
DATABASE_URL=mysql://user:password@localhost:3306/database

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379

# SMTP (Email Service)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@example.com

# Node Environment
NODE_ENV=production

# Service Names (for metrics)
SERVICE_NAME=auth-service  # Change per service
```

### **Frontend (.env.local)**
```bash
# API Gateway URL
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Node Environment
NODE_ENV=development
```

---

## 📊 System Requirements

### **Development**
- **RAM:** 4GB+
- **CPU:** 2+ cores
- **Disk:** 10GB+ free space
- **OS:** macOS, Linux, Windows (with WSL2)

### **Production (K3s)**
- **RAM:** 8GB+ (minimum 4GB)
- **CPU:** 4+ cores (minimum 2)
- **Disk:** 20GB+ free space
- **OS:** Ubuntu 20.04+, Debian 10+, CentOS 7+

---

## 📈 Roadmap

### **In Progress**
- [ ] Unit test coverage (80%+)
- [ ] E2E test automation
- [ ] CI/CD pipeline (GitHub Actions)

### **Planned Features**
- [ ] WebSocket support for real-time updates
- [ ] File upload service
- [ ] Advanced search with Elasticsearch
- [ ] Rate limiting middleware
- [ ] API versioning
- [ ] Swagger/OpenAPI documentation
- [ ] GraphQL API (optional)
- [ ] Multi-language support (i18n)
- [ ] Advanced caching strategies
- [ ] Message queue (RabbitMQ/Kafka)

### **Future Enhancements**
- [ ] Service mesh (Istio)
- [ ] Advanced monitoring (Jaeger tracing)
- [ ] Auto-scaling configurations
- [ ] Disaster recovery setup
- [ ] Multi-region deployment
- [ ] Mobile app (React Native)

---

## 📜 License

This project is licensed under the MIT License.

---

## 👥 Authors

- **Development Team** - POSE Development

---

## 🙏 Acknowledgments

- NestJS team for the amazing framework
- Next.js team for the React framework
- Vercel for shadcn/ui components
- Prometheus & Grafana communities
- All open-source contributors

---

## 📞 Support

- **Documentation:** See `/docs` folder and individual `README.md` files
- **Issues:** Create an issue in the repository
- **Email:** support@pose.example.com (if available)

---

## 🎯 Quick Links

- [Backend Docker Setup](backend/docker/README.md)
- [Frontend Docker Setup](frontend/docker/README.md)
- [K8s Production Guide](backend/k8s/README-PRODUCTION.md)
- [API Testing Guide](backend/API-TESTING-SCENARIOS.md)
- [Full Deployment Guide](FULL-STACK-DEPLOYMENT.md)
- [Monitoring Setup](backend/k8s/monitoring/DEPLOYMENT-GUIDE.md)

---

**Built with ❤️ using NestJS, Next.js, and Kubernetes**

🚀 **Ready to deploy!** See [DEPLOYMENT-SUMMARY.md](DEPLOYMENT-SUMMARY.md) for quick start.
