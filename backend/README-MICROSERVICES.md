# NestJS Microservices - Linen Service

โปรเจคนี้เป็น NestJS Microservices ที่ประกอบด้วย:

## Services

### 1. Gateway API (Port 3000)
- **หน้าที่**: API Gateway สำหรับ client ภายนอกติดต่อเข้ามา
- **Port**: 3000
- **Endpoints**:
  - `GET /api` - Health check
  - `POST /api/auth/register` - สมัครสมาชิก
  - `POST /api/auth/login` - เข้าสู่ระบบ
  - `GET /api/auth/profile` - ดูข้อมูลผู้ใช้
  - `POST /api/items` - สร้าง item ใหม่
  - `GET /api/items` - ดู items ทั้งหมด
  - `GET /api/items/:id` - ดู item ตาม ID
  - `PUT /api/ da/:id` - อัปเดต item
  - `DELETE /api/items/:id` - ลบ item
  - `GET /api/users/:userId/items` - ดู items ของ user

### 2. Auth Service (Port 3001)
- **หน้าที่**: จัดการ Login/Register และ JWT authentication
- **Port**: 3001 (TCP Microservice)
- **Message Patterns**:
  - `auth.register` - สมัครสมาชิก
  - `auth.login` - เข้าสู่ระบบ
  - `auth.validate` - ตรวจสอบ JWT token

### 3. Item Service (Port 3002)
- **หน้าที่**: จัดการ CRUD operations สำหรับ items/สินค้า
- **Port**: 3002 (TCP Microservice)
- **Message Patterns**:
  - `item.create` - สร้าง item ใหม่
  - `item.findAll` - ดู items ทั้งหมด (มี filter)
  - `item.findOne` - ดู item ตาม ID
  - `item.update` - อัปเดต item
  - `item.remove` - ลบ item
  - `item.findByUser` - ดู items ของ user

## การรันโปรเจค

### เตรียม Database

```bash
# สร้าง Prisma client
npm run db:generate

# รัน migration เพื่อสร้าง database และ tables
npm run db:migrate

# (Optional) เพิ่มข้อมูลเริ่มต้น
npm run db:seed
```

### รัน Services แยกกัน

```bash
# รัน Auth Service
npm run start:auth

# รัน Gateway API (ใน terminal อื่น)
npm run start:gateway
```

### รัน Services พร้อมกัน

```bash
npm run start:all
```

## การทดสอบ API

### 1. สมัครสมาชิก
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### 2. เข้าสู่ระบบ
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 3. ดูข้อมูลผู้ใช้
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. สร้าง Item
```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MacBook Pro",
    "description": "Apple MacBook Pro 16-inch",
    "price": 89900,
    "quantity": 5,
    "category": "Electronics",
    "userId": 1
  }'
```

### 5. ดู Items ทั้งหมด
```bash
curl -X GET http://localhost:3000/api/items
```

### 6. ดู Items ตาม Category
```bash
curl -X GET "http://localhost:3000/api/items?category=Electronics"
```

### 7. ดู Items ของ User
```bash
curl -X GET http://localhost:3000/api/users/1/items
```

### 8. อัปเดต Item
```bash
curl -X PUT http://localhost:3000/api/items/1 \
  -H "Content-Type: application/json" \
  -d '{
    "price": 79900,
    "quantity": 3
  }'
```

### 9. ลบ Item
```bash
curl -X DELETE http://localhost:3000/api/items/1
```

## โครงสร้างโปรเจค

```
apps/
├── gateway-api/          # API Gateway
│   ├── src/
│   │   ├── main.ts       # Entry point
│   │   ├── gateway-api.module.ts
│   │   ├── gateway-api.controller.ts
│   │   └── gateway-api.service.ts
│   └── test/
└── auth-service/         # Authentication Service
    ├── src/
    │   ├── main.ts       # Entry point
    │   ├── auth-service.module.ts
    │   ├── auth-service.controller.ts
    │   └── auth-service.service.ts
    └── test/
```

## Features

- ✅ JWT Authentication
- ✅ Password Hashing (bcryptjs)
- ✅ Input Validation (class-validator)
- ✅ CORS Support
- ✅ Microservice Communication (TCP)
- ✅ Error Handling
- ✅ TypeScript Support
- ✅ Prisma ORM (SQLite Database)
- ✅ Database Migrations
- ✅ Database Seeding

## Database Commands

```bash
# สร้าง Prisma client
npm run db:generate

# รัน migration
npm run db:migrate

# Push schema โดยไม่สร้าง migration
npm run db:push

# เปิด Prisma Studio (Database GUI)
npm run db:studio

# เพิ่มข้อมูลเริ่มต้น
npm run db:seed
```

## การพัฒนาต่อ

1. ✅ ~~เพิ่ม Database (Prisma + SQLite)~~
2. เพิ่ม Redis สำหรับ Session/Cache
3. เพิ่ม Service อื่น ๆ เช่น User Service, Product Service
4. เพิ่ม API Documentation (Swagger)
5. เพิ่ม Unit Tests และ E2E Tests
6. เพิ่ม Docker Configuration
7. เพิ่ม Health Checks
8. เพิ่ม Logging และ Monitoring
9. เปลี่ยนจาก SQLite เป็น PostgreSQL สำหรับ Production

## Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ root:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Gateway API Configuration
GATEWAY_PORT=3000

# Auth Service Configuration
AUTH_SERVICE_HOST=localhost
AUTH_SERVICE_PORT=3001
```

## การ Build

```bash
# Build ทั้งหมด
npm run build:all

# Build แยกกัน
npm run build:gateway
npm run build:auth
```
