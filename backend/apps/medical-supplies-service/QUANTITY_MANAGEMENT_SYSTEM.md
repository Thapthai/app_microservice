# ระบบจัดการจำนวนอุปกรณ์การแพทย์ (Medical Supply Quantity Management System)

## 📋 ภาพรวม

ระบบนี้ออกแบบมาเพื่อแยกการจัดการอุปกรณ์การแพทย์ออกเป็น 2 ประเภท:
1. **อุปกรณ์ที่ใช้กับคนไข้** (Used with Patient)
2. **อุปกรณ์ที่คืนเข้าตู้** (Returned to Cabinet)

โดยมีการ **compare** และ **validate** จำนวนอุปกรณ์ให้ตรงกัน:
```
qty (เบิก) = qty_used_with_patient (ใช้กับคนไข้) + qty_returned_to_cabinet (คืนเข้าตู้) + qty_pending (รอดำเนินการ)
```

---

## 🗄️ โครงสร้างฐานข้อมูล

### 1. SupplyUsageItem (ตารางหลัก)

| ฟิลด์ | ประเภท | คำอธิบาย |
|------|--------|----------|
| `qty` | Int | จำนวนที่เบิกทั้งหมด |
| `qty_used_with_patient` | Int | จำนวนที่ใช้กับคนไข้ (default: 0) |
| `qty_returned_to_cabinet` | Int | จำนวนที่คืนเข้าตู้แล้ว (default: 0) |
| `item_status` | String | สถานะ: PENDING, PARTIAL, COMPLETED |

**สถานะ (item_status):**
- `PENDING` - ยังไม่ได้ดำเนินการ (qty_pending = qty)
- `PARTIAL` - ดำเนินการบางส่วน (0 < qty_pending < qty)
- `COMPLETED` - ดำเนินการครบแล้ว (qty_pending = 0)

### 2. SupplyItemReturnRecord (ตารางบันทึกการคืน)

| ฟิลด์ | ประเภท | คำอธิบาย |
|------|--------|----------|
| `supply_usage_item_id` | Int | อ้างอิงไปยัง SupplyUsageItem |
| `qty_returned` | Int | จำนวนที่คืนในครั้งนี้ |
| `return_reason` | String | สาเหตุ |
| `return_datetime` | DateTime | วันที่-เวลาที่คืน |
| `return_by_user_id` | String | ผู้ทำการคืน |
| `return_note` | String? | หมายเหตุเพิ่มเติม |

**สาเหตุ (return_reason):**
- `UNWRAPPED_UNUSED` - แกะห่อแล้วไม่ได้ใช้
- `EXPIRED` - อุปกรณ์หมดอายุ
- `CONTAMINATED` - อุปกรณ์มีการปนเปื้อนไม่สามารถนำกลับมาใช้งานได้
- `DAMAGED` - อุปกรณ์มีการชำรุดไม่สามารถนำมาใช้งานได้

---

## 🔧 API Endpoints

### 1. บันทึกการใช้อุปกรณ์กับคนไข้

**Command:** `medical_supply_item.recordUsedWithPatient`

