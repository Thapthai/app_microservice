# Housekeeping Service

บริการสำหรับจัดการและย้ายข้อมูลเก่าจาก Primary Database ไป Archive Database เพื่อลดขนาดฐานข้อมูลหลักและเพิ่มประสิทธิภาพ

## Features

- ✅ **Auto Archive**: รัน cron job ทุกวันเวลา 02:00 น. เพื่อย้ายข้อมูลเก่า
- ✅ **Manual Trigger**: เรียกใช้งาน API เพื่อย้ายข้อมูลด้วยตนเอง
- ✅ **Statistics**: ดูสถิติข้อมูลใน Primary และ Archive database
- ✅ **Configurable**: กำหนดอายุข้อมูลที่ต้องการ archive ได้
- ✅ **Prometheus Metrics**: Default metrics (CPU, Memory, HTTP requests)

## Configuration

เพิ่ม environment variables ใน `.env`:

```env
# Housekeeping Service
HOUSEKEEPING_PORT=3007

# Primary Database
DATABASE_URL="mysql://user:password@host:3306/database"

# Archive Database
ARCHIVE_DATABASE_URL="mysql://user:password@host:3306/archive_database"
```

## Data Archiving Rules

### Batch Processing
- **ทีละ 100 records** ต่อ batch
- **รอ 1 นาที** ระหว่าง batch
- ทำงานต่อเนื่องจนกว่าจะไม่มีข้อมูลเก่าที่ต้อง archive
- ย้ายเสร็จ table หนึ่งแล้วค่อยไป table ต่อไป

### Refresh Tokens
- Archive tokens เก่ากว่า 90 วัน
- Archive tokens ที่ถูก revoke แล้ว

### Two-Factor Tokens
- Archive tokens เก่ากว่า 90 วัน
- Archive tokens ที่ใช้งานแล้ว (isUsed = true)

### Users (Optional)
- Archive users ที่ไม่ active และไม่ login เกิน 90 วัน
- ปิดการทำงานโดย default (uncomment ใน service ถ้าต้องการใช้)

## Installation

```bash
# Install dependencies
npm install

# Generate Prisma clients
npm run db:generate
npm run archive:generate

# Build service
npm run build:housekeeping
```

## Usage

### Development

```bash
# Start service in dev mode
npm run start:housekeeping

# Start all services including housekeeping
npm run start:all
```

### Production

```bash
# Build service
npm run build:housekeeping

# Start service
npm run start:housekeeping:prod
```

### Manual Archive Script

```bash
# Archive data older than 90 days (default)
npx ts-node scripts/manual-archive.ts

# Archive data older than 30 days
npx ts-node scripts/manual-archive.ts 30

# View statistics
npx ts-node scripts/manual-archive.ts stats
```

## API Endpoints

### GET /housekeeping
Check service health

```bash
curl http://localhost:3007/housekeeping
```

Response:
```json
"Housekeeping Service is running!"
```

### POST /housekeeping/archive
Manually trigger archive process

```bash
# Archive data older than 90 days (default)
curl -X POST http://localhost:3007/housekeeping/archive

# Archive data older than 30 days
curl -X POST http://localhost:3007/housekeeping/archive?days=30
```

Response:
```json
{
  "success": true,
  "message": "Archived data older than 90 days",
  "archiveDate": "2024-10-29T00:00:00.000Z"
}
```

### GET /housekeeping/stats
Get database statistics

```bash
curl http://localhost:3007/housekeeping/stats
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

## Cron Schedule

Service จะรัน archive อัตโนมัติตามกำหนดเวลา:

- **Daily at 2:00 AM**: Archive ข้อมูลเก่ากว่า 90 วัน

สามารถแก้ไข schedule ได้ที่:
```typescript
// housekeeping-service.service.ts
@Cron(CronExpression.EVERY_DAY_AT_2AM)
async archiveOldData() {
  // ...
}
```

ตัวอย่าง Cron expressions:
```typescript
CronExpression.EVERY_DAY_AT_2AM      // ทุกวัน 02:00
CronExpression.EVERY_WEEK            // ทุกสัปดาห์
CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT  // ทุกวันที่ 1 เวลาเที่ยงคืน
'0 */6 * * *'                        // ทุก 6 ชั่วโมง
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
  -e DATABASE_URL="mysql://user:password@host:3306/database" \
  -e ARCHIVE_DATABASE_URL="mysql://user:password@host:3306/archive_database" \
  housekeeping-service:latest
