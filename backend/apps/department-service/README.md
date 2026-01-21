# Department Service

Department Service เป็น microservice สำหรับจัดการข้อมูล Department และ mapping ระหว่าง ItemStock กับ Department

## Port
- **3009** (TCP Microservice)

## Features

### Department Management
- สร้าง, อ่าน, อัปเดต, ลบ Department
- รองรับ pagination และ search
- Filter ตาม status (IsCancel)

### ItemStock-Department Mapping
- สร้าง mapping ระหว่าง ItemStock และ Department
- จัดการสถานะของ mapping (ACTIVE/INACTIVE)
- ดึงข้อมูล Departments ที่เชื่อมกับ ItemStock
- ดึงข้อมูล ItemStocks ที่เชื่อมกับ Department

## API Endpoints (via Gateway)

### Department CRUD
```
POST   /departments                    - สร้าง department ใหม่
GET    /departments                    - ดึงรายการ departments
GET    /departments/:id                - ดึง department ตาม ID
PUT    /departments/:id                - อัปเดต department
DELETE /departments/:id                - ลบ department
```

### ItemStockDepartment CRUD
```
POST   /item-stock-departments         - สร้าง mapping
GET    /item-stock-departments         - ดึงรายการ mappings
PUT    /item-stock-departments/:id     - อัปเดต mapping
DELETE /item-stock-departments/:id     - ลบ mapping
```

### Helper Endpoints
```
GET    /item-stocks/:id/departments    - ดึง departments ที่เชื่อมกับ itemStock
GET    /departments/:id/item-stocks    - ดึง itemStocks ที่เชื่อมกับ department
```

## Development

### Start service
```bash
npm run start:department
```

### Build service
```bash
npm run build:department
```

## Docker

### Build image
```bash
docker build -f docker/Dockerfile.department -t backend-department-service:latest .
```

## Kubernetes

### Deploy
```bash
cd k8s/services
./update-department.sh
```

### Check status
```bash
kubectl get pods -n pose-microservices -l app=department-service
kubectl get svc department-service -n pose-microservices
```

## Environment Variables

- `DATABASE_URL` - MySQL database connection string
- `NODE_ENV` - Node environment (development/production)
- `DEPARTMENT_SERVICE_HOST` - Service host (for gateway)
- `DEPARTMENT_SERVICE_PORT` - Service port (default: 3009)
