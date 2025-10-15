# 🧪 API Testing Scenarios

## 📋 Table of Contents
1. [Test Environment Setup](#test-environment-setup)
2. [Authentication Tests](#authentication-tests)
3. [User Management Tests](#user-management-tests)
4. [Items Management Tests](#items-management-tests)
5. [Categories Management Tests](#categories-management-tests)
6. [Email Service Tests](#email-service-tests)
7. [Security Tests](#security-tests)
8. [Performance Tests](#performance-tests)
9. [Error Handling Tests](#error-handling-tests)

---

## Test Environment Setup

### Base URL
```
Production: http://10.11.9.84:3000/api
Local: http://localhost:3000/api
```

### Tools Needed
- **Postman** (แนะนำ)
- **cURL** (command line)
- **Insomnia**
- **Thunder Client** (VS Code Extension)

### Global Variables
```javascript
GATEWAY_URL = http://10.11.9.84:3000/api
ACCESS_TOKEN = <will be set after login>
USER_ID = <will be set after registration>
ITEM_ID = <will be set after creating item>
CATEGORY_ID = <will be set after creating category>
```

---

## 🔐 Authentication Tests

### TC-AUTH-001: User Registration (Success)
**Description:** ทดสอบการสมัครสมาชิกใหม่

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "tester@example.com",
  "password": "Test1234!",
  "name": "Test User"
}
```

**Expected Response (201):**
```json
{
  "user": {
    "id": 1,
    "email": "tester@example.com",
    "name": "Test User"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Test Steps:**
```bash
curl -X POST http://10.11.9.84:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tester@example.com",
    "password": "Test1234!",
    "name": "Test User"
  }'
```

**Assertions:**
- ✅ Status Code = 201
- ✅ Response contains `user` object
- ✅ Response contains `access_token`
- ✅ `user.email` = "tester@example.com"
- ✅ `access_token` is a valid JWT

---

### TC-AUTH-002: User Registration (Duplicate Email)
**Description:** ทดสอบการสมัครด้วยอีเมลที่มีอยู่แล้ว

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "tester@example.com",
  "password": "Test1234!",
  "name": "Another User"
}
```

**Expected Response (400/409):**
```json
{
  "statusCode": 400,
  "message": "Email already exists",
  "error": "Bad Request"
}
```

**Assertions:**
- ✅ Status Code = 400 or 409
- ✅ Error message indicates duplicate email

---

### TC-AUTH-003: User Registration (Invalid Email)
**Description:** ทดสอบการสมัครด้วยอีเมลที่ไม่ถูกต้อง

**Test Cases:**
```bash
# Test 1: Invalid email format
curl -X POST http://10.11.9.84:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "Test1234!",
    "name": "Test User"
  }'

# Test 2: Empty email
curl -X POST http://10.11.9.84:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "",
    "password": "Test1234!",
    "name": "Test User"
  }'
```

**Expected Response (400):**
```json
{
  "statusCode": 400,
  "message": ["email must be a valid email"],
  "error": "Bad Request"
}
```

**Assertions:**
- ✅ Status Code = 400
- ✅ Error message indicates invalid email

---

### TC-AUTH-004: User Registration (Weak Password)
**Description:** ทดสอบการสมัครด้วยรหัสผ่านที่ไม่ปลอดภัย

**Test Cases:**
```bash
# Test 1: Too short password
curl -X POST http://10.11.9.84:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@example.com",
    "password": "123",
    "name": "Test User"
  }'

# Test 2: No special characters
curl -X POST http://10.11.9.84:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "Test1234",
    "name": "Test User"
  }'
```

**Expected Response (400):**
```json
{
  "statusCode": 400,
  "message": [
    "password must be at least 8 characters",
    "password must contain uppercase, lowercase, number and special character"
  ],
  "error": "Bad Request"
}
```

---

### TC-AUTH-005: User Login (Success)
**Description:** ทดสอบการเข้าสู่ระบบ

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "tester@example.com",
  "password": "Test1234!"
}
```

**Expected Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "tester@example.com",
    "name": "Test User"
  }
}
```

**Test Steps:**
```bash
curl -X POST http://10.11.9.84:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tester@example.com",
    "password": "Test1234!"
  }'
```

**Assertions:**
- ✅ Status Code = 200
- ✅ Response contains `access_token`
- ✅ Response contains `user` object
- ✅ Save `access_token` for future requests

---

### TC-AUTH-006: User Login (Invalid Credentials)
**Description:** ทดสอบการเข้าสู่ระบบด้วยข้อมูลผิด

**Test Cases:**
```bash
# Test 1: Wrong password
curl -X POST http://10.11.9.84:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tester@example.com",
    "password": "WrongPassword123!"
  }'

# Test 2: Non-existent email
curl -X POST http://10.11.9.84:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "notexist@example.com",
    "password": "Test1234!"
  }'