```

## Monitoring

### Logs

ดู logs เพื่อตรวจสอบการทำงาน:

```bash
# Development
npm run start:housekeeping

# Production (Docker)
docker logs -f housekeeping-service
```

Expected logs:
```
🧹 Housekeeping Service is running on: http://localhost:3007
Starting housekeeping: archiving old data...

Archiving refresh tokens older than 2024-07-30...
Batch size: 100, Delay: 60s
✓ Archived batch of 100 refresh tokens (Total: 100)
⏳ Waiting 60s before next batch...
✓ Archived batch of 50 refresh tokens (Total: 150)
✅ All refresh tokens archived. Total: 150

Archiving 2FA tokens older than 2024-07-30...
Batch size: 100, Delay: 60s
✓ Archived batch of 45 2FA tokens (Total: 45)
✅ All 2FA tokens archived. Total: 45

Housekeeping completed successfully
```

### Prometheus Metrics

Service รองรับ Prometheus metrics endpoint:

```bash
# View metrics
curl http://localhost:3007/metrics
```

**Default Metrics ที่มีให้:**
- `process_cpu_user_seconds_total` - CPU usage
- `process_resident_memory_bytes` - Memory usage
- `nodejs_eventloop_lag_seconds` - Event loop lag
- `nodejs_heap_size_total_bytes` - Heap size
- `http_request_duration_seconds` - HTTP request duration

**Note:** Custom housekeeping metrics (archive count, duration, etc.) สามารถเพิ่มได้ในภายหลังถ้าต้องการ

## Best Practices

1. **Backup ก่อน Archive**: สำรองข้อมูลก่อนรัน archive ครั้งแรก
2. **Test Script**: ทดสอบด้วย manual script ก่อนใช้ auto cron
3. **Monitor Logs**: ตรวจสอบ logs หลัง archive เพื่อให้แน่ใจว่าทำงานถูกต้อง
4. **Adjust Schedule**: ปรับ cron schedule ตามความเหมาะสมของ workload
5. **Archive Period**: พิจารณาระยะเวลา archive ให้เหมาะสมกับ business requirements

## Troubleshooting

### ไม่สามารถเชื่อมต่อ Archive Database

ตรวจสอบ `ARCHIVE_DATABASE_URL` ใน `.env`:
```bash
# Test connection
npx prisma db push --schema=./prisma-archive/schema.prisma
```

### Cron ไม่ทำงาน

ตรวจสอบว่า `ScheduleModule` ถูก import ใน module:
```typescript
ScheduleModule.forRoot()
```

### Data Integrity Issues

ใช้ manual script เพื่อ verify:
```bash
npx ts-node scripts/manual-archive.ts stats
```

## Architecture

### Tech Stack
- **NestJS** - Framework
- **Prisma** - ORM (Primary + Archive clients)
- **@nestjs/schedule** - Cron jobs
- **@willsoto/nestjs-prometheus** - Metrics
- **MySQL** - Primary + Archive databases

### Service Structure
```
housekeeping-service/
├── src/
│   ├── main.ts                           # Entry point (Port 3007)
│   ├── housekeeping-service.module.ts    # Module config
│   ├── housekeeping-service.service.ts   # Business logic + Cron
│   ├── housekeeping-service.controller.ts # API endpoints
│   └── prisma.service.ts                 # DB connections
```

### How It Works (Batch Processing)
1. **Cron Job** runs daily at 02:00 AM
2. Process **Refresh Tokens** table:
   - Query 100 records (ordered by ID)
   - Copy to Archive DB
   - Delete from Primary DB
   - Wait 1 minute
   - Repeat until no more old data
3. Process **Two-Factor Tokens** table:
   - Same batch process
4. Process **Users** table (optional):
   - Same batch process
5. Log results

### Configuration
สามารถปรับค่าได้ใน `housekeeping-service.service.ts`:
```typescript
private readonly BATCH_SIZE = 100;        // Records per batch
private readonly BATCH_DELAY_MS = 60000;  // 1 minute delay
```

## Support

สำหรับปัญหาหรือคำถาม กรุณาติดต่อทีมพัฒนา

