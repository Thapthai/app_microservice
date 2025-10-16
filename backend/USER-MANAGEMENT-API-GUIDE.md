# คู่มือ User Management API

## 📋 ภาพรวม

ระบบได้เพิ่ม endpoints สำหรับจัดการข้อมูลผู้ใช้งาน ได้แก่:
- ดูข้อมูลโปรไฟล์ผู้ใช้งาน
- แก้ไขข้อมูลโปรไฟล์
- เปลี่ยนรหัสผ่าน
- ขอรีเซ็ตรหัสผ่าน

## 🔐 Authentication Required

**ทุก endpoints ต้องมี JWT token** ใน Authorization header ยกเว้น `reset-request`

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📡 API Endpoints

### 1. ดูข้อมูลโปรไฟล์ผู้ใช้งาน

```http
GET /api/auth/user/profile
```

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response สำเร็จ:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "isActive": true,
    "emailVerified": true,
    "preferredAuthMethod": "jwt",
    "twoFactorEnabled": false,
    "lastLoginAt": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. แก้ไขข้อมูลโปรไฟล์

```http
PUT /api/auth/user/profile
```

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "New Name",
  "email": "newemail@example.com",
  "preferredAuthMethod": "jwt",
  "currentPassword": "current_password"
}
```

**Field Descriptions:**
- `name` (optional): ชื่อใหม่
- `email` (optional): อีเมลใหม่
- `preferredAuthMethod` (optional): วิธีการ authentication ที่ต้องการ
- `currentPassword` (required): รหัสผ่านปัจจุบันสำหรับยืนยัน

**Response สำเร็จ:**
```json
{
  "success": true,
  "message": "อัพเดตข้อมูลผู้ใช้งานเรียบร้อยแล้ว",
  "data": {
    "id": 1,
    "email": "newemail@example.com",
    "name": "New Name",
    "preferredAuthMethod": "jwt",
    "emailVerified": false,
    "twoFactorEnabled": false
  }
}
```

### 3. เปลี่ยนรหัสผ่าน

```http
POST /api/auth/user/change-password
```

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "old_password",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Password Requirements:**
- อย่างน้อย 8 ตัวอักษร
- มีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว
- มีตัวพิมพ์เล็กอย่างน้อย 1 ตัว
- มีตัวเลขอย่างน้อย 1 ตัว
- มีอักษรพิเศษอย่างน้อย 1 ตัว

**Response สำเร็จ:**
```json
{
  "success": true,
  "message": "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว"
}
```

### 4. ขอรีเซ็ตรหัสผ่าน

```http
POST /api/auth/password/reset-request
```

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "หากอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้"
}
```

## 🚀 การใช้งานด้วย JavaScript/React

### API Service Class