```

**Expected Response (401):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

---

### TC-AUTH-007: Get Current User Profile
**Description:** ทดสอบการดึงข้อมูลผู้ใช้ปัจจุบัน

**Endpoint:** `GET /auth/profile`

**Headers:**
```
Authorization: Bearer <ACCESS_TOKEN>
```

**Test Steps:**
```bash
TOKEN="<YOUR_TOKEN_HERE>"

curl -X GET http://10.11.9.84:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
```json
{
  "id": 1,
  "email": "tester@example.com",
  "name": "Test User",
  "createdAt": "2025-10-15T00:00:00.000Z"
}
```

**Assertions:**
- ✅ Status Code = 200
- ✅ Response contains user data
- ✅ Password is NOT included

---

### TC-AUTH-008: Access Protected Route Without Token
**Description:** ทดสอบการเข้าถึง endpoint ที่ต้อง login โดยไม่ส่ง token

**Endpoint:** `GET /auth/profile`

**Test Steps:**
```bash
curl -X GET http://10.11.9.84:3000/api/auth/profile
```

**Expected Response (401):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

### TC-AUTH-009: Access Protected Route With Invalid Token
**Description:** ทดสอบการใช้ token ที่ไม่ถูกต้อง

**Test Steps:**
```bash
curl -X GET http://10.11.9.84:3000/api/auth/profile \
  -H "Authorization: Bearer invalid_token_here"
```

**Expected Response (401):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## 📦 Items Management Tests

### TC-ITEM-001: Get All Items (No Auth Required)
**Description:** ทดสอบการดึงรายการสินค้าทั้งหมด

**Endpoint:** `GET /items`

**Test Steps:**
```bash
curl -X GET http://10.11.9.84:3000/api/items
```

**Expected Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Sample Item",
      "description": "Description here",
      "price": 100,
      "createdAt": "2025-10-15T00:00:00.000Z",
      "updatedAt": "2025-10-15T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

**Assertions:**
- ✅ Status Code = 200
- ✅ Response contains `data` array
- ✅ Response contains pagination info

---

### TC-ITEM-002: Get Items With Pagination
**Description:** ทดสอบการดึงข้อมูลแบบแบ่งหน้า

**Test Cases:**
```bash
# Test 1: First page, 5 items
curl -X GET "http://10.11.9.84:3000/api/items?page=1&limit=5"

# Test 2: Second page
curl -X GET "http://10.11.9.84:3000/api/items?page=2&limit=5"

# Test 3: Large limit
curl -X GET "http://10.11.9.84:3000/api/items?page=1&limit=100"
```

**Assertions:**
- ✅ Status Code = 200
- ✅ Correct number of items returned
- ✅ Pagination metadata is correct

---

### TC-ITEM-003: Get Single Item (Success)
**Description:** ทดสอบการดึงข้อมูลสินค้าตาม ID

**Endpoint:** `GET /items/:id`

