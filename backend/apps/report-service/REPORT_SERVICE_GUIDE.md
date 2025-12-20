# 📊 Report Service - คู่มือการใช้งาน

## 📝 สารบัญ
1. [ภาพรวม](#ภาพรวม)
2. [การติดตั้ง](#การติดตั้ง)
3. [การรัน Service](#การรัน-service)
4. [API Documentation](#api-documentation)
5. [ตัวอย่างการใช้งาน](#ตัวอย่างการใช้งาน)
6. [การทดสอบ](#การทดสอบ)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 ภาพรวม

**Report Service** เป็น microservice สำหรับสร้างรายงานในรูปแบบต่างๆ ได้แก่:
- ✅ **Excel (.xlsx)** - รายงานแบบตารางพร้อม formatting
- ✅ **PDF (.pdf)** - รายงานแบบเอกสาร

### 📋 ประเภทรายงานที่รองรับ

1. **รายงานเปรียบเทียบการเบิกอุปกรณ์และการบันทึกใช้กับคนไข้** (Comparison Report)
   - รายงานเปรียบเทียบข้อมูลการเบิกอุปกรณ์กับการใช้งานจริง
   - รองรับทั้ง Excel และ PDF

2. **รายงานการใช้อุปกรณ์กับคนไข้** (Equipment Usage Report) ⭐ ใหม่!
   - รายงานสรุปการใช้อุปกรณ์ทั้งหมด
   - รองรับทั้ง Excel และ PDF
   - สามารถกรองตามวันที่, โรงพยาบาล, แผนก

### 🏗️ สถาปัตยกรรม

```
┌─────────────────┐         ┌─────────────────┐         ┌──────────────────────┐
│   Frontend      │────────▶│  Gateway API    │────────▶│  Report Service      │
│   (Next.js)     │         │  (Port 3000)    │         │  (Port 3006)         │
└─────────────────┘         └─────────────────┘         └──────────────────────┘
                                     │                              │
                                     │                              │
                                     ▼                              ▼
                            ┌─────────────────┐         ┌──────────────────────┐
                            │ Medical Supplies│◀────────│  ExportService       │
                            │   Service       │         │  - Excel Generator   │
                            │   (Port 3005)   │         │  - PDF Generator     │
                            └─────────────────┘         └──────────────────────┘
```

### 📦 Dependencies

- `exceljs` - สำหรับสร้างไฟล์ Excel
- `pdfkit` - สำหรับสร้างไฟล์ PDF
- `@nestjs/microservices` - สำหรับ microservice communication

---

## 🚀 การติดตั้ง

### 1. ติดตั้ง Dependencies (ทำแล้วใน backend)

```bash
cd backend
npm install exceljs pdfkit @types/pdfkit
```

### 2. ตรวจสอบโครงสร้างไฟล์

```
backend/apps/report-service/
├── src/
│   ├── main.ts                      # Entry point (Port 3006)
│   ├── report-service.module.ts    # Module configuration
│   ├── report-service.controller.ts # Message pattern handlers
│   ├── report-service.service.ts   # Business logic
│   └── services/
│       ├── comparison_report_excel.service.ts    # Comparison report Excel
│       ├── comparison_report_pdf.service.ts      # Comparison report PDF
│       ├── equipment_usage_excel.service.ts      # Equipment usage Excel ⭐
│       └── equipment_usage_pdf.service.ts       # Equipment usage PDF ⭐
│   └── types/
│       ├── comparison-report.types.ts            # Comparison report types
│       └── equipment-usage-report.types.ts       # Equipment usage types ⭐
└── test/
```

---

## 🏃 การรัน Service

### วิธีที่ 1: รัน Report Service เดี่ยว

```bash
cd backend
npm run start:report
```

**Output:**
```
Report Service is listening on port 3006
```

### วิธีที่ 2: รันทุก Service พร้อมกัน (แนะนำ)

```bash
cd backend
npm run start:all
```

**Services ที่จะรัน:**
- Auth Service (Port 3001)
- Item Service (Port 3002)
- Email Service (Port 3003)
- Category Service (Port 3004)
- Medical Supplies Service (Port 3005)
- **Report Service (Port 3006)** ← ใหม่!
- Gateway API (Port 3000)

---

## 📚 API Documentation

### 🔐 Authentication

ทุก endpoint ต้องใช้ authentication:

**Method 1: JWT Token**
```http
Authorization: Bearer <your-jwt-token>
```

**Method 2: Client Credentials**
```http
client_id: <your-client-id>
client_secret: <your-client-secret>
```

---

### 📊 Endpoints

#### 1. Export Comparison Report (Excel)

**Endpoint:**
```
GET /reports/comparison/:usageId/excel
```

**Parameters:**
- `usageId` (path, required) - ID ของรายการเบิกอุปกรณ์

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- File download: `comparison_report_{usageId}_{date}.xlsx`

**ตัวอย่างการใช้งาน:**

**cURL:**
```bash
curl -X GET "http://localhost:3000/reports/comparison/1/excel" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output report.xlsx
```

**JavaScript (Fetch):**
```javascript
const response = await fetch(`http://localhost:3000/reports/comparison/1/excel`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
  },                                                          
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'report.xlsx';
link.click();
```

**Axios:**
```javascript
const response = await axios.get(
  'http://localhost:3000/reports/comparison/1/excel',
  {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob',
  }
);

const url = window.URL.createObjectURL(new Blob([response.data]));
const link = document.createElement('a');
link.href = url;
link.download = 'report.xlsx';
link.click();
```

---

#### 2. Export Comparison Report (PDF)

**Endpoint:**
```
GET /reports/comparison/:usageId/pdf
```

**Parameters:**
- `usageId` (path, required) - ID ของรายการเบิกอุปกรณ์

**Response:**
- Content-Type: `application/pdf`
- File download: `comparison_report_{usageId}_{date}.pdf`

**ตัวอย่างการใช้งาน:**

**cURL:**
```bash
curl -X GET "http://localhost:3000/reports/comparison/1/pdf" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output report.pdf
```

**JavaScript (Fetch):**
```javascript
const response = await fetch(`http://localhost:3000/reports/comparison/1/pdf`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'report.pdf';
link.click();
```

---

#### 3. Export Equipment Usage Report (Excel) ⭐ ใหม่!

**Endpoint:**
```
POST /reports/equipment-usage/excel
```

**Request Body:**
```json
{
  "dateFrom": "18 ธันวาคม 2568",
  "dateTo": "19 ธันวาคม 2568",
  "hospital": "โรงพยาบาลเวชธาน",
  "department": "Emergency Room",
  "usageIds": [1, 2, 3]  // Optional: ถ้าต้องการระบุเฉพาะ usage IDs
}
```

**Parameters:**
- `dateFrom` (optional) - วันที่เริ่มต้น
- `dateTo` (optional) - วันที่สิ้นสุด
- `hospital` (optional) - ชื่อโรงพยาบาล
- `department` (optional) - แผนก/หน่วยงาน
- `usageIds` (optional) - Array ของ usage IDs ที่ต้องการ

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- File download: `equipment_usage_report_{date}.xlsx`

**ตัวอย่างการใช้งาน:**

**cURL:**
```bash
curl -X POST "http://localhost:3000/reports/equipment-usage/excel" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dateFrom": "18 ธันวาคม 2568",
    "dateTo": "19 ธันวาคม 2568",
    "hospital": "โรงพยาบาลเวชธาน",
    "department": "Emergency Room"
  }' \
  --output equipment_usage_report.xlsx
```

**JavaScript (Fetch):**
```javascript
const response = await fetch(`http://localhost:3000/reports/equipment-usage/excel`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    dateFrom: '18 ธันวาคม 2568',
    dateTo: '19 ธันวาคม 2568',
    hospital: 'โรงพยาบาลเวชธาน',
    department: 'Emergency Room',
  }),
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'equipment_usage_report.xlsx';
link.click();
```

**Axios:**
```javascript
const response = await axios.post(
  'http://localhost:3000/reports/equipment-usage/excel',
  {
    dateFrom: '18 ธันวาคม 2568',
    dateTo: '19 ธันวาคม 2568',
    hospital: 'โรงพยาบาลเวชธาน',
    department: 'Emergency Room',
  },
  {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob',
  }
);

const url = window.URL.createObjectURL(new Blob([response.data]));
const link = document.createElement('a');
link.href = url;
link.download = 'equipment_usage_report.xlsx';
link.click();
```

---

#### 4. Export Equipment Usage Report (PDF) ⭐ ใหม่!

**Endpoint:**
```
POST /reports/equipment-usage/pdf
```

**Request Body:**
```json
{
  "dateFrom": "18 ธันวาคม 2568",
  "dateTo": "19 ธันวาคม 2568",
  "hospital": "โรงพยาบาลเวชธาน",
  "department": "Emergency Room",
  "usageIds": [1, 2, 3]  // Optional
}
```

**Parameters:**
- `dateFrom` (optional) - วันที่เริ่มต้น
- `dateTo` (optional) - วันที่สิ้นสุด
- `hospital` (optional) - ชื่อโรงพยาบาล
- `department` (optional) - แผนก/หน่วยงาน
- `usageIds` (optional) - Array ของ usage IDs ที่ต้องการ

**Response:**
- Content-Type: `application/pdf`
- File download: `equipment_usage_report_{date}.pdf`

**ตัวอย่างการใช้งาน:**

**cURL:**
```bash
curl -X POST "http://localhost:3000/reports/equipment-usage/pdf" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dateFrom": "18 ธันวาคม 2568",
    "dateTo": "19 ธันวาคม 2568",
    "hospital": "โรงพยาบาลเวชธาน",
    "department": "Emergency Room"
  }' \
  --output equipment_usage_report.pdf
```

**JavaScript (Fetch):**
```javascript
const response = await fetch(`http://localhost:3000/reports/equipment-usage/pdf`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    dateFrom: '18 ธันวาคม 2568',
    dateTo: '19 ธันวาคม 2568',
    hospital: 'โรงพยาบาลเวชธาน',
    department: 'Emergency Room',
  }),
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'equipment_usage_report.pdf';
link.click();
```

---

## 💡 ตัวอย่างการใช้งาน

### 1. ใช้งานผ่าน Frontend (Next.js)

#### 1.1 Comparison Report

```typescript
// Frontend: src/app/medical-supplies/comparison/page.tsx

const handleExportExcel = async (usageId: number) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/comparison/${usageId}/excel`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export Excel');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${usageId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success('Export Excel สำเร็จ');
  } catch (error) {
    console.error('Error:', error);
    toast.error('เกิดข้อผิดพลาดในการ export');
  }
};

const handleExportPDF = async (usageId: number) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/comparison/${usageId}/pdf`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export PDF');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${usageId}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success('Export PDF สำเร็จ');
  } catch (error) {
    console.error('Error:', error);
    toast.error('เกิดข้อผิดพลาดในการ export');
  }
};
```

#### 1.2 Equipment Usage Report ⭐ ใหม่!

```typescript
// Frontend: src/app/medical-supplies/equipment-usage/page.tsx

