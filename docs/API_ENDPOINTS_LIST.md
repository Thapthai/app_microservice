# 📋 POSE Microservice - API Endpoints List

**Base URL:** `http://your-server:3000/api`

---

## 📊 สรุปจำนวน Endpoints

| Category | จำนวน Endpoints |
|----------|----------------|
| **Authentication** | 10 |
| **User Management** | 4 |
| **Items** | 5 |
| **Categories** | 8 |
| **Email** | 2 |
| **Total** | **29 Endpoints** |

---

## 🔐 1. Authentication (10 Endpoints)

### **1.1 Register**
- **Method:** `POST`
- **Endpoint:** `/api/auth/register`
- **Auth:** ❌ No
- **Body:**
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string"
  }
  ```

### **1.2 Login**
- **Method:** `POST`
- **Endpoint:** `/api/auth/login`
- **Auth:** ❌ No
- **Body:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```

### **1.3 Get Profile (Token Validation)**
- **Method:** `GET`
- **Endpoint:** `/api/auth/profile`
- **Auth:** ✅ Bearer Token
- **Headers:** `Authorization: Bearer {token}`

### **1.4 Firebase Login**
- **Method:** `POST`
- **Endpoint:** `/api/auth/firebase/login`
- **Auth:** ❌ No
- **Body:**
  ```json
  {
    "idToken": "string"
  }
  ```

### **1.5 Enable 2FA**
- **Method:** `POST`
- **Endpoint:** `/api/auth/2fa/enable`
- **Auth:** ✅ Bearer Token
- **Body:**
  ```json
  {
    "password": "string"
  }
  ```

### **1.6 Verify 2FA Setup**
- **Method:** `POST`
- **Endpoint:** `/api/auth/2fa/verify-setup`
- **Auth:** ✅ Bearer Token
- **Body:**
  ```json
  {
    "secret": "string",
    "token": "string"
  }
  ```

### **1.7 Disable 2FA**
- **Method:** `POST`
- **Endpoint:** `/api/auth/2fa/disable`
- **Auth:** ✅ Bearer Token
- **Body:**
  ```json
  {
    "password": "string",
    "token": "string (optional)"
  }
  ```

### **1.8 Login with 2FA**
- **Method:** `POST`
- **Endpoint:** `/api/auth/login/2fa`
- **Auth:** ❌ No
- **Body:**
  ```json
  {
    "tempToken": "string",
    "code": "string",
    "type": "string (optional)"
  }
  ```

### **1.9 Request Password Reset**
- **Method:** `POST`
- **Endpoint:** `/api/auth/password/reset-request`
- **Auth:** ❌ No
- **Body:**
  ```json
  {
    "email": "string"
  }
  ```

### **1.10 Change Password**
- **Method:** `POST`
- **Endpoint:** `/api/auth/user/change-password`
- **Auth:** ✅ JWT Guard
- **Body:**
  ```json
  {
    "oldPassword": "string",
    "newPassword": "string"
  }
  ```

---

## 👤 2. User Management (4 Endpoints)

### **2.1 Get User Profile**
- **Method:** `GET`
- **Endpoint:** `/api/auth/user/profile`
- **Auth:** ✅ JWT Guard
- **Response:** User profile data

### **2.2 Update User Profile**
- **Method:** `PUT`
- **Endpoint:** `/api/auth/user/profile`
- **Auth:** ✅ JWT Guard
- **Body:**
  ```json
  {
    "name": "string (optional)",
    "email": "string (optional)"
  }
  ```

### **2.3 Change Password**
- **Method:** `POST`
- **Endpoint:** `/api/auth/user/change-password`
- **Auth:** ✅ JWT Guard
- **Body:**
  ```json
  {
    "oldPassword": "string",
    "newPassword": "string"
  }
  ```

### **2.4 Request Password Reset**
- **Method:** `POST`
- **Endpoint:** `/api/auth/password/reset-request`
- **Auth:** ❌ No
- **Body:**
  ```json
  {
    "email": "string"
  }
  ```

---

## 📦 3. Items (5 Endpoints)

### **3.1 Create Item**
- **Method:** `POST`
- **Endpoint:** `/api/items`
- **Auth:** ✅ JWT Guard
- **Body:**
  ```json
  {
    "name": "string",
    "description": "string (optional)",
    "price": "number",
    "quantity": "number",
    "category_id": "number",
    "is_active": "boolean (optional)"
  }
  ```

### **3.2 Get All Items (with Pagination, Search, Sort)**
- **Method:** `GET`
- **Endpoint:** `/api/items`
- **Auth:** ✅ JWT Guard
- **Query Params:**
  - `page` (default: 1)
  - `limit` (default: 10)
  - `keyword` (optional)
  - `sort_by` (optional: name, price, quantity, created_at)
  - `sort_order` (optional: asc, desc)
- **Example:** `/api/items?page=1&limit=10&keyword=item&sort_by=name&sort_order=desc`

