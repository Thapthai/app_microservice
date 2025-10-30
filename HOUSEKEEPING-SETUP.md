# Housekeeping Service Setup Guide

## ภาพรวม

Housekeeping Service เป็นบริการที่สร้างขึ้นเพื่อจัดการและย้ายข้อมูลเก่าจาก Primary Database ไป Archive Database อัตโนมัติ เพื่อลดขนาดฐานข้อมูลหลักและเพิ่มประสิทธิภาพในการทำงาน

## สิ่งที่สร้างขึ้น

### 1. Archive Database Schema
- **ตำแหน่ง**: `backend/prisma-archive/schema.prisma`
- **Database**: `new_linen_microservice_archive`
- **โครงสร้าง**: เหมือนกับ Primary DB ทุกประการ แต่ชี้ไป Archive database
- **Generated Client**: `@prisma/archive-client`

### 2. Housekeeping Service
- **ตำแหน่ง**: `backend/apps/housekeeping-service/`
- **Port**: 3007
- **Features**:
  - Auto archive ทุกวันเวลา 02:00 น.
  - Manual trigger via API
  - Prometheus metrics
  - Statistics dashboard

### 3. Files Structure

```
backend/
├── prisma/
│   └── schema.prisma              # Primary database
├── prisma-archive/
│   └── schema.prisma              # Archive database
├── apps/
│   └── housekeeping-service/
│       ├── src/
│       │   ├── main.ts
│       │   ├── housekeeping-service.module.ts
│       │   ├── housekeeping-service.service.ts
│       │   ├── housekeeping-service.controller.ts
│       │   ├── prisma.service.ts
│       │   └── housekeeping-metrics.provider.ts
│       └── README.md
├── scripts/
│   └── manual-archive.ts          # Manual archive script
└── docker/
    └── Dockerfile.housekeeping    # Docker image
```

## Configuration

### Environment Variables

เพิ่มใน `backend/.env`:

```env
# Primary Database
DATABASE_URL="mysql://root:password@host:3306/new_linen_microservice"

# Archive Database
ARCHIVE_DATABASE_URL="mysql://root:password@host:3306/new_linen_microservice_archive"

# Housekeeping Service
HOUSEKEEPING_PORT=3007
```

## Installation

```bash
cd backend

# Install dependencies (if not already installed)
npm install

# Generate Prisma clients
npm run db:generate
npm run archive:generate

# Push schema to archive database
npm run archive:push
```

## Usage

### Development Mode

```bash
# Start housekeeping service only
npm run start:housekeeping

# Start all services including housekeeping
npm run start:all
```

### Production Mode

```bash
# Build service
npm run build:housekeeping

# Run service
npm run start:housekeeping:prod
```

## Archive Rules

### ข้อมูลที่จะถูก Archive

1. **Refresh Tokens**
   - อายุเกิน 90 วัน
   - ถูก revoke แล้วและอายุเกิน 90 วัน

2. **Two-Factor Tokens**
   - อายุเกิน 90 วัน
   - ใช้งานแล้ว (isUsed = true) และอายุเกิน 90 วัน

3. **Users** (Optional - ปิดการใช้งาน)
   - Inactive และไม่ได้ login เกิน 90 วัน
   - ต้อง uncomment ใน service เพื่อเปิดใช้งาน

## API Endpoints

### 1. Health Check
```bash
GET http://localhost:3007/housekeeping
```

### 2. Manual Archive
```bash
# Archive data older than 90 days (default)
POST http://localhost:3007/housekeeping/archive

# Archive data older than 30 days
POST http://localhost:3007/housekeeping/archive?days=30
```

Response:
```json
{
  "success": true,
  "message": "Archived data older than 90 days",
  "archiveDate": "2024-10-29T00:00:00.000Z",
  "duration": 2.5
}
```

### 3. Get Statistics
```bash
GET http://localhost:3007/housekeeping/stats
```

Response:
```json
{
  "primary": {
    "refresh_tokens": 150,
    "two_factor_tokens": 45,
    "users": 1000
  },
  "archive": {
    "refresh_tokens": 3500,
    "two_factor_tokens": 890,
    "users": 50
  }
}
```

## Manual Archive Script

```bash
cd backend

# Archive data older than 90 days
npx ts-node scripts/manual-archive.ts

# Archive data older than 30 days
npx ts-node scripts/manual-archive.ts 30

# View statistics only
npx ts-node scripts/manual-archive.ts stats
```

## Cron Schedule

Service รัน archive อัตโนมัติ:
- **เวลา**: ทุกวันเวลา 02:00 น.
- **ข้อมูล**: เก่ากว่า 90 วัน

### เปลี่ยน Schedule

แก้ไขใน `housekeeping-service.service.ts`:

```typescript
// ทุกวัน 02:00
@Cron(CronExpression.EVERY_DAY_AT_2AM)

// ทุกสัปดาห์
@Cron(CronExpression.EVERY_WEEK)

// ทุกวันที่ 1 เวลาเที่ยงคืน
@Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)

// ทุก 6 ชั่วโมง
@Cron('0 */6 * * *')
```

## Prometheus Metrics

Service มี metrics สำหรับ monitoring:

### Counters
- `housekeeping_archive_operations_total{type, status}` - จำนวน operations
- `housekeeping_archive_records_total{table}` - จำนวน records ที่ archive
- `housekeeping_archive_errors_total{table, error_type}` - จำนวน errors

### Histograms
- `housekeeping_archive_duration_seconds{type, table}` - ระยะเวลาที่ใช้ใน archive