**Test Steps:**
```bash
curl -X GET http://10.11.9.84:3000/api/items/1
```

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Sample Item",
  "description": "Description here",
  "price": 100,
  "createdAt": "2025-10-15T00:00:00.000Z",
  "updatedAt": "2025-10-15T00:00:00.000Z"
}
```

---

### TC-ITEM-004: Get Single Item (Not Found)
**Description:** ทดสอบการดึงข้อมูลสินค้าที่ไม่มีอยู่

**Test Steps:**
```bash
curl -X GET http://10.11.9.84:3000/api/items/99999
```

**Expected Response (404):**
```json
{
  "statusCode": 404,
  "message": "Item not found",
  "error": "Not Found"
}
```

---

### TC-ITEM-005: Create Item (Success)
**Description:** ทดสอบการสร้างสินค้าใหม่

**Endpoint:** `POST /items`

**Headers:**
```
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "New Test Item",
  "description": "This is a test item",
  "price": 150.50
}
```

**Test Steps:**
```bash
TOKEN="<YOUR_TOKEN_HERE>"

curl -X POST http://10.11.9.84:3000/api/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Test Item",
    "description": "This is a test item",
    "price": 150.50
  }'
```

**Expected Response (201):**
```json
{
  "id": 2,
  "name": "New Test Item",
  "description": "This is a test item",
  "price": 150.50,
  "createdAt": "2025-10-15T00:00:00.000Z",
  "updatedAt": "2025-10-15T00:00:00.000Z"
}
```

**Assertions:**
- ✅ Status Code = 201
- ✅ Response contains new item with ID
- ✅ Save `id` for future tests

---

### TC-ITEM-006: Create Item (Invalid Data)
**Description:** ทดสอบการสร้างสินค้าด้วยข้อมูลไม่ถูกต้อง

**Test Cases:**
```bash
TOKEN="<YOUR_TOKEN_HERE>"

# Test 1: Missing required field (name)
curl -X POST http://10.11.9.84:3000/api/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "No name provided",
    "price": 100
  }'

# Test 2: Invalid price (negative)
curl -X POST http://10.11.9.84:3000/api/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Item",
    "description": "Negative price",
    "price": -50
  }'

# Test 3: Invalid price (not a number)
curl -X POST http://10.11.9.84:3000/api/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Item",
    "description": "Invalid price",
    "price": "invalid"
  }'
```

**Expected Response (400):**
```json
{
  "statusCode": 400,
  "message": [
    "name should not be empty",
    "price must be a positive number"
  ],
  "error": "Bad Request"
}
```

---

### TC-ITEM-007: Create Item (Without Authentication)
**Description:** ทดสอบการสร้างสินค้าโดยไม่ login

**Test Steps:**
```bash
curl -X POST http://10.11.9.84:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Unauthorized Item",
    "description": "Should fail",
    "price": 100
  }'
```

**Expected Response (401):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

### TC-ITEM-008: Update Item (Success)
**Description:** ทดสอบการแก้ไขข้อมูลสินค้า

**Endpoint:** `PATCH /items/:id`

**Headers:**
```
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Item Name",
  "price": 200
}
```

**Test Steps:**
```bash
TOKEN="<YOUR_TOKEN_HERE>"
ITEM_ID=2

curl -X PATCH http://10.11.9.84:3000/api/items/$ITEM_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Item Name",
    "price": 200
  }'
```

**Expected Response (200):**
```json
{
  "id": 2,
  "name": "Updated Item Name",
  "description": "This is a test item",
  "price": 200,
  "createdAt": "2025-10-15T00:00:00.000Z",
  "updatedAt": "2025-10-15T01:00:00.000Z"
}
```

**Assertions:**
- ✅ Status Code = 200
- ✅ Fields are updated correctly
- ✅ `updatedAt` is changed

---

### TC-ITEM-009: Update Item (Partial Update)
**Description:** ทดสอบการแก้ไขบางส่วน

**Test Steps:**
```bash
TOKEN="<YOUR_TOKEN_HERE>"
ITEM_ID=2

