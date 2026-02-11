# Medical Supply Item - Quantity Management API

API สำหรับจัดการจำนวนอุปกรณ์การแพทย์ แยกการใช้งานกับคนไข้และการคืนอุปกรณ์เข้าตู้

## 🌐 Base URL

```
http://localhost:3000
```

---

## 📋 API Endpoints

### 1. บันทึกการใช้อุปกรณ์กับคนไข้

**POST** `/medical-supply-items/record-used`

บันทึกจำนวนอุปกรณ์ที่ใช้กับคนไข้

**Request Body:**
```json
{
  "item_id": 123,
  "qty_used": 2,
  "recorded_by_user_id": "USER001"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "qty": 5,
    "qty_used_with_patient": 2,
    "qty_returned_to_cabinet": 0,
    "qty_pending": 3,
    "item_status": "PARTIAL"
  }
}
```

**Status Codes:**
- `200 OK` - บันทึกสำเร็จ
- `400 Bad Request` - จำนวนเกินที่เบิก
- `404 Not Found` - ไม่พบ item_id
- `500 Internal Server Error` - เกิดข้อผิดพลาด

---

### 2. บันทึกการคืนอุปกรณ์เข้าตู้

**POST** `/medical-supply-items/record-return`

บันทึกจำนวนอุปกรณ์ที่คืนเข้าตู้พร้อมสาเหตุ

**Request Body:**
```json
{
  "item_id": 123,
  "qty_returned": 3,
  "return_reason": "UNWRAPPED_UNUSED",
  "return_by_user_id": "USER001",
  "return_note": "อุปกรณ์สำรองที่ไม่ได้ใช้"
}
```

**Return Reasons (สาเหตุ):**
- `UNWRAPPED_UNUSED` - แกะห่อแล้วไม่ได้ใช้
- `EXPIRED` - อุปกรณ์หมดอายุ
- `CONTAMINATED` - อุปกรณ์มีการปนเปื้อน
- `DAMAGED` - อุปกรณ์ชำรุด

**Response:**
```json
{
  "success": true,
  "data": {
    "return_record": {
      "id": 456,
      "qty_returned": 3,
      "return_reason": "UNWRAPPED_UNUSED",
      "return_datetime": "2024-12-20T10:30:00.000Z",
      "return_by_user_id": "USER001",
      "return_note": "อุปกรณ์สำรองที่ไม่ได้ใช้"
    },
    "updated_item": {
      "id": 123,
      "qty": 5,
      "qty_used_with_patient": 2,
      "qty_returned_to_cabinet": 3,
      "qty_pending": 0,
      "item_status": "COMPLETED"
    }
  }
}
```

**Status Codes:**
- `200 OK` - บันทึกสำเร็จ
- `400 Bad Request` - จำนวนเกินที่เบิก หรือข้อมูลไม่ถูกต้อง
- `404 Not Found` - ไม่พบ item_id
- `500 Internal Server Error` - เกิดข้อผิดพลาด

---

### 3. ดึงรายการที่รอดำเนินการ

**GET** `/medical-supply-items/pending`

ดึงรายการอุปกรณ์ที่ยังดำเนินการไม่ครบ (PENDING, PARTIAL)

**Query Parameters:**
- `department_code` (optional) - รหัสแผนก
- `patient_hn` (optional) - HN ของคนไข้
- `item_status` (optional) - สถานะ (PENDING, PARTIAL, COMPLETED)
- `page` (optional, default: 1) - หน้าที่ต้องการ
- `limit` (optional, default: 10) - จำนวนต่อหน้า

**Example Request:**
```
GET /medical-supply-items/pending?department_code=ER&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "order_item_code": "S4214JELCO018",
      "order_item_description": "JELCO IV NO,18",
      "qty": 5,
      "qty_used_with_patient": 2,
      "qty_returned_to_cabinet": 0,
      "qty_pending": 3,
      "item_status": "PARTIAL",
      "usage": {
        "patient_hn": "20-010334",
        "first_name": "สมชาย",
        "lastname": "ใจดี",
        "department_code": "ER"
      }
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10
}
```

---

### 4. ดึงประวัติการคืนอุปกรณ์

**GET** `/medical-supply-items/return-history`

ดึงประวัติการคืนอุปกรณ์เข้าตู้

**Query Parameters:**
- `department_code` (optional) - รหัสแผนก
- `patient_hn` (optional) - HN ของคนไข้
- `return_reason` (optional) - สาเหตุ
- `date_from` (optional) - วันที่เริ่มต้น (YYYY-MM-DD)
- `date_to` (optional) - วันที่สิ้นสุด (YYYY-MM-DD)
- `page` (optional, default: 1) - หน้าที่ต้องการ
- `limit` (optional, default: 10) - จำนวนต่อหน้า