const handleExportEquipmentUsageExcel = async (filters: {
  dateFrom?: string;
  dateTo?: string;
  hospital?: string;
  department?: string;
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/equipment-usage/excel`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export Excel');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = filters.dateFrom ? filters.dateFrom.replace(/\//g, '-') : new Date().toISOString().split('T')[0];
    link.download = `equipment_usage_report_${dateStr}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success('Export Excel สำเร็จ');
  } catch (error) {
    console.error('Error:', error);
    toast.error('เกิดข้อผิดพลาดในการ export');
  }
};

const handleExportEquipmentUsagePDF = async (filters: {
  dateFrom?: string;
  dateTo?: string;
  hospital?: string;
  department?: string;
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/equipment-usage/pdf`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export PDF');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = filters.dateFrom ? filters.dateFrom.replace(/\//g, '-') : new Date().toISOString().split('T')[0];
    link.download = `equipment_usage_report_${dateStr}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success('Export PDF สำเร็จ');
  } catch (error) {
    console.error('Error:', error);
    toast.error('เกิดข้อผิดพลาดในการ export');
  }
};
```

### 2. ใช้งานผ่าน Postman

**Step 1: Setup Environment**
```
API_BASE_URL: http://localhost:3000
JWT_TOKEN: <your-token>
```

**Step 2: Create Request**

**Excel Export:**
```
Method: GET
URL: {{API_BASE_URL}}/reports/comparison/1/excel
Headers:
  - Authorization: Bearer {{JWT_TOKEN}}