### **3.3 Get Item by ID**
- **Method:** `GET`
- **Endpoint:** `/api/items/:id`
- **Auth:** ✅ JWT Guard
- **Example:** `/api/items/1`

### **3.4 Update Item**
- **Method:** `PUT`
- **Endpoint:** `/api/items/:id`
- **Auth:** ✅ JWT Guard
- **Body:**
  ```json
  {
    "name": "string (optional)",
    "description": "string (optional)",
    "price": "number (optional)",
    "quantity": "number (optional)",
    "category_id": "number (optional)",
    "is_active": "boolean (optional)"
  }
  ```

### **3.5 Delete Item**
- **Method:** `DELETE`
- **Endpoint:** `/api/items/:id`
- **Auth:** ✅ JWT Guard
- **Example:** `/api/items/1`

---

## 📂 4. Categories (8 Endpoints)

### **4.1 Create Category**
- **Method:** `POST`
- **Endpoint:** `/api/categories`
- **Auth:** ✅ JWT Guard
- **Body:**
  ```json
  {
    "name": "string",
    "description": "string (optional)",
    "slug": "string (optional)",
    "parent_id": "number (optional)",
    "icon": "string (optional)",
    "color": "string (optional)",
    "is_active": "boolean (optional)"
  }
  ```

### **4.2 Get All Categories (with Pagination)**
- **Method:** `GET`
- **Endpoint:** `/api/categories`
- **Auth:** ✅ JWT Guard
- **Query Params:**
  - `page` (default: 1)
  - `limit` (default: 10)
  - `parentId` (optional)
- **Example:** `/api/categories?page=1&limit=10`

### **4.3 Get Category Tree**
- **Method:** `GET`
- **Endpoint:** `/api/categories/tree`
- **Auth:** ✅ JWT Guard
- **Response:** Hierarchical category tree

### **4.4 Get Category by ID**
- **Method:** `GET`
- **Endpoint:** `/api/categories/:id`
- **Auth:** ✅ JWT Guard
- **Example:** `/api/categories/1`

### **4.5 Get Category by Slug**
- **Method:** `GET`
- **Endpoint:** `/api/categories/slug/:slug`
- **Auth:** ✅ JWT Guard
- **Example:** `/api/categories/slug/electronics`

### **4.6 Update Category**
- **Method:** `PUT`
- **Endpoint:** `/api/categories/:id`
- **Auth:** ✅ JWT Guard
- **Body:**
  ```json
  {
    "name": "string (optional)",
    "description": "string (optional)",
    "slug": "string (optional)",
    "parent_id": "number (optional)",
    "icon": "string (optional)",
    "color": "string (optional)",
    "is_active": "boolean (optional)"
  }
  ```

### **4.7 Delete Category**
- **Method:** `DELETE`
- **Endpoint:** `/api/categories/:id`
- **Auth:** ✅ JWT Guard
- **Example:** `/api/categories/1`

### **4.8 Get Category Children**
- **Method:** `GET`
- **Endpoint:** `/api/categories/:parentId/children`
- **Auth:** ✅ JWT Guard
- **Example:** `/api/categories/1/children`

---

## 📧 5. Email (2 Endpoints)

### **5.1 Test Email Send**
- **Method:** `POST`
- **Endpoint:** `/api/email/test`
- **Auth:** ❌ No
- **Body:**
  ```json
  {
    "email": "string",
    "name": "string (optional)"
  }
  ```

### **5.2 Test Email Connection**
- **Method:** `GET`
- **Endpoint:** `/api/email/connection`
- **Auth:** ❌ No
- **Response:** Email service connection status

---

## 🎯 6. System/Health (2 Endpoints)

### **6.1 API Hello**
- **Method:** `GET`
- **Endpoint:** `/api`
- **Auth:** ❌ No
- **Response:** "Hello from Gateway API!"

### **6.2 Root Hello**
- **Method:** `GET`
- **Endpoint:** `/`
- **Auth:** ❌ No
- **Response:** "Hello from Gateway API!"

---

## 📊 สรุปการจัดกลุ่ม

### **Auth Required (JWT Guard):** 21 Endpoints
- User Management: 4
- Items: 5
- Categories: 8
- 2FA Management: 3
- Profile: 1

### **No Auth Required:** 8 Endpoints
- Register, Login, Firebase Login
- 2FA Login
- Password Reset Request
- Email Testing: 2
- System Hello: 2

---

## 🔑 Authentication

### **Bearer Token Format:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Get Token:**
1. Register: `POST /api/auth/register`
2. Login: `POST /api/auth/login`
3. Response includes: `{ "token": "..." }`

---

## 📝 Response Format

### **Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### **Error Response:**
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

---

## 🚀 Next Steps

1. **Import to Postman** - สร้าง Collection
2. **Add Examples** - เพิ่ม Request/Response ตัวอย่าง
3. **Add Tests** - เพิ่ม Test Scripts
4. **Generate Documentation** - Export เป็น PDF/HTML

---

**Created:** 2025-01-21  
**Version:** 1.0.0  
**Total Endpoints:** 29