**Request:**
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
    "item_status": "PARTIAL"
  }
}
```

**Validation:**
- ตรวจสอบว่า `qty_used_with_patient + qty_returned_to_cabinet <= qty`
- ถ้าเกินจำนวนที่เบิก จะ return error

---

### 2. บันทึกการคืนอุปกรณ์เข้าตู้

**Command:** `medical_supply_item.recordReturn`

**Request:**
```json
{
  "item_id": 123,
  "qty_returned": 3,
  "return_reason": "UNWRAPPED_UNUSED",
  "return_by_user_id": "USER001",
  "return_note": "อุปกรณ์สำรองที่ไม่ได้ใช้"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "return_record": {
      "id": 456,
      "qty_returned": 3,
      "return_reason": "UNWRAPPED_UNUSED",
      "return_datetime": "2024-12-20T10:30:00Z"
    },
    "updated_item": {
      "id": 123,
      "qty": 5,
      "qty_used_with_patient": 2,
      "qty_returned_to_cabinet": 3,
      "item_status": "COMPLETED"
    }
  }
}
```

**Validation:**
- ตรวจสอบว่า `qty_used_with_patient + qty_returned_to_cabinet <= qty`
- สร้างบันทึกการคืนในตาราง `SupplyItemReturnRecord`
- อัปเดต `qty_returned_to_cabinet` และ `item_status`

---

### 3. ดึงรายการที่รอดำเนินการ

**Command:** `medical_supply_item.getPendingItems`

**Request:**
```json
{
  "department_code": "ER",
  "item_status": "PENDING",
  "page": 1,
  "limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "order_item_code": "S4214JELCO018",
      "qty": 5,
      "qty_used_with_patient": 0,
      "qty_returned_to_cabinet": 0,
      "qty_pending": 5,
      "item_status": "PENDING"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10
}
```

**ฟิลเตอร์:**
- `department_code` - รหัสแผนก
- `patient_hn` - HN ของคนไข้
- `item_status` - สถานะ (PENDING, PARTIAL, COMPLETED)

---

### 4. ดึงประวัติการคืนอุปกรณ์

**Command:** `medical_supply_item.getReturnHistory`

**Request:**
```json
{
  "department_code": "ER",
  "return_reason": "UNWRAPPED_UNUSED",
  "date_from": "2024-12-01",
  "date_to": "2024-12-20",
  "page": 1,
  "limit": 10
}
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
      "return_datetime": "2024-12-20T10:30:00Z",
      "return_by_user_id": "USER001",
      "return_note": "อุปกรณ์สำรองที่ไม่ได้ใช้",
      "supply_item": {
        "order_item_code": "S4214JELCO018",
        "order_item_description": "JELCO IV NO,18"
      }
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

---

### 5. สถิติการจัดการอุปกรณ์

**Command:** `medical_supply_item.getQuantityStatistics`

**Request:**
```json
{
  "department_code": "ER"
}
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
      }
    ]
  }
}
```

---

### 6. ดูข้อมูล Supply Item แต่ละรายการ

**Command:** `medical_supply_item.getById`

ดูข้อมูลอุปกรณ์แต่ละรายการพร้อม quantity breakdown และประวัติการคืน

**Request:**
```json
{
  "item_id": 123
}
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
    "assession_no": "17938884/109",
    "qty": 5,
    "qty_used_with_patient": 2,
    "qty_returned_to_cabinet": 3,
    "qty_pending": 0,
    "item_status": "COMPLETED",
    "uom": "Each",
    "usage": {
      "id": 456,
      "hospital": "VTN01",
      "en": "EZ5-000584",
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
        "return_note": "อุปกรณ์สำรองที่ไม่ได้ใช้",
        "created_at": "2024-12-20T10:30:00.000Z"
      }
    ],
    "created_at": "2024-12-20T08:00:00.000Z",
    "updated_at": "2024-12-20T10:30:00.000Z"
  }
}
```

**ข้อมูลที่ได้:**
- ✅ จำนวนทั้งหมดที่เบิก (qty)
- ✅ จำนวนที่ใช้กับคนไข้ (qty_used_with_patient)
- ✅ จำนวนที่คืนเข้าตู้ (qty_returned_to_cabinet)
- ✅ จำนวนที่รอดำเนินการ (qty_pending) - คำนวณอัตโนมัติ
- ✅ สถานะรายการ (item_status)
- ✅ ข้อมูลผู้ป่วยและการเบิก (usage)
- ✅ ประวัติการคืนทั้งหมด (return_items)

---

### 7. ดูรายการ Supply Items ตาม Usage ID

**Command:** `medical_supply_item.getByUsageId`

ดูรายการอุปกรณ์ทั้งหมดที่เบิกใน medical supply usage นั้นๆ