### Gauges
- `housekeeping_primary_database_records{table}` - จำนวน records ใน primary DB
- `housekeeping_archive_database_records{table}` - จำนวน records ใน archive DB
- `housekeeping_last_archive_timestamp{type}` - เวลา archive ล่าสุด

### View Metrics

```bash
curl http://localhost:3007/metrics
```

## Docker Deployment

### Build Image

```bash
cd backend/docker
docker build -f Dockerfile.housekeeping -t housekeeping-service:latest ..
```

### Run Container

```bash
docker run -d \
  --name housekeeping-service \
  -p 3007:3007 \
  -e DATABASE_URL="mysql://root:password@host:3306/new_linen_microservice" \
  -e ARCHIVE_DATABASE_URL="mysql://root:password@host:3306/new_linen_microservice_archive" \
  housekeeping-service:latest
```

### Docker Compose

เพิ่มใน `docker-compose.yml`:

```yaml
services:
  housekeeping-service:
    build:
      context: ..
      dockerfile: docker/Dockerfile.housekeeping
    container_name: housekeeping-service
    ports:
      - "3007:3007"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - ARCHIVE_DATABASE_URL=${ARCHIVE_DATABASE_URL}
      - HOUSEKEEPING_PORT=3007
    restart: unless-stopped
    depends_on:
      - mysql
```

## Monitoring & Logs

### Development Logs

```bash
npm run start:housekeeping
```

Expected output:
```
🧹 Housekeeping Service is running on: http://localhost:3007
Starting housekeeping: archiving old data...
Archiving refresh tokens older than 2024-07-30...
Archived 150 refresh tokens in 2.3s
Archiving 2FA tokens older than 2024-07-30...
Archived 45 2FA tokens in 0.8s
Housekeeping completed successfully in 3.1s
```

### Docker Logs

```bash
docker logs -f housekeeping-service
```

## Grafana Dashboard

### Metrics สำหรับ Dashboard

```promql
# Archive operations rate
rate(housekeeping_archive_operations_total[5m])

# Archive records by table
housekeeping_archive_records_total

# Archive duration
histogram_quantile(0.95, housekeeping_archive_duration_seconds_bucket)

# Database sizes
housekeeping_primary_database_records
housekeeping_archive_database_records

# Last archive time
time() - housekeeping_last_archive_timestamp
```

## Best Practices

### 1. ก่อนใช้งานครั้งแรก
- ✅ Backup ทั้ง primary และ archive database
- ✅ ทดสอบด้วย manual script ก่อน
- ✅ เริ่มด้วยข้อมูลเก่ากว่า 180 วัน

### 2. Monitoring
- ✅ ตั้ง alerts สำหรับ archive failures
- ✅ Monitor database sizes
- ✅ ตรวจสอบ logs หลัง archive

### 3. Maintenance
- ✅ Review archive schedule ทุก 3 เดือน
- ✅ ปรับระยะเวลา (90 วัน) ตาม business requirements
- ✅ ทดสอบ restore จาก archive เป็นระยะ

### 4. Performance
- ✅ รัน archive นอกเวลา peak hours
- ✅ Monitor database connections
- ✅ ใช้ index ที่เหมาะสม (created_at, is_revoked, etc.)

## Troubleshooting

### ปัญหาที่พบบ่อย

#### 1. Cannot connect to archive database

**แก้ไข:**
```bash
# Test connection
npx prisma db push --schema=./prisma-archive/schema.prisma

# Check .env
echo $ARCHIVE_DATABASE_URL
```

#### 2. Cron job ไม่ทำงาน

**แก้ไข:**
- ตรวจสอบว่า `ScheduleModule.forRoot()` ถูก import
- ดู logs เพื่อหา errors
- ทดสอบด้วย manual trigger ก่อน

#### 3. Metrics ไม่แสดง

**แก้ไข:**
```bash
# Check metrics endpoint
curl http://localhost:3007/metrics

# Check PrometheusModule registration
# ใน housekeeping-service.module.ts
```

#### 4. Archive ช้า

**แก้ไข:**
- เพิ่ม index ใน database
- ปรับ batch size
- ใช้ bulk operations แทน loop

## Testing

### Manual Testing

```bash
# 1. Start service
npm run start:housekeeping

# 2. Trigger manual archive
curl -X POST http://localhost:3007/housekeeping/archive?days=180

# 3. Check statistics
curl http://localhost:3007/housekeeping/stats

# 4. View metrics
curl http://localhost:3007/metrics
```

### Verify Data Integrity

```bash
# Use manual script
npx ts-node scripts/manual-archive.ts stats
```

## Migration to Production

### Checklist

- [ ] Backup databases
- [ ] Test on staging environment
- [ ] Configure cron schedule
- [ ] Setup monitoring alerts
- [ ] Document restore procedures
- [ ] Train team on troubleshooting
- [ ] Schedule maintenance window
- [ ] Monitor first few runs closely

## Support

สำหรับคำถามหรือปัญหา:
1. ตรวจสอบ logs ก่อน
2. ดู metrics ใน Prometheus/Grafana
3. ทดสอบด้วย manual script
4. ติดต่อทีมพัฒนา

## Summary

✅ **สร้างเรียบร้อย:**
- Archive database schema
- Housekeeping service with cron jobs
- Manual archive script
- Prometheus metrics integration
- Docker support
- Complete documentation

🎯 **พร้อมใช้งาน:**
- Development: `npm run start:housekeeping`
- Production: Docker deployment
- Monitoring: Prometheus + Grafana
- Manual control: API + Scripts

