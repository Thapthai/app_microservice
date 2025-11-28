# Client Credential Authentication Guide

คู่มือการใช้งาน Client Credential Authentication (client_id และ client_secret)

## 📋 Overview

ระบบรองรับการ authentication แบบ Client Credential โดยใช้ `client_id` และ `client_secret` ใน HTTP headers แทน JWT token

## 🔑 การสร้าง Client Credential

### 1. สร้าง Client Credential (ต้อง login ด้วย JWT ก่อน)

```bash
curl -X POST http://10.11.9.84:3000/api/v1/auth/client-credential/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My API Client",
    "description": "For external API integration",
    "expires_at": "2025-12-31T23:59:59Z"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Client credential created successfully",
  "data": {
    "id": 1,
    "name": "My API Client",
    "client_id": "30aa87cc487f4398ab4c7796ed41c7ed",
    "client_secret": "1c26a66c9eC5461d8FF1A8CcdFd9d5fB",
    "expires_at": "2025-12-31T23:59:59.000Z"
  }
}
```

⚠️ **สำคัญ:** `client_secret` จะแสดงแค่ครั้งเดียวตอนสร้าง ต้องบันทึกไว้ให้ดี!

### 2. ดูรายการ Client Credentials

```bash
curl -X GET http://10.11.9.84:3000/api/v1/auth/client-credential/list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Revoke Client Credential

```bash
curl -X POST http://10.11.9.84:3000/api/v1/auth/client-credential/revoke \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "credentialId": 1
  }'
```

## 🔐 การใช้งาน Client Credential

### PHP cURL Example

```php
<?php
$ch = curl_init();

curl_setopt_array($ch, array(
  CURLOPT_URL => 'http://10.11.9.84:3000/api/v1/items',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'GET',
  CURLOPT_HTTPHEADER => array(
    'client_id: 30aa87cc487f4398ab4c7796ed41c7ed',
    'client_secret: 1c26a66c9eC5461d8FF1A8CcdFd9d5fB',
    'Content-Type: application/json'
  ),
));

$response = curl_exec($ch);
curl_close($ch);
echo $response;
?>
```

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

const response = await axios.get('http://10.11.9.84:3000/api/v1/items', {
  headers: {
    'client_id': '30aa87cc487f4398ab4c7796ed41c7ed',
    'client_secret': '1c26a66c9eC5461d8FF1A8CcdFd9d5fB',
    'Content-Type': 'application/json'
  }
});
```

### Python Example

```python
import requests

headers = {
    'client_id': '30aa87cc487f4398ab4c7796ed41c7ed',
    'client_secret': '1c26a66c9eC5461d8FF1A8CcdFd9d5fB',
    'Content-Type': 'application/json'
}

response = requests.get('http://10.11.9.84:3000/api/v1/items', headers=headers)
print(response.json())
```

## 📡 API Endpoints ที่รองรับ

ทุก endpoint ที่ใช้ `@UseGuards(JwtAuthGuard)` สามารถใช้ client credential ได้:

- `GET /api/v1/items` - ดูรายการ items
- `POST /api/v1/items` - สร้าง item
- `GET /api/v1/items/:id` - ดู item แบบละเอียด
- `PUT /api/v1/items/:id` - แก้ไข item
- `DELETE /api/v1/items/:id` - ลบ item
- `GET /api/v1/auth/user/profile` - ดู profile
- และอื่นๆ

## 🔒 Security Features

- ✅ Client secret ถูก hash ด้วย bcrypt
- ✅ รองรับ expiration date
- ✅ สามารถ revoke ได้
- ✅ Track last used timestamp
- ✅ เชื่อมโยงกับ user account

## ⚠️ หมายเหตุ

1. **บันทึก client_secret ให้ดี** - จะแสดงแค่ครั้งเดียวตอนสร้าง
2. **ใช้ HTTPS ใน production** - เพื่อความปลอดภัยในการส่ง client_secret
3. **อย่า commit client_secret ใน code** - ใช้ environment variables แทน
4. **Revoke ทันทีถ้า leak** - เพื่อความปลอดภัย