# Update only price
curl -X PATCH http://10.11.9.84:3000/api/items/$ITEM_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 250
  }'
```

**Expected Response (200):**
```json
{
  "id": 2,
  "name": "Updated Item Name",
  "description": "This is a test item",
  "price": 250,
  "createdAt": "2025-10-15T00:00:00.000Z",
  "updatedAt": "2025-10-15T01:30:00.000Z"
}
```

**Assertions:**
- ✅ Only specified field is updated
- ✅ Other fields remain unchanged

---

### TC-ITEM-010: Delete Item (Success)
**Description:** ทดสอบการลบสินค้า

**Endpoint:** `DELETE /items/:id`

**Headers:**
```
Authorization: Bearer <ACCESS_TOKEN>
```

**Test Steps:**
```bash
TOKEN="<YOUR_TOKEN_HERE>"
ITEM_ID=2

curl -X DELETE http://10.11.9.84:3000/api/items/$ITEM_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200/204):**
```json
{
  "message": "Item deleted successfully"
}
```

**Assertions:**
- ✅ Status Code = 200 or 204
- ✅ Item is deleted from database
- ✅ GET request to same ID returns 404

---

### TC-ITEM-011: Delete Item (Not Found)
**Description:** ทดสอบการลบสินค้าที่ไม่มีอยู่

**Test Steps:**
```bash
TOKEN="<YOUR_TOKEN_HERE>"

curl -X DELETE http://10.11.9.84:3000/api/items/99999 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (404):**
```json
{
  "statusCode": 404,
  "message": "Item not found",
  "error": "Not Found"
}
```

---

### TC-ITEM-012: Delete Item (Without Authentication)
**Description:** ทดสอบการลบสินค้าโดยไม่ login

**Test Steps:**
```bash
curl -X DELETE http://10.11.9.84:3000/api/items/1
```

**Expected Response (401):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## 📁 Categories Management Tests

### TC-CAT-001: Get All Categories
**Description:** ทดสอบการดึงหมวดหมู่ทั้งหมด

**Endpoint:** `GET /categories`

**Test Steps:**
```bash
curl -X GET http://10.11.9.84:3000/api/categories
```

**Expected Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Electronics",
      "description": "Electronic items"
    }
  ],
  "total": 1
}
```

---

### TC-CAT-002: Create Category (Success)
**Description:** ทดสอบการสร้างหมวดหมู่ใหม่

**Endpoint:** `POST /categories`

**Headers:**
```
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Books",
  "description": "Books and magazines"
}
```

**Test Steps:**
```bash
TOKEN="<YOUR_TOKEN_HERE>"

curl -X POST http://10.11.9.84:3000/api/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Books",
    "description": "Books and magazines"
  }'
```

**Expected Response (201):**
```json
{
  "id": 2,
  "name": "Books",
  "description": "Books and magazines",
  "createdAt": "2025-10-15T00:00:00.000Z"
}
```

---

### TC-CAT-003: Create Category (Duplicate Name)
**Description:** ทดสอบการสร้างหมวดหมู่ที่มีชื่อซ้ำ

**Test Steps:**
```bash
TOKEN="<YOUR_TOKEN_HERE>"

curl -X POST http://10.11.9.84:3000/api/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Books",
    "description": "Duplicate category"
  }'
```

**Expected Response (400/409):**
```json
{
  "statusCode": 400,
  "message": "Category name already exists",
  "error": "Bad Request"
}
```

---

### TC-CAT-004: Update Category (Success)
**Description:** ทดสอบการแก้ไขหมวดหมู่

**Endpoint:** `PATCH /categories/:id`