**Request:**
```json
{
  "usage_id": 456
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "medical_supply_usage_id": 456,
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
      "medical_supply_usage_id": 456,
      "order_item_code": "S4214NEEDLE",
      "order_item_description": "Needle 21G",
      "qty": 10,
      "qty_used_with_patient": 8,
      "qty_returned_to_cabinet": 0,
      "qty_pending": 2,
      "item_status": "PARTIAL",
      "return_items": []
    },
    {
      "id": 125,
      "medical_supply_usage_id": 456,
      "order_item_code": "S4214SYRINGE",
      "order_item_description": "Syringe 10ml",
      "qty": 3,
      "qty_used_with_patient": 0,
      "qty_returned_to_cabinet": 0,
      "qty_pending": 3,
      "item_status": "PENDING",
      "return_items": []
    }
  ]
}
```

**การใช้งาน:**
- ดูรายการอุปกรณ์ทั้งหมดที่เบิกในรายการเดียวกัน
- ตรวจสอบสถานะแต่ละรายการ
- ดูว่ารายการไหนยังรอดำเนินการ (qty_pending > 0)
- ดูประวัติการคืนของแต่ละรายการ

---

## 📊 Use Cases

### 1. กรณีเบิกอุปกรณ์ 5 ชิ้น ใช้กับคนไข้ 3 ชิ้น คืนเข้าตู้ 2 ชิ้น

```
เบิก: qty = 5
ใช้กับคนไข้: qty_used_with_patient = 3
คืนเข้าตู้: qty_returned_to_cabinet = 2
รอดำเนินการ: qty_pending = 0
สถานะ: COMPLETED ✅
```

### 2. กรณีเบิกอุปกรณ์ 10 ชิ้น ใช้กับคนไข้ 5 ชิ้น

```
เบิก: qty = 10
ใช้กับคนไข้: qty_used_with_patient = 5
คืนเข้าตู้: qty_returned_to_cabinet = 0
รอดำเนินการ: qty_pending = 5
สถานะ: PARTIAL ⏳
```

### 3. กรณีพยายามคืนเกินจำนวน

```
เบิก: qty = 5
ใช้กับคนไข้: qty_used_with_patient = 3
พยายามคืน: 3 ชิ้น
ผลลัพธ์: ❌ Error - จำนวนเกินที่เบิก (3 + 3 > 5)
```

---

## 🔍 การ Query ข้อมูล

### 1. ดูข้อมูล Supply Item เฉพาะรายการ

```typescript
// ดูข้อมูลรายการเดียว พร้อมประวัติการคืน
const item = await getSupplyItemById(123);

console.log(`จำนวนเบิก: ${item.qty}`);
console.log(`ใช้กับคนไข้: ${item.qty_used_with_patient}`);
console.log(`คืนเข้าตู้: ${item.qty_returned_to_cabinet}`);
console.log(`รอดำเนินการ: ${item.qty_pending}`);
console.log(`สถานะ: ${item.item_status}`);
console.log(`จำนวนครั้งที่คืน: ${item.return_items.length}`);
```

### 2. ดูรายการทั้งหมดของการเบิกหนึ่งครั้ง

```typescript
// ดูว่าในการเบิกครั้งนี้มีอุปกรณ์อะไรบ้าง
const items = await getSupplyItemsByUsageId(456);

// แยกตามสถานะ
const pending = items.filter(item => item.item_status === 'PENDING');
const partial = items.filter(item => item.item_status === 'PARTIAL');
const completed = items.filter(item => item.item_status === 'COMPLETED');

console.log(`รายการที่ยังไม่เริ่มทำ: ${pending.length}`);
console.log(`รายการที่ทำไปบางส่วน: ${partial.length}`);
console.log(`รายการที่เสร็จแล้ว: ${completed.length}`);
```

### 3. ดึงรายการที่ยังไม่ครบ (PENDING + PARTIAL)