Send & Save Response:
  - Save as: report.xlsx
```

**PDF Export:**
```
Method: GET
URL: {{API_BASE_URL}}/reports/comparison/1/pdf
Headers:
  - Authorization: Bearer {{JWT_TOKEN}}

Send & Save Response:
  - Save as: report.pdf
```

**Equipment Usage Excel Export:** ⭐ ใหม่!
```
Method: POST
URL: {{API_BASE_URL}}/reports/equipment-usage/excel
Headers:
  - Authorization: Bearer {{JWT_TOKEN}}
  - Content-Type: application/json
Body (JSON):
{
  "dateFrom": "18 ธันวาคม 2568",
  "dateTo": "19 ธันวาคม 2568",
  "hospital": "โรงพยาบาลเวชธาน",
  "department": "Emergency Room"
}

Send & Save Response:
  - Save as: equipment_usage_report.xlsx
```

**Equipment Usage PDF Export:** ⭐ ใหม่!
```
Method: POST
URL: {{API_BASE_URL}}/reports/equipment-usage/pdf
Headers:
  - Authorization: Bearer {{JWT_TOKEN}}
  - Content-Type: application/json
Body (JSON):
{
  "dateFrom": "18 ธันวาคม 2568",
  "dateTo": "19 ธันวาคม 2568",
  "hospital": "โรงพยาบาลเวชธาน",
  "department": "Emergency Room"
}