**Test Steps:**
```bash
TOKEN="<YOUR_TOKEN_HERE>"
CATEGORY_ID=2

curl -X PATCH http://10.11.9.84:3000/api/categories/$CATEGORY_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Books & Magazines",
    "description": "Updated description"
  }'
```

**Expected Response (200):**
```json
{
  "id": 2,
  "name": "Books & Magazines",
  "description": "Updated description",
  "updatedAt": "2025-10-15T01:00:00.000Z"
}
```

---

### TC-CAT-005: Delete Category (Success)
**Description:** ทดสอบการลบหมวดหมู่

**Endpoint:** `DELETE /categories/:id`

**Test Steps:**
```bash
TOKEN="<YOUR_TOKEN_HERE>"
CATEGORY_ID=2

curl -X DELETE http://10.11.9.84:3000/api/categories/$CATEGORY_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200/204):**
```json
{
  "message": "Category deleted successfully"
}
```

---

## 📧 Email Service Tests

### TC-EMAIL-001: Send Welcome Email
**Description:** ทดสอบการส่งอีเมลต้อนรับ (Internal service, test via registration)

**Note:** Email service จะถูกเรียกอัตโนมัติเมื่อมีการสมัครสมาชิก

**Test Steps:**
1. สมัครสมาชิกใหม่
2. เช็คว่า email service ทำงาน:

```bash
# Check email service logs
kubectl logs -n pose-microservices -l app=email-service --tail=50
```

**Expected Logs:**
```
[EmailService] Sending welcome email to: tester@example.com
[EmailService] Email sent successfully
```

---

## 🔒 Security Tests

### TC-SEC-001: SQL Injection Test
**Description:** ทดสอบการป้องกัน SQL Injection

**Test Cases:**
```bash
# Test 1: SQL injection in login
curl -X POST http://10.11.9.84:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com OR 1=1--",
    "password": "anything"
  }'

# Test 2: SQL injection in item search
curl -X GET "http://10.11.9.84:3000/api/items?search=test' OR '1'='1"
```

**Expected Response:**
- ✅ Should NOT expose database errors
- ✅ Should return 400/401 with safe error message

---

### TC-SEC-002: XSS (Cross-Site Scripting) Test
**Description:** ทดสอบการป้องกัน XSS

**Test Cases:**
```bash
TOKEN="<YOUR_TOKEN_HERE>"

# Test: Create item with XSS payload
curl -X POST http://10.11.9.84:3000/api/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<script>alert(\"XSS\")</script>",
    "description": "<img src=x onerror=alert(\"XSS\")>",
    "price": 100
  }'
```

**Expected Behavior:**
- ✅ Script tags should be escaped/sanitized
- ✅ When retrieved, data should be safe

---

### TC-SEC-003: Rate Limiting Test
**Description:** ทดสอบการจำกัดอัตราการเรียก API

**Test Steps:**
```bash
# Send 100 requests quickly
for i in {1..100}; do
  curl -X GET http://10.11.9.84:3000/api/items &
done
wait
```

**Expected Behavior:**
- ✅ After certain threshold, should return 429 (Too Many Requests)
- ✅ Response includes retry-after header

---

### TC-SEC-004: CORS Test
**Description:** ทดสอบการตั้งค่า CORS

**Test Steps:**
```bash
# Test from different origin
curl -X GET http://10.11.9.84:3000/api/items \
  -H "Origin: http://malicious-site.com" \
  -v
```

**Expected Headers:**
```
Access-Control-Allow-Origin: <configured-origins>
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH
```

---

### TC-SEC-005: JWT Token Expiration Test
**Description:** ทดสอบการหมดอายุของ token

**Test Steps:**
1. Login และเก็บ token
2. รอให้ token หมดอายุ (ตามที่ตั้งค่าไว้)
3. ใช้ token ที่หมดอายุเรียก API

```bash
EXPIRED_TOKEN="<OLD_TOKEN>"

