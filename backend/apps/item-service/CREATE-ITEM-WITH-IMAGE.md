# สร้าง Item พร้อม Upload รูปภาพจากคอมพิวเตอร์

## 📤 Create Item with Image Upload

### Endpoint
```
POST /items
```

### Description
สร้าง Medical Supply Item พร้อม upload รูปภาพจากคอมพิวเตอร์ในคำขอเดียว

### Request

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | ชื่อสินค้า |
| `description` | string | ❌ | รายละเอียด |
| `price` | number | ✅ | ราคา |
| `quantity` | number | ❌ | จำนวน |
| `category_id` | number | ❌ | ID หมวดหมู่ |
| `is_active` | boolean | ❌ | สถานะการใช้งาน |
| `number` | number | ❌ | ลำดับที่ |
| `item_code` | string | ❌ | รหัสสินค้า (unique) |
| `uom` | string | ❌ | หน่วยนับ |
| `size` | string | ❌ | ขนาด |
| `department` | string | ❌ | แผนก |
| `picture` | file | ❌ | ไฟล์รูปภาพ |

**Supported Image Formats:**
- JPG/JPEG
- PNG
- GIF
- WEBP
- BMP

**Max File Size:** 10MB

---

## 🚀 การใช้งาน

### 1. สร้าง Item พร้อม Upload รูปภาพด้วย cURL

```bash
curl -X POST http://localhost:3001/items \
  -F "name=BD POSIFLUSH SP 10ML ( 0.9%NaCl )" \
  -F "description=BD POSIFLUSH SP 10ML" \
  -F "price=0" \
  -F "quantity=0" \
  -F "number=1" \
  -F "item_code=S4214NACISP10" \
  -F "uom=ชิ้น" \
  -F "size=4*23 cm" \
  -F "department=Emergency Department" \
  -F "picture=@/path/to/your/image.jpg"
```

### 2. สร้าง Item โดยไม่มีรูปภาพ

```bash
curl -X POST http://localhost:3001/items \
  -F "name=TEGADERM 6*7CM 1623" \
  -F "item_code=S4231TEGA1623" \
  -F "uom=Each" \
  -F "size=9.5*14.5 cm" \
  -F "price=0"
```

### 3. สร้าง Item ด้วย Postman

1. เปิด Postman
2. สร้าง request: `POST http://localhost:3001/items`
3. ไปที่ tab **Body**
4. เลือก **form-data**
5. เพิ่มฟิลด์ต่างๆ:
   - `name`: BD POSIFLUSH SP 10ML
   - `item_code`: S4214NACISP10
   - `uom`: ชิ้น
   - `size`: 4*23 cm
   - `price`: 0
   - `picture`: (เลือก File และเลือกรูปภาพ)
6. กด **Send**

### 4. สร้าง Item ด้วย JavaScript/React

```javascript
async function createItemWithImage(itemData, imageFile) {
  const formData = new FormData();
  
  // เพิ่มข้อมูล item
  formData.append('name', itemData.name);
  formData.append('item_code', itemData.item_code);
  formData.append('uom', itemData.uom);
  formData.append('size', itemData.size);
  formData.append('department', itemData.department);
  formData.append('price', itemData.price);
  formData.append('quantity', itemData.quantity || 0);
  
  // เพิ่มรูปภาพ (ถ้ามี)
  if (imageFile) {
    formData.append('picture', imageFile);
  }

  try {
    const response = await fetch('http://localhost:3001/items', {
      method: 'POST',
      body: formData,
      // ไม่ต้องใส่ Content-Type header เพราะ browser จะใส่ให้อัตโนมัติ
    });

    const result = await response.json();
    console.log('Item created:', result);
    return result;
  } catch (error) {
    console.error('Failed to create item:', error);
    throw error;
  }
}

// Usage
const itemData = {
  name: 'BD POSIFLUSH SP 10ML ( 0.9%NaCl )',
  item_code: 'S4214NACISP10',
  uom: 'ชิ้น',
  size: '4*23 cm',
  department: 'Emergency Department',
  price: 0,
  quantity: 0,
};

const fileInput = document.getElementById('imageFile');
const imageFile = fileInput.files[0];

await createItemWithImage(itemData, imageFile);
```

### 5. React Component Example

```jsx
import React, { useState } from 'react';

function CreateItemForm() {
  const [formData, setFormData] = useState({
    name: '',
    item_code: '',
    uom: '',
    size: '',
    department: '',
    price: 0,
    quantity: 0,
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    
    if (imageFile) {
      data.append('picture', imageFile);
    }

    try {
      const response = await fetch('http://localhost:3001/items', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Item created successfully!');
        // Reset form
        setFormData({
          name: '',
          item_code: '',
          uom: '',
          size: '',
          department: '',
          price: 0,
          quantity: 0,
        });
        setImageFile(null);
      } else {
        alert('Failed to create item: ' + result.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>ชื่อสินค้า:</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <label>รหัสสินค้า:</label>
        <input
          type="text"
          name="item_code"
          value={formData.item_code}
          onChange={handleInputChange}
        />
      </div>

      <div>
        <label>หน่วยนับ:</label>
        <input
          type="text"
          name="uom"
          value={formData.uom}
          onChange={handleInputChange}
        />
      </div>

      <div>
        <label>ขนาด:</label>
        <input
          type="text"
          name="size"
          value={formData.size}
          onChange={handleInputChange}
        />
      </div>

      <div>
        <label>แผนก:</label>
        <input
          type="text"
          name="department"
          value={formData.department}
          onChange={handleInputChange}
        />
      </div>

      <div>
        <label>ราคา:</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <label>จำนวน:</label>
        <input
          type="number"
          name="quantity"
          value={formData.quantity}
          onChange={handleInputChange}
        />
      </div>

      <div>
        <label>รูปภาพ:</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        {imageFile && <p>Selected: {imageFile.name}</p>}
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Item'}
      </button>
    </form>
  );
}

export default CreateItemForm;
```

