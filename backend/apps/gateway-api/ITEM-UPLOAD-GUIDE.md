# Gateway API - Item Creation with Image Upload

## Overview
Gateway API ตอนนี้รองรับการสร้าง Item พร้อม upload รูปภาพผ่าน `POST /api/v1/items` โดย Gateway จะ forward request ไปยัง Item Service โดยอัตโนมัติ

## Endpoint

```
POST {{url}}/api/v1/items
```

- **Method**: POST
- **Content-Type**: multipart/form-data
- **Authentication**: Optional (commented out)

## Request Body (form-data)

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| name | String | Yes | ชื่อสินค้า | "BD POSIFLUSH SP 10ML ( 0.9%NaCl )" |
| description | String | No | รายละเอียดสินค้า | "BD POSIFLUSH SP 10ML" |
| price | Number | Yes | ราคา | 0 |
| quantity | Number | Yes | จำนวน | 0 |
| category_id | Number | Yes | ID ของหมวดหมู่ | 1 |
| is_active | Boolean | No | สถานะการใช้งาน (default: true) | true |
| number | Number | Yes | หมายเลขสินค้า | 1 |
| item_code | String | Yes | รหัสสินค้า (ต้องไม่ซ้ำ) | "S4214NACISP10" |
| uom | String | Yes | หน่วยนับ | "Each" |
| size | String | No | ขนาด | "423 cm" |
| department | String | No | แผนก | "Medical Supplies" |
| picture | File | No | ไฟล์รูปภาพ | (เลือกไฟล์จากคอมพิวเตอร์) |

## Response

### Success (201 Created)

```json
{
  "id": 1,
  "name": "BD POSIFLUSH SP 10ML ( 0.9%NaCl )",
  "description": "BD POSIFLUSH SP 10ML",
  "price": 0,
  "quantity": 0,
  "category_id": 1,
  "is_active": true,
  "number": 1,
  "item_code": "S4214NACISP10",
  "uom": "Each",
  "size": "423 cm",
  "department": null,
  "picture_path": "uploads/items/1732185678343-420870278_3439076751360145924709468785328525_n.jpg",
  "created_at": "2024-11-21T10:34:38.000Z",
  "updated_at": "2024-11-21T10:34:38.000Z"
}
```

### Error (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": [
    "name should not be empty",
    "item_code must be a string"
  ],
  "error": "Bad Request"
}
```

### Error (500 Internal Server Error)

```json
{
  "statusCode": 500,
  "message": "Failed to create item"
}
```

## Postman Example

### 1. Setup Request

1. Method: `POST`
2. URL: `{{url}}/api/v1/items`
3. Body: Select `form-data`

### 2. Add Form Fields

| Key | Type | Value |
|-----|------|-------|
| name | Text | BD POSIFLUSH SP 10ML ( 0.9%NaCl ) |
| description | Text | BD POSIFLUSH SP 10ML |
| price | Text | 0 |
| quantity | Text | 0 |
| category_id | Text | 1 |
| is_active | Text | true |
| number | Text | 1 |
| item_code | Text | S4214NACISP10 |
| uom | Text | Each |
| size | Text | 423 cm |
| picture | File | (เลือกไฟล์) |

### 3. Send Request

Click "Send" button

## cURL Example

```bash
curl -X POST "http://localhost:3000/api/v1/items" \
  -H "Content-Type: multipart/form-data" \
  -F "name=BD POSIFLUSH SP 10ML ( 0.9%NaCl )" \
  -F "description=BD POSIFLUSH SP 10ML" \
  -F "price=0" \
  -F "quantity=0" \
  -F "category_id=1" \
  -F "is_active=true" \
  -F "number=1" \
  -F "item_code=S4214NACISP10" \
  -F "uom=Each" \
  -F "size=423 cm" \
  -F "picture=@/path/to/image.jpg"
```

## JavaScript/Axios Example

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const formData = new FormData();
formData.append('name', 'BD POSIFLUSH SP 10ML ( 0.9%NaCl )');
formData.append('description', 'BD POSIFLUSH SP 10ML');
formData.append('price', '0');
formData.append('quantity', '0');
formData.append('category_id', '1');
formData.append('is_active', 'true');
formData.append('number', '1');
formData.append('item_code', 'S4214NACISP10');
formData.append('uom', 'Each');
formData.append('size', '423 cm');
formData.append('picture', fs.createReadStream('/path/to/image.jpg'));

axios.post('http://localhost:3000/api/v1/items', formData, {
  headers: formData.getHeaders()
})
.then(response => {
  console.log('Success:', response.data);
})
.catch(error => {
  console.error('Error:', error.response?.data || error.message);
});
```

## Architecture Flow

```
Client (Postman/Browser)
    ↓ POST /api/v1/items (multipart/form-data)
Gateway API (port 3000)
    ↓ @UseInterceptors(FileInterceptor('picture'))
    ↓ รับ file และ body
    ↓ สร้าง FormData ใหม่
    ↓ Forward ด้วย axios (HTTP)
Item Service (port 3001)
    ↓ @UseInterceptors(FileInterceptor('picture'))
    ↓ บันทึก file ไปที่ disk
    ↓ บันทึก data ไปที่ database
Database (MySQL)
```

**สำคัญ**: Gateway ใช้ **HTTP forwarding** ไม่ใช่ microservice TCP pattern เพราะ TCP ไม่รองรับ binary data ขนาดใหญ่

## File Storage

- **Upload Path**: `backend/uploads/items/`
- **File Naming**: `{timestamp}-{originalname}`
- **Stored in DB**: `picture_path` field
- **Example**: `uploads/items/1732185678343-image.jpg`

## Environment Variables

```env
# Item Service URL (for Gateway forwarding)
ITEM_SERVICE_URL=http://localhost:3001

# Upload configuration (in Item Service)
UPLOAD_PATH=./uploads/items
BASE_URL=http://localhost:3001
```

## Docker Volume Configuration

ถ้าใช้ Docker ต้องมี volume mapping:

```yaml
services:
  item-service:
    volumes:
      - ./uploads:/app/uploads
```

## Notes

1. ✅ **ใช้ Gateway URL**: `POST {{url}}/api/v1/items` (port 3000)
2. ✅ **รองรับ File Upload**: ผ่าน multipart/form-data
3. ✅ **HTTP Forwarding**: Gateway ใช้ HTTP (axios) forward ไปยัง Item Service
4. ✅ **ไม่ใช้ TCP Microservice**: เพราะ TCP ไม่รองรับ binary data ขนาดใหญ่
5. ✅ **Validation**: ตรวจสอบข้อมูลที่ Item Service
6. ✅ **Error Handling**: แสดง error message ที่ชัดเจน
7. ✅ **รองรับ PUT /items/:id**: สามารถอัพเดท item พร้อมเปลี่ยนรูปได้

## Troubleshooting

### Error: "Failed to create item"

1. ตรวจสอบว่า Item Service รันอยู่ที่ port 3001
2. ตรวจสอบ `ITEM_SERVICE_URL` environment variable
3. ตรวจสอบ network connectivity ระหว่าง Gateway และ Item Service

### Error: "item_code must be unique"

- `item_code` ซ้ำในฐานข้อมูล ให้เปลี่ยนเป็นค่าอื่น

### File Upload Failed

1. ตรวจสอบ upload directory มีสิทธิ์ write
2. ตรวจสอบ file size limit
3. ตรวจสอบ file type (รองรับ jpg, jpeg, png, gif, webp)