curl -X GET http://10.11.9.84:3000/api/auth/profile \
  -H "Authorization: Bearer $EXPIRED_TOKEN"
```

**Expected Response (401):**
```json
{
  "statusCode": 401,
  "message": "Token expired"
}
```

---

## ⚡ Performance Tests

### TC-PERF-001: Response Time Test
**Description:** ทดสอบเวลาตอบสนอง

**Test Steps:**
```bash
# Measure response time
time curl -X GET http://10.11.9.84:3000/api/items -o /dev/null -s
```

**Expected:**
- ✅ Response time < 200ms (for simple queries)
- ✅ Response time < 500ms (for complex queries)

---

### TC-PERF-002: Concurrent Users Test
**Description:** ทดสอบการทำงานกับผู้ใช้หลายคนพร้อมกัน

**Test Steps:**
```bash
# 50 concurrent requests
for i in {1..50}; do
  curl -X GET http://10.11.9.84:3000/api/items &
done
wait
```

**Expected:**
- ✅ All requests should succeed
- ✅ No timeout errors
- ✅ Response time should remain acceptable

---

### TC-PERF-003: Large Payload Test
**Description:** ทดสอบการส่งข้อมูลขนาดใหญ่

**Test Steps:**
```bash
TOKEN="<YOUR_TOKEN_HERE>"

# Create item with large description
curl -X POST http://10.11.9.84:3000/api/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Large Item",
    "description": "'$(python3 -c 'print("A" * 10000)')'",
    "price": 100
  }'
```

**Expected:**
- ✅ Should handle up to reasonable size limit
- ✅ Should return 413 (Payload Too Large) if exceeds limit

---

## 🔥 Error Handling Tests

### TC-ERR-001: Invalid JSON Format
**Description:** ทดสอบการจัดการ JSON ที่ไม่ถูกต้อง

**Test Steps:**
```bash
curl -X POST http://10.11.9.84:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d 'invalid json here'
```

**Expected Response (400):**
```json
{
  "statusCode": 400,
  "message": "Invalid JSON format",
  "error": "Bad Request"
}
```

---

### TC-ERR-002: Missing Content-Type Header
**Description:** ทดสอบการส่งข้อมูลโดยไม่ระบุ Content-Type

**Test Steps:**
```bash
curl -X POST http://10.11.9.84:3000/api/auth/login \
  -d '{"email":"test@example.com","password":"Test1234!"}'