Send & Save Response:
  - Save as: equipment_usage_report.pdf
```

### 3. ใช้งานด้วย Client Credentials

```bash
curl -X GET "http://localhost:3000/reports/comparison/1/excel" \
  -H "client_id: your-client-id" \
  -H "client_secret: your-client-secret" \
  --output report.xlsx
```

---

## 🧪 การทดสอบ

### 1. ทดสอบ Report Service โดยตรง

ไม่สามารถเรียก Report Service โดยตรงได้ เพราะเป็น microservice ต้องผ่าน Gateway API

### 2. ทดสอบผ่าน Gateway API

**Prerequisites:**
- ✅ Report Service รันอยู่ (Port 3006)
- ✅ Medical Supplies Service รันอยู่ (Port 3005)
- ✅ Gateway API รันอยู่ (Port 3000)
- ✅ มี Usage ID ที่มีข้อมูลใน database

**Test Script (test-report.sh):**

```bash
#!/bin/bash

# Variables
API_URL="http://localhost:3000"
TOKEN="your-jwt-token-here"
USAGE_ID=1

# Test Excel Export
echo "Testing Excel Export..."
curl -X GET "${API_URL}/reports/comparison/${USAGE_ID}/excel" \
  -H "Authorization: Bearer ${TOKEN}" \
  --output "test_excel_$(date +%Y%m%d_%H%M%S).xlsx" \
  -w "\nHTTP Status: %{http_code}\n"

# Test PDF Export
echo "Testing PDF Export..."
curl -X GET "${API_URL}/reports/comparison/${USAGE_ID}/pdf" \
  -H "Authorization: Bearer ${TOKEN}" \
  --output "test_pdf_$(date +%Y%m%d_%H%M%S).pdf" \
  -w "\nHTTP Status: %{http_code}\n"

