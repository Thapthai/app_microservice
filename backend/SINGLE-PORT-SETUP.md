# 🚀 Single Port Setup Guide

## การใช้งาน Port เดียว (3000) สำหรับทุก Services

### 🏗️ Architecture

```
                    ┌─────────────────┐
                    │   Port 3000     │
                    │   (Nginx)       │
                    └─────────┬───────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────┐    ┌───────────▼────┐    ┌──────────▼─────┐
│Gateway API │    │  Auth Service  │    │  Item Service  │
│Port: 3000  │    │  Port: 3001    │    │  Port: 3002    │
│(internal)  │    │  (internal)    │    │  (internal)    │
└────────────┘    └────────────────┘    └────────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼───────┐
                    │  Email Service  │
                    │  Port: 3003     │
                    │  (internal)     │
                    └─────────────────┘
```

### 📋 URL Routing

| Service | Internal Port | External Access | Description |
|---------|---------------|-----------------|-------------|
| **Nginx** | - | `http://localhost:3000` | Main entry point |
| **Gateway API** | 3000 | `http://localhost:3000/api/*` | Main API routes |
| **Auth Service** | 3001 | `http://localhost:3000/auth-direct/*` | Direct auth access |
| **Item Service** | 3002 | `http://localhost:3000/items-direct/*` | Direct items access |
| **Email Service** | 3003 | `http://localhost:3000/email-direct/*` | Direct email access |

### 🔧 การใช้งาน

#### 1. เริ่ม Services

```bash
# เริ่ม services ทั้งหมด (ใช้ port 3000 เดียว)
docker-compose up -d

# ตรวจสอบสถานะ
docker-compose ps
```

#### 2. ทดสอบ API Endpoints

```bash
# ผ่าน Gateway API (แนะนำ)
curl http://localhost:3000/api/auth/register
curl http://localhost:3000/api/items
curl http://localhost:3000/api/email/test

# Direct access (ถ้าจำเป็น)
curl http://localhost:3000/auth-direct/register
curl http://localhost:3000/items-direct/
curl http://localhost:3000/email-direct/test

# Health check
curl http://localhost:3000/health
```

### 🌟 ข้อดี

#### 1. **ประหยัด Ports**
- ใช้ port 3000 เดียวสำหรับทุก services
- ไม่กระทบกับ ports อื่นๆ ในระบบ
- เหมาะสำหรับ production server

#### 2. **Load Balancing & High Availability**
```nginx
# สามารถเพิ่ม multiple instances
upstream gateway-api {
    server gateway-api-1:3000;
    server gateway-api-2:3000;
    server gateway-api-3:3000;
}
```

#### 3. **SSL/TLS Termination**
```nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://gateway-api;
    }
}
```

#### 4. **Rate Limiting**
```nginx
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    server {
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://gateway-api;
        }
    }
}
```

### ⚙️ การปรับแต่ง Nginx

#### 1. แก้ไข nginx.conf

```bash
# แก้ไขไฟล์ nginx.conf
nano nginx.conf

# Restart nginx container
docker-compose restart nginx
```

#### 2. เพิ่ม Custom Routes

```nginx
# เพิ่มใน nginx.conf
location /admin/ {
    proxy_pass http://admin-service:3004;
    # Basic auth for admin
    auth_basic "Admin Area";
    auth_basic_user_file /etc/nginx/.htpasswd;
}

location /monitoring/ {
    proxy_pass http://monitoring-service:3005;
}
```

#### 3. Static Files Serving

```nginx
location /static/ {
    root /var/www;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location /uploads/ {
    root /var/www;
    client_max_body_size 10M;
}
```

### 🔍 Monitoring & Logging

#### 1. Nginx Access Logs

```bash
# ดู nginx logs
docker-compose logs nginx

# Follow logs แบบ real-time
docker-compose logs -f nginx
```

#### 2. Service Health Checks

```bash
# ตรวจสอบ health ของทุก services
curl http://localhost:3000/health

# ตรวจสอบ individual services
docker-compose exec nginx wget -qO- http://gateway-api:3000/
docker-compose exec nginx wget -qO- http://auth-service:3001/
```

#### 3. Performance Monitoring

```nginx
# เพิ่มใน nginx.conf สำหรับ monitoring
location /nginx-status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    deny all;
}
```

### 🚨 Troubleshooting

#### 1. Service ไม่ตอบสนอง

```bash
# ตรวจสอบ nginx configuration
docker-compose exec nginx nginx -t

# Reload nginx config
docker-compose exec nginx nginx -s reload

# ตรวจสอบ network connectivity
docker-compose exec nginx ping gateway-api
```

#### 2. 502 Bad Gateway

```bash
# ตรวจสอบว่า backend services ทำงาน
docker-compose ps

# ตรวจสอบ logs ของ services
docker-compose logs gateway-api
docker-compose logs auth-service
```

#### 3. Performance Issues

```bash
# ตรวจสอบ resource usage
docker stats

# ปรับ nginx worker processes
# เพิ่มใน nginx.conf
worker_processes auto;
worker_connections 2048;
```

### 🔧 Advanced Configuration

#### 1. WebSocket Support

```nginx
location /ws/ {
    proxy_pass http://websocket-service;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

#### 2. API Versioning

```nginx
location /api/v1/ {
    proxy_pass http://gateway-api-v1;
}

location /api/v2/ {
    proxy_pass http://gateway-api-v2;
}
```

#### 3. CORS Headers

```nginx
location /api/ {
    add_header 'Access-Control-Allow-Origin' '*';
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
    add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type';
    
    if ($request_method = 'OPTIONS') {
        return 204;
    }
    
    proxy_pass http://gateway-api;
}
```

### 📊 Scaling

#### 1. Horizontal Scaling

```yaml
# docker-compose.yml
services:
  gateway-api-1:
    # ... config
  gateway-api-2:
    # ... config
  gateway-api-3:
    # ... config
```

#### 2. Auto Scaling with Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml pose-stack

# Scale services
docker service scale pose-stack_gateway-api=3
```

### 🔐 Security

#### 1. Rate Limiting

```nginx
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

location /api/auth/login {
    limit_req zone=login burst=3 nodelay;
    proxy_pass http://gateway-api;
}
```

#### 2. IP Whitelisting

```nginx
location /admin/ {
    allow 192.168.1.0/24;
    allow 10.0.0.0/8;
    deny all;
    proxy_pass http://admin-service;
}
```

### 📈 Performance Optimization

#### 1. Caching

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    proxy_pass http://gateway-api;
}
```

#### 2. Compression

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```