```

**Expected:**
- ✅ Should handle gracefully
- ✅ May return 400 or accept as form data

---

### TC-ERR-003: Method Not Allowed
**Description:** ทดสอบการใช้ HTTP method ที่ไม่รองรับ

**Test Steps:**
```bash
# Try DELETE on login endpoint
curl -X DELETE http://10.11.9.84:3000/api/auth/login
```

**Expected Response (405):**
```json
{
  "statusCode": 405,
  "message": "Method Not Allowed"
}
```

---

### TC-ERR-004: Not Found Route
**Description:** ทดสอบการเรียก endpoint ที่ไม่มีอยู่

**Test Steps:**
```bash
curl -X GET http://10.11.9.84:3000/api/nonexistent
```

**Expected Response (404):**
```json
{
  "statusCode": 404,
  "message": "Cannot GET /api/nonexistent",
  "error": "Not Found"
}
```

---

## 📊 Test Execution Plan

### Phase 1: Smoke Tests (15 minutes)
- [ ] TC-AUTH-001: Register
- [ ] TC-AUTH-005: Login
- [ ] TC-AUTH-007: Get Profile
- [ ] TC-ITEM-001: Get Items
- [ ] TC-ITEM-005: Create Item

### Phase 2: Functional Tests (1 hour)
- [ ] All Authentication Tests (TC-AUTH-001 to TC-AUTH-009)
- [ ] All Items Tests (TC-ITEM-001 to TC-ITEM-012)
- [ ] All Categories Tests (TC-CAT-001 to TC-CAT-005)

### Phase 3: Security Tests (30 minutes)
- [ ] All Security Tests (TC-SEC-001 to TC-SEC-005)

### Phase 4: Performance Tests (30 minutes)
- [ ] All Performance Tests (TC-PERF-001 to TC-PERF-003)

### Phase 5: Error Handling Tests (30 minutes)
- [ ] All Error Handling Tests (TC-ERR-001 to TC-ERR-004)

---

## 📝 Postman Collection Setup

### Import This Collection

1. สร้าง Environment:
```json
{
  "name": "POSE Production",
  "values": [
    {
      "key": "base_url",
      "value": "http://10.11.9.84:3000/api",
      "enabled": true
    },
    {
      "key": "access_token",
      "value": "",
      "enabled": true
    },
    {
      "key": "user_id",
      "value": "",
      "enabled": true
    },
    {
      "key": "item_id",
      "value": "",
      "enabled": true
    }
  ]
}
```

2. สร้าง Pre-request Script (Global):
```javascript
// Auto set token from login response
pm.sendRequest({
    url: pm.environment.get("base_url") + "/auth/login",
    method: 'POST',
    header: {
        'Content-Type': 'application/json'
    },
    body: {
        mode: 'raw',
        raw: JSON.stringify({
            email: "tester@example.com",
            password: "Test1234!"
        })
    }
}, function (err, res) {
    if (res && res.json().access_token) {
        pm.environment.set("access_token", res.json().access_token);
    }
});
```

3. สร้าง Tests (Global):
```javascript
// Auto save IDs from responses
if (pm.response.json().id) {
    pm.environment.set("item_id", pm.response.json().id);
}

if (pm.response.json().user && pm.response.json().user.id) {
    pm.environment.set("user_id", pm.response.json().user.id);
}

if (pm.response.json().access_token) {
    pm.environment.set("access_token", pm.response.json().access_token);
}

// Check response time
pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

// Check status code
pm.test("Status code is success", function () {
    pm.response.to.have.status(200 || 201);
});
```

---

## 📈 Expected Results Summary

### Success Criteria
- ✅ All authentication flows work correctly
- ✅ CRUD operations work as expected
- ✅ Authorization is properly enforced
- ✅ Input validation works correctly
- ✅ Error responses are consistent and informative
- ✅ Response times are acceptable (< 500ms)
- ✅ Security measures are in place (no SQL injection, XSS)
- ✅ System handles concurrent requests properly

### Metrics to Monitor During Testing
```promql
# Total requests
sum(rate(http_requests_total[5m])) by (service)

# Error rate
rate(http_requests_total{status_code=~"5.."}[5m])

# Response time
histogram_quantile(0.95, rate(http_request_duration_bucket[5m]))

# Active users
count(http_requests_total{route="/auth/login"}) by (service)
```

---

## 🐛 Bug Report Template

```markdown
**Bug ID:** BUG-XXX
**Title:** [Brief description]

**Environment:**
- Base URL: http://10.11.9.84:3000/api
- Date: 2025-10-15
- Tester: [Name]

**Test Case:** TC-XXX-XXX

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected Result:**
...

**Actual Result:**
...

**Request:**
```bash
curl ...
```

**Response:**
```json
{...}
```

**Severity:** Critical / High / Medium / Low

**Screenshots/Logs:**
[Attach if applicable]
```

---

## ✅ Testing Checklist

### Before Testing
- [ ] Server is running
- [ ] Database is accessible
- [ ] All services are healthy (`kubectl get pods`)
- [ ] Monitoring is active (Prometheus/Grafana)

### During Testing
- [ ] Document all test results
- [ ] Save response examples
- [ ] Monitor system metrics
- [ ] Check application logs for errors

### After Testing
- [ ] Generate test report
- [ ] File bug reports
- [ ] Update documentation
- [ ] Share results with team

---

**Happy Testing! 🧪**