**Example Request:**
```
GET /medical-supply-items/return-history?return_reason=UNWRAPPED_UNUSED&date_from=2024-12-01&date_to=2024-12-31
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "qty_returned": 3,
      "return_reason": "UNWRAPPED_UNUSED",
      "return_datetime": "2024-12-20T10:30:00.000Z",
      "return_by_user_id": "USER001",
      "return_note": "อุปกรณ์สำรองที่ไม่ได้ใช้",
      "supply_item": {
        "id": 123,
        "order_item_code": "S4214JELCO018",
        "order_item_description": "JELCO IV NO,18",
        "usage": {
          "patient_hn": "20-010334",
          "first_name": "สมชาย",
          "lastname": "ใจดี"
        }
      }
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

---

### 5. ดูข้อมูล Supply Item แต่ละรายการ

**GET** `/medical-supply-items/:id`

ดูข้อมูลอุปกรณ์แต่ละรายการ พร้อม quantity breakdown และประวัติการคืน

**Example Request:**
```
GET /medical-supply-items/123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "medical_supply_usage_id": 456,
    "order_item_code": "S4214JELCO018",
    "order_item_description": "JELCO IV NO,18",
    "qty": 5,
    "qty_used_with_patient": 2,
    "qty_returned_to_cabinet": 3,
    "qty_pending": 0,
    "item_status": "COMPLETED",
    "uom": "Each",
    "usage": {
      "id": 456,
      "patient_hn": "20-010334",
      "first_name": "สมชาย",
      "lastname": "ใจดี",
      "department_code": "ER"
    },
    "return_items": [
      {
        "id": 789,
        "qty_returned": 3,
        "return_reason": "UNWRAPPED_UNUSED",
        "return_datetime": "2024-12-20T10:30:00.000Z",
        "return_by_user_id": "USER001",
        "return_note": "อุปกรณ์สำรองที่ไม่ได้ใช้"
      }
    ],
    "created_at": "2024-12-20T08:00:00.000Z",
    "updated_at": "2024-12-20T10:30:00.000Z"
  }
}
```

---

### 6. ดูรายการ Supply Items ตาม Usage ID

**GET** `/medical-supply-items/usage/:usageId`

ดูรายการอุปกรณ์ทั้งหมดที่เบิกใน medical supply usage นั้นๆ

**Example Request:**
```
GET /medical-supply-items/usage/456
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "order_item_code": "S4214JELCO018",
      "order_item_description": "JELCO IV NO,18",
      "qty": 5,
      "qty_used_with_patient": 2,
      "qty_returned_to_cabinet": 3,
      "qty_pending": 0,
      "item_status": "COMPLETED",
      "return_items": [
        {
          "id": 789,
          "qty_returned": 3,
          "return_reason": "UNWRAPPED_UNUSED",
          "return_datetime": "2024-12-20T10:30:00.000Z"
        }
      ]
    },
    {
      "id": 124,
      "order_item_code": "S4214NEEDLE",
      "order_item_description": "Needle 21G",
      "qty": 10,
      "qty_used_with_patient": 8,
      "qty_returned_to_cabinet": 0,
      "qty_pending": 2,
      "item_status": "PARTIAL",
      "return_items": []
    }
  ]
}
```

---

### 7. สถิติการจัดการจำนวนอุปกรณ์

**GET** `/medical-supply-items/statistics`

ดึงสถิติการใช้งานและการคืนอุปกรณ์

**Query Parameters:**
- `department_code` (optional) - รหัสแผนก (ถ้าไม่ส่ง จะแสดงทั้งหมด)

**Example Request:**
```
GET /medical-supply-items/statistics?department_code=ER
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_qty": 1000,
    "total_qty_used_with_patient": 600,
    "total_qty_returned_to_cabinet": 300,
    "total_qty_pending": 100,
    "percentage_used": "60.00",
    "percentage_returned": "30.00",
    "percentage_pending": "10.00",
    "by_status": [
      { "item_status": "COMPLETED", "_count": 50 },
      { "item_status": "PARTIAL", "_count": 20 },
      { "item_status": "PENDING", "_count": 10 }
    ],
    "by_return_reason": [
      {
        "return_reason": "UNWRAPPED_UNUSED",
        "_count": 15,
        "_sum": { "qty_returned": 150 }
      },
      {
        "return_reason": "EXPIRED",
        "_count": 10,
        "_sum": { "qty_returned": 100 }
      },
      {
        "return_reason": "CONTAMINATED",
        "_count": 5,
        "_sum": { "qty_returned": 30 }
      },
      {
        "return_reason": "DAMAGED",
        "_count": 3,
        "_sum": { "qty_returned": 20 }
      }
    ]
  }
}
```

---

## 🔐 Authentication

ทุก endpoint ต้องมี authentication โดยใช้:
- JWT Token (Bearer Token)
- Client Credentials
- API Key

**Header:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 📊 Item Status

| Status | คำอธิบาย |
|--------|----------|
| `PENDING` | ยังไม่ได้ดำเนินการ (qty_pending = qty) |
| `PARTIAL` | ดำเนินการบางส่วน (0 < qty_pending < qty) |
| `COMPLETED` | ดำเนินการครบแล้ว (qty_pending = 0) |

---

## 🔄 Validation Rules

1. **จำนวนที่ใช้ + จำนวนที่คืน ≤ จำนวนที่เบิก**
   ```
   qty_used_with_patient + qty_returned_to_cabinet <= qty
   ```

2. **จำนวนต้องมากกว่า 0**
   ```
   qty_used > 0 และ qty_returned > 0
   ```

3. **สถานะอัปเดตอัตโนมัติ**
   - ระบบจะคำนวณและอัปเดต `item_status` อัตโนมัติ

---

## 💡 Use Cases

### 1. เบิกอุปกรณ์ 5 ชิ้น → ใช้กับคนไข้ 3 ชิ้น → คืน 2 ชิ้น

```bash
# Step 1: บันทึกใช้กับคนไข้
POST /medical-supply-items/record-used
{
  "item_id": 123,
  "qty_used": 3,
  "recorded_by_user_id": "USER001"
}

