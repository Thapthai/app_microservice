# 🐳 Docker Setup Guide

## Quick Start

### 1. Setup Environment
```bash
# Copy environment example
cp .env.example .env

# Edit your configuration
nano .env
```

### 2. Start Development Environment
```bash
# Using Makefile (recommended)
make quick-start

# Or manually
docker-compose -f docker-compose.dev.yml up -d --build
```

### 3. Start Production Environment
```bash
# Using Makefile
make prod

# Or manually
docker-compose -f docker-compose.yml up -d --build
```

## 📋 Available Commands

### Using Makefile (Recommended)

```bash
# Show all available commands
make help

# Development
make dev                    # Start development environment
make up ENV=dev            # Start dev services
make down ENV=dev          # Stop dev services
make logs ENV=dev          # Show dev logs

# Production
make prod                  # Start production environment
make up ENV=prod           # Start prod services
make down ENV=prod         # Stop prod services
make logs ENV=prod         # Show prod logs

# Build
make build                 # Build all services
make build-service SERVICE=auth-service  # Build specific service

# Database
make db-migrate            # Run migrations
make db-seed              # Seed database
make db-reset             # Reset database (⚠️ deletes data)

# Maintenance
make status               # Show service status
make health              # Check service health
make clean               # Clean up containers
make shell SERVICE=auth-service  # Access service shell
```

### Manual Docker Commands

```bash
# Development
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml logs -f

# Production
docker-compose -f docker-compose.yml up -d
docker-compose -f docker-compose.yml down
docker-compose -f docker-compose.yml logs -f

# Build specific service
docker-compose -f docker-compose.dev.yml build auth-service
```

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL="mysql://pose_user:userpassword@database:3306/pose_microservice"
DB_HOST=database
DB_PORT=3306
DB_NAME=pose_microservice
DB_USER=pose_user
DB_PASSWORD=userpassword

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Services
GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001
ITEM_SERVICE_PORT=3002
EMAIL_SERVICE_PORT=3003

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# OAuth2 (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Gateway API   │
│   (Next.js)     │◄──►│   Port: 3000    │
└─────────────────┘    └─────────────────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
            ┌───────▼────┐ ┌────▼────┐ ┌───▼─────┐
            │Auth Service│ │Item Svc │ │Email Svc│
            │Port: 3001  │ │Port:3002│ │Port:3003│
            └────────────┘ └─────────┘ └─────────┘
                    │           │           │
                    └───────────┼───────────┘
                                │
                    ┌───────────▼───────────┐
                    │      Database         │
                    │      (MySQL)          │
                    │      Port: 3306       │
                    └───────────────────────┘
```

## 🚀 Service Endpoints

| Service | Development | Production | Health Check |
|---------|-------------|------------|--------------|
| Gateway API | http://localhost:3000 | http://localhost:3000 | /health |
| Auth Service | http://localhost:3001 | http://localhost:3001 | /health |
| Item Service | http://localhost:3002 | http://localhost:3002 | /health |
| Email Service | http://localhost:3003 | http://localhost:3003 | /health |
| Database | localhost:3306 | localhost:3306 | - |
| Redis | localhost:6379 | localhost:6379 | - |

## 🔍 Troubleshooting

### Check Service Status
```bash
make status
# or
docker-compose -f docker-compose.dev.yml ps
```

### View Logs
```bash
# All services
make logs

# Specific service
make logs-service SERVICE=auth-service

# Follow logs
docker-compose -f docker-compose.dev.yml logs -f auth-service
```

### Access Service Shell
```bash
make shell SERVICE=auth-service
# or
docker-compose -f docker-compose.dev.yml exec auth-service sh
```

### Database Issues
```bash
# Check database connection
docker-compose -f docker-compose.dev.yml exec database mysql -u pose_user -p

# Run migrations
make db-migrate

# Reset database (⚠️ deletes all data)
make db-reset
```

### Port Conflicts
If you get port conflicts, update the ports in your `.env` file:
```bash
GATEWAY_PORT=3010
AUTH_SERVICE_PORT=3011
ITEM_SERVICE_PORT=3012
EMAIL_SERVICE_PORT=3013
DB_PORT=3316
REDIS_PORT=6389
```

### Clean Up
```bash
# Stop and remove containers
make clean

# Remove volumes (⚠️ deletes all data)
make clean-volumes
```

## 🔐 Security Notes

1. **Change default passwords** in production
2. **Use strong JWT secrets** (minimum 32 characters)
3. **Enable HTTPS** in production
4. **Use environment-specific .env files**
5. **Don't commit .env files** to version control

## 📊 Monitoring

### Health Checks
```bash
# Check all services
make health

# Manual health checks
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

### Resource Usage
```bash
# Container stats
docker stats

# Service-specific stats
docker stats pose-gateway-api pose-auth-service pose-item-service pose-email-service
```

## 🔄 Development Workflow

1. **Start development environment**
   ```bash
   make dev
   ```

2. **Make code changes** (hot reload enabled in dev mode)

3. **View logs**
   ```bash
   make logs-service SERVICE=auth-service
   ```

4. **Test changes**
   ```bash
   curl http://localhost:3000/api/health
   ```

5. **Rebuild if needed**
   ```bash
   make build-service SERVICE=auth-service
   ```

## 🚀 Production Deployment

1. **Setup production environment**
   ```bash
   cp env.template .env.production
   # Edit production values
   ```

2. **Build and deploy**
   ```bash
   ENV=prod make up-build
   ```

3. **Run migrations**
   ```bash
   ENV=prod make db-migrate
   ```

4. **Monitor services**
   ```bash
   ENV=prod make status
   ENV=prod make health
   ```