```javascript
class UserManagementAPI {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
    this.token = localStorage.getItem('authToken');
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
    };
  }

  // ดูข้อมูลโปรไฟล์
  async getUserProfile() {
    const response = await fetch(`${this.baseURL}/auth/user/profile`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (response.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
      throw new Error('Authentication required');
    }

    return response.json();
  }

  // แก้ไขโปรไฟล์
  async updateProfile(profileData) {
    const response = await fetch(`${this.baseURL}/auth/user/profile`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(profileData),
    });

    return response.json();
  }

  // เปลี่ยนรหัสผ่าน
  async changePassword(passwordData) {
    const response = await fetch(`${this.baseURL}/auth/user/change-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(passwordData),
    });

    return response.json();
  }

  // ขอรีเซ็ตรหัสผ่าน
  async requestPasswordReset(email) {
    const response = await fetch(`${this.baseURL}/auth/password/reset-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    return response.json();
  }
}

// การใช้งาน
const userAPI = new UserManagementAPI();

// ดูโปรไฟล์
const loadProfile = async () => {
  try {
    const profile = await userAPI.getUserProfile();
 
  } catch (error) {
    console.error('Failed to load profile:', error);
  }
};

// แก้ไขโปรไฟล์
const updateProfile = async () => {
  try {
    const result = await userAPI.updateProfile({
      name: 'New Name',
      email: 'newemail@example.com',
      currentPassword: 'current_password'
    });
    
    if (result.success) {
      alert('อัพเดตโปรไฟล์เรียบร้อย');
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error('Failed to update profile:', error);
  }
};

// เปลี่ยนรหัสผ่าน
const changePassword = async () => {
  try {
    const result = await userAPI.changePassword({
      currentPassword: 'old_password',
      newPassword: 'NewPassword123!',
      confirmPassword: 'NewPassword123!'
    });
    
    if (result.success) {
      alert('เปลี่ยนรหัสผ่านเรียบร้อย');
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error('Failed to change password:', error);
  }
};
```

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: ''
  });

  const userAPI = new UserManagementAPI();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const result = await userAPI.getUserProfile();
      if (result.success) {
        setProfile(result.data);
        setFormData({
          name: result.data.name,
          email: result.data.email,
          currentPassword: ''
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      const result = await userAPI.updateProfile(formData);
      
      if (result.success) {
        setProfile(result.data);
        setIsEditing(false);
        alert('อัพเดตโปรไฟล์เรียบร้อย');
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="user-profile">
      <h2>ข้อมูลผู้ใช้งาน</h2>
      
      {!isEditing ? (
        <div>
          <p><strong>ชื่อ:</strong> {profile.name}</p>
          <p><strong>อีเมล:</strong> {profile.email}</p>
          <p><strong>สถานะ:</strong> {profile.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}</p>
          <p><strong>ยืนยันอีเมล:</strong> {profile.emailVerified ? 'แล้ว' : 'ยังไม่ได้'}</p>
          <p><strong>2FA:</strong> {profile.twoFactorEnabled ? 'เปิด' : 'ปิด'}</p>
          
          <button onClick={() => setIsEditing(true)}>
            แก้ไขข้อมูล
          </button>
        </div>
      ) : (
        <form onSubmit={handleUpdateProfile}>
          <div>
            <label>ชื่อ:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div>
            <label>อีเมล:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          
          <div>
            <label>รหัสผ่านปัจจุบัน (สำหรับยืนยัน):</label>
            <input
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
              required
            />
          </div>
          
          <button type="submit">บันทึก</button>
          <button type="button" onClick={() => setIsEditing(false)}>
            ยกเลิก
          </button>
        </form>
      )}
    </div>
  );
};

export default UserProfile;
```

## ❌ Error Responses

### 1. ไม่มี Authorization Header
```json
{
  "message": "Authorization header is required",
  "statusCode": 401
}
```

### 2. รหัสผ่านปัจจุบันไม่ถูกต้อง
```json
{
  "success": false,
  "message": "รหัสผ่านปัจจุบันไม่ถูกต้อง"
}
```

### 3. รหัสผ่านใหม่ไม่ตรงตามเงื่อนไข
```json
{
  "success": false,
  "message": "รหัสผ่านใหม่ต้องมีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักษรพิเศษ"
}
```

### 4. อีเมลซ้ำ
```json
{
  "success": false,
  "message": "อีเมลนี้ถูกใช้งานแล้ว"
}
```

### 5. รหัสผ่านใหม่เหมือนเดิม
```json
{
  "success": false,
  "message": "รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านปัจจุบัน"
}
```

## 🔒 Security Features

### ✅ Password Validation
- ตรวจสอบรหัสผ่านปัจจุบันก่อนทำการเปลี่ยนแปลง
- รหัสผ่านใหม่ต้องตรงตามเงื่อนไขความปลอดภัย
- ตรวจสอบว่ารหัสผ่านใหม่ไม่เหมือนเดิม

### ✅ Email Verification
- เมื่อเปลี่ยนอีเมลจะต้องยืนยันใหม่
- ตรวจสอบอีเมลซ้ำในระบบ

### ✅ Authentication Required
- ทุก endpoints ต้องมี valid JWT token
- ใช้ user ID จาก token เพื่อความปลอดภัย

### ✅ OAuth User Protection
- ผู้ใช้ OAuth ไม่สามารถเปลี่ยนรหัสผ่านได้
- ป้องกันการเปลี่ยนแปลงข้อมูลที่ไม่เหมาะสม

## 🛠️ Validation Rules

### Password Requirements:
```regex
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).+$/
```
- อย่างน้อย 8 ตัวอักษร
- มีตัวพิมพ์เล็ก (a-z)
- มีตัวพิมพ์ใหญ่ (A-Z)  
- มีตัวเลข (0-9)
- มีอักษรพิเศษ (!@#$%^&* เป็นต้น)

### Email Format:
- ต้องเป็น email format ที่ถูกต้อง
- ตรวจสอบด้วย `@IsEmail()` validator

## 📞 Support

หากมีปัญหาเกี่ยวกับ User Management API:

1. **401 Unauthorized** - ตรวจสอบ JWT token
2. **Password Issues** - ตรวจสอบ password requirements
3. **Email Issues** - ตรวจสอบ email format และการซ้ำ
4. **Network Issues** - ตรวจสอบ connectivity ระหว่าง services

---

## 📋 Summary

ระบบ User Management API ให้ความสามารถในการ:
- ✅ ดูข้อมูลโปรไฟล์แบบปลอดภัย
- ✅ แก้ไขข้อมูลส่วนตัวพร้อมการยืนยัน
- ✅ เปลี่ยนรหัสผ่านแบบปลอดภัย
- ✅ ขอรีเซ็ตรหัสผ่านผ่านอีเมล
- ✅ ป้องกันการเข้าถึงโดยไม่ได้รับอนุญาต
