# คู่มือการจัดการรูปภาพสำหรับ Medical Supply Items ใน Docker

## 📋 วิธีการจัดการรูปภาพใน Docker Environment

### ตัวเลือกที่ 1: ใช้ External Storage (แนะนำ) ⭐

เก็บรูปภาพใน Cloud Storage หรือ CDN เช่น:
- **AWS S3** / **DigitalOcean Spaces** / **Google Cloud Storage**
- **Cloudinary** / **ImageKit**
- **CDN** ของคุณเอง

**ข้อดี:**
- ไม่ต้องกังวลเรื่อง Docker volume
- Scalable และ Fast
- Backup อัตโนมัติ
- ไม่กระทบกับ container restart

**ตัวอย่าง:**
```json
{
  "name": "BD POSIFLUSH SP 10ML",
  "item_code": "S4214NACISP10",
  "picture_url": "https://your-cdn.com/medical-supplies/S4214NACISP10.jpg"
}
```

---

### ตัวเลือกที่ 2: ใช้ Docker Volume

เก็บรูปภาพใน Docker volume ที่ mount ไว้

#### 2.1 สร้าง Volume ใน docker-compose.yml

```yaml
version: '3.8'
services:
  item-service:
    image: your-registry/item-service:latest
    volumes:
      - item-uploads:/app/uploads  # Mount volume
    environment:
      - UPLOAD_PATH=/app/uploads
      - BASE_URL=https://your-domain.com

volumes:
  item-uploads:  # Persistent volume
    driver: local
```

#### 2.2 อัพเดต Item Service เพื่อรองรับ File Upload

สร้าง upload endpoint:

```typescript
// item-service.controller.ts
import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('items')
export class ItemServiceController {
  
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: process.env.UPLOAD_PATH || './uploads/items',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/items/${file.filename}`;
    
    return {
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: file.filename,
        url: fileUrl,
        size: file.size,
        mimetype: file.mimetype,
      },
    };
  }
}
```

#### 2.3 Serve Static Files

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Serve static files
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  
  await app.listen(3000);
}
bootstrap();
```

---

### ตัวเลือกที่ 3: ใช้ Shared NFS/Network Storage

เหมาะสำหรับ Multi-container deployment

```yaml
volumes:
  item-uploads:
    driver: local
    driver_opts:
      type: nfs
      o: addr=nfs-server.example.com,rw
      device: ":/path/to/shared/storage"
```

---

## 🚀 การใช้งาน

### 1. สร้าง Item พร้อมรูปภาพ (External URL)

```bash
curl -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "BD POSIFLUSH SP 10ML ( 0.9%NaCl )",
    "description": "BD POSIFLUSH SP 10ML",
    "price": 0,
    "quantity": 0,
    "number": 1,
    "item_code": "S4214NACISP10",
    "uom": "ชิ้น",
    "size": "4*23 cm",
    "department": "Emergency Department",
    "picture_url": "https://cdn.example.com/medical-supplies/S4214NACISP10.jpg"
  }'
```

### 2. Upload รูปภาพ (ถ้าใช้ Local Storage)

```bash
# Upload file
curl -X POST http://localhost:3000/items/upload \
  -F "file=@/path/to/image.jpg"

# Response
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "filename": "file-1234567890-123456789.jpg",
    "url": "http://localhost:3000/uploads/items/file-1234567890-123456789.jpg",
    "size": 245678,
    "mimetype": "image/jpeg"
  }
}

# จากนั้นใช้ URL นี้สร้าง item
curl -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "BD POSIFLUSH SP 10ML",
    "item_code": "S4214NACISP10",
    "picture_url": "http://localhost:3000/uploads/items/file-1234567890-123456789.jpg",
    ...
  }'
```

---

## 📦 ติดตั้ง Dependencies (ถ้าใช้ File Upload)

```bash
npm install --save @nestjs/platform-express multer
npm install --save-dev @types/multer
```

---

## 🔒 Security Best Practices

1. **Validate File Types**: อนุญาตเฉพาะไฟล์รูปภาพ
2. **Limit File Size**: จำกัดขนาดไฟล์ (เช่น 5MB)
3. **Sanitize Filenames**: ใช้ unique filename
4. **Use HTTPS**: สำหรับ production
5. **Set Proper Permissions**: chmod 755 สำหรับ upload directory

---

## 🐳 Dockerfile Example

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Create uploads directory
RUN mkdir -p /app/uploads/items && \
    chmod -R 755 /app/uploads

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]
```

---

## 📝 Environment Variables

```env
# .env
UPLOAD_PATH=/app/uploads
BASE_URL=https://your-domain.com
MAX_FILE_SIZE=5242880  # 5MB in bytes
```

---

## 🎯 แนะนำสำหรับ Production

**ใช้ External Storage (Option 1)** เพราะ:
- ✅ ไม่ต้องจัดการ volume
- ✅ Scalable
- ✅ Fast delivery ผ่าน CDN
- ✅ Automatic backup
- ✅ ไม่กระทบ container lifecycle

**ตัวอย่าง Services:**
- **AWS S3** + CloudFront
- **DigitalOcean Spaces** + CDN
- **Cloudinary** (มี free tier)
- **ImageKit** (มี free tier)

---

## 📊 ตัวอย่างข้อมูล Medical Supply Items

```json
[
  {
    "number": 1,
    "item_code": "S4214NACISP10",
    "name": "BD POSIFLUSH SP 10ML ( 0.9%NaCl )",
    "uom": "ชิ้น",
    "size": "4*23 cm",
    "department": "Emergency Department",
    "picture_url": "https://cdn.example.com/items/S4214NACISP10.jpg"
  },
  {
    "number": 2,
    "item_code": "S4231TEGA1623",
    "name": "TEGADERM 6*7CM 1623",
    "uom": "Each",
    "size": "9.5*14.5 cm",
    "department": "Emergency Department",
    "picture_url": "https://cdn.example.com/items/S4231TEGA1623.jpg"
  }
]
```

