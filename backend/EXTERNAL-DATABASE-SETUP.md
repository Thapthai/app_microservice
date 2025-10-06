# 🗄️ External Database Setup Guide

## การใช้งานกับ Database ภายนอก

### 🔧 การตั้งค่า .env สำหรับ External Database

```bash
# =================================
# EXTERNAL DATABASE CONFIGURATION
# =================================
# ใช้ IP หรือ hostname ของ database server ภายนอก
DB_HOST=your-external-db-host.com
DB_PORT=3306
DB_NAME=pose_microservice
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Connection string สำหรับ external database
DATABASE_URL="mysql://your_db_user:your_db_password@your-external-db-host.com:3306/pose_microservice"

# =================================
# REDIS CONFIGURATION
# =================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# =================================
# SERVICE CONFIGURATION
# =================================
GATEWAY_PORT=3000
AUTH_SERVICE_HOST=localhost
AUTH_SERVICE_PORT=3001

# =================================
# JWT & SECURITY
# =================================
JWT_SECRET=your-super-secret-jwt-key-here
BCRYPT_ROUNDS=10
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100

# =================================
# EMAIL CONFIGURATION
# =================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
SMTP_FROM=noreply@yourapp.com
APP_NAME=POSE Microservice
SUPPORT_EMAIL=support@yourapp.com
FRONTEND_URL=http://localhost:3001

# =================================
# OAUTH2 CONFIGURATION
# =================================
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

## 🚀 การเริ่มต้นใช้งาน

### 1. ตั้งค่า External Database

```sql
-- สร้าง database
CREATE DATABASE pose_microservice;

-- สร้าง user (ถ้าจำเป็น)
CREATE USER 'pose_user'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON pose_microservice.* TO 'pose_user'@'%';
FLUSH PRIVILEGES;
```

### 2. ตั้งค่า Environment Variables

```bash
# คัดลอกและแก้ไข .env
cp .env.example .env
nano .env

# แก้ไข DB_HOST เป็น IP/hostname ของ database server
DB_HOST=192.168.1.100  # หรือ your-db-server.com
```

### 3. เริ่ม Services (ไม่รวม Database)

```bash
# เริ่ม services ทั้งหมด (ไม่มี database container)
docker-compose up -d

# ตรวจสอบสถานะ
docker-compose ps
```

### 4. Run Database Migrations

```bash
# เข้าไปใน auth-service container
docker-compose exec auth-service sh

# รัน migrations
npx prisma migrate deploy

# หรือ generate Prisma client
npx prisma generate

# ออกจาก container
exit
```

## 🔍 การทดสอบการเชื่อมต่อ

### ทดสอบจาก Container

```bash
# ทดสอบการเชื่อมต่อ database จาก auth-service
docker-compose exec auth-service sh -c "npx prisma db push --preview-feature"

# หรือทดสอบด้วย MySQL client
docker-compose exec auth-service sh -c "mysql -h \$DB_HOST -u \$DB_USER -p\$DB_PASSWORD -e 'SELECT 1;'"
```

### ทดสอบจาก Host Machine

```bash
# ทดสอบการเชื่อมต่อจากเครื่อง host
mysql -h your-external-db-host.com -u your_db_user -p -e "USE pose_microservice; SHOW TABLES;"
```

## 🏗️ Architecture แบบ External Database

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
            └─────┬──────┘ └────┬────┘ └─────────┘
                  │             │
                  └─────────────┼─────────────┐
                                │             │
                    ┌───────────▼─────────────▼───┐
                    │    External Database        │
                    │    (MySQL/PostgreSQL)       │
                    │    your-db-server.com       │
                    └─────────────────────────────┘
```

## ⚠️ ข้อควรระวัง

### 1. Network Security
```bash
# ตรวจสอบว่า database server อนุญาตการเชื่อมต่อจาก Docker containers
# อาจต้องเปิด firewall port 3306 (MySQL) หรือ 5432 (PostgreSQL)
```

### 2. Connection Limits
```bash
# ตรวจสอบ max_connections ของ database server
SHOW VARIABLES LIKE 'max_connections';

# ปรับ connection pool ใน Prisma ถ้าจำเป็น
```

### 3. SSL/TLS Connection
```bash
# สำหรับ production ควรใช้ SSL connection
DATABASE_URL="mysql://user:pass@host:3306/db?ssl=true"
```

## 🔧 Troubleshooting

### ปัญหาการเชื่อมต่อ Database

```bash
# ตรวจสอบ network connectivity
docker-compose exec auth-service ping your-db-host.com

# ตรวจสอบ port accessibility
docker-compose exec auth-service telnet your-db-host.com 3306

# ดู logs ของ services
docker-compose logs auth-service
docker-compose logs item-service
```

### ปัญหา Prisma Migration

```bash
# Reset database schema (ระวัง: จะลบข้อมูลทั้งหมด)
docker-compose exec auth-service npx prisma migrate reset --force

# Push schema โดยไม่สร้าง migration file
docker-compose exec auth-service npx prisma db push
```

### ปัญหา Permission

```bash
# ตรวจสอบ user permissions
SHOW GRANTS FOR 'your_user'@'%';

# Grant permissions ที่จำเป็น
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER ON pose_microservice.* TO 'your_user'@'%';
```

## 📊 Monitoring

### Database Performance

```sql
-- ตรวจสอบ active connections
SHOW PROCESSLIST;

-- ตรวจสอบ slow queries
SHOW VARIABLES LIKE 'slow_query_log';
```

### Application Metrics

```bash
# ตรวจสอบ resource usage ของ containers
docker stats

# ตรวจสอบ logs แบบ real-time
docker-compose logs -f auth-service
```
