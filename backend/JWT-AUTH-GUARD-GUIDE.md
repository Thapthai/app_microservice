# คู่มือการใช้งาน JWT Auth Guard

## 📋 ภาพรวม

ระบบได้ใช้ **JWT Auth Guard** แบบ NestJS standard เพื่อป้องกัน Items endpoints ทั้งหมด ผู้ใช้งานต้อง login และส่ง JWT token ใน Authorization header เพื่อเข้าถึงข้อมูล

## 🔐 JWT Auth Guard Implementation

### Guard Structure
```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  canActivate(context: ExecutionContext): Observable<boolean> {
    // 1. ตรวจสอบ Authorization header
    // 2. แยก JWT token
    // 3. ส่งไปยัง Auth Service เพื่อ validate
    // 4. เก็บ user data ใน request object
  }
}
```

### Protected Endpoints
ทุก endpoints ของ items ได้รับการป้องกันด้วย `@UseGuards(JwtAuthGuard)`:

```typescript
@Post('items')
@UseGuards(JwtAuthGuard)
async createItem(@Body() createItemDto: CreateItemDto, @Request() req: any) {
  // req.user มีข้อมูล user จาก JWT token
}

@Get('items')
@UseGuards(JwtAuthGuard)
async findAllItems(@Request() req: any, @Query() params...) {
  // req.user มีข้อมูล user จาก JWT token
}
```

## 🚀 การใช้งาน

### 1. Login เพื่อรับ JWT Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your_password"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "User Name"
    }
  }
}
```

### 2. ใช้ Token เพื่อเข้าถึง Protected Endpoints

```bash
# ดูรายการ items
curl -X GET http://localhost:3000/api/items \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# สร้าง item ใหม่
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "New Product",
    "description": "Product description",
    "price": 99.99,
    "quantity": 10,
    "category": "Electronics"
  }'
```

## 🔍 Guard Validation Process

### 1. Header Validation
```typescript
const authHeader = request.headers.authorization;
if (!authHeader) {
  throw new UnauthorizedException('Authorization header is required');
}

if (!authHeader.startsWith('Bearer ')) {
  throw new UnauthorizedException('Invalid authorization header format');
}
```

### 2. Token Extraction
```typescript
const token = authHeader.substring(7); // Remove 'Bearer ' prefix
```

### 3. Auth Service Validation
```typescript
return this.authClient.send('auth.validate', token).pipe(
  map((result: any) => {
    if (!result.success) {
      throw new UnauthorizedException(result.message || 'Invalid token');
    }
    
    // Attach user data to request
    request.user = result.data;
    return true;
  })
);
```

## 💡 ข้อดีของ JWT Auth Guard

### ✅ NestJS Standard
- ใช้ `@UseGuards()` decorator ตาม NestJS best practices
- Clean และ maintainable code
- Reusable across multiple endpoints

### ✅ Automatic User Data Injection
- User data จาก JWT token ถูกเก็บใน `req.user` อัตโนมัติ
- ไม่ต้อง manual validation ในแต่ละ endpoint

### ✅ Centralized Authentication Logic
- Logic การตรวจสอบ authentication อยู่ที่เดียว
- ง่ายต่อการ maintain และ update

### ✅ Error Handling
- Consistent error responses
- Proper HTTP status codes (401 Unauthorized)

## 🔧 การใช้งาน User Data ใน Controller

```typescript
@Post('items')
@UseGuards(JwtAuthGuard)
async createItem(@Body() createItemDto: CreateItemDto, @Request() req: any) {
  // เข้าถึงข้อมูล user จาก JWT token
  const currentUser = req.user;
  
  // ใช้ user ID สำหรับ business logic
  const userId = currentUser.id;
  const userEmail = currentUser.email;
  
  // สามารถส่ง user data ไปยัง service ได้
  const result = await this.gatewayApiService.createItem(createItemDto, userId);
  return result;
}
```

## ❌ Error Responses

### 1. ไม่มี Authorization Header
```json
{
  "message": "Authorization header is required",
  "statusCode": 401
}
```

### 2. Invalid Header Format
```json
{
  "message": "Invalid authorization header format",
  "statusCode": 401
}
```

### 3. Invalid/Expired Token
```json
{
  "message": "Invalid token",
  "statusCode": 401
}
```

### 4. Token Validation Failed
```json
{
  "message": "Token validation failed",
  "statusCode": 401
}
```

## 🔄 Frontend Integration

### React/JavaScript Example
```javascript
// API service with automatic token handling
class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
    this.token = localStorage.getItem('authToken');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add Authorization header if token exists
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, config);

    // Handle 401 Unauthorized
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
      throw new Error('Authentication required');
    }

    return response.json();
  }

  // Items API methods
  async getItems(page = 1, limit = 10, keyword = '') {
    return this.request(`/items?page=${page}&limit=${limit}&keyword=${keyword}`);
  }

  async createItem(itemData) {
    return this.request('/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async updateItem(id, itemData) {
    return this.request(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  }

  async deleteItem(id) {
    return this.request(`/items/${id}`, {
      method: 'DELETE',
    });
  }
}

// Usage
const api = new ApiService();

// Login and store token
const login = async (email, password) => {
  const response = await api.request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  if (response.success) {
    localStorage.setItem('authToken', response.data.token);
    api.token = response.data.token;
  }
  
  return response;
};

// Use protected endpoints
const loadItems = async () => {
  try {
    const items = await api.getItems();
  } catch (error) {
    console.error('Failed to load items:', error);
  }
};
```

## 🛡️ Security Features

### ✅ Token Validation
- ตรวจสอบ JWT signature และ expiration
- Validate กับ Auth Service แบบ real-time

### ✅ Automatic Error Handling
- Consistent error responses
- Proper HTTP status codes

### ✅ Request Context
- User data ถูกเก็บใน request context
- ปลอดภัยและเข้าถึงได้ง่าย

## 🔧 Customization

### เพิ่ม Role-based Authorization
```typescript
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    return requiredRoles.some(role => user.roles?.includes(role));
  }
}

// Usage
@Post('items')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('admin', 'user')
async createItem(@Body() createItemDto: CreateItemDto) {
  // Only admin or user roles can access
}
```

---

## 📞 Support

หากมีปัญหาเกี่ยวกับ JWT Auth Guard:
1. ตรวจสอบ Authorization header format
2. ตรวจสอบ token expiration
3. ตรวจสอบ Auth Service connectivity
4. ดู console logs สำหรับ detailed errors
