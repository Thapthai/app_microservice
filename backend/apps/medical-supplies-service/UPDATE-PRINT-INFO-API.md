# API สำหรับอัพเดตข้อมูล Print Information

## Endpoint
```
PATCH /medical-supplies/:id/print-info
```

## Description
อัพเดตข้อมูล Print Information ของ Medical Supply Usage โดยใช้ `medical_supply_usage_id`

ข้อมูลที่อัพเดตจะถูกบันทึกในตาราง `medical_supply_usages` (ไม่ใช่ `supply_usage_items`)

## Request Parameters

### Path Parameters
- `id` (required): Medical Supply Usage ID

### Body Parameters
ทุกฟิลด์เป็น optional - ส่งเฉพาะฟิลด์ที่ต้องการอัพเดต

```typescript
{
  "Twu"?: string,              // Patient Location when Ordered (แผนก/จุดที่ Print ตาม Location)
  "PrintLocation"?: string,    // Print Location when Ordered
  "PrintDate"?: string,        // Print Date
  "TimePrintDate"?: string,    // Time Print Date
  "update"?: string            // Print Date (วันที่ของการ Print แยกจากวันที่ Receipt/Invoice)
}
```

## Request Example

### Example 1: อัพเดตฟิลด์ใหม่ทั้งหมด
```bash
curl -X PATCH http://localhost:3000/medical-supplies/1/print-info \
  -H "Content-Type: application/json" \
  -d '{
    "Twu": "Emergency",
    "update": "14/11/2025"
  }'
```

### Example 2: อัพเดตเฉพาะบางฟิลด์
```bash
curl -X PATCH http://localhost:3000/medical-supplies/1/print-info \
  -H "Content-Type: application/json" \
  -d '{
    "Twu": "Emergency"
  }'
```

### Example 3: อัพเดตทุกฟิลด์
```bash
curl -X PATCH http://localhost:3000/medical-supplies/1/print-info \
  -H "Content-Type: application/json" \
  -d '{
    "Twu": "Emergency",
    "PrintLocation": "Emergency Department",
    "PrintDate": "14/11/2025",
    "TimePrintDate": "14/11/2025 09:30:00",
    "update": "14/11/2025"
  }'
```

## Response

### Success Response (200 OK)
```json
{
  "status": "success",
  "message": "Print information updated successfully",
  "data": {
    "id": 1,
    "hospital": "VTN01",
    "en": "EZ5-000584",
    "patient_hn": "20-010334",
    "first_name": "สมชาย",
    "lastname": "ใจดี",
    "twu": "Emergency",
    "print_location": "Emergency Department",
    "print_date": "14/11/2025",
    "time_print_date": "14/11/2025 09:30:00",
    "update": "14/11/2025",
    "supply_items": [
      {
        "id": 1,
        "order_item_code": "S4214JELCO018",
        "order_item_description": "JELCO IV NO,18",
        "assession_no": "17938884/109",
        "order_item_status": "Verified",
        "qty": 2,
        "uom": "Each",
        "print_location": "Emergency Department",
        "print_date": "14/11/2025",
        "time_print_date": "14/11/2025 09:30:00"
      }
    ],
    "created_at": "2025-11-21T08:00:00.000Z",
    "updated_at": "2025-11-21T08:30:00.000Z"
  }
}
```

### Error Response (404 Not Found)
```json
{
  "statusCode": 404,
  "message": "Medical supply usage with ID 999 not found"
}
```

### Error Response (500 Internal Server Error)
```json
{
  "statusCode": 500,
  "message": "Failed to update print information"
}
```

## Notes

1. **Usage-Level Data**: ฟิลด์ทั้งหมดจะถูกอัพเดตในตาราง `medical_supply_usages` (ไม่ใช่ `supply_usage_items`)
2. **Centralized Print Info**: ข้อมูล Print เป็นของ usage record ทั้งหมด ไม่ใช่แต่ละ item
3. **Partial Update**: สามารถส่งเฉพาะฟิลด์ที่ต้องการอัพเดตได้ ไม่จำเป็นต้องส่งทุกฟิลด์
4. **Logging**: ระบบจะบันทึก log การอัพเดตลงใน `medical_supply_usages_logs` โดยอัตโนมัติ

## Database Impact

การอัพเดตจะส่งผลต่อตาราง:
- `medical_supply_usages`: อัพเดตฟิลด์ `twu`, `print_location`, `print_date`, `time_print_date`, `update`
- `medical_supply_usages_logs`: สร้าง log entry ใหม่สำหรับการอัพเดต

## Use Cases

### Use Case 1: อัพเดตข้อมูลหลังจาก Print Receipt/Invoice
เมื่อระบบ Print Receipt/Invoice แล้ว ต้องการบันทึกข้อมูล:
- แผนกที่ Print (Twu)
- วันที่ Print (update)
- เวลาที่ Print (TimePrintDate2)

### Use Case 2: แก้ไขข้อมูล Print ที่บันทึกผิด
สามารถอัพเดตข้อมูลที่บันทึกไว้แล้วได้

### Use Case 3: เพิ่มข้อมูล Print ย้อนหลัง
สำหรับข้อมูลที่สร้างไว้แล้วแต่ยังไม่มีข้อมูล Print

## Integration Example (JavaScript/TypeScript)

```typescript
async function updatePrintInfo(usageId: number, printData: any) {
  try {
    const response = await fetch(`http://localhost:3000/medical-supplies/${usageId}/print-info`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer YOUR_TOKEN' // ถ้ามี authentication
      },
      body: JSON.stringify(printData)
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      return result.data;
    } else {
      console.error('Failed to update:', result.message);
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error updating print info:', error);
    throw error;
  }
}

// Usage
await updatePrintInfo(1, {
  Twu: 'Emergency',
  PrintLocation: 'Emergency Department',
  PrintDate: '14/11/2025',
  TimePrintDate: '14/11/2025 09:30:00',
  update: '14/11/2025'
});
```

## โครงสร้างข้อมูล

```
medical_supply_usages (หลัก)
├── id
├── patient_hn
├── first_name
├── lastname
├── twu              ← Print: Patient Location when Ordered
├── print_location   ← Print: Location when Ordered
├── print_date       ← Print: Date
├── time_print_date  ← Print: Time
├── update           ← Print: Date (แยกจาก Receipt/Invoice)
└── supply_items[]
    ├── order_item_code
    ├── order_item_description
    ├── qty
    └── uom
```

