# คู่มือการใช้งานรายงาน Vending Reports

## สารบัญ
1. [รายงานสรุป Mapping Vending กับ HIS](#1-รายงานสรุป-mapping-vending-กับ-his)
2. [รายงานการเบิกที่ Mapping ไม่ได้](#2-รายงานการเบิกที่-mapping-ไม่ได้)
3. [รายงานรายการที่เบิกแล้วแต่ไม่ได้ใช้ภายในวัน](#3-รายงานรายการที่เบิกแล้วแต่ไม่ได้ใช้ภายในวัน)
4. [จัดการ Cancel Bill ข้ามวัน](#4-จัดการ-cancel-bill-ข้ามวัน)

---

## 1. รายงานสรุป Mapping Vending กับ HIS

### คำอธิบาย
รายงานสรุปการ Mapping การจ่ายเวชภัณฑ์จาก Vending กับ HN ที่ใช้รายการเวชภัณฑ์จาก HIS สรุปรายวันตามวันที่ของการ Print Receipt/Invoice

### Endpoints

#### Excel Report
```
GET /api/v1/reports/vending-mapping/excel
```

#### PDF Report
```
GET /api/v1/reports/vending-mapping/pdf
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | No | วันที่เริ่มต้น (รูปแบบ: YYYY-MM-DD) |
| `endDate` | string | No | วันที่สิ้นสุด (รูปแบบ: YYYY-MM-DD) |
| `printDate` | string | No | วันที่ Print Receipt/Invoice (รูปแบบ: YYYY-MM-DD) |

### ตัวอย่างการใช้งาน

#### ตัวอย่างที่ 1: ดึงรายงานตามช่วงวันที่
```bash
curl -X GET "http://localhost:3000/api/v1/reports/vending-mapping/excel?startDate=2025-01-01&endDate=2025-01-31" \
  -H "Content-Type: application/json" \
  --output vending_mapping_report.xlsx
```

#### ตัวอย่างที่ 2: ดึงรายงานตามวันที่ Print
```bash
curl -X GET "http://localhost:3000/api/v1/reports/vending-mapping/excel?printDate=2025-01-15" \
  -H "Content-Type: application/json" \
  --output vending_mapping_report.xlsx
```

#### ตัวอย่างที่ 3: ดึงรายงาน PDF
```bash
curl -X GET "http://localhost:3000/api/v1/reports/vending-mapping/pdf?startDate=2025-01-01&endDate=2025-01-31" \
  -H "Content-Type: application/json" \
  --output vending_mapping_report.pdf
```

### Response Format

**Excel/PDF File**: ไฟล์รายงานจะถูกดาวน์โหลดโดยตรง

### ข้อมูลในรายงาน

- **สรุปผล (Summary)**:
  - จำนวนวัน
  - จำนวน Episode
  - จำนวนผู้ป่วย
  - จำนวนรายการทั้งหมด
  - รายการที่ Mapping ได้
  - รายการที่ Mapping ไม่ได้

- **รายละเอียดรายวัน**:
  - วันที่ Print
  - จำนวน Episode
  - จำนวนผู้ป่วย
  - จำนวนรายการ
  - Mapping ได้
  - Mapping ไม่ได้

---

## 2. รายงานการเบิกที่ Mapping ไม่ได้

### คำอธิบาย
รายงานสรุปการเบิกรายการเวชภัณฑ์จาก Vending ที่ Mapping ไม่ได้ว่าใช้ไปกับ HN ใด รายวันและรายเดือน ตามวันที่ของการเบิกใน Vending

### Endpoint

```
GET /api/v1/reports/unmapped-dispensed/excel
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | No | วันที่เริ่มต้น (รูปแบบ: YYYY-MM-DD) |
| `endDate` | string | No | วันที่สิ้นสุด (รูปแบบ: YYYY-MM-DD) |
| `groupBy` | string | No | รูปแบบการจัดกลุ่ม: `day` หรือ `month` (default: `day`) |

### ตัวอย่างการใช้งาน

#### ตัวอย่างที่ 1: รายงานรายวัน
```bash
curl -X GET "http://localhost:3000/api/v1/reports/unmapped-dispensed/excel?startDate=2025-01-01&endDate=2025-01-31&groupBy=day" \
  -H "Content-Type: application/json" \
  --output unmapped_dispensed_report_day.xlsx
```

#### ตัวอย่างที่ 2: รายงานรายเดือน
```bash
curl -X GET "http://localhost:3000/api/v1/reports/unmapped-dispensed/excel?startDate=2025-01-01&endDate=2025-12-31&groupBy=month" \
  -H "Content-Type: application/json" \
  --output unmapped_dispensed_report_month.xlsx
```

### Response Format

**Excel File**: ไฟล์รายงานจะถูกดาวน์โหลดโดยตรง

### ข้อมูลในรายงาน

- **สรุปผล (Summary)**:
  - จำนวนช่วงเวลา
  - จำนวนรายการที่ Mapping ไม่ได้
  - จำนวนรวม
  - รูปแบบ (รายวัน/รายเดือน)

- **รายละเอียดรายการ**:
  - วันที่/เดือน
  - รหัสอุปกรณ์
  - ชื่ออุปกรณ์
  - วันที่เบิก
  - จำนวน
  - RFID Code

---

## 3. รายงานรายการที่เบิกแล้วแต่ไม่ได้ใช้ภายในวัน

### คำอธิบาย
รายงานแสดงรายการที่เบิกจาก Vending แล้วแต่ยังไม่ได้ใช้ภายในวันเดียวกัน พร้อมจำนวนชั่วโมงที่ผ่านมา

### Endpoint

```
GET /api/v1/reports/unused-dispensed/excel
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | string | No | วันที่ที่ต้องการตรวจสอบ (รูปแบบ: YYYY-MM-DD) - ถ้าไม่ระบุจะใช้วันปัจจุบัน |

### ตัวอย่างการใช้งาน

#### ตัวอย่างที่ 1: ตรวจสอบวันที่เฉพาะ
```bash
curl -X GET "http://localhost:3000/api/v1/reports/unused-dispensed/excel?date=2025-01-15" \
  -H "Content-Type: application/json" \
  --output unused_dispensed_report.xlsx
```

#### ตัวอย่างที่ 2: ตรวจสอบวันปัจจุบัน
```bash
curl -X GET "http://localhost:3000/api/v1/reports/unused-dispensed/excel" \
  -H "Content-Type: application/json" \
  --output unused_dispensed_report.xlsx
```

### Response Format

**Excel File**: ไฟล์รายงานจะถูกดาวน์โหลดโดยตรง

### ข้อมูลในรายงาน

- **สรุปผล (Summary)**:
  - วันที่
  - จำนวนรายการที่ไม่ได้ใช้
  - จำนวนรวม

- **รายละเอียดรายการ**:
  - รหัสอุปกรณ์
  - ชื่ออุปกรณ์
  - วันที่เบิก
  - จำนวน
  - RFID Code
  - ชั่วโมงที่ผ่านมา

### Flow การจัดการ

1. **กรณีที่ยังไม่ได้แกะซอง หรือยังอยู่ในสภาพเดิมจากการเบิก**:
   - นำกลับเข้าตู้ Vending

2. **กรณีที่ Package ไม่เหมือนเดิม หรือนำไปใช้ในแผนก**:
   - ติดต่อแผนกที่เกี่ยวข้องเพื่อตรวจสอบและจัดการต่อไป

---

## 4. จัดการ Cancel Bill ข้ามวัน

### คำอธิบาย
กรณีมีการ Cancel Bill ยกเลิกรายการใบเสร็จข้ามวัน ส่ง Update รายการเวชภัณฑ์ใน Episode นั้นในวันที่ของการ Print Receipt/Invoice ใหม่ Vending เก็บเป็น Transaction ใหม่ในวันที่และเวลาของการ Print

### Endpoint

```
POST /api/v1/medical-supplies/cancel-bill/cross-day
```

### Request Body

```json
{
  "en": "string",
  "hn": "string",
  "oldPrintDate": "string (YYYY-MM-DD)",
  "newPrintDate": "string (YYYY-MM-DD)",
  "cancelItems": [
    {
      "assession_no": "string",
      "item_code": "string",
      "qty": number
    }
  ],
  "newItems": [
    {
      "item_code": "string",
      "item_description": "string",
      "assession_no": "string",
      "qty": number,
      "uom": "string",
      "item_status": "string (optional, default: 'Verified')"
    }
  ]
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `en` | string | Yes | Episode Number |
| `hn` | string | Yes | Patient HN |
| `oldPrintDate` | string | Yes | วันที่ Print เดิม (YYYY-MM-DD) |
| `newPrintDate` | string | Yes | วันที่ Print ใหม่ (YYYY-MM-DD) |
| `cancelItems` | array | Yes | รายการที่ต้องการยกเลิก |
| `cancelItems[].assession_no` | string | Yes | Assession Number |
| `cancelItems[].item_code` | string | Yes | รหัสอุปกรณ์ |
| `cancelItems[].qty` | number | Yes | จำนวนที่ยกเลิก |
| `newItems` | array | No | รายการใหม่ที่ต้องการเพิ่ม |
| `newItems[].item_code` | string | Yes | รหัสอุปกรณ์ |
| `newItems[].item_description` | string | Yes | คำอธิบายอุปกรณ์ |
| `newItems[].assession_no` | string | Yes | Assession Number |
| `newItems[].qty` | number | Yes | จำนวน |
| `newItems[].uom` | string | Yes | หน่วยนับ |
| `newItems[].item_status` | string | No | สถานะรายการ (default: 'Verified') |

### ตัวอย่างการใช้งาน

#### ตัวอย่างที่ 1: ยกเลิกรายการเท่านั้น
```bash
curl -X POST "http://localhost:3000/api/v1/medical-supplies/cancel-bill/cross-day" \
  -H "Content-Type: application/json" \
  -d '{
    "en": "O25-000001",
    "hn": "08-020958",
    "oldPrintDate": "2025-01-15",
    "newPrintDate": "2025-01-16",
    "cancelItems": [
      {
        "assession_no": "7938884/109",
        "item_code": "IER03",
        "qty": 3
      }
    ]
  }'
```

#### ตัวอย่างที่ 2: ยกเลิกรายการและเพิ่มรายการใหม่
```bash
curl -X POST "http://localhost:3000/api/v1/medical-supplies/cancel-bill/cross-day" \
  -H "Content-Type: application/json" \
  -d '{
    "en": "O25-000001",
    "hn": "08-020958",
    "oldPrintDate": "2025-01-15",
    "newPrintDate": "2025-01-16",
    "cancelItems": [
      {
        "assession_no": "7938884/109",
        "item_code": "IER03",
        "qty": 3
      }
    ],
    "newItems": [
      {
        "item_code": "IER03",
        "item_description": "JELCO IV NO,18",
        "assession_no": "7938884/246",
        "qty": 2,
        "uom": "Each",
        "item_status": "Verified"
      }
    ]
  }'
```

### Response Format

```json
{
  "success": true,
  "message": "Cross-day cancel bill processed successfully",
  "cancelled_usage_ids": [15, 16],
  "new_usage_id": 20
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | สถานะการทำงาน |
| `message` | string | ข้อความตอบกลับ |
| `cancelled_usage_ids` | array | รายการ ID ของ Usage ที่ถูกยกเลิก |
| `new_usage_id` | number | ID ของ Usage ใหม่ (ถ้ามี) |

### การทำงาน

1. **ค้นหา Usage Records เดิม**: ค้นหาจาก `en`, `hn`, และ `oldPrintDate`
2. **อัพเดตรายการที่ยกเลิก**: 
   - เปลี่ยน `order_item_status` เป็น `'Discontinue'`
   - ตั้ง `qty_used_with_patient` เป็น `0`
3. **อัพเดต Billing Status**: เปลี่ยน `billing_status` เป็น `'CANCELLED'`
4. **สร้าง Usage ใหม่** (ถ้ามี `newItems`):
   - สร้าง `MedicalSupplyUsage` ใหม่ด้วย `newPrintDate`
   - สร้าง `SupplyUsageItem` สำหรับแต่ละรายการใหม่
   - ตั้ง `billing_status` เป็น `'VERIFIED'`

---

## ตัวอย่างการใช้งานด้วย JavaScript/TypeScript

### ใช้ Fetch API

```javascript
// 1. Vending Mapping Report (Excel)
async function downloadVendingMappingExcel(startDate, endDate) {
  const url = `http://localhost:3000/api/v1/reports/vending-mapping/excel?startDate=${startDate}&endDate=${endDate}`;
  const response = await fetch(url);
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'vending_mapping_report.xlsx';
  a.click();
}

// 2. Unmapped Dispensed Report (Excel)
async function downloadUnmappedDispensedExcel(startDate, endDate, groupBy = 'day') {
  const url = `http://localhost:3000/api/v1/reports/unmapped-dispensed/excel?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`;
  const response = await fetch(url);
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'unmapped_dispensed_report.xlsx';
  a.click();
}

// 3. Unused Dispensed Report (Excel)
async function downloadUnusedDispensedExcel(date) {
  const url = date 
    ? `http://localhost:3000/api/v1/reports/unused-dispensed/excel?date=${date}`
    : 'http://localhost:3000/api/v1/reports/unused-dispensed/excel';
  const response = await fetch(url);
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'unused_dispensed_report.xlsx';
  a.click();
}

// 4. Cross Day Cancel Bill
async function handleCrossDayCancelBill(data) {
  const response = await fetch('http://localhost:3000/api/v1/medical-supplies/cancel-bill/cross-day', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  return result;
}
```

### ใช้ Axios

```javascript
import axios from 'axios';

// 1. Vending Mapping Report (Excel)
async function downloadVendingMappingExcel(startDate, endDate) {
  const response = await axios({
    url: 'http://localhost:3000/api/v1/reports/vending-mapping/excel',
    method: 'GET',
    params: { startDate, endDate },
    responseType: 'blob',
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'vending_mapping_report.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// 2. Unmapped Dispensed Report (Excel)
async function downloadUnmappedDispensedExcel(startDate, endDate, groupBy = 'day') {
  const response = await axios({
    url: 'http://localhost:3000/api/v1/reports/unmapped-dispensed/excel',
    method: 'GET',
    params: { startDate, endDate, groupBy },
    responseType: 'blob',
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'unmapped_dispensed_report.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// 3. Unused Dispensed Report (Excel)
async function downloadUnusedDispensedExcel(date) {
  const response = await axios({
    url: 'http://localhost:3000/api/v1/reports/unused-dispensed/excel',
    method: 'GET',
    params: date ? { date } : {},
    responseType: 'blob',
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'unused_dispensed_report.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// 4. Cross Day Cancel Bill
async function handleCrossDayCancelBill(data) {
  const response = await axios.post(
    'http://localhost:3000/api/v1/medical-supplies/cancel-bill/cross-day',
    data
  );
  return response.data;
}
```

---

## หมายเหตุสำคัญ

1. **Authentication**: Endpoints ทั้งหมดถูก comment `@UseGuards(FlexibleAuthGuard)` ไว้สำหรับการทดสอบ ก่อน production ควร uncomment เพื่อเพิ่มการตรวจสอบสิทธิ์

2. **Base URL**: เปลี่ยน `http://localhost:3000` เป็น URL ของ server จริงเมื่อ deploy

3. **Date Format**: ใช้รูปแบบ `YYYY-MM-DD` สำหรับทุกวันที่

4. **Error Handling**: ควรจัดการ error cases อย่างเหมาะสม เช่น:
   - Network errors
   - Invalid date formats
   - Missing required parameters
   - Server errors (500, 404, etc.)

5. **File Downloads**: สำหรับรายงาน Excel/PDF จะถูกดาวน์โหลดโดยตรง ควรตรวจสอบว่า browser/client รองรับการดาวน์โหลดไฟล์

---

## สอบถามและสนับสนุน

หากมีปัญหาหรือข้อสงสัยในการใช้งาน กรุณาติดต่อทีมพัฒนา