---

## 📥 Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Item created successfully",
  "data": {
    "id": 1,
    "name": "BD POSIFLUSH SP 10ML ( 0.9%NaCl )",
    "description": "BD POSIFLUSH SP 10ML",
    "price": 0,
    "quantity": 0,
    "category_id": null,
    "is_active": true,
    "number": 1,
    "item_code": "S4214NACISP10",
    "uom": "ชิ้น",
    "picture_url": "http://localhost:3001/items/images/item-1700000000000-123456789.jpg",
    "size": "4*23 cm",
    "department": "Emergency Department",
    "created_at": "2025-11-21T10:00:00.000Z",
    "updated_at": "2025-11-21T10:00:00.000Z",
    "category": null
  }
}
```

### Error Response (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": "Only image files are allowed!",
  "error": "Bad Request"
}
```

---

## 🔄 Update Item with New Image

### Endpoint
```
PUT /items/:id
```

### Example

```bash
curl -X PUT http://localhost:3001/items/1 \
  -F "name=BD POSIFLUSH SP 10ML (Updated)" \
  -F "price=150" \
  -F "picture=@/path/to/new-image.jpg"
```

---

## 🖼️ ดูรูปภาพ

### Endpoint
```
GET /items/images/:filename
```

### Example
```
http://localhost:3001/items/images/item-1700000000000-123456789.jpg
```

---

## 📋 ตัวอย่างข้อมูลจากตาราง Emergency Department

```bash
# Item 1
curl -X POST http://localhost:3001/items \
  -F "number=1" \
  -F "item_code=S4214NACISP10" \
  -F "name=BD POSIFLUSH SP 10ML ( 0.9%NaCl )" \
  -F "uom=ชิ้น" \
  -F "size=4*23 cm" \
  -F "department=Emergency Department" \
  -F "price=0" \
  -F "picture=@./images/S4214NACISP10.jpg"

# Item 2
curl -X POST http://localhost:3001/items \
  -F "number=2" \
  -F "item_code=S4231TEGA1623" \
  -F "name=TEGADERM 6*7CM 1623" \
  -F "uom=Each" \
  -F "size=9.5*14.5 cm" \
  -F "department=Emergency Department" \
  -F "price=0" \
  -F "picture=@./images/S4231TEGA1623.jpg"

# Item 3
curl -X POST http://localhost:3001/items \
  -F "number=3" \
  -F "item_code=S4214VOLUME01" \
  -F "name=VOLUMETRIC PUMP SET" \
  -F "uom=ชุด" \
  -F "size=12*22 cm" \
  -F "department=Emergency Department" \
  -F "price=0" \
  -F "picture=@./images/S4214VOLUME01.jpg"
```

---

## 🔒 Security Features

- ✅ รองรับเฉพาะไฟล์รูปภาพ
- ✅ จำกัดขนาดไฟล์ 10MB
- ✅ สร้างชื่อไฟล์ unique อัตโนมัติ
- ✅ Validate ข้อมูล input
- ✅ ป้องกัน path traversal

---

## 📝 Notes

1. **รูปภาพเป็น Optional**: สามารถสร้าง item โดยไม่มีรูปภาพได้
2. **Auto URL Generation**: ระบบจะสร้าง URL รูปภาพอัตโนมัติ
3. **Persistent Storage**: รูปภาพจะถูกเก็บใน Docker volume
4. **Update Support**: สามารถอัพเดตรูปภาพภายหลังได้ด้วย PUT endpoint

---

## 🐳 Docker Configuration

```yaml
# docker-compose.yml
services:
  item-service:
    image: your-registry/item-service:latest
    ports:
      - "3001:3001"
    volumes:
      - item-uploads:/app/uploads
    environment:
      - UPLOAD_PATH=/app/uploads/items
      - BASE_URL=http://localhost:3001

volumes:
  item-uploads:
    driver: local
```

---

## 🚨 Troubleshooting

### Error: "Only image files are allowed"
- ตรวจสอบนามสกุลไฟล์ (.jpg, .png, .gif, .webp, .bmp)

### Error: "File too large"
- ลดขนาดไฟล์ให้น้อยกว่า 10MB

### Error: "Failed to create item"
- ตรวจสอบ required fields: `name`, `price`
- ตรวจสอบ `item_code` ต้องไม่ซ้ำกัน (unique)

### รูปภาพไม่แสดง
- ตรวจสอบ `BASE_URL` environment variable
- ตรวจสอบ Docker volume mount
- ตรวจสอบ path `/items/images/:filename`