echo "Tests completed!"
```

**Run:**
```bash
chmod +x test-report.sh
./test-report.sh
```

### 3. ทดสอบผ่าน Frontend

```
1. เปิดเบราว์เซอร์ไปที่: http://localhost:3001
2. Login เข้าสู่ระบบ
3. ไปที่เมนู: เวชภัณฑ์ → รายงานเปรียบเทียบ
4. เลือกรายการเบิกจากตาราง
5. คลิกปุ่ม "Export Excel" หรือ "Export PDF"
6. ตรวจสอบว่าไฟล์ดาวน์โหลดสำเร็จ
```

---

## 🎨 รูปแบบรายงาน

### 1. Comparison Report (รายงานเปรียบเทียบ)

#### Excel Report Features:

1. **Title Section**
   - หัวเรื่อง: "รายงานเปรียบเทียบการเบิกอุปกรณ์และการบันทึกใช้กับคนไข้"
   - พื้นหลังสีน้ำเงิน, ตัวอักษรสีขาว

2. **Patient Information**
   - HN, ชื่อ-นามสกุล, EN, แผนก, วันที่เบิก
   - พื้นหลังสีเทาอ่อน

3. **Data Table**
   - Header: สีน้ำเงินเข้ม, ตัวอักษรสีขาว
   - Zebra striping: สลับสีแถว
   - Conditional formatting:
     - ✅ Match: พื้นหลังสีเขียว
     - ❌ Not Match: พื้นหลังสีแดง

4. **Summary**
   - แสดงจำนวนทั้งหมด, Match, Not Match

#### PDF Report Features:

1. **Layout**
   - A4 Portrait (แนวตั้ง)
   - Margin: 35pt ทุกด้าน
   - ใช้ฟอนต์ Tahoma (รองรับภาษาไทย)

2. **Content**
   - Title: ไม่มีพื้นหลังสี, ตัวอักษรสีเข้ม
   - ข้อมูลผู้ป่วย: กล่องสีเทาอ่อน
   - ตารางข้อมูล: Header สีเทา, สลับสีแถว
   - สี Match/Not Match: สีอ่อน
   - รองรับหลายหน้าอัตโนมัติ

3. **Footer**
   - วันที่สร้างรายงาน

---

### 2. Equipment Usage Report (รายงานการใช้อุปกรณ์กับคนไข้) ⭐ ใหม่!

#### Excel Report Features:

1. **Title Section**
   - หัวเรื่อง: "รายงานการใช้อุปกรณ์กับคนไข้"
   - ไม่มีพื้นหลังสี, ตัวอักษรสีเข้ม

2. **Hospital Information**
   - โรงพยาบาล: ชื่อโรงพยาบาล
   - หน่วยงาน/แผนก: แผนก/หน่วยงาน
   - วันที่: ช่วงวันที่ (ถ้ามี)

3. **Data Table**
   - Header: สีน้ำเงินเข้ม, ตัวอักษรสีขาว
   - คอลัมน์: EN, HN, Code, Description, AssessionNo, Status, QTY, UOM
   - Zebra striping: สลับสีแถว
   - Description column: รองรับ wrap text

#### PDF Report Features:

1. **Layout**
   - A4 Portrait (แนวตั้ง)
   - Margin: 35pt ทุกด้าน
   - ใช้ฟอนต์ Tahoma (รองรับภาษาไทย)

2. **Content**
   - Title: ไม่มีพื้นหลังสี, ตัวอักษรสีเข้ม
   - ข้อมูลโรงพยาบาล: แสดงชื่อโรงพยาบาล, แผนก, วันที่
   - ตารางข้อมูล: Header สีเทา, สลับสีแถว
   - 8 คอลัมน์: EN, HN, Code, Description, AssessionNo, Status, QTY, UOM
   - รองรับหลายหน้าอัตโนมัติ

3. **Footer**
   - วันที่สร้างรายงาน

---

## 🔧 Troubleshooting

### ปัญหา 1: Report Service ไม่ start

**อาการ:**
```
Error: Cannot find module 'exceljs'
```

**แก้ไข:**
```bash
cd backend
npm install exceljs pdfkit @types/pdfkit
```

---

### ปัญหา 2: Cannot connect to Medical Supplies Service

**อาการ:**
```
Error: Failed to connect to Medical Supplies Service
```

**แก้ไข:**
1. ตรวจสอบว่า Medical Supplies Service รันอยู่:
```bash
ps aux | grep medical-supplies
```

2. ตรวจสอบ port (Medical Supplies Service ใช้ port 3008):
```bash
lsof -i :3008
```

3. Restart service:
```bash
npm run start:medical-supplies
```

---

### ปัญหา 3: Empty report or no data

**อาการ:**
- ไฟล์ดาวน์โหลดได้แต่ไม่มีข้อมูล

**แก้ไข:**
1. ตรวจสอบว่า `usageId` มีข้อมูลใน database:
```sql
SELECT * FROM app_microservice_medical_supply_usages WHERE id = 1;
SELECT * FROM app_microservice_supply_usage_items WHERE medical_supply_usage_id = 1;
```

2. ตรวจสอบ logs:
```bash
# Backend logs
tail -f backend/logs/app.log