# Response: item_status = "PARTIAL", qty_pending = 2

# Step 2: คืนอุปกรณ์
POST /medical-supply-items/record-return
{
  "item_id": 123,
  "qty_returned": 2,
  "return_reason": "UNWRAPPED_UNUSED",
  "return_by_user_id": "USER001"
}

# Response: item_status = "COMPLETED", qty_pending = 0
```

### 2. ดูรายการที่ยังไม่ครบ

```bash
GET /medical-supply-items/pending?item_status=PARTIAL
```

### 3. ดูประวัติการคืนในเดือนธันวาคม

```bash
GET /medical-supply-items/return-history?date_from=2024-12-01&date_to=2024-12-31
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "จำนวนเกินที่เบิก: เบิก=5, ใช้=3, คืน=3, รวม=6"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Supply usage item with ID 123 not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to record item usage with patient"
}
```

---

## 🧪 Testing with cURL

### ดูข้อมูล Supply Item
```bash
curl -X GET http://localhost:3000/medical-supply-items/123 \
  -H "client_id: your_client_id" \
  -H "client_secret: your_client_secret"
```

### ดูรายการ Supply Items ตาม Usage ID
```bash
curl -X GET http://localhost:3000/medical-supply-items/usage/456 \
  -H "client_id: your_client_id" \
  -H "client_secret: your_client_secret"
```

### บันทึกการใช้กับคนไข้
```bash
curl -X POST http://localhost:3000/medical-supply-items/record-used \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "item_id": 123,
    "qty_used": 2,
    "recorded_by_user_id": "USER001"
  }'
```

### บันทึกการคืนอุปกรณ์
```bash
curl -X POST http://localhost:3000/medical-supply-items/record-return \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "item_id": 123,
    "qty_returned": 3,
    "return_reason": "UNWRAPPED_UNUSED",
    "return_by_user_id": "USER001",
    "return_note": "อุปกรณ์สำรองที่ไม่ได้ใช้"
  }'
```

### ดูรายการที่รอดำเนินการ
```bash
curl -X GET "http://localhost:3000/medical-supply-items/pending?department_code=ER&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### ดูสถิติ
```bash
curl -X GET "http://localhost:3000/medical-supply-items/statistics?department_code=ER" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📞 สรุป Endpoints

| Method | Endpoint | คำอธิบาย |
|--------|----------|----------|
| **POST** | `/medical-supply-items/record-used` | บันทึกการใช้กับคนไข้ |
| **POST** | `/medical-supply-items/record-return` | บันทึกการคืนอุปกรณ์ |
| **GET** | `/medical-supply-items/:id` | ดูข้อมูล supply item แต่ละรายการ |
| **GET** | `/medical-supply-items/usage/:usageId` | ดูรายการ supply items ตาม usage ID |
| **GET** | `/medical-supply-items/pending` | ดูรายการที่รอดำเนินการ |
| **GET** | `/medical-supply-items/return-history` | ดูประวัติการคืน |
| **GET** | `/medical-supply-items/statistics` | ดูสถิติการจัดการจำนวน |

---

## 📝 Notes

- ทุก endpoint รองรับ FlexibleAuth (JWT, Client Credentials, API Key)
- Response format เป็น JSON
- ใช้ pagination สำหรับ list endpoints
- Validation ทำงานอัตโนมัติ
- สถานะอัปเดตอัตโนมัติตามจำนวนที่บันทึก

---

เอกสารฉบับนี้อธิบายการใช้งาน API สำหรับระบบจัดการจำนวนอุปกรณ์การแพทย์ 🏥