```typescript
const pendingItems = await getPendingItems({
  item_status: undefined, // จะดึง PENDING และ PARTIAL
  department_code: "ER",
  page: 1,
  limit: 20
});
```

### 4. ดึงรายการที่คืนด้วยเหตุผล "แกะห่อแล้วไม่ได้ใช้"

```typescript
const returnHistory = await getReturnHistory({
  return_reason: "UNWRAPPED_UNUSED",
  date_from: "2024-12-01",
  date_to: "2024-12-31"
});
```

### 5. วิเคราะห์ข้อมูลการใช้งาน

```typescript
// ดูข้อมูลการเบิก
const usage = await findOne(456);

// วิเคราะห์แต่ละรายการ
usage.supply_items.forEach(item => {
  const usagePercent = (item.qty_used_with_patient / item.qty * 100).toFixed(2);
  const returnPercent = (item.qty_returned_to_cabinet / item.qty * 100).toFixed(2);
  
  console.log(`${item.order_item_description}:`);
  console.log(`  - ใช้กับคนไข้: ${usagePercent}%`);
  console.log(`  - คืนเข้าตู้: ${returnPercent}%`);
  console.log(`  - สถานะ: ${item.item_status}`);
  
  if (item.return_items.length > 0) {
    console.log(`  - ประวัติการคืน:`);
    item.return_items.forEach(ret => {
      console.log(`    * ${ret.qty_returned} ชิ้น - ${ret.return_reason}`);
    });
  }
});
```

---

## 🛡️ Validation Rules

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
   - ไม่ต้องส่ง `item_status` มาเอง

---

## 📝 Migration

หลังจากแก้ไข schema แล้ว ต้องรัน migration:

```bash
cd backend
npx prisma migrate dev --name add_quantity_management_system
```

---

## 🎯 สรุป

ระบบนี้ช่วยให้:
1. ✅ **ติดตามจำนวนอุปกรณ์แบบละเอียด** - แยกชัดเจนว่าใช้กับคนไข้เท่าไหร่ คืนเท่าไหร่
2. ✅ **Validate จำนวน** - ป้องกันการบันทึกจำนวนเกินที่เบิก
3. ✅ **บันทึกสาเหตุ** - รู้ว่าทำไมถึงคืนอุปกรณ์
4. ✅ **สถิติแม่นยำ** - คำนวณเปอร์เซ็นต์การใช้งานและการคืน
5. ✅ **รองรับการคืนหลายครั้ง** - สามารถคืนทีละน้อยได้
6. ✅ **ดูข้อมูลแบบ Real-time** - ดูสถานะแต่ละรายการพร้อมประวัติการคืน

## 📋 สรุป API Commands

### Write Operations (POST)
| Command | คำอธิบาย |
|---------|----------|
| `medical_supply_item.recordUsedWithPatient` | บันทึกการใช้กับคนไข้ |
| `medical_supply_item.recordReturn` | บันทึกการคืนอุปกรณ์ |

### Read Operations (GET)
| Command | คำอธิบาย |
|---------|----------|
| `medical_supply_item.getById` | ดูข้อมูล supply item แต่ละรายการ |
| `medical_supply_item.getByUsageId` | ดูรายการ supply items ตาม usage ID |
| `medical_supply_item.getPendingItems` | ดูรายการที่รอดำเนินการ |
| `medical_supply_item.getReturnHistory` | ดูประวัติการคืน |
| `medical_supply_item.getQuantityStatistics` | ดูสถิติการจัดการจำนวน |

### Medical Supply Usage (with updated response)
| Command | คำอธิบาย |
|---------|----------|
| `medical_supply_usage.findOne` | ดู usage พร้อม qty_pending และ return_items |
| `medical_supply_usage.findAll` | ดูรายการ usage พร้อม qty_pending และ return_items |

---

## 📞 ติดต่อ

หากมีคำถามเกี่ยวกับระบบนี้ กรุณาติดต่อทีมพัฒนา