# Frontend console
# เปิด Browser DevTools → Console
```

---

### ปัญหา 4: PDF แสดงภาษาไทยไม่ได้

**อาการ:**
- PDF แสดงภาษาไทยเป็นสี่เหลี่ยม

**หมายเหตุ:**
- PDFKit ใช้ Helvetica font ซึ่งไม่รองรับภาษาไทย
- สำหรับ production จริง ควรเพิ่ม Thai font:

```typescript
// ใน export.service.ts
const doc = new PDFDocument({ 
  size: 'A4',
  layout: 'landscape',
  margin: 50,
});

// Register Thai font (ต้องมีไฟล์ font)
doc.registerFont('THSarabunNew', 'path/to/THSarabunNew.ttf');
doc.font('THSarabunNew');
```

---

### ปัญหา 5: Port conflict

**อาการ:**
```
Error: Port 3006 is already in use
```

**แก้ไข:**
1. หา process ที่ใช้ port:
```bash
lsof -i :3006
```

2. Kill process:
```bash
kill -9 <PID>
```

3. หรือเปลี่ยน port ใน `main.ts`:
```typescript
port: 3007, // เปลี่ยนเป็น port อื่น
```

---

## 📝 Best Practices

### 1. Error Handling

```typescript
try {
  const result = await generateComparisonExcel(usageId);
  // Success
} catch (error) {
  console.error('Export failed:', error);
  // Show user-friendly error message
  toast.error('ไม่สามารถสร้างรายงานได้ กรุณาลองใหม่');
}
```

### 2. Loading States

```typescript
const [isExporting, setIsExporting] = useState(false);

const handleExport = async () => {
  setIsExporting(true);
  try {
    await exportReport();
  } finally {
    setIsExporting(false);
  }
};
```

### 3. File Naming

```typescript
// Good
const filename = `comparison_report_${usageId}_${date}.xlsx`;

// Better
const filename = `comparison_HN${patientHN}_${date}.xlsx`;
```

### 4. Cleanup

```typescript
// Always cleanup object URLs
const url = window.URL.createObjectURL(blob);
// ... use url
window.URL.revokeObjectURL(url); // Cleanup
```

---

## 🚀 Production Deployment

### 1. Environment Variables

```env
# .env.production
REPORT_SERVICE_HOST=report-service
REPORT_SERVICE_PORT=3006
MEDICAL_SUPPLIES_SERVICE_HOST=medical-supplies-service
MEDICAL_SUPPLIES_SERVICE_PORT=3008
```

### 2. Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/apps/report-service ./

EXPOSE 3006

CMD ["node", "main.js"]
```

### 3. Health Check

เพิ่ม health check endpoint:

```typescript
@Get('health')
healthCheck() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}
```

---

## 📊 Monitoring

### Logs

```bash
# Production logs
tail -f /var/log/report-service/app.log

# Development logs
npm run start:report | tee report-service.log
```

### Metrics

- Report generation time
- Success/failure rate
- File sizes
- Memory usage

---

## 📞 Support

หากพบปัญหาหรือต้องการความช่วยเหลือ:
1. ตรวจสอบ logs ก่อน
2. ดู Troubleshooting section
3. ติดต่อทีมพัฒนา

---

## 📚 Additional Resources

- [NestJS Microservices Documentation](https://docs.nestjs.com/microservices/basics)
- [ExcelJS Documentation](https://github.com/exceljs/exceljs)
- [PDFKit Documentation](https://pdfkit.org/)

---

**เวอร์ชัน:** 1.0.0  
**อัพเดทล่าสุด:** 20 ธันวาคม 2025  
**ผู้พัฒนา:** POSE Team
