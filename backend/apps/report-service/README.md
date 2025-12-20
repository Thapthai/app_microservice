# 📊 Report Service

Microservice สำหรับสร้างรายงานในรูปแบบ Excel และ PDF

## 🚀 Quick Start

### 1. ติดตั้ง Dependencies (ครั้งแรกเท่านั้น)

```bash
cd backend
npm install
```

### 2. รัน Service

**รัน Report Service เดียว:**
```bash
npm run start:report
```

**รันทุก Service:**
```bash
npm run start:all
```

### 3. ทดสอบ

```bash
# Export Excel
curl -X GET "http://localhost:3000/reports/comparison/1/excel" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output report.xlsx

# Export PDF
curl -X GET "http://localhost:3000/reports/comparison/1/pdf" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output report.pdf
```

## 📚 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/comparison/:usageId/excel` | Export รายงานเป็น Excel |
| GET | `/reports/comparison/:usageId/pdf` | Export รายงานเป็น PDF |

## 🔐 Authentication

ใช้ JWT Token หรือ Client Credentials:

```http
Authorization: Bearer <token>
```

หรือ

```http
client_id: <id>
client_secret: <secret>
```

## 📖 เอกสารเพิ่มเติม

อ่านคู่มือฉบับเต็ม: [REPORT_SERVICE_GUIDE.md](./REPORT_SERVICE_GUIDE.md)

## 🏗️ Architecture

```
Port 3006 (Report Service)
├── Excel Export Service
├── PDF Export Service
└── Connects to:
    └── Medical Supplies Service (Port 3008)
```

## 📦 Features

- ✅ Excel export with formatting
- ✅ PDF export (A4 Landscape)
- ✅ Automatic file download
- ✅ Patient information included
- ✅ Match/Not Match status
- ✅ Summary statistics

## 🛠️ Technologies

- NestJS Microservices
- ExcelJS
- PDFKit
- TypeScript

## 📞 Support

ดูเอกสารเพิ่มเติม: [REPORT_SERVICE_GUIDE.md](./REPORT_SERVICE_GUIDE.md)

---

**Version:** 1.0.0  
**Updated:** December 20, 2025
